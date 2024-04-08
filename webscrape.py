import requests
from bs4 import BeautifulSoup
from requests.exceptions import ConnectionError
from urllib.parse import urlparse
import time

#Skulespark@gmail.com key
API_KEY = "AIzaSyAPvQ4rM3utD22oHlY7a8kuhtlQ6bBtTPc"
CX = "378336830fc104cdf"
NUM_RESULTS = 3

def extract_base_url(url):
    parsed_url = urlparse(url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    return base_url

def extract_favicon(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    favicon_url = None

    # Try to find the favicon link tag
    for tag in soup.find_all('link'):
        rel_list = tag.get('rel')
        href = tag.get('href')
        if rel_list and href:
            rel_lower = [rel.lower() for rel in rel_list]
            if any('icon' in rel or 'shortcut icon' in rel for rel in rel_lower) or href.endswith('.ico'):
                # Check if href is a relative path
                if href.startswith('//'):
                    favicon_url = 'https:' + href
                elif href.startswith('/'):
                    favicon_url = base_url + href
                else:
                    favicon_url = href
                break

    return favicon_url

# Returns a list of dictionaries containing link, title, and favicon_url of length NUM_RESULTS
def get_links(search_term):
    ret = []
    url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={search_term}&num={NUM_RESULTS}"
    print("Starting webscrape of term: " + search_term)

    try:
        response = requests.get(url, timeout=(5, 10))  # Timeout set to 5 seconds for connection, 10 seconds for read
        if response.status_code == 200:
            print("Received response, starting processing")
            data = response.json()
            for item in data.get("items", []):
                link = item["link"]
                title = item["title"]

                print("Extracting base url")
                base_url = extract_base_url(link)
                print("Finished extracting base url")

                print("Attempting to access scraped website")
                website_response = requests.get(link, timeout=(5, 10))  # Timeout set to 5 seconds for connection, 10 seconds for read
                
                if website_response.status_code == 200:
                    print("Successfully visited website")
                    favicon_url = extract_favicon(website_response.text, base_url)
                    ret.append({"link": link, "title": title, "favicon_url": favicon_url})
    except requests.exceptions.Timeout:
        print("Request timed out")
    except ConnectionError:
        print(f"Failed to fetch {url}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return ret