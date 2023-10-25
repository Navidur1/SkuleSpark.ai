import requests
from bs4 import BeautifulSoup

API_KEY = "PUT_KEY"
CX = "SEARCH_ENGINE_ID"
query = "string query"
num_results = 5

url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={query}&num={num_results}"

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    # Extract and print the non-sponsored links
    for item in data.get("items", []):
        print(item["title"])
        print(item["link"])
else:
    print(f"Request failed with status code {response.status_code}")
    print(response.content)