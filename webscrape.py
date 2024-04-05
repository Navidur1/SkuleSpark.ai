import requests
#from goose3 import Goose

#Skulespark@gmail.com key
API_KEY = "AIzaSyAPvQ4rM3utD22oHlY7a8kuhtlQ6bBtTPc"
CX = "378336830fc104cdf"
NUM_RESULTS = 2

# Returns a list of links of length NUM_RESULTS
def get_links(search_term):
    #used for text extraction from website
    #g = Goose()

    ret = []
    url = f"https://www.googleapis.com/customsearch/v1?key={API_KEY}&cx={CX}&q={search_term}&num={NUM_RESULTS}"

    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        # Extract and print the non-sponsored links
        for item in data.get("items", []):
            link = item["link"]

            #Visit each link and extract the text from each link
            website_response = requests.get(link)

            if website_response.status_code == 200:
                #Find and extract the text content using goose3
                # article = g.extract(link)
                # main_text = article.cleaned_text

                ret.append(link)

            else:
                '''return "Request website reponse failed with status code {website_response.status_code}\n"'''
                return None

    else:
        '''return "Request failed with status code {response.status_code}"'''
        return None
    
    return ret