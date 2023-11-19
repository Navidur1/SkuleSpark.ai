from flask import Flask, render_template, session, redirect, url_for, flash, request, g
from flask_bootstrap import Bootstrap
from database import get_data_one
from bson.objectid import ObjectId
from database import get_data_one
from bson.objectid import ObjectId
from google.cloud import storage

app = Flask(__name__)

bootstrap = Bootstrap(app)

credentials_path = 'credentials.json'
bucket_name = 'capstone-notes-bucket'

# Initialize Google Cloud Storage client with the service account credentials
storage_client = storage.Client.from_service_account_json(credentials_path)

@app.route('/')
def index():
    return render_template("homepage.html")

@app.route('/upload', methods=['POST'])
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

    # Get the public URL of the uploaded PDF file
    pdf_url = blob.public_url

    # Return the URL of the uploaded PDF file
    return {'pdf_url': pdf_url}, 200

if __name__ == '__main__':
    app.run(debug=True)