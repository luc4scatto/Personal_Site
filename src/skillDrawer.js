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

  // Only shown once the sheet is actually open (CSS gates it on .is-open) - at rest and on
  // hover-peek there is nothing here to close yet.
  const close = document.createElement('button');
  close.className = 'folder__close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.tabIndex = -1;
  close.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg>';
  li.append(close);

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

/** A card-index divider: a plain tab standing between two categories, never itself a
 *  folder. Taller than a folder's own rest-state tab so its label survives everything
 *  filed in front of it, the way a real index divider is cut proud of the cards it sorts. */
function buildDivider(label) {
  const el = document.createElement('div');
  el.className = 'folder folder--divider';
  el.setAttribute('aria-hidden', 'true');

  const tab = document.createElement('div');
  tab.className = 'folder__tab--divider';
  tab.textContent = label;
  el.append(tab);
  return el;
}

export function initSkillDrawer(host, strip) {
  // Walk the strip's own .skill-group divs rather than flatly querying every <li> so the
  // rail can carry the same category boundaries the flat wall shows via its <h3>s — a card
  // index files by subject, it doesn't run everything together.
  const railSource = [];
  for (const group of strip.querySelectorAll('.skill-group')) {
    const label = group.querySelector('h3')?.textContent;
    if (label && railSource.length) railSource.push({ divider: label });
    for (const li of group.querySelectorAll('li[data-skill]')) railSource.push({ li });
  }
  if (!railSource.some((r) => r.li)) return () => {};

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
  // the last folder and a different amount in front of the first. Dividers sit on the same
  // GAP pitch as folders, so they count toward this length too.
  const MARGIN = 0.55;
  const D = GAP * (railSource.length - 1) + MARGIN * 2;
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
  // carcass wrapping the drawer would swallow the folders filed at the back. It is a whole
  // piece of furniture, top included: it used to run far past the top of the frame under
  // five closed fronts, and the frame spent so much of itself on steel that the drawer - the
  // thing actually being read - came out small.
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
  const CAB_BOTTOM = -H * 1.25;
  // Deep enough to actually swallow this drawer whole, shell and tail: at 0.85 * D the
  // drawer bottomed out against the back of the bay with its front still standing a third of
  // the way out, which is a drawer that cannot shut rather than one left open.
  const CAB_D = DL + 0.3;
  const PITCH = FRONT_H + 0.15; // one face plus the reveal between two of them
  // The top of a cabinet holding `total` drawers: the highest front, plus the same border
  // the frame runs down its sides, so the top rail reads as the same board.
  const cabTop = (total) => MOUTH_Y + PITCH * (total - 1) + FRONT_H / 2 + (CAB_W - FACE_W) / 2;
  const cabinet = new THREE.Group();
  cabinet.position.z = -D / 2 - CAB_D / 2 - 0.05;
  scene.add(cabinet);

  // The bay at the back of the hole. Same reason as the drawer's own liners: lit metal down
  // there reads as a floor, so the cavity takes no light at all.
  const bay = new THREE.Mesh(new THREE.PlaneGeometry(OPEN_W, OPEN_H), steelInner);
  bay.position.set(0, OPEN_Y, CAB_D / 2 - BOARD + 0.01);
  cabinet.add(bay);

  // The face used to carry a black wash fading out from the opening, back when the mouth was
  // painted on a solid slab and needed help reading as a cavity. The hole is real now and the
  // wash only sat on the steel dimming it, which is half of why the pale bevel looked stuck
  // on. mouthFalloff() is still here if the shading is ever wanted back.

  // Rebuilt, not scaled, when the drawer count changes: the face is a shape with a hole in
  // it, and stretching it would stretch the mouth with it. resize() picks the count and only
  // lands here when it actually differs, so this runs about once per visit.
  let drawerCount = 0;
  function buildCabinet(total) {
    if (total === drawerCount) return;
    drawerCount = total;
    for (const o of [...cabinet.children]) {
      if (o === bay) continue;
      cabinet.remove(o);
      o.geometry.dispose();
    }
    const top = cabTop(total);

    // The opening is a real hole with a board's worth of material around it, not a black
    // panel on a slab. Painted on, it read as one flat layer: at three quarters the eye
    // expects to see the cut edge on the near side of the mouth and the inner face of the
    // board on the far side. So the carcass is pushed back by BOARD and the face carries the
    // thickness. An earlier version ran this at 0.16 with a chamfer faked on top, because a
    // thin lip has no reveal to show. At a board's thickness the reveal is simply there.
    const carcass = box(CAB_W, top - CAB_BOTTOM, CAB_D, steel);
    carcass.position.set(0, (top + CAB_BOTTOM) / 2, -BOARD);
    cabinet.add(carcass);

    // The face is one piece, flush: the whole cabinet front with the mouth cut out of it and
    // extruded to the board's thickness, so the reveal around the hole is the only edge in
    // it. Four separate slabs framing the opening were tried first and read as four boards
    // laid on the face - a seam at every corner, and the frame standing proud of the panel.
    const faceShape = new THREE.Shape();
    faceShape.moveTo(-CAB_W / 2, CAB_BOTTOM);
    faceShape.lineTo(CAB_W / 2, CAB_BOTTOM);
    faceShape.lineTo(CAB_W / 2, top);
    faceShape.lineTo(-CAB_W / 2, top);
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

    // closed drawer fronts stacked above the open one - without them the carcass is just a
    // slab and the object stops reading as office furniture
    for (let i = 1; i < total; i++) {
      // The same face as the open drawer's, on the same pitch: they are the same furniture,
      // and sized on their own the stack drifted out of step with the drawer below it.
      // FACE_W, not CAB_W, so the frame's border runs round them as it runs round the mouth.
      const face = box(FACE_W, FRONT_H, 0.2, steel);
      face.position.set(0, MOUTH_Y + PITCH * i, CAB_D / 2 + 0.06);
      cabinet.add(face);
      const pull = box(W * 0.45, 0.16, 0.22, steel);
      pull.position.set(0, face.position.y, CAB_D / 2 + 0.22);
      cabinet.add(pull);
    }
  }

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-4, 7, 6);
  scene.add(key);

  // ---- the folders -------------------------------------------------------------------
  // The rail slides through the drawer; the cards keep their own place on it.
  const rail = new THREE.Group();
  drawer.add(rail);

  const RIM = H / 2; // the cards' bottom edge rests here, so nothing dips below the metal
  const items = railSource.map((r, i) => {
    const el = r.li ? buildFolder(r.li) : buildDivider(r.divider);
    const obj = new CSS3DObject(el);
    // CSS3DObject stamps pointer-events: auto inline on the element, which no stylesheet rule
    // can beat - so the whole transparent 320px box took the pointer, in front of the next
    // few tabs back. Cleared, the CSS decides: only the ::before strip over the tab is a target.
    el.style.pointerEvents = '';
    obj.scale.setScalar(PX);
    obj.position.set(0, RIM + CH / 2, D / 2 - MARGIN - i * GAP);
    rail.add(obj);
    // reveal: the opening stagger's share of the opacity, multiplied in by cull(). op/pe: the
    // last opacity and pointer-events cull() wrote, so it can skip writes that change nothing
    return { interactive: !!r.li, el, obj, i, z0: obj.position.z, reveal: 1, op: null, pe: null };
  });
  // keyboard Left/Right and select()/close() only ever act on real folders — dividers are
  // positional-only, so they need their own sequential index within just this list
  const folders = items.filter((it) => it.interactive);
  folders.forEach((f, fi) => (f.fi = fi));

  let active = null;
  let railZ = 0;
  const maxZ = Math.max(0, (items.length - 1) * GAP - D * 0.34);

  // ---- rendering ---------------------------------------------------------------------
  let w = 0;
  let h = 0;
  let dist = 20;
  let frame = 0;
  // A picked card's "face the camera" target, read straight off the camera itself rather
  // than hand-set as Euler(x: -ELEVATION * k, y: AZIMUTH). THREE's default Euler order
  // (XYZ, intrinsic) composes yaw and pitch in the opposite order from what camera.lookAt()
  // actually produces for this azimuth/elevation orbit (yaw around world Y, then pitch about
  // the yawed frame's own X) — no scalar factor on a mismatched composition order can land on
  // the camera's real orientation, which is why tuning that factor only ever changed how
  // wrong the skew looked, never removed it. Slerping toward the camera's own quaternion is
  // the actual billboard: exactly parallel to the camera's image plane.
  const billboardQuat = new THREE.Quaternion();
  const RESTING_QUAT = new THREE.Quaternion(); // identity — a filed folder carries no rotation
  // A hovered folder turns about its own vertical centre line toward the camera, which sits
  // off to the right. The ceiling is the neighbour in front: the turn swings the near edge
  // forward by sin(angle) * CW / 2, and past ~17 degrees that is more than GAP, so the folder
  // would cut through the one filed ahead of it.
  const HOVER_TURN = THREE.MathUtils.degToRad(14);
  const HOVER_QUAT = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    HOVER_TURN,
  );

  /** Slerps f's own orientation toward `target`. Tweens a per-folder plain object rather than
   *  f.obj.rotation directly — component-wise Euler tweening is exactly the wrong-composition
   *  bug this replaces — so dispose() kills f.rotP, not f.obj.rotation, to reach it. */
  function rotateTo(f, target, duration, ease) {
    const p = f.rotP ?? (f.rotP = {});
    gsap.killTweensOf(p);
    const start = f.obj.quaternion.clone();
    p.t = 0;
    gsap.to(p, {
      t: 1,
      duration,
      ease,
      onUpdate: () => {
        f.obj.quaternion.slerpQuaternions(start, target, p.t);
        render();
      },
    });
  }

  function aim() {
    camera.position.set(
      dist * Math.cos(ELEVATION) * Math.sin(AZIMUTH),
      dist * Math.sin(ELEVATION),
      dist * Math.cos(ELEVATION) * Math.cos(AZIMUTH),
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(); // project()/unproject() read these before any render does
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

  // The only thing that writes a folder's opacity. The opening stagger used to tween the same
  // style.opacity alongside this, and which of the two landed last each frame came down to the
  // order GSAP and pump() happened to tick in; it now tweens f.reveal, which is multiplied in
  // here. Writes that change nothing are skipped: every render walks all the folders, and
  // nearly all of them are standing still.
  function cull() {
    for (const f of items) {
      let op = '';
      let pe = '';
      if (f !== active) {
        // pushed out through the drawer's own face by a drag
        const past = rail.position.z + f.z0 > D / 2 + 0.15;
        // still swallowed by the cabinet
        const emerged = THREE.MathUtils.clamp(
          (drawer.position.z + rail.position.z + f.z0 - FADE_AT) / FADE_OVER,
          0,
          1,
        );
        const shown = past ? 0 : emerged * f.reveal;
        op = shown.toFixed(3);
        pe = shown < 0.6 ? 'none' : '';
      }
      if (op !== f.op) f.el.style.opacity = f.op = op;
      // a class rather than inline pointer-events: the hit target is the folder's ::before
      // strip, which an inline value on the folder itself can't reach
      if (pe !== f.pe) f.el.classList.toggle('is-culled', (f.pe = pe) === 'none');
    }
  }

  function render() {
    cull();
    renderer.render(scene, camera);
    css.render(scene, camera);
  }

  /** Render for a moment rather than forever: the scene is static between interactions,
   *  so there is no standing rAF here the way hero3d.js has one. */
  let pumpUntil = 0;
  function pump(ms = 900) {
    // extend the window rather than bail: a second interaction landing inside an already-
    // running burst (e.g. opening a folder near the tail end of the drawer's opening tween)
    // used to be dropped by `if (frame) return`, so its own tween could keep animating past
    // the point rendering had already stopped.
    pumpUntil = Math.max(pumpUntil, performance.now() + ms);
    if (frame) return;
    const tick = () => {
      render();
      frame = performance.now() < pumpUntil ? requestAnimationFrame(tick) : 0;
    };
    frame = requestAnimationFrame(tick);
  }

  // Where a picked folder goes: out of the file and up into the free corner above the
  // drawer's front, under the section heading. Placed in screen space rather than in the
  // scene, so it lands in the same spot on the page at any framing: a world position tuned
  // at one aspect drifted off the heading, or onto the drawer, at every other.
  const PICK_W = 0.28; // share of the frame's width the card takes
  const PICK_TOP = 0.03; // gap above it, as a share of the frame's height
  const PICK_PULL = 2; // world units in front of the drawer's face, so it rides over every folder
  const pickPos = new THREE.Vector3();
  const pickRay = new THREE.Vector3();
  const camFwd = new THREE.Vector3();
  function cardSize() {
    const cardH = Math.min(h * (1 - PICK_TOP * 2), (w * PICK_W * CARD_H) / CARD_W);
    return [(cardH * CARD_W) / CARD_H, cardH];
  }
  // how far the furniture steps right so the card gets a column of its own, clear of the
  // drawer's front instead of laid over the folders filed there
  const pickShift = () => Math.max(0, cardSize()[0] + w * 0.025 - view.left);

  function pickTarget() {
    const [cardW, cardH] = cardSize();
    const face = pickPos.set(0, 0, D / 2 + OPEN_Z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -face.z - PICK_PULL;
    // left edge on the frame's own left edge, which is the heading's: centre in NDC, cast
    // through the camera (so the view offset fit() sets is honoured) out to that depth
    pickRay
      .set(cardW / w - 1, 1 - (2 * (h * PICK_TOP + cardH / 2)) / h, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
    camera.getWorldDirection(camFwd);
    pickPos.copy(camera.position).addScaledVector(pickRay, depth / pickRay.dot(camFwd));
    const pxPerUnit = h / (2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    return { pos: pickPos, scale: cardW / pxPerUnit / CARD_W };
  }

  // Solve the distance numerically against the corners of what is on screen: the cabinet,
  // top included, and the drawer at full extension. At three quarters the projected extent
  // depends on the azimuth as well as the aspect, so trigonometry that assumed a front-on
  // camera framed the drawer at roughly half the width it could have used. The picked card is
  // left out on purpose: it lives in the corner the drawer's silhouette leaves empty, and
  // framing its reach as well is what used to shrink the furniture to half the frame.
  const corner = new THREE.Vector3();

  // The frame's own centring, solved by fit(), and how far the furniture has been slid right
  // to make room for a picked card. Kept apart so the slide can be tweened without re-solving
  // the fit; `left` is the furniture's left edge in px once centred.
  const view = { baseX: 0, baseY: 0, left: 0, shift: 0 };
  function frameFor(shift) {
    camera.setViewOffset(w, h, view.baseX - shift, view.baseY, w, h);
    // the canvas mask's right-hand fade rides along, or it dims the cabinet's face instead
    // of the carcass running off behind it
    host.style.setProperty('--slide', `${shift}px`);
  }

  /** Slide the furniture to `shift`. `solve` runs against the frame being slid to, so a card
   *  placed in it lands where the frame will be rather than where it was. `duration` has to
   *  match whatever card tween this call is paired with - left at its own fixed 0.6s, the
   *  furniture kept sliding for ~250ms after collapse()'s shorter tweens had already settled
   *  the folder, so a card that looked done sat there while the background kept moving under
   *  it. */
  function slideFrame(shift, solve, duration = 0.48) {
    gsap.killTweensOf(view);
    frameFor(shift);
    solve?.();
    frameFor(view.shift);
    gsap.to(view, {
      shift,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        frameFor(view.shift);
        render();
      },
    });
  }

  function fit(total) {
    camera.clearViewOffset();
    dist = Math.max(W, D) * 1.4;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < 10; i++) {
      aim();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const x of [-CAB_W / 2 - 0.1, CAB_W / 2 + 0.1]) {
        for (const y of [-H, cabTop(total) + 0.1]) {
          for (const z of [-D / 2, D / 2 + 0.45 + OPEN_Z]) {
            corner.set(x, y, z).project(camera);
            x0 = Math.min(x0, corner.x);
            x1 = Math.max(x1, corner.x);
            y0 = Math.min(y0, corner.y);
            y1 = Math.max(y1, corner.y);
          }
        }
      }
      cx = (x0 + x1) / 2;
      cy = (y0 + y1) / 2;
      const over = Math.max(x1 - x0, y1 - y0) / 2 / 0.96;
      if (!Number.isFinite(over) || over <= 0) break;
      dist *= over;
      if (Math.abs(over - 1) < 0.005) break;
    }
    // Centred on what is there, not on the point the camera looks at: at three quarters the
    // silhouette sits well off that point, and framing it symmetrically about it left a band
    // of the frame empty on one side.
    view.baseX = (cx * w) / 2;
    view.baseY = (-cy * h) / 2;
    frameFor(0);
    // the drawer front's own left edge, not the carcass's: the front is the narrower of the
    // two, and measured off the carcass the furniture stepped further aside than it needed to
    corner.set(-FACE_W / 2, FRONT_Y + FRONT_H / 2, D / 2 + 0.22 + OPEN_Z).project(camera);
    view.left = ((corner.x + 1) / 2) * w;
    return dist;
  }

  // Three drawers, give or take one for the room there is: a fourth when the frame has
  // height to spare and it costs the drawer nothing in size, two only when the frame is so
  // short that a third would shrink everything by more than a third.
  function pickDrawerCount() {
    const [d2, d3, d4] = [2, 3, 4].map((n) => fit(n));
    return d4 <= d3 * 1.02 ? 4 : d3 <= d2 * 1.35 ? 3 : 2;
  }

  function resize() {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    const total = pickDrawerCount();
    buildCabinet(total);
    fit(total);
    billboardQuat.copy(camera.quaternion);
    measureZAxis();
    renderer.setSize(w, h);
    css.setSize(w, h);
    // the card's spot is in screen space, so it and the room made for it follow the frame
    gsap.killTweensOf(view);
    view.shift = active ? pickShift() : 0;
    frameFor(view.shift);
    if (active) lift(active, 0);
    render();
  }

  // ---- browsing the index ------------------------------------------------------------
  // Only ever called mid-drag, so it always snaps — there is no tweened path to a target
  // left in the index browsing gesture (the drawer's own open/shut run is tweened separately).
  function slideTo(z) {
    railZ = THREE.MathUtils.clamp(z, 0, maxZ);
    rail.position.z = railZ;
    render();
  }

  // ---- picking a folder ----------------------------------------------------------------
  /** Carry f to the pick spot and square it up to the camera: a card read at the drawer's
   *  own angle is foreshortened, and the whole reason it comes up is to be read. */
  function lift(f, duration) {
    const { pos, scale } = pickTarget();
    const ease = 'power3.out';
    gsap.to(f.obj.position, { x: pos.x, y: pos.y, z: pos.z, duration, ease, onUpdate: render });
    gsap.to(f.obj.scale, { x: scale, y: scale, z: scale, duration, ease, onUpdate: render });
    rotateTo(f, billboardQuat, duration * 0.92, ease);
  }

  function select(f) {
    if (active === f) return close();
    if (active) collapse(active);
    active = f;
    f.el.classList.add('is-open');
    f.el.setAttribute('aria-expanded', 'true');
    f.el.querySelector('.folder__close').tabIndex = 0;
    host.classList.add('has-open');
    // Out of the file and into the scene itself: left on the rail, a drag through the index
    // carried the open card along with it. Moving the rail to bring the card forward instead
    // pushed everything in front of it out through the drawer's face.
    gsap.killTweensOf([f.obj.position, f.obj.scale]);
    scene.attach(f.obj);
    slideFrame(pickShift(), () => lift(f, 0.48));
    pump(1200);
  }

  function collapse(f) {
    // aria updates now, the visual close deferred - see below
    f.el.setAttribute('aria-expanded', 'false');
    f.el.querySelector('.folder__close').tabIndex = -1;
    // back into the file, so it rides with the index again; a lift still running would
    // otherwise keep writing world coordinates into what is now rail space
    gsap.killTweensOf([f.obj.position, f.obj.scale]);
    rail.attach(f.obj);
    gsap.to(f.obj.position, {
      x: 0,
      y: RIM + CH / 2,
      z: f.z0,
      duration: 0.35,
      // A stronger curve than the scale/rotation tweens below, on purpose: position has
      // the farthest to travel, so power3's tail was still visibly (if barely) creeping
      // for ~150ms after the card already looked flat and file-sized, reading as two
      // separate motions instead of one landing. power4 front-loads harder, so by the
      // point rotation/scale settle, position has too.
      ease: 'power4.out',
      onUpdate: render,
      // .is-open drives the sheet's own CSS slide and the rim mask, which used to drop the moment
      // this tween started: the mask flipping back on at full CSS size, while the object
      // was still large mid-flight in world space, read as a jump. Held until the card is
      // actually back and small again, that same CSS change happens at rail scale, where
      // it is too small to see.
      onComplete: () => f.el.classList.remove('is-open'),
    });
    rotateTo(f, RESTING_QUAT, 0.35, 'power3.out');
    gsap.to(f.obj.scale, {
      x: PX,
      y: PX,
      z: PX,
      duration: 0.35,
      // matches position's power4.out above: scale has the biggest relative change of the
      // three (pick size down to a filed tile), and power3's tail left it visibly still
      // shrinking after the rotation already read as flat and settled
      ease: 'power4.out',
      onUpdate: render,
    });
  }

  function close() {
    if (!active) return;
    collapse(active);
    active = null;
    host.classList.remove('has-open');
    slideFrame(0, undefined, 0.35);
    pump(700);
  }

  for (const f of folders) {
    f.el.addEventListener('click', () => select(f));
    // Turned a little toward the camera under the mouse, so its tab opens up wider than the
    // ones around it and is easier to hit. Mouse only: a tap has no hover to show, and focus
    // moves with the arrow keys far too often to animate every step. Never the open card -
    // that one is squared up to the camera already.
    f.el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && f !== active) rotateTo(f, HOVER_QUAT, 0.2, 'power3.out');
    });
    f.el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && f !== active) rotateTo(f, RESTING_QUAT, 0.2, 'power3.out');
    });
    // its own control: a bare click on the folder already toggles shut via select(), but the
    // X has to win over that bubbling to the same handler and reopening what it just closed
    f.el.querySelector('.folder__close').addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });
    f.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Space would scroll the page
        select(f);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        // steps between real folders only — f.fi is this folder's index within that
        // filtered list, not its position in the full rail, so dividers are never a stop
        folders[
          THREE.MathUtils.clamp(f.fi + (e.key === 'ArrowRight' ? 1 : -1), 0, folders.length - 1)
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
      slideTo(startZ + ((e.clientX - startX) / host.clientWidth) * maxZ * 1.6);
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
    // fromTo, not from: a from() left the folders parked on their start values. It tweens
    // f.reveal, which cull() multiplies into the opacity it already owns, 40ms apart - 20ms
    // was under the floor where a stagger reads as one. onComplete renders once more, so a
    // reveal that finishes after pump() has stopped (a backgrounded tab) can't leave the
    // index half faded.
    gsap.fromTo(
      items,
      { reveal: 0 },
      {
        reveal: 1,
        duration: 0.5,
        stagger: 0.04,
        delay: 0.35,
        ease: 'power2.out',
        onComplete: render,
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
    gsap.killTweensOf(view);
    gsap.killTweensOf(items);
    items.forEach((f) => {
      gsap.killTweensOf(f.obj.position);
      gsap.killTweensOf(f.obj.scale);
      if (f.rotP) gsap.killTweensOf(f.rotP);
    });
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
