import requests
import json
from database import insert_one
from flask import Blueprint, request, json
from io import BytesIO

ocr_service = Blueprint('ocr_service', __name__)


def chunk_elements(elements):
    chunks = []
    threshold = 512
    stored_ids = []
    i = 0
    cur_element_ids = []
    cur_text_len = 0
    final_text = []
    cur_text = ""
    chunk_success = True
    while i < len(elements):
        # add to mongodb for element
        # recieve element_id
        data = elements[i]
        chunk_success, element_id = insert_one('Elements', data)
        
        if not chunk_success:
            break
        else:
            stored_ids.append(element_id)


        if cur_text_len + len(elements[i]['text']) >= threshold:
            chunks.append({'element_ids': cur_element_ids})
            final_text.append(cur_text)
            cur_element_ids = []
            cur_text_len = 0
            cur_text = ""
            
        cur_text += elements[i]['text']
        cur_element_ids.append(element_id)
        cur_text_len += len(elements[i]['text'])
        i += 1
    
    if chunk_success:
        for chunk in chunks:
            chunk_success, element_id = insert_one('Chunks', chunk)

        if len(cur_element_ids) > 0:
            final_text.append(cur_text)
            chunks.append(cur_element_ids)
        
        for text in final_text:
            print(text)
            print(len(text))
            print("\n")
        
    return chunk_success


@ocr_service.route('/ocr_service', methods=["POST"])
def ocr_flow():
    url = "https://api.unstructured.io/general/v0/general"

    headers = {
        "accept": "application/json",
        "unstructured-api-key": "ryHik0FZBTS4YoZi8N9ca6nOyP3zur",
    }

    data = {
        "strategy": "hi_res",
        "coordinates": "true"
    }

    # Get file id
    data = request.json
    file_id = data['file_id']

    # Open file and send to unstructured
    uploaded_file = request.files['file']
    file_object = BytesIO(uploaded_file.read())
    file_object.seek(0)
    file_data = {'files': file_object}

    response = requests.post(url, headers=headers, files=file_data, data=data)

    file_data['files'].close()

    json_response = response.json()

    success = chunk_elements(json_response)
    
    if success:
        return 200, file_id

    return 400    
        

