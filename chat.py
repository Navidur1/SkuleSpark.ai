from flask import Blueprint, request, json, jsonify,  Response
import requests
from bson.objectid import ObjectId
from openai import OpenAI
import json
import os
import tiktoken
from dotenv import load_dotenv,find_dotenv
from database import pc_get_many, get_data_one, pc_get_many_filter
import time

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


def get_relevant_sources(message, file_id, whole_course, course_code):
    message_embedding = client.embeddings.create(input=message, model=embedding_model).data[0].embedding
    filter = {}

    if (whole_course):
        filter = {'course_code_user_notes': course_code}
    else:
        filter = {'file_id': file_id}

    success, query_results = pc_get_many_filter(message_embedding = message_embedding, filter = filter)
    if not success:
        return ""

    MAX_TOKENS = 1100
    tokens = 0
    context = []
    
    for match in query_results['matches']:
        success, chunk= get_data_one('Chunks', { '_id': ObjectId(match['id'])})
        
        # get gcs link
        file_id = -1
        if 'metadata' in match and 'file_id' in match['metadata']:
            file_id = match['metadata']['file_id']

        _, res = get_data_one('Files', {'_id': ObjectId(file_id)}, {'gcs_link': 1})
        gcs_link = res['gcs_link']

        text = chunk['text']

        if (match['score'] < 0.77):
            pass 

        tokens += num_tokens_from_string(text)
        if tokens > MAX_TOKENS:
            break

        
        
        elements = []  # List to store elements for the current chunk

        for element_id in chunk['element_ids']:
            success, element_data = get_data_one('Elements', {'_id': ObjectId(element_id)})
            if success:
                element_info = {
                    'coordinates': element_data['metadata']['coordinates']['points'],
                    'width': element_data['metadata']['coordinates']['layout_width'],
                    'height': element_data['metadata']['coordinates']['layout_height'],
                    'page_number': element_data['metadata']['page_number']
                }
                elements.append(element_info)
        
        context.append({"text": text, "elements":elements, "gcsLink": gcs_link })
    
    return context

def get_augmented_message(message, sources):
    source_introduction = f"Use the following material from the student's notes to help answer the question:\n\n"
    augmented_message = source_introduction
    source_text = ""
    for i,source in enumerate(sources):
        source_text += f"{i}. {source['text']} \n\n"
    if(source_text==""):
        source_text = "N/A\n\n"
    augmented_message += source_text
    augmented_message += f"\nStudent Question: {message}"

    return augmented_message

def get_gpt_response(augmented_message,sources,streaming):
    messages = [{
                    "role": "system", 
                    "content": "You are a helpful tutor that specializes in answering student questions. Consider the provided context while formulating your answer. If the context is not relevant let the student know"
                },
                {
                    "role": "user",
                    "content": augmented_message
                }]

    response = client.chat.completions.create(
        model = model_id,
        messages = messages,
        stream=streaming
    )
    if streaming:
        for chunk in response:
            if chunk.choices[0].delta.content:
                yield json.dumps({ "type": "answer", "data":chunk.choices[0].delta.content})
        print("sources", sources)
        yield json.dumps({"type": "reference", "data": sources})

    else:       
        return response.choices[0].message.content
# Make sure the sources have all of the original text, this is very important!

def prune_relevant_sources(user_msg, sources):
    message = "Given this question from a user: \n" + user_msg
    message += "\nWhich of the sources below might help answer the question. From these sources"
    message += " identify the ones that are relevant to the question and can support and answer the users questions. Return a json boolean array called relevant_sources which marks if a source is relevant (true) or not (false)"
    message += "\nSources:\n"

    for index, text in enumerate(sources):
        message += "\nSource " + str(index + 1) + ": \n"
        message += text;
    

    message += "make the output of the relevant_sources array in this format. For example:"
    message += "say source 1 is relevant, source 2 is not relevant, source 3 is relevant then output would be [true, false, true]. Sources that are relevant are marked true and irrelvant sources are marked false"
    messages = [{
                    "role": "system",
                    "content": "You specialize in identifying relevant sources from a given list that is relevant and can help answer a given question. You return the identified relevant sources in a json boolean array called relevant_sources."
                },{
                    "role": "user",
                    "content": message
                }]

    response = client.chat.completions.create(
        model = model_id,
        messages = messages,
        stream=False,
        response_format={"type": "json_object"}
    )
    print(response.choices[0].message.content)

    pruned_sources = json.loads(response.choices[0].message.content)
    res = []
    for index, is_relevant in enumerate(pruned_sources['relevant_sources']):
        if (is_relevant):
            res.append(sources[index])
    return res


@chat_service.route('/chat-prompt', methods=['POST'])
def handle_chat_prompt():
    req_body = request.json
    user_message_orig = req_body['message']
    file_id = req_body['file_id']
    whole_course = req_body['whole_course']
    course_code = req_body['course_code']
    streaming = True

    sources = get_relevant_sources(user_message_orig,file_id,whole_course,course_code)
    #pruned_sources = prune_relevant_sources(user_message_orig, sources)
    augmented_message = get_augmented_message(user_message_orig,sources)
    chatgpt_response = get_gpt_response(augmented_message,sources,streaming)
    
    def response_wrapper():
        for response in chatgpt_response:
            time.sleep(0.05)
            yield (response)
    
    if streaming:
        return Response(response_wrapper(), content_type='application/json')
    else:
        response_data ={
            'answer' : chatgpt_response,
            'sources': sources
        }
        return jsonify(response_data)
    

