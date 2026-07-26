import os, math, sqlite3
from flask import Flask, render_template, request, jsonify, json
from ultralytics import YOLO

app = Flask(__name__)

model = YOLO("train-6/weights/best.pt")
pose_model = YOLO("yolo26n-pose.pt")

UPLOAD_FOLDER = "static/uploads"
OUTPUT_FOLDER = "static/outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def init_db():
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT,
        original_image TEXT,
        result_image TEXT,
        confidence REAL,
        severity TEXT,
        deviation_percent REAL,
        conclusion TEXT,
        keypoints TEXT
    )""")


def ptl(point, start, end):
    x0, y0 = point
    x1, y1 = start
    x2, y2 = end
    top = abs((y2-y1)*x0-(x2-x1)*y0+x2*y1-y2*x1)
    bot = math.sqrt((y2-y1)*(y2-y1)+(x2-x1)*(x2-x1))
    if bot==0: return 0
    return top/bot

def ca(p1, p2):
    dx = float(p2[0]) - float(p1[0])
    dy = float(p2[1]) - float(p1[1])
    angle = math.degrees(math.atan2(dy, dx))
    return abs(round(angle, 2))

@app.route("/index.html")
def home():
    return render_template("index.html")

@app.route("/dashboard.html")
def dashboard():
    return render_template("dashboard.html")

@app.route("/about.html")
def about():
    return render_template("about.html")

@app.route("/faq.html")
def faq():
    return render_template("faq.html")

@app.route("/guide.html")
def guide():
    return render_template("guide.html")

@app.route("/info.html")
def info():
    return render_template("info.html")


@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["image"]
    image_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(image_path)
    results = model(image_path)
    result = results[0]
    pose_results = pose_model(image_path)
    pose_result = pose_results[0]
    shoulder_tilt = 0
    hip_tilt = 0
    if pose_result.keypoints is not None:
        pose_points = pose_result.keypoints.xy[0]
        left_shoulder = pose_points[5]
        right_shoulder = pose_points[6]
        left_hip = pose_points[11]
        right_hip = pose_points[12]
        shoulder_tilt = ca(left_shoulder, right_shoulder)
        hip_tilt = ca(left_hip, right_hip)

    if (len(result.boxes)>0):
        confidence = float(result.boxes.conf[0])
        confidence = round(confidence*100, 2)
    else:
        confidence = 0
    output_path = os.path.join(
        OUTPUT_FOLDER,
        file.filename
    )
    annotated = result.plot()
    import cv2
    cv2.imwrite(output_path, annotated)
    keypoints = []
    points = []
    if result.keypoints is not None:
        for point in result.keypoints.xy[0]:
            x =float(point[0])
            y =float(point[1])
            keypoints.append({
                "x":x,
                "y": y
            })

            points.append((x, y))

    max_deviation = 0
    spine_length=0
    top = points[0]
    bottom = points[-1]
    for p in points[1:-1]:
        dist = ptl(p, top, bottom)
        max_deviation = max(max_deviation, dist)
    spine_length = math.sqrt((bottom[0]-top[0])*(bottom[0]-top[0])+(bottom[1]-top[1])*(bottom[1]-top[1]))
    deviation_percent = 0
    deviation_percent = round((max_deviation/spine_length)*100, 2)
    if deviation_percent < 2:
        severity = "Normal-Mild"
    elif deviation_percent < 2.8:
        severity = "Mild-Moderate"
    else:
        severity = "Moderate-Severe"    
    max_deviation = round(max_deviation, 2)
    if deviation_percent < 2:
        conclusion = (
            "The model dectected minimal spinal deviation. The subject's posture appears to be within the normal to mildly asymmetric range."
        )
    elif deviation_percent < 3:
        conclusion = (
            "The model dectected moderate spinal deviation. It is reccomended to continue monitoring and assessing the curve to track further progression."
        )
    else:
        conclusion = (
            "The model dectected pronounced spinal asymmetry. It is reccomended to have a professional evaluation such as an X-ray."
        )
    
    return jsonify({
        "image": "/static/outputs/" + file.filename,
        "keypoints": keypoints,
        "confidence": confidence,
        "deviation_percent": deviation_percent,
        "shoulder_tilt": shoulder_tilt,
        "hip_tilt": hip_tilt,
        "severity": severity,
        "conclusion": conclusion

    })

@app.route("/save_session", methods=["POST"])
def save_session():
    data = request.json
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sessions (
        name,
        date,
        original_image,
        result_image,
        confidence,
        severity,
        deviation_percent,
        conclusion,
        keypoints
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["name"],
        data["date"],
        data["original_image"],
        data["result_image"],
        data["confidence"],
        data["severity"],
        data["deviation_percent"],
        data["conclusion"],
        json.dumps(data["keypoints"])
    ))
    conn.commit()
    conn.close()
    return jsonify({
        "message": "Session saved successfully!!!"
    })

@app.route("/sessions")
def get_sessions():
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, date
        FROM sessions
        ORDER BY id DESC
    """)
    sessions = cursor.fetchall()
    conn.close()
    return jsonify([
        {
            "id": s[0],
            "name": s[1],
            "date": s[2]
        }
        for s in sessions
    ])

@app.route("/session/<int:id>")
def load_session(id):
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT *
        FROM sessions
        WHERE id = ?
    """, (id,))
    session = cursor.fetchone()
    conn.close()
    return jsonify({
        "id": session[0],
        "name": session[1],
        "date": session[2],
        "original_image": session[3],
        "result_image": session[4],
        "confidence": session[5],
        "severity": session[6],
        "deviation_percent": session[7],
        "conclusion": session[8],
        "keypoints": json.loads(session[9])
    })

@app.route("/delete_session/<int:id>", methods=["DELETE"])
def delete_session(id):
    conn = sqlite3.connect("sessions.db")
    cursor = conn.cursor()
    cursor.execute(
        """
        DELETE FROM sessions
        WHERE id = ?
        """,
        (id,)
    )
    conn.commit()
    conn.close()
    return jsonify({
        "message": "Session deleted"
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True)