from ultralytics import YOLO

model = YOLO("yolo11n-pose.pt")
results = model("test.jpg")


for result in results:
    print(result.keypoints)
