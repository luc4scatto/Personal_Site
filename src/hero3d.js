import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const ACCENT = 0xccff00;
const WHITE = 0xf2f2f2;
const VIOLET = 0xa78bfa; // third palette color — complementary to the lime accent
const COLORS = [ACCENT, WHITE, VIOLET];
const GLB_MODELS = [
  'mixing_board_01',
  'transistor_03',
  'turntable',
  'knob_39',
  'gaming_computer',
  'integrated_circuit_01',
  'synthesizer',
  'classical_computer_mouse_03',
  'gaming_gpu',
  'connector_iec_c19_coiled',
  '3d_printer',
  'knob_44',
  'concert_speaker_02',
  'integrated_circuit_02',
  'pile_of_vinyl',
  'sunglasses_04',
  'mixing_board_03',
  'cable_ethernet_coiled',
  'concert_speaker_02',
];

// placeholder blurbs shown when an object is clicked — one per model, real copy TBD
const DESCRIPTIONS = {
  turntable: { title: 'Vinyl & DJing', text: 'Placeholder — I spin records and love the ritual of mixing on a real turntable.' },
  pile_of_vinyl: { title: 'Vinyl Collection', text: 'Placeholder — an ever-growing crate of records I hunt for on weekends.' },
  mixing_board_01: { title: 'Mixing', text: 'Placeholder — layering tracks and riding faders is my kind of flow state.' },
  mixing_board_03: { title: 'Live Sound', text: 'Placeholder — patching a console and dialing in a mix for a room.' },
  synthesizer: { title: 'Synths', text: 'Placeholder — chasing sounds and building patches from scratch.' },
  knob_39: { title: 'Sound Design', text: 'Placeholder — I tweak knobs until a patch finally clicks.' },
  knob_44: { title: 'Tweaking', text: 'Placeholder — endless fine-tuning is half the fun.' },
  gaming_computer: { title: 'PC Gaming', text: 'Placeholder — I built this rig myself and it doubles as my render machine.' },
  gaming_gpu: { title: 'Hardware', text: 'Placeholder — GPUs, benchmarks and the occasional upgrade rabbit hole.' },
  integrated_circuit_01: { title: 'Electronics', text: 'Placeholder — tinkering with circuits and small hardware projects.' },
  integrated_circuit_02: { title: 'Chips & Boards', text: 'Placeholder — I like understanding how the silicon actually works.' },
  transistor_03: { title: 'Tinkering', text: 'Placeholder — soldering, breadboards and figuring things out by hand.' },
  '3d_printer': { title: '3D Printing', text: 'Placeholder — prototyping props and parts one layer at a time.' },
  classical_computer_mouse_03: { title: 'Everyday Tools', text: 'Placeholder — the trusty tools I work with every day.' },
  connector_iec_c19_coiled: { title: 'Gear & Cables', text: 'Placeholder — the unglamorous cables that keep the studio running.' },
  cable_ethernet_coiled: { title: 'Connectivity', text: 'Placeholder — a tidy network is a happy network.' },
  sunglasses_04: { title: 'Eyewear & Design', text: 'Placeholder — eyewear is where my day job at Thélios meets good design.' },
  concert_speaker_02: { title: 'Live Music', text: 'Placeholder — gigs, festivals and chasing the perfect drop.' },
  _default: { title: 'One of my things', text: 'Placeholder description — this object represents one of my interests.' },
};

const ITEM_SIZE = 0.95;
// per-model size tweaks on top of ITEM_SIZE — hero pieces up, tiny parts down
const SIZE_TWEAKS = {
  mixing_board_01: 1.35,
  turntable: 1.35,
  synthesizer: 1.35,
  gaming_computer: 1.2,
  '3d_printer': 1.3,
  gaming_gpu: 1.2,
  pile_of_vinyl: 1.1,
  mixing_board_03: 1.1,
  sunglasses_04: 0.9,
  classical_computer_mouse_03: 0.8,
  connector_iec_c19_coiled: 0.8,
  integrated_circuit_01: 0.7,
  integrated_circuit_02: 0.7,
  knob_39: 0.45,
  knob_44: 0.45,
  transistor_03: 0.55,
};
const SPHERE_RADIUS = 3.0;
// ponytail: wander amplitude < half the min distance between fibonacci homes
// (19 pts on r=3 sphere → min dist ~2.1), so overlaps are impossible by construction.
// The pulse hint (≤1.2×) and focus scale (1.3×) stay well within that margin too.
const WANDER = 0.3;
const FOCUS_SCALE = 1.3;
const HOVER_SCALE = 1.12; // gentle scale-up while the pointer is over an object
const PULSE_AMP = 0.18; // extra scale at the peak of a click-me pulse
const GLOW_AMP = 0.5; // emissive flash at the peak of a pulse (same sin curve)
const BLUR_STRENGTH = 2.5; // gaussian blur radius (in texels) applied while focused

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

// stronger lightness variants of the base color so the parts of each object stay readable
const SHADE_OFFSETS = [0, -0.18, 0.12, -0.09, 0.07, -0.24, 0.16];
const NEUTRAL = 0x9a9797; // dark-gray parts interleaved for contrast (high metalness reads near-black without an envmap)

function recolor(object, baseColor) {
  let i = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    // every 4th part goes dark neutral + metallic, the rest are shades of the base
    const neutral = i % 4 === 3;
    const color = new THREE.Color(neutral ? NEUTRAL : baseColor);
    if (!neutral) color.offsetHSL(0, 0, SHADE_OFFSETS[i % SHADE_OFFSETS.length]);
    child.material = new THREE.MeshStandardMaterial({
      color,
      roughness: neutral ? 0.3 : 0.35,
      metalness: neutral ? 0.35 : 0.1,
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

// info card shown on click — created once, appended to <body> (the canvas is pointer-events:none)
function createInfoCard(onClose) {
  const card = document.createElement('div');
  card.className = 'info-card';
  card.hidden = true;
  card.innerHTML =
    '<button class="info-card__close" aria-label="Close">&times;</button>' +
    '<h3 class="info-card__title"></h3>' +
    '<p class="info-card__text"></p>';
  card.querySelector('.info-card__close').addEventListener('click', onClose);
  document.body.appendChild(card);
  return {
    el: card,
    title: card.querySelector('.info-card__title'),
    text: card.querySelector('.info-card__text'),
  };
}

export function initHero3D(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.z = 9.5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  // lights must reach the focused object too (it renders on its own layer while focused)
  ambient.layers.enableAll();
  sun.layers.enableAll();

  const group = new THREE.Group();
  group.position.x = 0.9;
  scene.add(group);

  const homes = fibonacciSphere(GLB_MODELS.length, SPHERE_RADIUS);
  const items = [];
  const clickable = []; // GLB wrappers only (decorative shapes stay non-interactive)

  function addItem(object, index) {
    normalize(object, ITEM_SIZE * (SIZE_TWEAKS[GLB_MODELS[index]] ?? 1));
    recolor(object, COLORS[index % COLORS.length]);
    // each mesh glows its own color during the click-me pulse (emissiveIntensity animated in the loop)
    const mats = [];
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.material.emissive = child.material.color.clone();
      child.material.emissiveIntensity = 0;
      mats.push(child.material);
    });
    const wrapper = new THREE.Group();
    wrapper.add(object);
    wrapper.position.copy(homes[index]);
    group.add(wrapper);
    const item = {
      wrapper,
      home: homes[index],
      mats,
      glow: 0,
      clickable: true,
      model: GLB_MODELS[index],
      focusAmt: 0, // eased 0→1 while this item is the focused one
      hoverAmt: 0, // eased 0→1 while the pointer is over this item
      pulseStart: -1,
      pulseUntil: -1,
      nextPulse: 2 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 0.4,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(0.004 + Math.random() * 0.004),
    };
    wrapper.userData.item = item;
    items.push(item);
    clickable.push(wrapper);
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
    const shades = [ACCENT, WHITE, VIOLET, ACCENT, WHITE];
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

  // ---- interaction: click an object → focus it, blur the rest, show its card ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmpV = new THREE.Vector3();
  let focusedItem = null;
  let hoveredItem = null;

  function pick(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom)
      return null;
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(clickable, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.item) o = o.parent;
    return o ? o.userData.item : null;
  }

  const info = createInfoCard(unfocus);

  function focus(item) {
    if (focusedItem === item) return;
    document.querySelector('.hero-hint')?.classList.add('is-hidden');
    if (focusedItem) focusedItem.wrapper.traverse((o) => o.layers.set(0));
    focusedItem = item;
    item.wrapper.traverse((o) => o.layers.set(1));
    ensureBlur();
    const d = DESCRIPTIONS[item.model] || DESCRIPTIONS._default;
    info.title.textContent = d.title;
    info.text.textContent = d.text;
    info.el.hidden = false;
    requestAnimationFrame(() => info.el.classList.add('is-open'));
  }

  function unfocus() {
    if (!focusedItem) return;
    focusedItem.wrapper.traverse((o) => o.layers.set(0));
    focusedItem = null;
    camera.layers.set(0);
    info.el.classList.remove('is-open');
    setTimeout(() => {
      if (!focusedItem) info.el.hidden = true;
    }, 260);
  }

  // parallax + hover cursor share one pointermove; click focuses / dismisses
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    hoveredItem = focusedItem ? null : pick(e.clientX, e.clientY);
    document.body.style.cursor = hoveredItem ? 'pointer' : '';
  });
  window.addEventListener('click', (e) => {
    if (e.target instanceof Node && info.el.contains(e.target)) return; // interacting with the card itself
    const hit = pick(e.clientX, e.clientY);
    if (hit) focus(hit);
    else if (focusedItem) unfocus();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') unfocus();
  });

  // ---- blur pipeline, allocated lazily on first focus, active only while focused ----
  let rtA, rtB, blurQuad, hMat, vMat, compMat;
  function rtSize() {
    const p = renderer.getPixelRatio();
    return new THREE.Vector2(
      Math.max(1, Math.round(container.clientWidth * p)),
      Math.max(1, Math.round(container.clientHeight * p))
    );
  }
  function ensureBlur() {
    if (rtA) return;
    const s = rtSize();
    rtA = new THREE.WebGLRenderTarget(s.x, s.y);
    rtB = new THREE.WebGLRenderTarget(s.x, s.y);
    hMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms),
      vertexShader: HorizontalBlurShader.vertexShader,
      fragmentShader: HorizontalBlurShader.fragmentShader,
    });
    vMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms),
      vertexShader: VerticalBlurShader.vertexShader,
      fragmentShader: VerticalBlurShader.fragmentShader,
    });
    // composite the linear blurred texture to screen: darken + encode to sRGB
    compMat = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, brightness: { value: 0.5 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader:
        'uniform sampler2D tDiffuse; uniform float brightness; varying vec2 vUv;' +
        'void main(){ vec4 t = texture2D(tDiffuse, vUv);' +
        'vec3 obj = pow(clamp(t.rgb * brightness, 0.0, 1.0), vec3(0.4545));' +
        // mix the dimmed objects over the page bg (#0a0a0a) in sRGB space so empty
        // pixels match the page exactly — no seam at the canvas edges
        'gl_FragColor = vec4(mix(vec3(0.0392), obj, t.a), 1.0); }',
    });
    blurQuad = new FullScreenQuad();
  }

  function renderFocused() {
    const s = rtSize();
    // 1. render everything except the focused object (it's on layer 1) into rtA
    camera.layers.set(0);
    renderer.setRenderTarget(rtA);
    renderer.clear();
    renderer.render(scene, camera);
    // 2. separable gaussian blur, ping-ponging rtA↔rtB (two iterations = smoother)
    for (let i = 0; i < 2; i++) {
      hMat.uniforms.tDiffuse.value = rtA.texture;
      hMat.uniforms.h.value = BLUR_STRENGTH / s.x;
      blurQuad.material = hMat;
      renderer.setRenderTarget(rtB);
      blurQuad.render(renderer);

      vMat.uniforms.tDiffuse.value = rtB.texture;
      vMat.uniforms.v.value = BLUR_STRENGTH / s.y;
      blurQuad.material = vMat;
      renderer.setRenderTarget(rtA);
      blurQuad.render(renderer);
    }
    // 3. composite the blurred background to the canvas
    renderer.setRenderTarget(null);
    renderer.clear();
    compMat.uniforms.tDiffuse.value = rtA.texture;
    blurQuad.material = compMat;
    blurQuad.render(renderer);
    // 4. draw the sharp focused object on top
    renderer.autoClear = false;
    renderer.clearDepth();
    camera.layers.set(1);
    renderer.render(scene, camera);
    camera.layers.set(0);
    renderer.autoClear = true;
  }

  function positionCard() {
    if (!focusedItem) return;
    if (window.innerWidth <= 700) {
      info.el.style.left = '';
      info.el.style.top = ''; // let the CSS bottom-sheet layout take over
      return;
    }
    focusedItem.wrapper.getWorldPosition(tmpV);
    tmpV.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const px = rect.left + (tmpV.x * 0.5 + 0.5) * rect.width;
    const py = rect.top + (-tmpV.y * 0.5 + 0.5) * rect.height;
    const cw = info.el.offsetWidth;
    const ch = info.el.offsetHeight;
    const M = 24; // keep this much clearance from the viewport edges
    const gap = 44; // horizontal offset from the object
    // prefer the right side of the object; flip to the left when the card would
    // otherwise run into the right edge (objects near the sphere's rim)
    let x = px + gap;
    if (x + cw > window.innerWidth - M) x = px - gap - cw;
    x = Math.min(Math.max(x, M), window.innerWidth - cw - M);
    const y = Math.min(Math.max(py - ch / 2, M), window.innerHeight - ch - M);
    info.el.style.left = `${x}px`;
    info.el.style.top = `${y}px`;
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    // mobile band: centered group, camera further back to fit
    const mobile = window.innerWidth <= 700;
    group.position.x = mobile ? 0 : 0.2;
    camera.position.z = mobile ? 12 : 13.5;
    if (rtA) {
      const s = rtSize();
      rtA.setSize(s.x, s.y);
      rtB.setSize(s.x, s.y);
    }
  }
  resize();
  new ResizeObserver(resize).observe(container);

  const clock = new THREE.Clock();
  let autoSpin = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    items.forEach((it) => {
      const wander = it === focusedItem ? 0 : it.wander ?? WANDER;
      it.wrapper.position.set(
        it.home.x + Math.sin(t * it.freq + it.phase) * wander,
        it.home.y + Math.sin(t * it.freq * 0.8 + it.phase * 2) * wander,
        it.home.z + Math.cos(t * it.freq * 0.6 + it.phase) * wander
      );
      it.wrapper.rotation.x += it.spin.x;
      it.wrapper.rotation.y += it.spin.y;
      it.wrapper.rotation.z += it.spin.z;

      if (it.clickable) {
        // ease the focus scale up/down
        it.focusAmt += ((it === focusedItem ? 1 : 0) - it.focusAmt) * 0.15;
        // occasional "click me" pulse, only when nothing is focused
        if (!focusedItem && t > it.nextPulse) {
          it.pulseStart = t;
          it.pulseUntil = t + 0.6;
          it.nextPulse = t + 3 + Math.random() * 5;
        }
        let pulse = 1;
        let glow = 0;
        if (!focusedItem && t < it.pulseUntil) {
          const p = (t - it.pulseStart) / (it.pulseUntil - it.pulseStart);
          const wave = Math.sin(Math.PI * p);
          pulse = 1 + wave * PULSE_AMP;
          glow = wave * GLOW_AMP;
        }
        if (glow !== it.glow) {
          it.glow = glow;
          it.mats.forEach((m) => (m.emissiveIntensity = glow));
        }
        // ease the hover scale (suppressed on the focused item — it's already scaled up)
        it.hoverAmt += ((it === hoveredItem && it !== focusedItem ? 1 : 0) - it.hoverAmt) * 0.15;
        const focusScale = 1 + it.focusAmt * (FOCUS_SCALE - 1);
        const hoverScale = 1 + it.hoverAmt * (HOVER_SCALE - 1);
        it.wrapper.scale.setScalar(focusScale * hoverScale * pulse);
      }
    });

    // freeze rotation while focused so the object (and its card) stay put
    if (!focusedItem) {
      // continuous slow spin (independent of the mouse) plus a mouse-parallax offset on top,
      // so the two never fight each other the way a single damped target would
      autoSpin += 0.001;
      parallaxY += (mouse.x * 0.35 - parallaxY) * 0.03;
      parallaxX += (mouse.y * 0.2 - parallaxX) * 0.03;
      group.rotation.y = autoSpin + parallaxY;
      group.rotation.x = parallaxX;
    }

    if (focusedItem) {
      renderFocused();
      positionCard();
    } else {
      renderer.render(scene, camera);
    }
  });
}
