import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = null;
const geometry = new THREE.BoxGeometry(3, 1, 3);
const material = new THREE.MeshLambertMaterial({ color: 0xfb8e00 });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, 0);
scene.add(mesh);
const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient_light);
const dir_light = new THREE.DirectionalLight(0xffffff, 0.6);
dir_light.position.set(10, 20, 0);
scene.add(dir_light);

const aspect = (window.innerWidth * 0.8) / window.innerHeight;
const camera = new THREE.PerspectiveCamera(
    45,
    aspect,
    1,
    100,
);
camera.position.set(4, 4, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
renderer.render(scene, camera);

document.getElementById("model-container").appendChild(renderer.domElement);