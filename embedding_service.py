import pinecone
import openai
from database import insert_one, get_data_one, update_one, pc_get_many, pc_insert_one
from flask import Blueprint, request, json, jsonify
from bson.objectid import ObjectId

embedding_service = Blueprint('embedding_service', __name__)

openai.api_key = ""
embedding_model = "text-embedding-ada-002"


@embedding_service.route('/create_embeddings', methods=["POST"])
def create_embeddings():
    data = request.json

    # Check if 'file_id' exists in the data dictionary
    if 'file_id' not in data:
        return "No 'file_id' found in the provided data.", 400
    
    file_id = data['file_id']

    success, data = get_data_one('Files', {'_id': ObjectId(file_id)}, {'chunk_ids': 1})

    if not success:
        return "Could not retrieve file", 400
    
    chunks = data['chunk_ids']

    for chunk_id in chunks:
        text_to_embed = ""
        success, data = get_data_one('Chunks', {'_id': chunk_id}, {'element_ids': 1})

        for element_id in data['element_ids']:
            success, data = get_data_one('Elements', {'_id': ObjectId(element_id)}, {'text': 1})
            text_to_embed += data['text']

        embedding_res = openai.embeddings.create(input=text_to_embed, model=embedding_model)
        pinecone_entry = (str(chunk_id), embedding_res.data[0].embedding, {"file_id": file_id})
        pc_insert_one([pinecone_entry])
        
    return jsonify("fake"), 200


