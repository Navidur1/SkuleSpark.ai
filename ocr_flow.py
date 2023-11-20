import requests
import json
from database import insert_one, get_data_one, update_one
from flask import Blueprint, request, json, jsonify
from io import BytesIO
from google.cloud import storage
from flask_cors import CORS


ocr_service = Blueprint('ocr_service', __name__)

credentials_path = 'credentials.json'
bucket_name = 'capstone-notes-bucket'

# Initialize Google Cloud Storage client with the service account credentials
storage_client = storage.Client.from_service_account_json(credentials_path)

def chunk_elements(elements, file_id):
    chunks = []
    threshold = 512
    stored_ids = []
    i = 0
    cur_element_ids = []
    cur_text_len = 0
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
            chunks.append({'element_ids': cur_element_ids, 'text': cur_text})
            cur_element_ids = []
            cur_text_len = 0
            cur_text = ""
            
        cur_text += elements[i]['text']
        cur_element_ids.append(element_id)
        cur_text_len += len(elements[i]['text'])
        i += 1
    
    if chunk_success:
        if len(cur_element_ids) > 0:
            chunks.append({'element_ids': cur_element_ids, 'text': cur_text})

        for chunk in chunks:
            chunk_success, chunk_id = insert_one('Chunks', chunk)
            update_one('Files', {'_id': file_id}, {'$push': {'chunk_ids': chunk_id}})

    return chunk_success

def ocr_flow(uploaded_file, file_id):
    url = "https://api.unstructured.io/general/v0/general"

    headers = {
        "accept": "application/json",
        "unstructured-api-key": "ryHik0FZBTS4YoZi8N9ca6nOyP3zur",
    }

    data = {
        "strategy": "hi_res",
        "coordinates": "true"
    }

    file_content = uploaded_file.read()
    file_in_mem = BytesIO(file_content)
    file_data = {'files': (uploaded_file.filename, file_in_mem)}

    response = requests.post(url, headers=headers, files=file_data, data=data)

    file_in_mem.close()
    json_response = response.json()
    print(json_response)
    
    success = chunk_elements(json_response, file_id)

    elements = []

    for data in json_response:
        obj = {
            'id': data['element_id'],
            'text': data['text']
        }
        elements.append(obj)

    return success, elements

@ocr_service.route('/upload', methods=['POST'])
def upload_pdf():
    
    if 'pdf' not in request.files:
        return 'No PDF file provided', 400

    pdf_file = request.files['pdf']
    
    if pdf_file.filename == '':
        return 'No selected file', 400
    
    # Get the bucket where you want to upload the file
    bucket = storage_client.bucket(bucket_name)

    # Upload the PDF file to Google Cloud Storage
    blob = bucket.blob(pdf_file.filename)
    blob.upload_from_file(pdf_file)
    pdf_file.stream.seek(0)
    # Get the GCS URL of the uploaded PDF file
    gcs_pdf_url = f"https://storage.googleapis.com/{bucket_name}/{pdf_file.filename}"

    print('returning')
    print(gcs_pdf_url)

    # Upload file metadata to mongo
    data = {
        'gcs_link': gcs_pdf_url,
        'file_name': pdf_file.filename,
        'chat_ready': False
    }
    success, file_id = insert_one('Files', data)

    # Call OCR service
    if not success:
        return "error", 404

    success, ocr_results = ocr_flow(pdf_file, file_id)
    
    # Return the GCS URL of the uploaded PDF file
    if success:
        return jsonify({'gcs_pdf_url': gcs_pdf_url, 'file_id': str(file_id), 'ocr_results': ocr_results}), 200
    
    return jsonify({'gcs_pdf_url': "fake"}), 400
