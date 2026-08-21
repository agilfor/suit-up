import { FaceLandmarker, FilesetResolver } from 'mediapipe';
// Docs for MediaPipe at: https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/README.md
import * as THREE from 'three';
import { STLLoader } from 'three/addons/stlloader';

// --- MediaPipe Globals ---
const VIDEO_ELEMENT_ID = "cameo";
let video;
let face_landmarker = null;
let detection_id = null;
let running = false;

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
let base_scale = 4.0;
let x_offset = 0;
let y_offset = 30;

// --- MediaPipe Functions ---
function start_stream() {
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
    if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
        const matrix_data = result.facialTransformationMatrixes[0].data;
        const transform_matrix = new THREE.Matrix4().fromArray(matrix_data);
        const euler_rotation = new THREE.Euler().setFromRotationMatrix(transform_matrix);
        if (mesh && renderer && scene && camera) {
            // rotate mask
            mesh.rotation.x = euler_rotation.x;
            mesh.rotation.y = -euler_rotation.y;
            mesh.rotation.z = -euler_rotation.z;

            // move mask
            const nose = result.faceLandmarks[0][1];
            const ndc_x = -(nose.x - 0.5) * 2;
            const ndc_y = -(nose.y - 0.5) * 2;

            const n_vect = new THREE.Vector3(ndc_x, ndc_y, 0.5);
            n_vect.unproject(camera);
            n_vect.sub(camera.position).normalize();
            const n_dist = -camera.position.z / n_vect.z;
            const target_pos = camera.position.clone().add(n_vect.multiplyScalar(n_dist));
            console.log(target_pos, x_offset, y_offset);
            mesh.position.set(target_pos.x + parseFloat(x_offset), target_pos.y + parseFloat(y_offset), 0);

            // scale mask
            const left_cheek = result.faceLandmarks[0][234];
            const right_cheek = result.faceLandmarks[0][454];
            const face_width = Math.abs(right_cheek.x - left_cheek.x);

            mesh.scale.set(face_width * base_scale, face_width * base_scale, face_width * base_scale);

            renderer.render(scene, camera);
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

    let last_video_time = -1;
    
    const request_face_detection = () => {
        if (!face_landmarker) return;

        if (video.currentTime !== last_video_time) {
            const start_time = performance.now();
            const result = face_landmarker.detectForVideo(video, start_time);
            last_video_time = video.currentTime;
            parse_landmarks(result);
        }
        detection_id = window.requestAnimationFrame(request_face_detection);
    };

    video.addEventListener("loadeddata", () => {
        resize_canvas();
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

    if (video && video instanceof HTMLVideoElement) {
        const tracks = video.srcObject.getTracks();
        for (var i = 0; i < tracks.length; i++) tracks[i].stop();
        video.srcObject = null;
    }
    // generate_landmarks();
    running = false;
}

// --- THREE Functions ---
async function load_model() {
    const video_size = video.getBoundingClientRect();
    geometry = await loader.loadAsync('./models/mask-v2.stl');
    if (!geometry) {
        console.error("Could not load STL model");
        return;
    }
    geometry.computeBoundingBox();
    const bounding_box = geometry.boundingBox;
    const center = bounding_box.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.rotateX(-Math.PI / 2 + 0.2); // temporary offset, fix in CAD
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
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
    camera.position.set(0, 0, camera_z);
    camera.lookAt(0, 0, 0);
    renderer.setSize(video_size.width, video_size.height);
    renderer.render(scene, camera);
    document.getElementById("model-container").appendChild(renderer.domElement);

    // display constants
    document.getElementById("x-offset").value = x_offset;
    document.getElementById("y-offset").value = y_offset;
    document.getElementById("base-scale").value = base_scale;
}

function resize_canvas() {
    if (video instanceof HTMLVideoElement && camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = video.offsetWidth / video.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(video.offsetWidth, video.offsetHeight);
    }
}

// --- Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    video = document.getElementById(VIDEO_ELEMENT_ID);
    // generate_landmarks();
    start_all();
    load_model();
    window.addEventListener("keyup", (ev) => {
        if (ev.code == "Space") {
            if (running) stop_all();
            else start_all();
        }
    })
    window.onresize = resize_canvas;
    document.getElementById("x-offset").addEventListener("change", () => { x_offset = document.getElementById("x-offset").value; })
    document.getElementById("y-offset").addEventListener("change", () => { y_offset = document.getElementById("y-offset").value; })
    document.getElementById("base-scale").addEventListener("change", () => { base_scale = document.getElementById("base-scale").value; })
})
