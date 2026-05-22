import requests

url = "http://127.0.0.1:5000/predict"
files = {"video": open("C:\\Users\\lvssk\\Downloads\\Wan_Avatar_SpeechtoVideo.mp4", "rb")}

res = requests.post(url, files=files)
print(res.json())