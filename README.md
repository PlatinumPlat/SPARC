# SPARC
Spinal Posture Assessment and Risk Classifier

# Description
SPARC aims to advocate for, facilitate, and promote early detection of scoliosis in an accessible manner.
It is a screening tool that analyzes an image of a patient's back to identify the severity of a patient's scoliosis, their shoulder tilt, and hip tilt.
In addition, SPARC allows users to save their results and access them afterwards to encourage users to track the progression of their curve and seek professional help in the case that it increases significantly.

# Demo
Access the demo at this google drive link: [https://drive.google.com/drive/folders/1eXi6Yc8do5UbdwkRtm8zSdeHkoL0qRMu?usp=sharing](https://drive.google.com/drive/folders/1eXi6Yc8do5UbdwkRtm8zSdeHkoL0qRMu?usp=sharing)

# Instructions For Use
Due to high server hosting costs, SPARC is currently locally-run.
To test it yourself on your own computer, follow these steps:

## Requirements
- Python 3.10 or newer

## 1. Clone this repo
Open Command Prompt, PowerShell, or Terminal.
Either type this command if you have git
```bash
git clone https://github.com/<your-username>/SPARC.git
cd SPARC
```
Or, download the ZIP from GitHub and extract it, then open Command Prompt, PowerShell, or Terminal in the extracted "SPARC" folder before continuing.

## 2. Create a virtual environment
### Windows
Run
```powershell
py -m venv .venv
.\.venv\Scripts\activate
```

### macOS/Linux
Run
```bash
python3 -m venv .venv
source .venv/bin/activate
```

## Install Dependencies
Run
```bash
pip install -r requirements.txt
```

## 4. Run the application
Run
```bash
python app.py
```

## 5. Checkout the website!!!
In your browser, go to

```
http://127.0.0.1:5000/index.html
```
SPARC should be running locally, and you can just follow the instructions on the website to test the model.

# Tech Stack
- HTML for designing the webpage
- CSS for styling the content
- Javascript for interactivity
- Python (Flask framework) for backend

# Sources
These two resources significantly helped me when I was beginning this project.
- [https://docs.ultralytics.com/tasks/pose#train](https://docs.ultralytics.com/tasks/pose#train)
- [https://agneya.medium.com/a-beginners-guide-to-yolo-pose-detection-e99ea7db014c](https://agneya.medium.com/a-beginners-guide-to-yolo-pose-detection-e99ea7db014c)

# Credits
Created with 💖 by Sophia Pu
