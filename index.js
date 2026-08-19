import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
// Docs for MediaPipe at: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/README.md

import * as THREE from 'three';
import { STLLoader } from 'three/addons/stlloader';


// --- MediaPipe Globals ---
const VIDEO_ELEMENT_ID = "cameo";
let face_landmarker = null;
let detection_id = null;
let running = false;
let face_orientation = null;
let latest_rotation;

// --- THREE Globals ---
const loader = new STLLoader();
const scene = new THREE.Scene();
scene.background = null;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const material = new THREE.MeshLambertMaterial();
const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient_light);
const dir_light = new THREE.DirectionalLight(0xffffff, 0.6);
dir_light.position.set(0, 10, 0);
scene.add(dir_light);
let geometry, mesh, camera;

// --- MediaPipe Functions ---
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
    const video_bounding_rect = video.getBoundingClientRect();
    if (!(video instanceof HTMLVideoElement)) return;
    let landmark = null;
    let rfl = null;
    if (result.faceLandmarks.length > 0) {
        for (var i = 0; i < result.faceLandmarks[0].length; i++) {
            landmark = document.getElementById(`landmark-${i}`);
            rfl = result.faceLandmarks[0][i];
            let x = video_bounding_rect.right - (rfl.x * video_bounding_rect.width);
            let y = (rfl.y * video_bounding_rect.height) + video_bounding_rect.top;
            landmark.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
    } else {
        for (var i = 0; i < 478; i++) {
            landmark = document.getElementById(`landmark-${i}`);
            landmark.style.transform = 'translate3d(0, -100px, 0)';
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
        outputFacialTransformationMatrixes: true,
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

// --- THREE Functions ---
async function load_model() {
    const video_size = document.getElementById(VIDEO_ELEMENT_ID).getBoundingClientRect();
    geometry = await loader.loadAsync('./models/mask-v2.stl');
    if (!geometry) {
        console.error("Could not load STL model");
        return;
    }
    geometry.computeBoundingBox();
    const bounding_box = geometry.boundingBox;
    const center = bounding_box.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.x += 0.2; // temporary manual offset (fix later in CAD)
    scene.add(mesh);
    const aspect = video_size.width / video_size.height;
    camera = new THREE.PerspectiveCamera(
        50,
        aspect,
        0.1,
        1000,
    );
    const size = new THREE.Vector3();
    bounding_box.getSize(size);
    const max_dimension = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let camera_z = Math.abs(max_dimension / 2 / Math.tan(fov / 2)) * 1.5;
    console.log(camera_z);
    camera.position.set(0, 0, camera_z);
    camera.lookAt(0, 0, 0);
    renderer.setSize(video_size.width, video_size.height);
    console.log(video_size.width, video_size.height);
    renderer.render(scene, camera);
    document.getElementById("model-container").appendChild(renderer.domElement);
}

document.addEventListener("DOMContentLoaded", () => {
    generate_landmarks();
    start_all();
    load_model();
    window.addEventListener("keyup", (ev) => {
        console.log(ev.code);
        if (ev.code == "Space") {
            if (running) stop_all();
            else start_all();
        }
    })
})