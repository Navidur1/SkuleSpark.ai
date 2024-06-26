from flask import Flask, render_template, session, redirect, url_for, flash, request, g, jsonify
from database import get_data_one, insert_one
from bson.objectid import ObjectId
from google.cloud import storage
from flask_cors import CORS
from chat import chat_service
from ocr_flow import ocr_service
from embedding_service import embedding_service
from crud_notes import crud_notes
from database import get_data
from quiz_service import quiz_service

app = Flask(__name__)
app.register_blueprint(chat_service)
app.register_blueprint(ocr_service)
app.register_blueprint(embedding_service)
app.register_blueprint(crud_notes)
app.register_blueprint(quiz_service)
CORS(app)


@app.route('/')
def index():
    return ""

if __name__ == '__main__':
    app.run(debug=True, port=5001)