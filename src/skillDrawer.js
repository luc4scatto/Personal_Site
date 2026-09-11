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
const LINER_GAP = 0.03; // how far the black inner liners stand off the steel, clear of z-fighting
// The hole is the measurement everything else is cut from, and the front laps over it by
// LAP on every side. Derived the other way round - a mouth sized from the front plus a
// gap - the front was the smaller of the two, so a shut drawer showed a hairline of the
// black bay all the way round it. A real drawer face overlaps its frame; it never fits
// inside it. The front is taller than the box behind it and hung a little low, which is why
// these live up here with FACE_W rather than next to the cabinet.
// Cut to the shell that actually passes through it - including the bottom panel, which hangs
// half its thickness below the sides. Sized to the front instead, the hole stood 0.18 proud
// of the drawer at the sides and half a unit below it, and an open drawer showed a band of
// the black bay all down its flank and under its belly.
const MOUTH_W = W + 0.06;
const MOUTH_H = H + T / 2 + 0.06;
const MOUTH_Y = (H / 2 + (-H / 2 - T / 2)) / 2;
const LAP = 0.12;
const FACE_W = MOUTH_W + LAP * 2; // the front face - every closed front shares it
const FRONT_H = MOUTH_H + LAP * 2;
const FRONT_Y = MOUTH_Y;
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

/** Alpha for the cabinet's mouth: solid black over the drawer's own cross-section, falling
 *  off into the steel around it. Canvas shadowBlur rather than a gradient, so the falloff
 *  follows the rectangle's corners instead of a box or a circle. */
function mouthFalloff(panelW, panelH, slotW, slotH, feather) {
  const PPU = 48; // canvas px per world unit, so the falloff is isotropic on a tall panel
  const c = document.createElement('canvas');
  c.width = Math.round(panelW * PPU);
  c.height = Math.round(panelH * PPU);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, c.width, c.height);
  const w = slotW * PPU;
  const h = slotH * PPU;
  // A grown rectangle, then blurred: shadowBlur was tried first and its haze peaks far too
  // low - against steel a 15% black is invisible, which is why this looked like nothing at
  // all until the panel was tinted to check it was drawing. Growing before the blur puts
  // full black at the drawer's own edge and spends the falloff outside it.
  const grow = feather * 0.55 * PPU;
  ctx.fillStyle = '#fff';
  ctx.filter = `blur(${feather * 0.45 * PPU}px)`;
  ctx.fillRect((c.width - w) / 2 - grow, (c.height - h) / 2 - grow, w + grow * 2, h + grow * 2);
  ctx.filter = 'none';
  // punched through over the opening itself: the shading belongs on the face, and left solid
  // it painted over the jamb and flattened the hole back into one layer
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect((c.width - w) / 2, (c.height - h) / 2, w, h);
  return new THREE.CanvasTexture(c);
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
  const steelInner = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

  // The tray is cut to the index plus a margin at each end, rather than to a headroom figure
  // that had nothing to do with the folders: the old one left a full GAP of empty tray behind
  // the last folder and a different amount in front of the first.
  const MARGIN = 0.55;
  const D = GAP * (tiles.length - 1) + MARGIN * 2;
  // A drawer whose back edge comes level with the cabinet face is a drawer that has fallen
  // out. The shell is longer than the index by TAIL, and that tail is empty: it stays in the
  // cabinet at full extension, so the furniture is still holding the drawer while every
  // folder is out in front of the mouth, where cull() leaves it visible.
  const TAIL = D * 0.2;
  const DL = D + TAIL;
  const TAIL_Z = -TAIL / 2; // the shell's centre; the index keeps the old one
  // Open runs a little past flush, and only as far as the fade needs. Stopping at 0 left the
  // last folder sitting on the point where its tab crosses the top of the mouth, with no room
  // for cull() to have faded it first; half the tail, which is what this was, bought far more
  // room than that costs and spent it on empty tray standing out of the cabinet.
  const OPEN_Z = 1.0;
  const drawer = new THREE.Group();
  scene.add(drawer);

  const box = (bw, bh, bd, mat) => new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 3, 0.05), mat);

  const bottom = box(W, T, DL, steelInner);
  bottom.position.set(0, -H / 2, TAIL_Z);
  drawer.add(bottom);

  const back = box(W, H, T, steelInner);
  back.position.z = -D / 2 - TAIL + T / 2;
  drawer.add(back);

  for (const sx of [-1, 1]) {
    const side = box(T, H, DL, steel);
    side.position.set(sx * (W / 2 - T / 2), 0, TAIL_Z);
    drawer.add(side);
    // Outside of the wall is furniture, inside is void - one box cannot be steel on one face
    // and nothing on the other, so the inside gets its own plane. LINER_GAP, not a hair: a
    // liner pressed against the wall z-fights, and the fight is won by whichever surface the
    // depth buffer resolves better, so the black came and went as the drawer slid forward.
    const liner = new THREE.Mesh(new THREE.PlaneGeometry(DL - T, H), steelInner);
    liner.rotation.y = (sx * -Math.PI) / 2;
    liner.position.set(sx * (W / 2 - T - LINER_GAP), 0, TAIL_Z);
    drawer.add(liner);
  }

  // same for the front panel: seen from above its inner face was the one lit surface left
  // inside, and it read as a shelf the front folders were standing on
  const frontInner = new THREE.Mesh(new THREE.PlaneGeometry(W - T * 2, H), steelInner);
  frontInner.position.z = D / 2 - LINER_GAP;
  drawer.add(frontInner);

  const front = box(FACE_W, FRONT_H, 0.22, steel);
  front.position.set(0, FRONT_Y, D / 2 + 0.11);
  drawer.add(front);

  const handle = box(W * 0.45, 0.18, 0.24, steel);
  handle.position.set(0, FRONT_Y, D / 2 + 0.33);
  drawer.add(handle);

  // ---- the cabinet ---------------------------------------------------------------------
  // Behind the drawer's back end, never over it: the whole index has to stay visible, and a
  // carcass wrapping the drawer would swallow the folders filed at the back. It runs well
  // past the top of the frame; .drawer__scene's mask is what ends it.
  // The frame is built the way a real open cube is: one board thickness, used both for how
  // deep the reveal runs back and for how wide the border sits on the face. The two being
  // the same number is what makes it read as a board rather than as a groove cut in a sheet.
  const BOARD = 0.3;
  // The mouth clears the drawer's front panel, not the box behind it: the front is an
  // overlay and hangs lower, so a hole cut to the box left the panel dangling below the
  // frame with nothing framing it.
  const OPEN_W = MOUTH_W;
  const OPEN_H = MOUTH_H;
  const OPEN_Y = MOUTH_Y;
  const CAB_W = OPEN_W + BOARD * 2; // the carcass frames the mouth, it doesn't end at it
  const CAB_H = 16;
  // Deep enough to actually swallow this drawer whole, shell and tail: at 0.85 * D the
  // drawer bottomed out against the back of the bay with its front still standing a third of
  // the way out, which is a drawer that cannot shut rather than one left open.
  const CAB_D = DL + 0.3;
  const cabinet = new THREE.Group();
  cabinet.position.z = -D / 2 - CAB_D / 2 - 0.05;
  scene.add(cabinet);

  // The opening is a real hole with a board's worth of material around it, not a black panel
  // on a slab. Painted on, it read as one flat layer: at three quarters the eye expects to
  // see the cut edge on the near side of the mouth and the inner face of the board on the
  // far side. So the carcass is pushed back by BOARD and the face is rebuilt as four slabs
  // around the hole - it is their own sides, front edge and reveal, that carry the thickness.
  // An earlier version ran this at 0.16 with a chamfer faked on top, because a thin lip has
  // no reveal to show and needed a highlight standing in for one. At a board's thickness the
  // reveal is simply there and the chamfer is gone.
  const carcass = box(CAB_W, CAB_H, CAB_D, steel);
  carcass.position.set(0, CAB_H / 2 - H * 1.25, -BOARD);
  cabinet.add(carcass);

  // The face is one piece, flush: the whole cabinet front with the mouth cut out of it and
  // extruded to the board's thickness, so the reveal around the hole is the only edge in it.
  // Four separate slabs framing the opening were tried first and read as four boards laid
  // on the face - a seam at every corner, and the frame standing proud of the panel around
  // it. A shape with a hole has no seams to show and nothing to stand proud of.
  const CAB_TOP = CAB_H - H * 1.25;
  const CAB_BOTTOM = -H * 1.25;
  const faceShape = new THREE.Shape();
  faceShape.moveTo(-CAB_W / 2, CAB_BOTTOM);
  faceShape.lineTo(CAB_W / 2, CAB_BOTTOM);
  faceShape.lineTo(CAB_W / 2, CAB_TOP);
  faceShape.lineTo(-CAB_W / 2, CAB_TOP);
  faceShape.closePath();
  const mouth = new THREE.Path();
  mouth.moveTo(-OPEN_W / 2, OPEN_Y - OPEN_H / 2);
  mouth.lineTo(-OPEN_W / 2, OPEN_Y + OPEN_H / 2);
  mouth.lineTo(OPEN_W / 2, OPEN_Y + OPEN_H / 2);
  mouth.lineTo(OPEN_W / 2, OPEN_Y - OPEN_H / 2);
  mouth.closePath();
  faceShape.holes.push(mouth);
  const faceMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(faceShape, { depth: BOARD, bevelEnabled: false }),
    steel,
  );
  faceMesh.position.z = CAB_D / 2 - BOARD;
  cabinet.add(faceMesh);

  // The bay at the back of the hole. Same reason as the drawer's own liners: lit metal down
  // there reads as a floor, so the cavity takes no light at all.
  const bay = new THREE.Mesh(new THREE.PlaneGeometry(OPEN_W, OPEN_H), steelInner);
  bay.position.set(0, OPEN_Y, CAB_D / 2 - BOARD + 0.01);
  cabinet.add(bay);

  // The face used to carry a black wash fading out from the opening, back when the mouth was
  // painted on a solid slab and needed help reading as a cavity. The hole is real now and the
  // wash only sat on the steel dimming it, which is half of why the pale bevel looked stuck
  // on. mouthFalloff() is still here if the shading is ever wanted back.

  // closed drawer fronts stacked above the open one - without them the carcass is just a
  // slab and the object stops reading as office furniture
  const PITCH = FRONT_H + 0.15; // one face plus the reveal between two of them
  for (let i = 0; i < 5; i++) {
    // The same face as the open drawer's, on the same pitch: they are the same furniture, and
    // sized on their own the stack drifted out of step with the drawer below it. FACE_W, not
    // CAB_W, so the frame's border runs round them as it runs round the mouth.
    const face = box(FACE_W, FRONT_H, 0.2, steel);
    face.position.set(0, MOUTH_Y + PITCH * (i + 1), CAB_D / 2 + 0.06);
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
    obj.position.set(0, RIM + CH / 2, D / 2 - MARGIN - i * GAP);
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
  // A folder has to be gone before its tab crosses the top edge of the mouth, not when its
  // own anchor reaches the face: the tab stands higher than the opening, so keyed to the
  // face plane a folder was still ~90% opaque while its tab was already painted over the
  // metal above the hole. Measured at this framing the crossing happens 0.86 in front of
  // the face, so the fade is finished by then and made shorter to fit in what is left.
  const FADE_AT = CAB_MOUTH + 1.2;
  const FADE_OVER = 0.35;

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
        (drawer.position.z + rail.position.z + f.z0 - FADE_AT) / FADE_OVER,
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
  // widest thing in frame is the cabinet now, not the drawer - fit() has to see its edges
  const CORNERS = [];
  for (const x of [-CAB_W / 2 - 0.1, CAB_W / 2 + 0.1]) {
    for (const y of [-H, RIM + CH + 0.25]) {
      for (const z of [-D / 2, D / 2 + 0.45 + OPEN_Z]) CORNERS.push(new THREE.Vector3(x, y, z));
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
    measureZAxis();
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

  // ---- dragging ----------------------------------------------------------------------
  // Two drags share the canvas. Grab the drawer's face or its handle and the whole drawer
  // runs in and out; grab anywhere else and you walk your fingers through the index.
  // Shut means shut: the front panel's back face lands on the cabinet's own face, so the
  // drawer reads as closed rather than as parked. The panel spans D/2 to D/2 + 0.22 in the
  // drawer's own space and the face sits at -D/2 - 0.05, which is the whole of this sum.
  const SHUT_Z = -D - 0.05;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  // Screen pixels travelled per world unit along the drawer's own +z. Measured by projecting
  // the axis rather than assuming "drag right pulls out": the axis points wherever the
  // framing puts it, and fit() re-solves the camera on every resize.
  const zAxis = new THREE.Vector2();
  function measureZAxis() {
    const a = new THREE.Vector3(0, 0, 0).project(camera);
    const b = new THREE.Vector3(0, 0, 1).project(camera);
    zAxis.set(((b.x - a.x) * w) / 2, (-(b.y - a.y) * h) / 2);
  }

  function grabsDrawer(e) {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects([front, handle], false).length > 0;
  }

  /** A click on the face runs the drawer the rest of the way on its own. It toggles rather
   *  than only shutting: a handle that closes and then does nothing leaves the drawer with
   *  no way back except a drag, and the affordance reads the same either way. */
  function runDrawer() {
    const shut = drawer.position.z < (SHUT_Z + OPEN_Z) / 2;
    gsap.to(drawer.position, {
      z: shut ? OPEN_Z : SHUT_Z,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: render,
    });
    pump(1400);
  }

  let dragMode = null; // 'drawer' | 'index'
  let startX = 0;
  let startY = 0;
  let startZ = 0;
  let startDrawerZ = 0;
  let travel = 0; // how far the pointer went, so a click can be told from a drag
  host.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.folder')) return; // let the folders take their own clicks
    startX = e.clientX;
    startY = e.clientY;
    travel = 0;
    if (grabsDrawer(e)) {
      dragMode = 'drawer';
      gsap.killTweensOf(drawer.position); // a hand on the handle beats the opening tween
      opened = true;
      startDrawerZ = drawer.position.z;
      close(); // an open card would ride out over the cabinet while the drawer shuts
    } else {
      dragMode = 'index';
      startZ = railZ;
    }
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      // a pointer that has already gone (or a synthetic one) refuses capture; the drag still
      // works off the move events, so this is not worth dropping the grab over
    }
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragMode) return;
    if (dragMode === 'index') {
      slideTo(startZ + ((e.clientX - startX) / host.clientWidth) * maxZ * 1.6, true);
      return;
    }
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    travel = Math.max(travel, Math.hypot(dx, dy));
    drawer.position.z = THREE.MathUtils.clamp(
      startDrawerZ + (dx * zAxis.x + dy * zAxis.y) / (zAxis.lengthSq() || 1),
      SHUT_Z,
      OPEN_Z,
    );
    render();
  });
  const release = () => {
    // a grab that never went anywhere was a click on the face, not a drag of it
    if (dragMode === 'drawer' && travel < 5) runDrawer();
    dragMode = null;
  };
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
  drawer.position.z = SHUT_Z;
  function openDrawer() {
    if (opened) return;
    opened = true;
    gsap.to(drawer.position, { z: OPEN_Z, duration: 1.5, ease: 'power3.out', onUpdate: render });
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
