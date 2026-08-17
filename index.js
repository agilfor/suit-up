import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
// Docs for MediaPipe at: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/README.md

const VIDEO_ELEMENT_ID = "cameo";
let face_landmarker = null;
let detection_id = null;
let running = false;

function generate_landmarks() {
    const container = document.getElementById("landmark-container");
    container.innerHTML = "";
    for (var i = 0; i < 478; i++) {
        container.innerHTML += `<span id="landmark-${i}" class="landmark"></span>`
    }
}

function start_stream() {
    const video = document.getElementById(VIDEO_ELEMENT_ID);
    if (navigator.mediaDevices.getUserMedia && video instanceof HTMLVideoElement) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (video && stream) { 
                    video.srcObject = stream;
                    video.play();
                }

            })
            .catch((err) => {
                console.error(`Error opening camera: ${err}`)
            })
    }
}

function parse_landmarks(result) {
    const video = document.getElementById(VIDEO_ELEMENT_ID);
    if (!(video instanceof HTMLVideoElement)) return;
    let landmark = null;
    let rfl = null;
    if (result.faceLandmarks.length > 0) {
        for (var i = 0; i < result.faceLandmarks[0].length; i++) {
            landmark = document.getElementById(`landmark-${i}`);
            rfl = result.faceLandmarks[0][i];
            let x = video.getBoundingClientRect().right - (rfl.x * video.offsetWidth);
            let y = (rfl.y * video.offsetHeight) + video.getBoundingClientRect().top;
            landmark.style.top = `${y}px`;
            landmark.style.left = `${x}px`;
        }
    } else {
        for (var i = 0; i < 478; i++) {
            landmark = document.getElementById(`landmark-${i}`);
            landmark.style.top = "-10px";
        }
    }
}

async function run_facial_landmarking() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    face_landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
        },
        runningMode: "VIDEO",
        outputFaceBlendshapes: true,
    });

    const video = document.getElementById(VIDEO_ELEMENT_ID);
    let last_video_time = -1;
    
    const request_face_detection = () => {
        if (!face_landmarker) return;

        if (video.currentTime !== last_video_time) {
            const start_time = performance.now();
            const result = face_landmarker.detectForVideo(video, start_time);
            console.log(result);
            last_video_time = video.currentTime;
            parse_landmarks(result);
        }
        detection_id = window.requestAnimationFrame(request_face_detection);
    };

    video.addEventListener("loadeddata", () => {
        request_face_detection();
    });
}

function start_all() {
    start_stream();
    run_facial_landmarking();
    running = true;
}

function stop_all() {
    if (detection_id !== null) {
        window.cancelAnimationFrame(detection_id);
        detection_id = null;
    }

    if (face_landmarker !== null) {
        face_landmarker.close();
        face_landmarker = null;
    }

    const video = document.getElementById(VIDEO_ELEMENT_ID);
    if (video && video instanceof HTMLVideoElement) {
        const tracks = video.srcObject.getTracks();
        for (var i = 0; i < tracks.length; i++) tracks[i].stop();
        video.srcObject = null;
    }
    generate_landmarks();
    running = false;
}

document.addEventListener("DOMContentLoaded", () => {
    generate_landmarks();
    start_all();
    window.addEventListener("keyup", (ev) => {
        console.log(ev.code);
        if (ev.code == "Space") {
            if (running) stop_all();
            else start_all();
        }
    })
})