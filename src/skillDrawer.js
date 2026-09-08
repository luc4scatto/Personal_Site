// The skill drawer: one long office drawer in brushed steel, seen at three quarters, with
// the tools filed in it front-to-back the way a real card index is.
//
// The folders are the page's own <li data-skill> elements, moved into a CSS3DObject each.
// That is the whole point of CSS3DRenderer here: at three quarters every folder sits at a
// different depth, so a flat DOM strip cannot line up any more — but billboarding them in
// WebGL would cost the text, the links, the keyboard and the screen reader. CSS3D keeps
// real DOM and still puts it in the scene's perspective.
//
// A folder IS its own detail card. At rest only the tab shows above the rim; picking one
// grows the sheet upward and brings it forward to read. Nothing ever needs to be drawn
// behind the metal, which matters because a CSS3D layer cannot be occluded by the WebGL
// canvas — everything the visitor reads lives above the drawer's rim by construction.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import gsap from 'gsap';
import { content } from './content.js';

// CSS3D works in CSS pixels, so the cards are authored at their real size and the whole
// rail is scaled into world units.
const CARD_W = 250;
const CARD_H = 320;
const PX = 0.011; // px -> world
const CW = CARD_W * PX; // ~2.75
const CH = CARD_H * PX; // ~3.52

const GAP = 0.44; // spacing front to back. Tighter and the tabs cover each other
const W = CW + 1.0; // drawer is a little wider than a folder
const H = 1.6; // side height
const T = 0.14; // wall thickness
const FACE_W = 4.05; // the front face - drawer and cabinet share it so the edges line up
const AZIMUTH = THREE.MathUtils.degToRad(34);
const ELEVATION = THREE.MathUtils.degToRad(27);

/** Brushed steel, not chrome: a mirror would render RoomEnvironment's fake room legibly,
 *  which reads as a bug. Streaks break the reflection into a machined surface. */
function brushedRoughness() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const y = Math.random() * 512;
    const x = Math.random() * 512;
    const v = 60 + Math.random() * 90;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.lineWidth = Math.random() < 0.5 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12 + Math.random() * 90, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

/** Turn a plain tile into a folder: the mark and name become the tab, and the copy from
 *  content.js becomes the sheet that unfolds above it. */
function buildFolder(li) {
  const d = content.skills[li.dataset.skill];
  const icon = li.querySelector('.skill-icon');
  const label = li.querySelector('.skill-label');
  li.textContent = '';
  li.className = 'folder';
  if (d?.color) li.style.setProperty('--brand', d.color);

  const sheet = document.createElement('div');
  sheet.className = 'folder__sheet';

  const tab = document.createElement('div');
  tab.className = 'folder__tab';
  if (icon) tab.append(icon);
  if (label) tab.append(label);
  sheet.append(tab);

  const body = document.createElement('div');
  body.className = 'folder__body';
  if (d?.selfTaught) {
    const badge = document.createElement('p');
    badge.className = 'folder__badge';
    badge.textContent = 'Self-taught';
    body.append(badge);
  }
  if (d?.text) {
    const p = document.createElement('p');
    p.className = 'folder__text';
    p.textContent = d.text;
    body.append(p);
  }
  if (d?.bullets?.length) {
    const ul = document.createElement('ul');
    ul.className = 'folder__bullets';
    for (const b of d.bullets) {
      const item = document.createElement('li');
      if (typeof b === 'string') {
        item.textContent = b;
      } else {
        item.textContent = b.label;
        const sub = document.createElement('ul');
        for (const s of b.subs ?? []) {
          const si = document.createElement('li');
          si.textContent = s;
          sub.append(si);
        }
        item.append(sub);
      }
      ul.append(item);
    }
    body.append(ul);
  }
  sheet.append(body);
  li.append(sheet);

  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-expanded', 'false');
  return li;
}

export function initSkillDrawer(host, strip) {
  const tiles = [...strip.querySelectorAll('li[data-skill]')];
  if (!tiles.length) return () => {};

  const scene = new THREE.Scene();
  // A long lens on purpose. At 32 degrees the drawer's front panel rendered half again
  // larger than the cabinet face 11 units behind it, and the two stopped reading as the
  // same piece of furniture. Flattening the perspective closes that gap; fit() re-solves
  // the distance, so nothing else has to change.
  const camera = new THREE.PerspectiveCamera(17, 1, 0.1, 400);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // this renderer is its own island: hero3d.js sets neither of these and corrects sRGB by
  // hand in its blur shader, so configuring them here changes nothing over there
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  const css = new CSS3DRenderer();
  css.domElement.className = 'drawer__css';
  host.appendChild(css.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const roughnessMap = brushedRoughness();
  const steel = new THREE.MeshStandardMaterial({
    color: 0x9aa0a8,
    metalness: 0.96,
    roughness: 0.3,
    roughnessMap,
    envMapIntensity: 1.1,
  });
  // A void, not dark metal. Anything lit down there catches the environment and reads as a
  // floor again however far it is dimmed, so the inside takes no light at all and the cards
  // climb out of nothing.
  const steelInner = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const D = GAP * tiles.length + CW * 0.6; // long enough to hold the whole index
  const drawer = new THREE.Group();
  scene.add(drawer);

  const box = (bw, bh, bd, mat) => new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 3, 0.05), mat);

  const bottom = box(W, T, D, steelInner);
  bottom.position.y = -H / 2;
  drawer.add(bottom);

  const back = box(W, H, T, steelInner);
  back.position.z = -D / 2 + T / 2;
  drawer.add(back);

  for (const sx of [-1, 1]) {
    const side = box(T, H, D, steel);
    side.position.x = sx * (W / 2 - T / 2);
    drawer.add(side);
  }

  const front = box(FACE_W, H * 1.4, 0.22, steel);
  front.position.set(0, -0.15, D / 2 + 0.11);
  drawer.add(front);

  const handle = box(W * 0.45, 0.18, 0.24, steel);
  handle.position.set(0, -0.15, D / 2 + 0.33);
  drawer.add(handle);

  // ---- the cabinet ---------------------------------------------------------------------
  // Behind the drawer's back end, never over it: the whole index has to stay visible, and a
  // carcass wrapping the drawer would swallow the folders filed at the back. It runs well
  // past the top of the frame; .drawer__scene's mask is what ends it.
  const CAB_W = FACE_W;
  const CAB_H = 16;
  // deep enough to actually swallow this drawer. A shallow carcass sat so far behind a
  // drawer this long that perspective shrank it, and the two stopped reading as one object.
  const CAB_D = D * 0.85;
  const cabinet = new THREE.Group();
  cabinet.position.z = -D / 2 - CAB_D / 2 - 0.05;
  scene.add(cabinet);

  const carcass = box(CAB_W, CAB_H, CAB_D, steel);
  carcass.position.y = CAB_H / 2 - H * 1.25;
  cabinet.add(carcass);

  // closed drawer fronts stacked above the open one - without them the carcass is just a
  // slab and the object stops reading as office furniture
  for (let i = 0; i < 4; i++) {
    const face = box(CAB_W, H * 1.5, 0.2, steel);
    face.position.set(0, H * 1.62 + i * (H * 1.62), CAB_D / 2 + 0.06);
    cabinet.add(face);
    const pull = box(W * 0.45, 0.16, 0.22, steel);
    pull.position.set(0, face.position.y, CAB_D / 2 + 0.22);
    cabinet.add(pull);
  }

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-4, 7, 6);
  scene.add(key);

  // ---- the folders -------------------------------------------------------------------
  // The rail slides through the drawer; the cards keep their own place on it.
  const rail = new THREE.Group();
  drawer.add(rail);

  const RIM = H / 2; // the cards' bottom edge rests here, so nothing dips below the metal
  const folders = tiles.map((li, i) => {
    const el = buildFolder(li);
    const obj = new CSS3DObject(el);
    obj.scale.setScalar(PX);
    obj.position.set(0, RIM + CH / 2, D / 2 - CW * 0.3 - i * GAP);
    rail.add(obj);
    return { el, obj, i, z0: obj.position.z };
  });

  let active = null;
  let railZ = 0;
  const maxZ = Math.max(0, (folders.length - 1) * GAP - D * 0.34);

  // ---- rendering ---------------------------------------------------------------------
  let w = 0;
  let h = 0;
  let dist = 20;
  let frame = 0;

  function aim() {
    camera.position.set(
      dist * Math.cos(ELEVATION) * Math.sin(AZIMUTH),
      dist * Math.sin(ELEVATION),
      dist * Math.cos(ELEVATION) * Math.cos(AZIMUTH),
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  // Where the cabinet's mouth is. A CSS3D layer is always painted over the WebGL canvas, so
  // a folder still inside the cabinet would ride on top of the metal instead of being hidden
  // by it. Fading each one in as it crosses this plane is what makes them read as coming out
  // of the drawer rather than sliding along above it — and it is the reveal animation too,
  // which is why there is no separate opacity tween on open.
  const CAB_MOUTH = -D / 2 - 0.05;

  function cull() {
    for (const f of folders) {
      if (f === active) {
        f.el.style.opacity = '';
        f.el.style.pointerEvents = '';
        continue;
      }
      // pushed out through the drawer's own face by a drag
      const past = rail.position.z + f.z0 > D / 2 + 0.15;
      // still swallowed by the cabinet
      const emerged = THREE.MathUtils.clamp(
        (drawer.position.z + rail.position.z + f.z0 - CAB_MOUTH) / 0.9,
        0,
        1,
      );
      f.el.style.opacity = past ? '0' : emerged.toFixed(3);
      f.el.style.pointerEvents = past || emerged < 0.6 ? 'none' : '';
    }
  }

  function render() {
    cull();
    renderer.render(scene, camera);
    css.render(scene, camera);
  }

  /** Render for a moment rather than forever: the scene is static between interactions,
   *  so there is no standing rAF here the way hero3d.js has one. */
  function pump(ms = 900) {
    const until = performance.now() + ms;
    if (frame) return;
    const tick = () => {
      render();
      frame = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  }

  // every corner of what the visitor actually sees: the metal, plus the height a folder
  // reaches when it is standing open
  const CORNERS = [];
  for (const x of [-W / 2 - 0.2, W / 2 + 0.2]) {
    for (const y of [-H, RIM + CH + 0.25]) {
      for (const z of [-D / 2, D / 2 + 0.45]) CORNERS.push(new THREE.Vector3(x, y, z));
    }
  }

  function fit() {
    // Solve the distance numerically against those corners. At three quarters the projected
    // extent depends on the azimuth as well as the aspect, so trigonometry that assumed a
    // front-on camera framed the drawer at roughly half the width it could have used.
    dist = Math.max(W, D) * 1.4;
    const p = new THREE.Vector3();
    for (let i = 0; i < 10; i++) {
      aim();
      let spanX = 0;
      let spanY = 0;
      for (const c of CORNERS) {
        p.copy(c).project(camera);
        spanX = Math.max(spanX, Math.abs(p.x));
        spanY = Math.max(spanY, Math.abs(p.y));
      }
      const over = Math.max(spanX, spanY) / 0.96;
      if (!Number.isFinite(over) || over <= 0) break;
      dist *= over;
      if (Math.abs(over - 1) < 0.005) break;
    }
  }

  function resize() {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    fit();
    renderer.setSize(w, h);
    css.setSize(w, h);
    render();
  }

  // ---- browsing the index ------------------------------------------------------------
  function slideTo(z, snap = false) {
    railZ = THREE.MathUtils.clamp(z, 0, maxZ);
    if (snap) {
      rail.position.z = railZ;
      render();
      return;
    }
    gsap.to(rail.position, { z: railZ, duration: 0.5, ease: 'power3.out', onUpdate: render });
    pump(600);
  }

  function select(f) {
    if (active === f) return close();
    if (active) collapse(active);
    active = f;
    f.el.classList.add('is-open');
    f.el.setAttribute('aria-expanded', 'true');
    host.classList.add('has-open');
    // out of the file and forward to the front of the drawer, so a card filed at the back
    // is just as readable as one at the front. Moving the rail instead pushed everything in
    // front of it out through the drawer's face.
    gsap.to(f.obj.position, {
      x: CW * 0.3,
      y: RIM + CH / 2 + 0.45,
      z: D / 2 + 0.9,
      duration: 0.6,
      ease: 'power3.out',
      onUpdate: render,
    });
    // square up to the camera: a card read at the drawer's own angle is foreshortened, and
    // the whole reason it comes up is to be read
    gsap.to(f.obj.rotation, {
      y: AZIMUTH,
      x: -ELEVATION * 0.55,
      duration: 0.55,
      ease: 'power3.out',
      onUpdate: render,
    });
    pump(1200);
  }

  function collapse(f) {
    f.el.classList.remove('is-open');
    f.el.setAttribute('aria-expanded', 'false');
    gsap.to(f.obj.position, {
      x: 0,
      y: RIM + CH / 2,
      z: f.z0,
      duration: 0.45,
      ease: 'power3.inOut',
      onUpdate: render,
    });
    gsap.to(f.obj.rotation, { y: 0, x: 0, duration: 0.4, ease: 'power3.inOut', onUpdate: render });
  }

  function close() {
    if (!active) return;
    collapse(active);
    active = null;
    host.classList.remove('has-open');
    pump(700);
  }

  for (const f of folders) {
    f.el.addEventListener('click', () => select(f));
    f.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Space would scroll the page
        select(f);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        folders[
          THREE.MathUtils.clamp(f.i + (e.key === 'ArrowRight' ? 1 : -1), 0, folders.length - 1)
        ].el.focus();
      }
    });
  }

  // drag to browse the index, the way you'd walk fingers through the files
  let dragging = false;
  let startX = 0;
  let startZ = 0;
  host.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.folder')) return; // let the folders take their own clicks
    dragging = true;
    startX = e.clientX;
    startZ = railZ;
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    slideTo(startZ + ((e.clientX - startX) / host.clientWidth) * maxZ * 1.6, true);
  });
  const release = () => (dragging = false);
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  const onKey = (e) => e.key === 'Escape' && active && (active.el.focus(), close());
  window.addEventListener('keydown', onKey);

  const onOutside = (e) => {
    if (active && !e.target.closest('.folder')) close();
  };
  window.addEventListener('click', onOutside);

  // ---- open once, when the section arrives -------------------------------------------
  let opened = false;
  drawer.position.z = -D * 0.86;
  function openDrawer() {
    if (opened) return;
    opened = true;
    gsap.to(drawer.position, { z: 0, duration: 1.5, ease: 'power3.out', onUpdate: render });
    gsap.fromTo(
      folders.map((f) => f.el),
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        stagger: 0.02,
        delay: 0.35,
        ease: 'power2.out',
        clearProps: 'opacity',
      },
    );
    pump(2600);
  }

  const io = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && openDrawer(),
    { threshold: 0.2 },
  );
  io.observe(host);

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // hero3d.js has no teardown at all; this module keeps one.
  return function dispose() {
    io.disconnect();
    ro.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('click', onOutside);
    gsap.killTweensOf(drawer.position);
    folders.forEach((f) => (gsap.killTweensOf(f.obj.position), gsap.killTweensOf(f.obj.rotation)));
    scene.traverse((o) => o.geometry?.dispose());
    steel.dispose();
    steelInner.dispose();
    roughnessMap.dispose();
    envRT.texture.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    css.domElement.remove();
  };
}
