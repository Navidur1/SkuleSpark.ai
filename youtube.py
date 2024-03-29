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

    response = request.execute()

    ids = []

    for item in response['items']:
        ids.append(item['id']['videoId'])

    return ids