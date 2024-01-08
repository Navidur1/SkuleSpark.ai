import os
import sys
from werkzeug.datastructures import FileStorage
from ocr_flow import ocr_flow
from openai import OpenAI
import json
import tiktoken
from dotenv import load_dotenv,find_dotenv

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
                    "content": "You are parsing an exam. You specialize in extracting text from exams questions and you put the text into a json aray called exam_questions."
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

    #decoded_response = json.loads(response.choices[0].message.function_call.arguments.strip())
    # print(response.choices[0].message.function_call.arguments.strip())
    # print(response.usage)
    print(response.choices[0].finish_reason)
    print(response.choices[0].message.content)
    #print(response.choices[0].message.content.function_call)
    return None


def process_pdf_files(directory):
    # Check if the provided directory exists
    if not os.path.exists(directory):
        print(f"The directory '{directory}' does not exist.")
        return

    # Check if the provided path is a directory
    if not os.path.isdir(directory):
        print(f"The path '{directory}' is not a directory.")
        return

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
                file_storage = FileStorage(file)
                _, ocr_results = ocr_flow(file_storage, skule_scrape=True)

                exam_text = ""
                for elem in ocr_results:
                    exam_text += elem['text']
                
                get_gpt_response(exam_text)
    
            # Placeholder 
            # comment for the actions you want to perform on each PDF file
            print(f"Processing '{filename}'...")
            # Your code to handle each PDF file goes here

if __name__ == "__main__":
    # Check if the correct number of command-line arguments is provided
    if len(sys.argv) != 2:
        print("Usage: python pdf_processor.py <directory_path>")
    else:
        directory_path = sys.argv[1]
        process_pdf_files(directory_path)
