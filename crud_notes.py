from flask import Blueprint, request, json, jsonify
from database import  get_data
from bson.objectid import ObjectId

crud_notes = Blueprint('crud_notes', __name__)

@crud_notes.route('/augmented-note/<file_id>', methods=['GET'])
def get_augmented_note(file_id):
    # get elements
    success, data = get_data('Elements', {'file_id': ObjectId(file_id)}, {'type': 1,'text':1, "_id":1, "element_index":1})

    
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
    
    print(res)
    return res
