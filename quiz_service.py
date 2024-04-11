import pinecone
import openai
from database import insert_one, get_data_one, update_one, pc_get_many, pc_insert_one, pc_get_many_filter
from bson.objectid import ObjectId
from collections import Counter
from flask import Blueprint, request, json, jsonify
import time

quiz_service = Blueprint('quiz_service', __name__)

# need random vector to do a query or else it doesnt work
vector_embedding = [0.83,0.48,0.64,0.81,0.2,0.17,0.68,0.45,0.73,0.49,0.47,0.63,0.94,0.61,0.6,0.55,0.24,0.85,0.61,0.38,0.73,0.47,0.89,0.05,0.18,0.57,0.81,0.36,0.51,0.94,0.36,0.58,0.72,0.9,0.46,0.45,0.16,0.62,0.63,0.55,0.62,0.71,0.59,0.36,0.93,0.12,0.98,0.2,0.54,0.12,0.8,0.69,0.32,0.43,0.55,0.51,0.69,0.06,0.16,0.33,0.35,0.42,0.85,0.67,0.65,0.82,0.57,0.11,0.38,0.17,0.99,0.55,0.14,0.98,0.87,0.39,0.26,0.79,0.11,0.77,0.59,0.77,0.04,0.72,0.34,0.87,0.62,0.48,0.57,0.7,0.63,0.15,0.53,0.47,0.99,0.41,0.4,0.17,0.36,0.59,0.41,0.26,0.65,0.13,0.94,0.39,0.41,0.83,0.86,0.96,0.71,0.01,0.31,0.31,0.01,0.05,0.93,0.04,0.49,0.28,0.9,0.68,0.17,0.01,0.48,0.89,0.81,0.23,0.16,0.21,0.72,0.24,0.91,0.85,0.85,0.12,0.68,0.74,0.46,0.44,0.78,0.98,0.38,0.84,0.99,0.35,0.85,0.22,0.12,0.97,0.69,0.91,0.35,0.89,0.57,0.6,0.85,0.36,0.59,0.08,0.16,0.04,0.22,0.14,0.91,0.92,0.44,0.53,0.29,0.83,0.48,0.17,0.73,0.44,0.54,0.32,0.12,0.29,0.27,0.19,0.68,0.93,0.92,0.77,0.8,0.34,0.08,0.75,0.76,0.39,0.53,0.06,0.16,0.15,0.41,0.98,0.72,0.19,0.76,0.69,0.41,0.69,0.77,0.76,0.92,0.99,0.42,0.11,0.06,0.18,0.04,0.07,0.4,0.19,0.18,0.47,0.99,0.66,0.8,0.69,0.32,0.82,0.2,0.92,0.91,0.92,0.2,0.12,0.77,0.99,0.24,0.21,0.2,1,0.88,0.26,0.2,0.26,0.86,0.43,0.44,0.44,0.44,0.62,0.36,0.73,0.53,0.1,0.93,0.87,0.7,0.29,0.04,0.03,0.15,0.92,0.15,0.82,0.88,0.96,0.54,0.31,0.86,0.56,0.99,0.79,0.37,0.6,0.84,0.64,0.08,0.33,0.24,0.98,0.54,0.91,0.17,0.29,0.45,0.81,0.07,0.86,0.23,0.09,0.75,0.65,0.1,0.04,0.24,0.23,0.67,0.59,0.22,0.54,0.01,0.45,0.01,0.26,0.45,0.41,0.69,0.04,0.91,0.55,0.61,0.78,0.55,0.37,0.09,0.89,0.55,0.83,0.35,0.8,0.09,0.93,0.97,0.62,0.94,0.49,0.27,0.67,0.23,0.07,0.98,0.96,0.83,0.26,0.81,0.27,0.54,0.37,0.51,0.95,0.32,0.11,0.44,0.81,0.7,0.95,0.28,0.96,0.5,0.94,0.76,0.68,0.49,0.87,0.52,0.77,0.29,0.48,0.23,0.39,0.74,0.95,0.67,0.33,0.63,0.1,0.94,0.26,0.29,0.52,0.7,0.37,0.37,0.93,0.41,0.52,0.34,0.87,0.75,0.19,0.18,0.47,0.8,0.62,0.44,0.9,0.47,0.39,0.96,0.72,0.16,0.26,0.12,0.12,0.76,0.6,0.42,0.82,0.27,0.98,0.86,0.66,0.44,0.57,0.93,0.7,0.33,0.5,0.06,0.13,0.08,0.13,0.29,0.11,0.99,0.34,0.85,0.38,0.73,0.92,0.4,0.51,0.95,0.84,0.61,0.79,0.44,0.57,0.66,0.46,0.29,0.19,0.97,0.86,0.01,0.4,0.22,0.83,0.72,0.9,0.28,0.3,0.98,0.01,0.96,0.78,0.44,0.35,0.37,1,0.28,0.55,0.11,0.94,0.62,0.52,0.68,0.82,0.36,0.66,0.09,0,0.49,0.95,0.12,0.38,0.79,0.74,0.17,0.2,0.03,0.25,0.32,0.48,0.7,0.28,0.98,0.09,0.74,0.58,0.78,0.47,0.6,0.37,0.12,0.01,0.7,0.48,0.36,0.1,0.04,0.21,0.78,0.09,0.3,0.93,0.65,0.58,0.16,0.4,0.88,0.99,0.89,0.67,0.33,0.87,0.9,0.95,0.86,0.22,0.43,0.27,0.29,0.66,0.97,0.83,0.02,0.5,0.98,0.64,0.76,0.7,0.14,0.1,0.16,0.46,0.35,0.51,0.57,0.35,0.21,0.67,0.58,0.28,0.12,0.51,0.64,0.54,0.06,0.61,0.45,0.69,0.67,0.82,0.13,0.23,0.18,0.55,0.55,0.91,0.21,0.44,0.55,0.74,0.49,0.78,0.57,0.08,0.43,0.54,0.66,0.38,0.48,0.51,0.44,0.78,0.08,0.02,0.39,0.59,0.01,0.97,0.14,0.57,0.31,0.78,0.9,0.08,0.81,0.4,0.58,0.39,0.4,0.46,0.41,0.76,0.68,0.1,0.04,0.39,0.38,0.05,0.78,0.83,0.68,0.07,0.03,0.42,0.97,0.94,0.92,0.35,0.71,0.78,0.42,0.34,0.8,0.07,0.03,0.56,0.34,0.47,0.58,0.9,0.78,0.08,0.64,0.25,0.75,0.73,0.19,0.45,0.76,0.17,0.91,0.12,0.53,0.3,0.23,0.92,0.25,0.17,0.44,0.3,0.61,0.78,0.57,0.24,0.22,0.4,0.8,0.91,0.3,0.55,0.88,0.75,0.47,0.3,0.6,0.89,0.51,0.54,0.1,0.7,0.27,0.63,0.95,0.11,0.05,0.22,0.33,0.85,0.31,0.68,0.85,0.17,0.71,0.17,0.65,0.94,0.21,0.82,0.56,0.13,0.96,0.26,0.95,0.75,0.54,0.61,0.4,0.09,0.98,0.68,0.51,0.93,0.25,0.53,0.9,0.17,0.96,0.13,0.27,0.4,0.26,0.35,0.88,0.09,0.43,0.84,0.96,0.68,0.46,0.47,0.02,0.56,0.65,0.5,0.84,0.47,0.73,1,0.99,0.99,0.73,0.05,1,0.06,0.24,0.52,0.22,0.02,0.17,0.02,0.46,0.94,0.24,0.9,0.78,0.05,0.63,0.84,0.18,0.66,0.86,0.18,0.83,0.54,0.53,0.76,0.87,0.76,0.63,0.63,0.42,0.54,0.51,0.7,0.05,0.91,0.76,0.53,0.04,0.81,0.84,0.92,0.4,0.25,0.9,0.67,0.08,0.77,0.83,0.67,0.06,0.3,0.34,0.85,0.46,0.94,0.78,0.03,0.56,0.52,0.51,0.32,0.18,0.68,0.76,0.52,0.54,0.78,0.7,0.85,0.76,0.24,0.22,0.09,0.13,0.73,0.44,0.26,0.7,0.48,0.52,0.47,0.84,0.95,0.19,0.48,0.66,0.52,0.09,0.9,0.7,0.03,0.22,0.9,0.29,0.61,0.78,0.56,0.7,0.03,0.99,0.21,0.76,0.32,0.92,0.47,0.83,0.52,0.21,0.75,0.07,0.3,0.88,0.7,0.68,0.49,0.46,0.93,0.43,0.53,0.61,0.24,0.48,0.66,0.9,0.42,0.14,0.87,0.91,0.31,0.33,0.71,0.36,0.37,0.28,0.17,0.08,0.02,0.95,0.47,0.95,0.12,0.37,0.49,0.67,0.03,0.23,0.98,0.81,0.32,0.82,0.9,0.99,0.24,0.18,0.29,0.28,0.99,0.11,0.47,0.73,0.78,0.29,0.72,0.04,0.54,0.25,0.91,0.54,0.08,0.24,0.41,0.2,0.23,0.92,0.63,0.53,0.27,0.61,0.67,0.04,0.21,0.24,0.7,0.22,0.17,0.28,0.41,0.89,0.05,0.99,0.19,0.1,0.03,0.72,0.52,0.77,0.43,0.37,0.47,0.02,0.14,0.29,0.18,0.12,0.12,0.88,0.65,0.56,0.51,0.38,0.72,0.23,0.65,0.71,0.39,0.1,0.62,0.46,0.89,0.49,0.11,0.55,0.68,0.06,0.52,0.45,0.19,0.9,0.63,0.43,0.77,0.13,0.51,0.94,0.12,0.25,0.08,0.7,0.06,0.67,0.41,0.71,0.14,0.09,0.76,0.15,0.36,0.86,0.71,0.07,0.56,0.27,0.59,0.38,0.21,0.64,0.13,0.83,0.41,0.51,0.66,0.71,0.47,0.1,0.27,0.33,0.49,0.47,0.34,0.48,0.9,0.02,0.99,0.28,0.07,0.28,0.11,0.14,0.09,0.2,0.42,0.91,0.55,0.59,0.98,0.65,0.86,0.82,0.06,0.36,0.76,0.61,0.45,0.32,0.99,0.3,0.66,0.3,0.03,0.19,0.83,0.69,0.54,0.98,0.98,0.19,0.42,0.98,0.26,0.69,0.06,0.65,0.61,0.21,0.42,0.53,0.6,0.47,0.55,0.86,0.8,0.23,0.58,0.58,0.67,0.03,0.3,0.13,0.57,0.14,0.68,0.31,0.79,0.03,0.85,0.06,0.13,0.62,0.18,0.32,0.45,0.28,0.47,0.64,0.95,0.47,0.89,0.21,0.69,0.36,0.26,0.84,0.17,0.95,0.69,0.29,0.22,0.8,0.78,0.14,0.86,0.43,0.89,0.17,0.58,0.2,0.99,0.94,0.77,0.8,0.72,0.62,0.08,0.16,0.33,0.32,0.62,0.79,0.81,0.07,0.13,0.37,0.81,0.21,0.2,0.89,0.42,0.38,0.48,0.26,0.29,0.28,0.26,0.25,0.49,0.85,0.35,0.38,1,0.03,0.44,0.15,0.75,0.51,0.08,0.77,0.46,0.31,0.58,0.22,0.01,0.46,0.67,0.67,0.32,0.45,0.3,0.85,0.89,0.92,0.66,0.43,0.64,0.56,0.15,0.91,0.15,0.93,0.36,0.77,0.29,0.59,0.4,0.33,0.69,0.65,0.99,0.06,0.85,0.63,0.44,0.1,0.57,0.93,0.19,0.63,0.67,0.04,0.34,0.2,0.91,0.31,0.54,0.38,0.89,0.46,0.08,0.25,0.33,0.55,0.01,0.53,0.88,0.64,0.13,0.5,0.2,0.68,0.5,0.71,0.24,0.51,0.55,0.33,0.65,0.37,0.38,0.65,0.45,0.52,0.78,0.33,0.8,0.51,0.3,0.27,0.9,0.92,0.21,0.22,0.1,0.27,0.65,0.17,0.24,0.95,0.92,0.79,0.43,0.81,0,0.51,0.63,0.28,0.64,0.61,0.52,0.08,0.2,0,0.74,0.9,0.15,0.5,0.78,0.12,0.44,0.12,0.86,0.59,0.61,0.18,0.93,0.26,0.53,0.67,0.7,0.49,0.34,0.26,0.68,0.16,0.22,0.46,0.5,0.24,0.86,0.66,0.11,0.38,0.36,0.91,0.33,0.69,0.47,0.22,0.42,0.95,0.99,0.13,0.91,0.38,0.52,0.78,0.76,0.47,0.48,0.08,0.06,0.86,0.14,0.28,0.34,0.23,0.41,0.02,0.87,0.65,0.71,0.63,0.1,0.35,0.88,0.33,0.86,0.69,0.29,0.56,0.9,0.03,0.92,0.71,0.07,0.16,0.48,0.24,0.24,0.34,0.07,0.05,0.13,0.5,0.31,0.43,0.01,0.87,0.18,0.05,0.35,0.58,0.77,0.84,0.91,0.41,0.3,0.28,0.14,0.08,0.7,0.96,0.41,0.73,0.17,0.01,0.89,0.26,0.78,0.44,0.02,0.56,0.56,0.35,0.47,0.34,0.41,0.16,0.21,0.75,0.78,0.06,0.89,0.18,0.87,0.2,0.73,0.32,0.32,0.62,0.54,0.78,0.47,0.52,0.91,0.92,0.2,0.51,0.29,0.75,0.39,0.22,0.79,0.05,0.49,0.26,0.19,0.59,0.66,0.77,0.23,0.03,0.04,0.21,0.84,0.54,0.02,0.99,0.5,0.75,0.88,0.13,0.75,0.05,0.5,0.79,0.76,0.16,0.04,0.15,0.77,0.83,0.27,0.9,0.29,0.31,0.2,0.35,0.63,0.2,0.05,0.56,0.27,0.67,0.66,0.87,0.98,0.12,0.4,0.37,0.19,0.92,0.31,0.73,0.33,0.81,0.01,0.88,0.29,0.39,0.68,0.57,0.65,0.12,0.99,0.79,0.19,0.05,0.99,0.97,0.72,0.12,0.97,0.82,0.39,0.12,0.31,0.35,0.37,0.82,0.97,0.21,0.32,0.81,0.13,0.86,0.27,0.49,0.71,0.95,0.4,0.73,0.46,0.59,0.57,0.75,0.96,0.66,0.34,0.48,0.06,0.08,0.61,0.13,0.35,0.88,0.43,0.69,0.05,0.22,0.69,0.72,0.38,0.64,0.58,0.29,0.13,0.79,0.87,0.55,0.61,0.09,0.25,0.11,0.1,0.91,0.7,0.86,0.39,0.99,0.17,0.62,0.26,0.47,0.86,0.15,0.56,0.27,0,0.05,0.76,0.61,0.49,0.68,0.88,0.01,0.63,0.36,0.46,0.46,0.93,0.92,0.3,0.39,0.52,0.98,0.97,0.27,0.9,0.39,0.48,0.82,0.31,0.81,0.99,0.18,0.21,0.36,0.32,0.64,0.14,0.59,0.45,0.1,0.27,0.08,0.93,0.62,0.91]

def get_quiz(file_id):
    success, result = get_data_one("Files", {'_id': ObjectId(file_id)}, projection={'questions': 1})
    if success and 'questions' in result:
        return result['questions']
    return []

def generate_quiz(file_id, course):
    print(file_id)
    print(course)
    
    # get # of embeddings
    _, result = get_data_one("Files", {'_id': ObjectId(file_id)}, projection={'chunk_ids': 1})
    top_k = len(result['chunk_ids'])
    # retrieve all embeddings for this file
    result = []
    while True:
        _, result = pc_get_many_filter(message_embedding = vector_embedding, top_k = top_k, filter = {"file_id": file_id}, include_values=True)
        print("Trying to get embeddings: ", len(result['matches']))
        if len(result['matches']) >= top_k:
            break
        time.sleep(5)

    note_embeddings = []
    for match in result['matches']:
        note_embeddings.append(match['values'])

    # go chunk by chunk and collect relevant questions
    question_count = {}
    for embedding in note_embeddings:
        _, result = pc_get_many_filter(embedding, top_k=10, filter={'course': course})
        for match in result['matches']:
            if match['score'] < 0.77:
                pass
            id = match['id']
            if id in question_count:
                question_count[id] = question_count[id] + 1
            else:
                question_count[id] = 1
    

    question_counter = Counter(question_count)
    top_occurrences = question_counter.most_common(10)


    """
    structure of final questions:

    final_questions = {
        'exam_id_1': {
            exam_url: str,
            exam_questions: [str, str, str]    
        },
        'exam_id_2': {
        
        }
    }
    
    """

    final_questions = {}

    for question_id,_ in top_occurrences:
        _, result = get_data_one("Questions", {'_id': ObjectId(question_id)})
        
        if str(result['exam_id']) in final_questions:
            final_questions[str(result['exam_id'])]['exam_questions'].append(result['text'])

        else:
            _, exam = get_data_one("Exams", {"_id": ObjectId(result['exam_id'])})
            final_questions[str(result['exam_id'])] = {
                'exam_url': exam['url'],
                'exam_questions': [result['text']]
            }

    # insert quiz questions to 
    success, error_message = update_one('Files', {'_id': ObjectId(file_id)}, {'$set': {'questions': final_questions}})
    
    return final_questions