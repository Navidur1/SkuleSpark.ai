from flask import Blueprint, request, json, jsonify
from database import get_data, get_data_one, update_one
from bson.objectid import ObjectId
from bson import json_util

crud_notes = Blueprint('crud_notes', __name__)

@crud_notes.route('/augmented-note/<file_id>', methods=['GET'])
def get_augmented_note(file_id):
    # get elements
    success, data = get_data('Elements', {'file_id': ObjectId(file_id)}, {'type': 1,'text': 1, "_id": 1, "element_index": 1})

    if not success:
        return "Could not get augmented note", 400

    res = []
    curr_list = []
    for element in data:
        element["_id"] = str(element["_id"])
        if element['type'] == 'ListItem':
            curr_list.append(element)
            continue

        elif len(curr_list):
            res.append({'type': 'List', 'text': curr_list})
            curr_list = []
            
        res.append(element)

    if curr_list:
        res.append({'type': 'List', 'text': curr_list})
    
    return res

@crud_notes.route('/course', methods=['POST'])
def create_course():
    data = request.json

    #Check for course code in data
    if 'course_code' not in data:
        return "No 'course_code' found in the provided data", 400
    
    course_code = data['course_code']

    #TODO: Check for current logged in user
    
    # Check if this user already created this course
    # Not sure if this would ever get hit, the frontend would also know if a course already exists or not
    # so it might be better to do the logic there
    success, courses = get_data_one('Users', {'name': "Dummy"}, {'courses': 1})

    if not success:
        return "Could not find user", 400

    if course_code in courses:
        return "Course already exists for user", 400
    
    success, error_message = update_one('Users', {'name': "Dummy"}, {'$push': {'courses': {'course': course_code, 'notes': []}}})
                
    if not success:
        return error_message, 400

    return "Successfully created course", 200

@crud_notes.route('/file_structure/<user_id>', methods=['GET'])
def get_file_structure(user_id):
    success, file_structure = get_data_one('Users', {'name': 'Dummy'}, {'courses': 1}) # Later on: {'_id': user_id}

    if not success:
        return "Could not fetch file structure", 400
    
    data = file_structure['courses']

    return json.loads(json_util.dumps(data))

@crud_notes.route('/note/<note_id>', methods=['GET'])
def get_note(note_id):
    success, data = get_data_one('Files', {'_id': note_id}, {'gcs_link': 1})

    if not success:
        return "Could not fetch note", 400

    return data['gcs_link']
