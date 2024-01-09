import os
import sys
from werkzeug.datastructures import FileStorage
from ocr_flow import ocr_flow
from openai import OpenAI
import json
import tiktoken
import shutil
from dotenv import load_dotenv,find_dotenv
from database import insert_one, get_data_one, update_one, pc_get_many, pc_insert_one
from bson.objectid import ObjectId
import requests

# Set up open ai 
dotenv_path = find_dotenv(raise_error_if_not_found=True)
load_dotenv(dotenv_path)
client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

model_id = 'gpt-3.5-turbo-1106'
embedding_model = "text-embedding-ada-002"
encoding = tiktoken.encoding_for_model(model_id)

def get_augmented_message(exam):

    augmented_message = f"Exam text:\n\n" #"Use the following information, retrieved from relevant financial documents, to help answer the subsequent question.\n\n"
    augmented_message += exam
    augmented_message += f"\n\nTry your best retrieve all the text from the exam questions and put it into an array named exam_questions. This array is an array of strings that holds the all of the text of each question in the exam."

    return augmented_message

def get_gpt_response(exam):
    augmented_message = get_augmented_message(exam)
    messages = [{
                    "role": "system", 
                    "content": "You are parsing an exam. You specialize in extracting text from exams questions and you put the text into a json aray called exam_questions. This array is an array of strings that holds the all of the text of each question in the exam."
                },
                {
                    "role": "user",
                    "content": augmented_message
                }]

    response = client.chat.completions.create(
        model = model_id,
        messages = messages,
        stream=False,
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)


def download_pdf(url, save_path):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, 'wb') as file:
                file.write(response.content)
                file.close()
            print(f"PDF downloaded and saved at: {save_path}")
        else:
            print(f"Failed to download the PDF. Status code: {response.status_code}")
    except requests.RequestException as e:
        print(f"An error occurred: {e}")

def process_pdf_files(directory, course):
    # Check if the provided directory exists
    if not os.path.exists(directory):
        print(f"The directory '{directory}' does not exist.")
        return

    # Check if the provided path is a directory
    if not os.path.isdir(directory):
        print(f"The path '{directory}' is not a directory.")
        return

    # Download PDF from url
    target_directory = 'parsed_files'

<<<<<<< HEAD
    # Iterate over the files in the directory
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath) and filepath.lower().endswith('.pdf'):
            # Perform actions on each PDF file here
            # For example, you could use a PDF processing library like PyPDF2 or pdftotext
            # to read, manipulate, or extract information from the PDF files.
            # Example using PyPDF2:
            # 
            with open(filepath, 'rb') as file:
                # Create a FileStorage object
                print(f"Processing '{filename}'...")
                file_storage = FileStorage(file)
                _, ocr_results = ocr_flow(file_storage, None, skule_scrape=True)

                exam_text = ""
                for elem in ocr_results:
                    exam_text += elem['text']
                
                try:
                    result = get_gpt_response(exam_text)

                    print("Retrieved " + len(result['exam_questions']) + " questions from exam")

                    # Make results directory
                    new_directory = os.path.join(directory, target_directory)
                    if not os.path.exists(new_directory):
                        os.makedirs(new_directory)

                    # Move the current file to the new directory
                    new_filepath = os.path.join(new_directory, filename)
                    file.close()
                    shutil.move(filepath, new_filepath)

                    # Store and Embed retireved questions 
                    # for question in result:
                    #     success, question_id = insert_one('Exams')

                    print(f"Succesfully parsed '{filename}' and moved to {new_directory}.")
                except:
                    print(f"Could not retrieve questions for file '{filename}")
=======
    with open(f'{directory}/pdf_url.txt', 'r') as file:
        for url in file:
            success, data = get_data_one('Exams', {'url': url}, {'_id': 1})
            if success and data:
                print(f"Already parsed exam {url}. Skipping...")
                continue

            pdf_url = url.strip()
            filename = pdf_url.split('/')[-1]
            save_path = os.path.join(directory, filename)
            download_pdf(pdf_url, save_path)
            
            # Create exam object
            exam_object = {
                'url': url,
                'course': course
            }
            _, exam_id = insert_one('Exams', exam_object)

            # Iterate over the files in the directory
            filepath = save_path
            if os.path.isfile(filepath) and filepath.lower().endswith('.pdf'):
                with open(filepath, 'rb') as file:
                    # Create a FileStorage object
                    print(f"Processing '{filename}'...")
                    file_storage = FileStorage(file)
                    _, ocr_results = ocr_flow(file_storage, skule_scrape=True)

                    exam_text = ""
                    for elem in ocr_results:
                        exam_text += elem['text']
                    
                    try:
                        result = get_gpt_response(exam_text)

                        print("Retrieved " + str(len(result['exam_questions'])) + " questions from exam")

                        # Make results directory
                        new_directory = os.path.join(directory, target_directory)
                        if not os.path.exists(new_directory):
                            os.makedirs(new_directory)

                        # Move the current file to the new directory
                        new_filepath = os.path.join(new_directory, filename)
                        file.close()
                        shutil.move(filepath, new_filepath)

                        # Store and Embed retireved questions
                        for question in result['exam_questions']:
                            question_object = {
                                'exam_id': ObjectId(exam_id),
                                'text': question
                            }
                            _, question_id = insert_one('Questions', question_object)
                            embedding_res = client.embeddings.create(input=question, model=embedding_model)
                            pinecone_entry = (str(question_id), embedding_res.data[0].embedding, {"course": course})
                            success = pc_insert_one([pinecone_entry])                         

                        print(f"Succesfully parsed '{filename}' and moved to {new_directory}.")
                    except Exception as e:
                        print(f"Could not retrieve questions for file '{filename}")
                        print(e)
>>>>>>> 615acd4 (add in embedding feature)



if __name__ == "__main__":
    # Check if the correct number of command-line arguments is provided
    if len(sys.argv) != 3:
        print("Usage: python pdf_processor.py <directory_path> <course_code>")
    else:
        directory_path = sys.argv[1]
        course = sys.argv[2]
        process_pdf_files(directory_path, course)
