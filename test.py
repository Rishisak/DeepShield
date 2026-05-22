from model import predict_video

result, confidence = predict_video("C:\\Users\\lvssk\\Downloads\\Wan_Avatar_SpeechtoVideo.mp4")

print("Result:", result)
print("Confidence:", confidence)