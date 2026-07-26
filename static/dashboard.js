const today = new Date();
document.getElementById("session-date").textContent = "Session " + 
    today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const preview_container = document.getElementById("preview-container");
const resultImage = document.getElementById("result-image");
let currentResult = null;

input.addEventListener("change", async () => {
    const file=input.files[0];
    if (!file) return;
    preview.src=URL.createObjectURL(file);
    preview_container.style.display = "block";
    preview.style.display = "block";

    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/predict", {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    currentResult = data;
    resultImage.src = data.image;
    resultImage.style.display = "block";

    const downloadBtn = document.getElementById("download-btn");
    downloadBtn.href = data.image;
    
    const resultText = document.querySelector(".results-textbox p");
    resultText.innerHTML = `
        The model's confidence level was ${data.confidence}%.<br>
        The spine deviation was ${data.deviation_percent}%, which is in the category of ${data.severity}.<br>
        ${data.conclusion}<br>
        Shoulder Tilt: ${data.shoulder_tilt}°<br>
        Hip Tilt: ${data.hip_tilt}°<br>`
    const dataText = document.querySelector(".data-box p");
    dataText.innerHTML = `Detected ${data.keypoints.length} keypoints.<br>
        Keypoints:<br>
        ${data.keypoints.map(
        (p, i) => `Point ${i + 1}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join("<br>")}`;

    document.querySelectorAll(".sample-img").forEach(img=>{
        img.classList.remove("selected");
    });
});

const samples = document.querySelectorAll(".sample-img");

samples.forEach(sample=>{
    sample.addEventListener("click", async ()=>{
        preview.src = sample.src;
        preview_container.style.display = "block";
        preview.style.display = "block";

        const imgresponse = await fetch(sample.src);
        const blob = await imgresponse.blob();

        const file = new File(
            [blob],
            sample.src.split("/").pop(),
            {
                type: blob.type
            }
        );

        const formData = new FormData();
        formData.append("image", file);
        const preresponse = await fetch("/predict", {
            method: "POST",
            body: formData
        });
        const data = await preresponse.json();
        currentResult = data;
        resultImage.src = data.image;
        resultImage.style.display = "block";
        const downloadBtn = document.getElementById("download-btn");
        downloadBtn.href = data.image;

        const resultText = document.querySelector(".results-textbox p");
        resultText.innerHTML = `
        The model's confidence level was ${data.confidence}%.<br>
        The spine deviation was ${data.deviation_percent}%, which is in the category of ${data.severity}.<br>
        ${data.conclusion}<br>
        Shoulder Tilt: ${data.shoulder_tilt}°<br>
        Hip Tilt: ${data.hip_tilt}°<br>`
        const dataText = document.querySelector(".data-box p");
        dataText.innerHTML = `Detected ${data.keypoints.length} keypoints.<br>
        Keypoints:<br>
        ${data.keypoints.map(
            (p, i) => `Point ${i + 1}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join("<br>")}`;
        samples.forEach(img=>{
            img.classList.remove("selected");
        });
        sample.classList.add("selected");
    });
});

const none = document.getElementById("rmv");
none.addEventListener("click", () => {
    preview_container.style.display = "none";
    preview.style.display = "none";
    document.querySelectorAll(".sample-img").forEach(img => {
        img.classList.remove("selected");
    });
});

const saveBtn = document.getElementById("save-session-btn");
saveBtn.addEventListener("click", async()=> {
    const name = prompt("Enter session name:");
    if (!name) return;
    const sessionData = {
        name: name,
        date: new Date().toLocaleDateString(),
        original_image: preview.src,
        result_image: resultImage.src,

        confidence: currentResult.confidence,
        severity: currentResult.severity,
        deviation_percent: currentResult.deviation_percent,
        conclusion: currentResult.conclusion,
        keypoints: currentResult.keypoints
    }
    const response = await fetch("/save_session", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sessionData)
    });
    const result = await response.json();
    alert(result.message);
    loadSessionList();
})

async function loadSessionList() {
    const response = await fetch("/sessions");
    const sessions = await response.json();
    const logList = document.getElementById("log-list");
    logList.innerHTML = "";
    sessions.forEach(session => {
        const item = document.createElement("div");
        item.className = "log-item";
        item.onclick = () => {
            openSession(session.id);
        };
        const name = document.createElement("span");
        name.className = "log-name";
        name.textContent = session.name;
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-session-btn";
        deleteBtn.innerHTML = "🗑";
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            await fetch(`/delete_session/${session.id}`, {
                method: "DELETE"
            });
            console.log("Current session clicked");
            currentResult = null;
            preview.src = "";
            preview.style.display = "none";
            resultImage.src = "";
            resultImage.style.display = "none";
            const resultText = document.querySelector(".results-textbox p");
            const dataText = document.querySelector(".data-box p");
            console.log("result image:", resultImage);
            console.log("result text:", resultText);
            console.log("data text:", dataText);
            resultText.innerHTML = "";
            dataText.innerHTML = "";
            document.querySelectorAll(".sample-img").forEach(img => {
                img.classList.remove("selected");
            });
            await loadSessionList();
        };

        item.appendChild(name);
        item.appendChild(deleteBtn);
        logList.appendChild(item);
    });
}

loadSessionList();

async function openSession(id) {
    const response = await fetch(`/session/${id}`);

    const data = await response.json();
    preview.src = data.original_image;
    preview.style.display = "block";
    resultImage.src = data.result_image;
    resultImage.style.display = "block";
    const resultText = document.querySelector(".results-textbox p");
    resultText.innerHTML = `
        The model's confidence level was ${data.confidence}%.<br>
        The spine deviation was ${data.deviation_percent}%, which is in the category of ${data.severity}.<br>
        ${data.conclusion}<br>
        Shoulder Tilt: ${data.shoulder_tilt}°<br>
        Hip Tilt: ${data.hip_tilt}°<br>`
    const dataText = document.querySelector(".data-box p");
    dataText.innerHTML = `Detected ${data.keypoints.length} keypoints.<br>
        Keypoints:<br>
        ${data.keypoints.map(
        (p, i) => `Point ${i + 1}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join("<br>")}`;
}

const currentSession = document.getElementById("current-session");

currentSession.addEventListener("click", () => {
    console.log("Current session clicked");
    currentResult = null;
    preview.src = "";
    preview.style.display = "none";
    resultImage.src = "";
    resultImage.style.display = "none";
    const resultText = document.querySelector(".results-textbox p");
    const dataText = document.querySelector(".data-box p");
    console.log("result image:", resultImage);
    console.log("result text:", resultText);
    console.log("data text:", dataText);
    resultText.innerHTML = "";
    dataText.innerHTML = "";
    document.querySelectorAll(".sample-img").forEach(img => {
        img.classList.remove("selected");
    });
});

loadSessionList();