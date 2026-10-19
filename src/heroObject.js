// One 3D object for a project page's hero: the same Draco models as the home cloud, alone,
// slowly turning, and draggable. Decorative (aria-hidden), so no keyboard path. It draws only
// while it is on screen, and with reduced motion it stands still until someone drags it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const COARSE = matchMedia('(pointer: coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SIZE = 3.7; // the model's longest side, in scene units
const TILT = 0.28; // resting pitch, so a flat model still shows a top

// There is no laptop in the shared model set, so this one is built from boxes, in the site's own
// colours: a dark aluminium shell, a screen that runs blue into orange, an orange edge light.
function buildLaptop() {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x1a1b20, roughness: 0.4, metalness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 2.2), shell);
  g.add(base);

  const keyGeo = new THREE.BoxGeometry(0.2, 0.04, 0.2);
  const keys = new THREE.InstancedMesh(
    keyGeo,
    new THREE.MeshStandardMaterial({ color: 0x2b3042, roughness: 0.6 }),
    13 * 4,
  );
  const m = new THREE.Matrix4();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 13; c++) {
      m.setPosition(-1.32 + c * 0.22, 0.08, -0.85 + r * 0.22);
      keys.setMatrixAt(r * 13 + c, m);
    }
  }
  g.add(keys);
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.02, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x23262f, roughness: 0.3, metalness: 0.5 }),
  );
  pad.position.set(0, 0.07, 0.65);
  g.add(pad);
  // the orange edge light along the front lip
  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.03, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xff6a13 }),
  );
  lip.position.set(0, 0.0, 1.1);
  g.add(lip);

  // the lid hangs from the back edge and stands open, tilted a little past upright
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.07, -1.1);
  hinge.rotation.x = -(Math.PI / 2 + 0.25);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 2.1), shell);
  lid.position.set(0, 0.04, 1.05);
  hinge.add(lid);

  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 320;
  const x = cv.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, '#16233f');
  grad.addColorStop(0.55, '#5c8dff');
  grad.addColorStop(1, '#ff6a13');
  x.fillStyle = grad;
  x.fillRect(0, 0, 512, 320);
  x.fillStyle = 'rgba(10,10,10,0.55)'; // a panel of rows, so the screen reads as a tool
  x.fillRect(40, 40, 200, 240);
  x.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 6; i++) x.fillRect(56, 64 + i * 36, 120 - (i % 3) * 22, 10);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.96, 1.84),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, -0.001, 1.05);
  hinge.add(screen);
  g.add(hinge);
  return g;
}

export function initHeroObject(stage) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, COARSE ? 1.5 : 2));
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 7;
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  // a cool back light in the site's blue, so the edge of the object separates from the black
  const rim = new THREE.DirectionalLight(0x5c8dff, 1.2);
  rim.position.set(-3, 1, -2);
  scene.add(rim);

  const pivot = new THREE.Group();
  scene.add(pivot);

  function place(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(box.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();
    holder.add(model);
    holder.scale.setScalar(SIZE / Math.max(size.x, size.y, size.z));
    pivot.add(holder);
    pivot.rotation.set(TILT, -0.6, 0);
    stage.classList.add('is-ready');
    draw();
  }

  if (stage.dataset.objModel === 'laptop') {
    queueMicrotask(() => place(buildLaptop())); // after the state below is declared
  } else {
    const draco = new DRACOLoader();
    draco.setDecoderPath('draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(`models/${stage.dataset.objModel}.glb`, (gltf) => place(gltf.scene));
  }

  let yaw = -0.6;
  let pitch = TILT;
  let spin = REDUCED ? 0 : 0.0035; // radians per frame while nobody holds it
  let drag = null;
  let raf = 0;
  let visible = true;

  function draw() {
    pivot.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
  }
  function frame() {
    raf = 0;
    if (!drag) yaw += spin;
    draw();
    if (visible && !document.hidden && (spin || drag)) raf = requestAnimationFrame(frame);
  }
  const run = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  // touch-action keeps vertical page scroll working: only a sideways drag turns the object
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-grabbed');
    run();
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    yaw += (e.clientX - drag.x) * 0.012;
    pitch = Math.max(-0.9, Math.min(0.9, pitch + (e.clientY - drag.y) * 0.008));
    drag = { x: e.clientX, y: e.clientY };
    if (!spin) draw();
  });
  const release = () => {
    drag = null;
    el.classList.remove('is-grabbed');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) run();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }).observe(stage);
  document.addEventListener('visibilitychange', () => run());
  resize();
  run();
}
