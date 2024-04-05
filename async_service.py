import openai
from flask import json
import os
import time
from dotenv import load_dotenv, find_dotenv
from webscrape import get_links
from youtube import get_video

# Set up open ai
dotenv_path = find_dotenv(raise_error_if_not_found=True)
load_dotenv(dotenv_path)
client = openai.OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

model_id = "gpt-3.5-turbo-0125"

def get_augmented_message(note_content):
    augmented_message = f"Note content:\n\n"
    augmented_message += note_content
    augmented_message += f"\n\nTry your best to summarize the main ideas from the given note's content."

    return augmented_message

def get_gpt_response(note_content):
    augmented_message = get_augmented_message(note_content)
    messages = [{
                    "role": "system", 
                    "content": """For a given paragraph, return a summary and a list of keywords that best represents the paragraph.
                            Return in JSON format:
                            \`\`\`json
                            { "summary": "Summary of the paragraph", "keywords": ["KEYWORD1", "KEYWORD2"] }
                            \`\`\``"""
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

def create_summary(note_text):
    result = get_gpt_response(note_text)
    print(f"Result is: {result}")

    return result

def get_all_links(search_terms, max_wikipedia):
    if len(search_terms) > 3:
        search_terms = search_terms[:3]

    all_links = []
    wiki_count = 0

    for term in search_terms:
        links = get_links(term)
        time.sleep(0.5)
        if links is not None:
            for link in links:
                if 'wikipedia' in link and wiki_count < max_wikipedia:
                    all_links.append(link)
                    wiki_count += 1
                    break
                elif 'wikipedia' not in link:
                    all_links.append(link)
                    break
                    
    print(all_links)
    return all_links

def get_all_videos(search_terms):
    if len(search_terms) > 3:
        search_terms = search_terms[:3]
        
    all_videos = []

    for term in search_terms:
        video = get_video(term)
        time.sleep(0.5)
        if video is not None:
            all_videos.append(video)

    print(all_videos)
    return all_videos