import * as THREE from 'three';
import { STLLoader } from 'three/addons/stlloader';

const loader = new STLLoader();
const scene = new THREE.Scene();
scene.background = null;
const geometry = await loader.loadAsync('./models/mask-v2.stl');
if (!geometry) { console.error("there is no geometry"); }
geometry.computeBoundingBox();
const bounding_box = geometry.boundingBox;
const center = bounding_box.getCenter(new THREE.Vector3());
geometry.translate(-center.x, -center.y + 10, -center.z);
const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, 0);
mesh.rotation.x = -Math.PI / 2 + 0.2;
scene.add(mesh);
const ambient_light = new THREE.AmbientLight(0xeedd00, 0.1);
scene.add(ambient_light);
const dir_light = new THREE.DirectionalLight(0xff0000, 1);
dir_light.position.set(50, 10, -5);
scene.add(dir_light);

const aspect = window.innerWidth * 0.8 / window.innerHeight;
const camera = new THREE.PerspectiveCamera(
    50,
    aspect,
    0.1,
    1000,
);
const size = new THREE.Vector3();
bounding_box.getSize(size);
const max_dim = Math.max(size.x, size.y, size.z);
const fov = camera.fov * (Math.PI / 180);
let camera_z = Math.abs(max_dim / 2 / Math.tan(fov / 2));
console.log(camera_z)
camera.position.set(0, 0, camera_z * 1.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
renderer.render(scene, camera);

document.getElementById("model-container").appendChild(renderer.domElement);

function animate() {
    mesh.rotation.z += 0.01;
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}

animate();

window.onresize = () => {
    camera.aspect = window.innerWidth * 0.8 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}