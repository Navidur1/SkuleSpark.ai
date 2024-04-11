import googleapiclient.discovery

api_service_name = "youtube"
api_version = "v3"
DEVELOPER_KEY = "AIzaSyB_RmCHJlQ7-2doB1N9bYuISijl1tTOti4"

youtube = googleapiclient.discovery.build(
    api_service_name, api_version, developerKey = DEVELOPER_KEY)

def get_video(keyword):
    request = youtube.search().list(
        part="snippet",
        maxResults=1,
        q=keyword,
        type="video"
    )
    ids = []

    try:
        response = request.execute()

        if response:
            for item in response['items']:
                ids.append(item['id']['videoId'])
    except Exception as e:
        print("[YOUTUBE] Request failed for term: " + keyword)

    return ids