import requests
from goose3 import Goose

#Skulespark@gmail.com key
API_KEY = "AIzaSyAPvQ4rM3utD22oHlY7a8kuhtlQ6bBtTPc"
CX = "378336830fc104cdf"
query = "newton"
num_results = 1

def get_link(search_term):
    g = Goose()

    url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={search_term}&num={num_results}"

    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        # Extract and print the non-sponsored links
        for item in data.get("items", []):
            link = item["link"]
            print(item["title"])
            print(f"Link: {link}")

            #Visit each link and extract the text from each link
            website_response = requests.get(link)

            if website_response.status_code == 200:
                #Find and extract the text content using goose3
                article = g.extract(link)
                '''main_text = article.cleaned_text'''
                return link
            else:
                '''return "Request website reponse failed with status code {website_response.status_code}\n"'''
                return None

    else:
        '''return "Request failed with status code {response.status_code}"'''
        return None