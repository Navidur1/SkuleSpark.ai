from flask import Flask, render_template, session, redirect, url_for, flash, request, g, jsonify
from database import get_data_one, insert_one
from bson.objectid import ObjectId
from database import get_data_one
from bson.objectid import ObjectId
from google.cloud import storage
from flask_cors import CORS
from ocr_flow import ocr_service
from embedding_service import embedding_service

app = Flask(__name__)
app.register_blueprint(ocr_service)
app.register_blueprint(embedding_service)

CORS(app)


@app.route('/')
def index():
    return render_template("homepage.html")


if __name__ == '__main__':
    app.run(debug=True)