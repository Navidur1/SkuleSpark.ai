from flask import Blueprint, request, json, jsonify
import requests
from bson.objectid import ObjectId
from openai import OpenAI
import json
import os
import tiktoken
from dotenv import load_dotenv,find_dotenv
from database import pc_get_many, get_data_one


# Set up open ai 
dotenv_path = find_dotenv(raise_error_if_not_found=True)
load_dotenv(dotenv_path)
client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

model_id = 'gpt-3.5-turbo'
embedding_model = "text-embedding-ada-002"
encoding = tiktoken.encoding_for_model(model_id)

chat_service = Blueprint('chat_service', __name__)

def num_tokens_from_string(string: str):
    """Returns the number of tokens in a text string."""
    num_tokens = len(encoding.encode(string))
    return num_tokens


def get_relevant_sources(message, file_id):
    message_embedding = client.embeddings.create(input=message, model=embedding_model).data[0].embedding
    success, query_results = pc_get_many(message_embedding,file_id)
    print(query_results)
    if not success:
        return ""

    MAX_TOKENS = 1100
    tokens = 0
    context = []

    for match in query_results['matches']:
        success, chunk= get_data_one('Chunks', { '_id': ObjectId(match['id'])})
        print(chunk)
        text = chunk['text']

        if (match['score'] < 0.77):
            pass

        tokens += num_tokens_from_string(text)
        if tokens > MAX_TOKENS:
            break

        context.append(text)

    return context

def get_augmented_message(message, sources):
    source_introduction = f"Context from student's notes:\n\n" #"Use the following information, retrieved from relevant financial documents, to help answer the subsequent question.\n\n"
    augmented_message = source_introduction
    source_text = ""
    for i,source in enumerate(sources):
        source_text += f"{i}. {source} \n\n"
    if(source_text==""):
        source_text = "N/A\n\n"
    augmented_message += source_text
    augmented_message += f"\nStudent Question: {message}"

    return augmented_message

def get_gpt_response(augmented_message):
    messages = [{
                    "role": "system", 
                    "content": "You are a helpful tutor that specializes in answering student questions. If relevant, consider the provided context while formulating your answer."
                },
                {
                    "role": "user",
                    "content": augmented_message
                }]

    response = client.chat.completions.create(
        model = model_id,
        messages = messages,
        stream=False
    )
    return response.choices[0].message.content

@chat_service.route('/chat-prompt', methods=['POST'])
def handle_chat_prompt():
    req_body = request.json
    user_message_orig = req_body['message']
    file_id = req_body['file_id']

    sources = get_relevant_sources(user_message_orig,file_id)
    augmented_message = get_augmented_message(user_message_orig,sources)
    chatgpt_response = get_gpt_response(augmented_message)

    response_data ={
        'answer' : chatgpt_response,
        'sources': sources
    }
    
    return jsonify(response_data)