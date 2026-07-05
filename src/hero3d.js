import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const ACCENT = 0xccff00;
const WHITE = 0xf2f2f2;
const GLB_MODELS = [
  'macbook',
  'dj-mixer',
  'vinyl',
  'vinyl',
  'vinyl',
  'lego',
  'printer-3d',
  'speaker',
  'server',
  'cdj',
  'turntable',
  'lego-figure',
];
const ITEM_SIZE = 1.15;
// per-model size tweaks on top of ITEM_SIZE
const SIZE_TWEAKS = { cdj: 1.15, server: 0.85, turntable: 1.35 };
const SPHERE_RADIUS = 2.5;
// ponytail: wander amplitude < half the min distance between fibonacci homes
// (12 pts on r=2.5 sphere → min dist ~2.3), so overlaps are impossible by construction
const WANDER = 0.3;

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

// lightness variants of the base color so the parts of each object stay readable
const SHADE_OFFSETS = [0, -0.1, 0.08, -0.05, 0.05, -0.14, 0.1];

function recolor(object, baseColor) {
  let i = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    const color = new THREE.Color(baseColor);
    color.offsetHSL(0, 0, SHADE_OFFSETS[i % SHADE_OFFSETS.length]);
    child.material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide, // open meshes / flipped normals would look holey otherwise
    });
    i++;
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

  const homes = fibonacciSphere(GLB_MODELS.length, SPHERE_RADIUS);
  const items = [];

  function addItem(object, index) {
    normalize(object, ITEM_SIZE * (SIZE_TWEAKS[GLB_MODELS[index]] ?? 1));
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

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  GLB_MODELS.forEach((name, i) => {
    gltfLoader.load(`models/${name}.glb`, (gltf) => addItem(gltf.scene, i));
  });

  // small decorative shapes filling the orbital volume, kept clear of the models
  {
    // ~50% spheres, the rest cubes / tori / icosahedra
    const shapeGeos = [
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.TorusGeometry(1, 0.4, 8, 24),
      new THREE.IcosahedronGeometry(1.2, 0),
    ];
    const shades = [ACCENT, WHITE, ACCENT, WHITE];
    const placed = [];
    let guard = 0;
    while (placed.length < 110 && guard++ < 4000) {
      const p = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );
      if (p.length() > 1) continue;
      p.multiplyScalar(SPHERE_RADIUS + 0.4);
      if (homes.some((h) => h.distanceTo(p) < 0.9)) continue;
      if (placed.some((q) => q.distanceTo(p) < 0.12)) continue;
      placed.push(p);

      const color = new THREE.Color(shades[placed.length % shades.length]);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
      const geoIdx = Math.floor(Math.random() * shapeGeos.length);
      const mesh = new THREE.Mesh(
        shapeGeos[geoIdx],
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.4,
          metalness: 0.1,
          flatShading: geoIdx === shapeGeos.length - 1, // icosahedra look better faceted
        })
      );
      mesh.scale.setScalar(0.02 + Math.random() * 0.045);
      mesh.position.copy(p);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(mesh);
      items.push({
        wrapper: mesh,
        home: p.clone(),
        phase: Math.random() * Math.PI * 2,
        freq: 0.3 + Math.random() * 0.4,
        spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize()
          .multiplyScalar(0.003),
        wander: 0.1,
      });
    }
  }

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
    group.position.x = mobile ? 0 : 0.2;
    camera.position.z = mobile ? 10 : 11.5;
  }
  resize();
  new ResizeObserver(resize).observe(container);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    items.forEach((it) => {
      const w = it.wander ?? WANDER;
      it.wrapper.position.set(
        it.home.x + Math.sin(t * it.freq + it.phase) * w,
        it.home.y + Math.sin(t * it.freq * 0.8 + it.phase * 2) * w,
        it.home.z + Math.cos(t * it.freq * 0.6 + it.phase) * w
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
