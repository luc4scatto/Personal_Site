import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const ACCENT = 0xccff00;
const WHITE = 0xf2f2f2;
const GLB_MODELS = ['macbook', 'dj-mixer', 'vinyl', 'lego', 'printer-3d', 'circuit', 'sneakers'];
const ITEM_SIZE = 1.15;
const SPHERE_RADIUS = 1.8;
// ponytail: wander amplitude < half the min distance between fibonacci homes
// (8 pts on r=2.2 sphere → min dist ~1.7), so overlaps are impossible by construction
const WANDER = 0.35;

function fibonacciSphere(count, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius));
  }
  return pts;
}

function recolor(object, color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
  object.traverse((child) => {
    if (child.isMesh) child.material = mat;
  });
}

function normalize(object, size) {
  const box = new THREE.Box3().setFromObject(object);
  const dim = box.getSize(new THREE.Vector3());
  const scale = size / Math.max(dim.x, dim.y, dim.z);
  object.scale.setScalar(scale);
  const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
  object.position.sub(center);
}

export function initHero3D(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 9.5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const group = new THREE.Group();
  group.position.x = 0.9;
  scene.add(group);

  const homes = fibonacciSphere(GLB_MODELS.length + 1, SPHERE_RADIUS);
  const items = [];

  function addItem(object, index) {
    normalize(object, ITEM_SIZE);
    recolor(object, index % 2 === 0 ? ACCENT : WHITE);
    const wrapper = new THREE.Group();
    wrapper.add(object);
    wrapper.position.copy(homes[index]);
    group.add(wrapper);
    items.push({
      wrapper,
      home: homes[index],
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 0.4,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(0.004 + Math.random() * 0.004),
    });
  }

  const gltfLoader = new GLTFLoader();
  GLB_MODELS.forEach((name, i) => {
    gltfLoader.load(`models/${name}.glb`, (gltf) => addItem(gltf.scene, i));
  });

  // music note: no CC0 GLB exists, extrude the SVG icon instead
  new SVGLoader().load('models/music-note.svg', (data) => {
    const geoms = [];
    data.paths.forEach((path) => {
      SVGLoader.createShapes(path).forEach((shape) => {
        geoms.push(new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false }));
      });
    });
    const note = new THREE.Group();
    geoms.forEach((g) => note.add(new THREE.Mesh(g)));
    note.rotation.x = Math.PI; // SVG y-axis is flipped
    const holder = new THREE.Group();
    holder.add(note);
    addItem(holder, GLB_MODELS.length);
  });

  // light parallax following the mouse
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    // mobile band: centered group, camera further back to fit
    const mobile = window.innerWidth <= 700;
    group.position.x = mobile ? 0 : 0.9;
    camera.position.z = mobile ? 8 : 9.5;
  }
  resize();
  new ResizeObserver(resize).observe(container);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    items.forEach((it) => {
      it.wrapper.position.set(
        it.home.x + Math.sin(t * it.freq + it.phase) * WANDER,
        it.home.y + Math.sin(t * it.freq * 0.8 + it.phase * 2) * WANDER,
        it.home.z + Math.cos(t * it.freq * 0.6 + it.phase) * WANDER
      );
      it.wrapper.rotation.x += it.spin.x;
      it.wrapper.rotation.y += it.spin.y;
      it.wrapper.rotation.z += it.spin.z;
    });
    group.rotation.y += (mouse.x * 0.35 - group.rotation.y) * 0.03 + 0.0008;
    group.rotation.x += (mouse.y * 0.2 - group.rotation.x) * 0.03;
    renderer.render(scene, camera);
  });
}
