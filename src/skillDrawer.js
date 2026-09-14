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

export function initSkillDrawer(host, strip) {
  // Walk the strip's own .skill-group divs rather than flatly querying every <li>, so the rail
  // keeps the category boundaries the flat wall shows with its <h3>s - a card index files by
  // subject. A boundary is an empty slot in the file, which groups on its own; the name goes
  // outside the drawer (see "category labels" below).
  const railSource = []; // an <li> per slot, or null for the gap between two categories
  const categories = [];
  for (const group of strip.querySelectorAll('.skill-group')) {
    const lis = group.querySelectorAll('li[data-skill]');
    if (!lis.length) continue;
    if (railSource.length) railSource.push(null);
    const first = railSource.length;
    railSource.push(...lis);
    const label = group.querySelector('h3')?.textContent;
    if (label) categories.push({ label, first, last: railSource.length - 1 });
  }
  if (!railSource.some(Boolean)) return () => {};

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
  // The metal is decorative and says nothing a reader needs; the folders are not, and they
  // live in the CSS3D layer beside this canvas. aria-hidden used to sit on the host that
  // holds both, which hid every skill from assistive tech and made the browser refuse the
  // attribute outright as soon as a folder took focus. It belongs on the canvas alone.
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const css = new CSS3DRenderer();
  css.domElement.className = 'drawer__css';
  host.appendChild(css.domElement);

  // The invitation to pull the last drawer, filed where the flat wall's own hint sits - left,
  // under the section heading - with one long arrow sweeping across the empty floor of the
  // scene to land on the handle. Plain DOM, not CSS3D: neither element has anything to do with
  // the scene's perspective. Both ride render()'s own `is-shut` class, read straight off the
  // drawer's z each frame rather than tracked as separate state, so they show for exactly as
  // long as the drawer really is shut - including the very first frame, before anyone has
  // touched anything.
  const hintText = document.createElement('p');
  hintText.className = 'drawer__hint';
  // A <span> per line of the copy, not one text node with a <br>: each line carries the colour
  // sweep and the nudge on its own, and the sweeps run half a period apart (sections.css), which
  // needs two elements to run on. The break is the copy's own, from content.js.
  for (const line of (content.skillsHint?.drawerText ?? content.skillsHint?.text ?? '').split(
    '\n',
  )) {
    const lineEl = document.createElement('span');
    lineEl.textContent = line;
    hintText.appendChild(lineEl);
  }
  host.appendChild(hintText);

  // The sweep's own path is solved in resize() - it has to be: its start is wherever CSS
  // actually laid the text out and its end is the handle's own projected position, and neither
  // is known until the camera and the page have both settled. A fixed-size element sitting in a
  // fixed spot the way the tab's small arrow used to (rest of that attempt now gone) can't reach
  // across a box whose empty floor grows and shrinks with the aspect ratio, so this one spans
  // the whole host instead and is redrawn, not repositioned.
  const hintArrowNS = 'http://www.w3.org/2000/svg';
  const hintArrow = document.createElementNS(hintArrowNS, 'svg');
  hintArrow.setAttribute('class', 'drawer__hint-arrow');
  hintArrow.setAttribute('fill', 'none');
  hintArrow.setAttribute('aria-hidden', 'true');
  const hintArrowMarker = document.createElementNS(hintArrowNS, 'marker');
  hintArrowMarker.setAttribute('id', 'drawer-hint-arrowhead');
  hintArrowMarker.setAttribute('viewBox', '0 0 10 10');
  hintArrowMarker.setAttribute('refX', '5');
  hintArrowMarker.setAttribute('refY', '5');
  hintArrowMarker.setAttribute('markerWidth', '6');
  hintArrowMarker.setAttribute('markerHeight', '6');
  hintArrowMarker.setAttribute('orient', 'auto-start-reverse');
  const hintArrowHead = document.createElementNS(hintArrowNS, 'path');
  hintArrowHead.setAttribute('d', 'M0 0L10 5L0 10Z');
  hintArrowHead.setAttribute('fill', 'currentColor');
  hintArrowMarker.append(hintArrowHead);
  const hintArrowDefs = document.createElementNS(hintArrowNS, 'defs');
  hintArrowDefs.append(hintArrowMarker);
  const hintArrowPath = document.createElementNS(hintArrowNS, 'path');
  hintArrowPath.setAttribute('stroke', 'currentColor');
  hintArrowPath.setAttribute('stroke-width', '2');
  hintArrowPath.setAttribute('stroke-linecap', 'round');
  hintArrowPath.setAttribute('marker-end', 'url(#drawer-hint-arrowhead)');
  hintArrow.append(hintArrowDefs, hintArrowPath);
  host.appendChild(hintArrow);

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
  // the last folder and a different amount in front of the first. The empty slot between two
  // categories sits on the same GAP pitch as a folder, so it counts toward this length too.
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
  const slotZ = (i) => D / 2 - MARGIN - i * GAP;
  const items = [];
  railSource.forEach((li, i) => {
    if (!li) return; // the gap between two categories
    const el = buildFolder(li);
    const obj = new CSS3DObject(el);
    // CSS3DObject stamps pointer-events: auto inline on the element, which no stylesheet rule
    // can beat - so the whole transparent 320px box took the pointer, in front of the next
    // few tabs back. Cleared, the CSS decides: only the ::before strip over the tab is a target.
    el.style.pointerEvents = '';
    obj.scale.setScalar(PX);
    obj.position.set(0, RIM + CH / 2, slotZ(i));
    rail.add(obj);
    // reveal: the opening stagger's share of the opacity, multiplied in by cull(). op/pe: the
    // last opacity and pointer-events cull() wrote, so it can skip writes that change nothing
    items.push({ el, obj, i, z0: obj.position.z, reveal: 1, op: null, pe: null });
  });
  // keyboard Left/Right steps through this list, so the gaps between categories are never a
  // stop: f.fi is a folder's place in it, f.i its slot in the rail
  const folders = items;
  folders.forEach((f, fi) => (f.fi = fi));

  let active = null;
  let railZ = 0;
  const maxZ = Math.max(0, (railSource.length - 1) * GAP - D * 0.34);

  // ---- category labels ---------------------------------------------------------------------
  // Outside the drawer, not filed in it. A divider tab standing in the index covered the logo
  // and title of the first folder of every category - the one you'd look for - and a narrow
  // tab off to the right was too small to read. Each category gets its name and a hairline
  // instead, just outside the left edge of the file: the rule runs along the top-left corners
  // of its category's tabs and the name sits above-left of its midpoint, away from every tab,
  // which only ever lean the other way. (Under the right flank was tried first; the left reads
  // as part of the file's own edge.) The name faces the camera so it reads at any depth.
  // CSS3D, like the folders, so the rule takes the same colour token as its name; it is never
  // occluded by the metal either, so cull() clips both by hand, at the cabinet face and at the
  // drawer's own front.
  // Anchored on the tabs' corners, not on the drawer's rim at the same depth: a tab stands
  // TAB_REM above the rim, and at three quarters higher on screen is also further back, so a
  // rule on the rim sat under the tabs of the folders filed ahead of its own - Audio's ran
  // from Illustrator to Ableton instead of Ableton to Rekordbox. It used to stand 220px up
  // as well, out in the empty space over the drawer, where no name belonged to any tab.
  // Positioned in screen space off that corner, not by a world-unit offset: a world-unit
  // offset drifts out of line as depth changes, because this camera looks from the side
  // (AZIMUTH) as well as from above. Fixed pixel offsets from the corner's own projected
  // position keep the rule running along the tabs at every depth; layoutLabels() (called
  // from resize(), after the camera is final for that frame) is where that projection happens.
  const TAB_REM = 3.4; // the tab left above the rim at rest - .folder__sheet's translateY in sections.css
  const PEEK_REM = 2; // the extra lift under the mouse - .folder:hover .folder__sheet, same file
  const LABEL_PX_LEFT = 10; // screen px left of the tabs' corners
  const LABEL_PX_UP = 10; // screen px above them
  const LABEL_LEAD = 0.12; // the rule runs a touch past the category's first and last folder
  const RULE_PX = 100; // a rule's authored length; cull() scales it to what is showing
  let tabH = 0; // TAB_REM in world units, set by layoutLabels() from the live root font size
  const rimWorld = new THREE.Vector3();
  const rimCam = new THREE.Vector3();
  const rimFwd = new THREE.Vector3();
  /** The point `pxLeft`/`pxUp` screen pixels off the top-left corner of a tab filed at depth
   *  `z`, at the same distance from the camera as that corner - not the same world Z, which
   *  is what makes this track the corners' own projected line rather than a parallel one that
   *  drifts from it as the camera's azimuth foreshortens the two differently. */
  function rimOffset(z, pxLeft, pxUp) {
    rimWorld.set(-CW / 2, RIM + tabH, z);
    rimCam.copy(rimWorld).applyMatrix4(camera.matrixWorldInverse);
    const depth = -rimCam.z;
    rimWorld.project(camera);
    rimWorld.x -= (2 * pxLeft) / w;
    rimWorld.y += (2 * pxUp) / h;
    rimWorld.unproject(camera).sub(camera.position).normalize();
    camera.getWorldDirection(rimFwd);
    return camera.position.clone().addScaledVector(rimWorld, depth / rimWorld.dot(rimFwd));
  }
  const X_AXIS = new THREE.Vector3(1, 0, 0);
  const labels = categories.map((c) => {
    const el = document.createElement('div');
    el.className = 'drawer__label';
    const name = document.createElement('span');
    name.textContent = c.label;
    el.append(name);
    const obj = new CSS3DObject(el);
    el.style.pointerEvents = '';
    obj.scale.setScalar(PX);
    rail.add(obj);

    const ruleEl = document.createElement('div');
    ruleEl.className = 'drawer__rule';
    const rule = new CSS3DObject(ruleEl);
    ruleEl.style.pointerEvents = '';
    rail.add(rule);

    const front = slotZ(c.first) + LABEL_LEAD; // in world Z, for cull()'s reveal/clip math
    const back = slotZ(c.last) - LABEL_LEAD;
    // p0/p1/dir/len: this category's rim-offset endpoints and the segment between them,
    // filled in by layoutLabels() once the camera is known - front > back in world Z always,
    // so p0 (at `front`) is the nearer, p1 (at `back`) the further of the two.
    return {
      el,
      obj,
      ruleEl,
      rule,
      front,
      back,
      // its own reveal, tweened by fadeLabels() - riding the lead folder's own f.reveal made
      // a category filed toward the back wait for that folder's turn in a 24-item stagger,
      // arriving over a second after the ones at the front. Starts at 0: the drawer starts
      // shut and stays that way until it is pulled, and a name only ever stands beside one
      // that is open and still.
      reveal: 0,
      p0: new THREE.Vector3(),
      p1: new THREE.Vector3(),
      dir: new THREE.Quaternion(),
      len: 1,
      op: null,
      rop: null,
    };
  });
  /** Re-solves every label's rim-offset endpoints against the current camera. Only the
   *  endpoints move here; cull() re-clips and re-draws the visible stretch between them
   *  every frame, since how much of a category is out of the cabinet changes constantly. */
  function layoutLabels() {
    tabH = TAB_REM * parseFloat(getComputedStyle(document.documentElement).fontSize) * PX;
    for (const l of labels) {
      l.p0.copy(rimOffset(l.front, LABEL_PX_LEFT, LABEL_PX_UP));
      l.p1.copy(rimOffset(l.back, LABEL_PX_LEFT, LABEL_PX_UP));
      l.len = l.p0.distanceTo(l.p1);
      l.dir.setFromUnitVectors(X_AXIS, l.p1.clone().sub(l.p0).normalize());
      l.rule.quaternion.copy(l.dir);
      l.obj.position.copy(l.p0).lerp(l.p1, 0.5); // the name hangs off the rule's midpoint
      l.obj.quaternion.copy(billboardQuat);
    }
  }

  /** The names belong to an open drawer, not to the drawer itself: they fade in once it has
   *  finished coming out and fade out before it runs back, so a name is never left standing
   *  beside a drawer that is shut or still moving. `reveal` is cull()'s own factor, the same
   *  one the opening stagger tweens - nothing else writes their opacity. */
  // Soft and unhurried on purpose. These are the one part of the scene that is pure label,
  // and a quick fade on them read as a flicker rather than as something being set down; the
  // ease is sine.inOut, which has no hard start and no hard stop at either end. The cost is
  // paid on the way in, where the drawer stands still until this has finished - about 0.78s
  // with the stagger's tail, which is what the names going first is worth.
  const LABEL_FADE = 0.5;
  const LABEL_STAGGER = 0.04;
  const LABEL_EASE = 'sine.inOut';
  // Held so a grab can kill it. gsap.killTweensOf(labels) is not enough: a staggered tween
  // still runs its onComplete, and this one's is runDrawer()'s "now shut the drawer", so a
  // hand taken to the drawer mid-fade ran the drawer anyway. kill() drops the callback too.
  let labelTween = null;
  function fadeLabels(to, onDone) {
    labelTween?.kill();
    labelTween = null;
    // No categories, no fade - and no callback to wait on either. runDrawer() hangs its whole
    // close off this onDone, so a tween over an empty array deciding not to fire it would
    // leave the handle dead.
    if (!labels.length) return onDone?.();
    labelTween = gsap.to(labels, {
      reveal: to,
      duration: LABEL_FADE,
      stagger: LABEL_STAGGER,
      ease: LABEL_EASE,
      onUpdate: render,
      onComplete: () => {
        labelTween = null;
        render(); // the burst may have stopped already, and a half-faded name would stick
        onDone?.();
      },
    });
  }

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
  function rotateTo(f, target, duration, ease, delay = 0) {
    const p = f.rotP ?? (f.rotP = {});
    gsap.killTweensOf(p);
    const start = f.obj.quaternion.clone();
    p.t = 0;
    gsap.to(p, {
      t: 1,
      duration,
      ease,
      delay,
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
  const labelTmp = new THREE.Vector3(); // scratch: a label's p1-p0 span, re-used every frame
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
      if (pe !== f.pe) {
        f.pe = pe;
        // a class rather than inline pointer-events: the hit target is the folder's ::before
        // strip, which an inline value on the folder itself can't reach
        f.el.classList.toggle('is-culled', pe === 'none');
        // and the folder's own tabIndex, tied to the same threshold: a folder still filed
        // inside the cabinet is real DOM sitting in the natural Tab order, so without this a
        // keyboard visitor could Tab through 20-odd "button, collapsed" announcements with
        // nothing on screen to show for any of them. -1 only drops it from that sequence —
        // arrow-key browsing (below) calls .focus() directly and reaches it exactly as before.
        // The lead folder (fi 0) is exempt: it's the drawer's keyboard handle (see the
        // `focusin` listener, "Tab is a pull too") and stays reachable even while shut, since
        // landing on it is what triggers the pull - and it is genuinely visible again by the
        // time focus paints, because runDrawer() starts opening that same frame.
        f.el.tabIndex = pe === 'none' && f.fi !== 0 ? -1 : 0;
      }
    }

    // Category labels: only the stretch that is out in the open shows - in front of the
    // cabinet face, and not pushed out through the drawer's own front by a drag. Clipped by
    // how far along the rim-offset segment (not the world-Z span) the limits fall, since p0
    // and p1 no longer share a world X/Y the way the old Z-only rule did.
    const backLim = CAB_MOUTH - drawer.position.z - rail.position.z;
    const frontLim = D / 2 - rail.position.z;
    const span = labelTmp;
    for (const l of labels) {
      const front = Math.min(l.front, frontLim);
      const back = Math.max(l.back, backLim);
      l.rule.visible = front > back;
      if (l.rule.visible) {
        const t0 = (l.front - front) / (l.front - l.back);
        const t1 = (l.front - back) / (l.front - l.back);
        span.copy(l.p1).sub(l.p0);
        l.rule.scale.set((l.len * (t1 - t0)) / RULE_PX, PX, PX);
        l.rule.position.copy(l.p0).addScaledVector(span, (t0 + t1) / 2);
      }
      const rop = l.reveal.toFixed(3);
      if (rop !== l.rop) l.ruleEl.style.opacity = l.rop = rop;
      // the name hangs off the rule's midpoint, so it fades in as that point clears the face
      const mid = (l.front + l.back) / 2;
      const shown =
        mid > frontLim ? 0 : THREE.MathUtils.clamp((mid - backLim) / FADE_OVER, 0, 1) * l.reveal;
      const op = shown.toFixed(3);
      if (op !== l.op) l.el.style.opacity = l.op = op;
    }
  }

  // Not a separate flag flipped at every open/close call site - a click, a drag, and the
  // auto-open on scroll each end the drawer shut or open by a different path, and tracking
  // "shut" by hand at every one of them is exactly the kind of state that drifts from the
  // thing it describes. Derived from the real z instead, so it can't disagree with what's on
  // screen; skipped when it hasn't changed, same as every other write in cull().
  let shutState = null;
  function render() {
    cull();
    const shutNow = drawer.position.z <= SHUT_Z + 0.001;
    if (shutNow !== shutState) host.classList.toggle('is-shut', (shutState = shutNow));
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
  const PICK_W = 0.25; // share of the frame's width the card takes
  const PICK_TOP = 0.03; // gap above it, as a share of the frame's height
  const PICK_PULL = 2; // world units in front of the drawer's face, so it rides over every folder
  const pickPos = new THREE.Vector3();
  const pickRay = new THREE.Vector3();
  const camFwd = new THREE.Vector3();
  function cardSize() {
    const cardH = Math.min(h * (1 - PICK_TOP * 2), (w * PICK_W * CARD_H) / CARD_W);
    return [(cardH * CARD_W) / CARD_H, cardH];
  }
  // How far the furniture steps right so the card gets a column of its own, clear of the
  // drawer's front instead of laid over the folders filed there - and clear of the category
  // names, which stand out past that front on the left: sized to the front alone, the longest
  // name beside the card ran into its corner. The names are measured off the page, less the
  // slide they were last drawn at, so this reads where they rest at no slide at all.
  const pickShift = () => {
    const [cardW, cardH] = cardSize();
    const clear = cardW + w * 0.025;
    let shift = clear - view.left;
    const hb = host.getBoundingClientRect();
    const top = h * PICK_TOP;
    for (const l of labels) {
      const b = l.el.firstChild.getBoundingClientRect();
      if (!b.width || b.bottom - hb.top < top || b.top - hb.top > top + cardH) continue;
      shift = Math.max(shift, clear - (b.left - hb.left - view.shift));
    }
    return Math.max(0, shift);
  };

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
  const view = {
    baseX: 0,
    baseY: 0,
    left: 0,
    handleX: 0,
    handleY: 0,
    shutLeft: 0,
    shift: 0,
  };
  function frameFor(shift) {
    camera.setViewOffset(w, h, view.baseX - shift, view.baseY, w, h);
    // the canvas mask's right-hand fade rides along, or it dims the cabinet's face instead
    // of the carcass running off behind it
    // On the canvas, which is the element the mask is on, rather than on the host: a custom
    // property set on the host invalidates style for everything under it, and everything
    // under it is the CSS3D layer - 30-odd folder and label elements restyled on every frame
    // of a slide that runs while the scene is already rendering.
    renderer.domElement.style.setProperty('--slide', `${shift}px`);
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
      // the card's own curve: the pan and the card move together, and two different eases on
      // one moment read as two things happening rather than one
      ease: CARD_EASE,
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
    // The last drawer's own handle, at rest - where the sweeping hint arrow has to land. Its
    // world position while shut is the drawer group's own position (SHUT_Z) plus the handle's
    // local one, since the handle is a child of that group; the arrow only ever shows while the
    // drawer is shut and still, so this is the only position it will ever need to reach.
    corner.set(0, FRONT_Y, SHUT_Z + D / 2 + 0.33).project(camera);
    view.handleX = ((corner.x + 1) / 2) * w;
    view.handleY = ((1 - corner.y) / 2) * h;
    // The front's own left edge while shut - not view.left just above, which is the same
    // corner pulled out to OPEN_Z for the picked card's column and sits well left of where
    // the closed furniture actually starts. The hint arrow needs the shut silhouette, since
    // it only ever shows while the drawer is exactly that: shut.
    corner.set(-FACE_W / 2, FRONT_Y + FRONT_H / 2, SHUT_Z + D / 2 + 0.22).project(camera);
    view.shutLeft = ((corner.x + 1) / 2) * w;
    return dist;
  }

  // Three drawers, give or take one for the room there is: a fourth when the frame has
  // height to spare and it costs the drawer nothing in size, two only when the frame is so
  // short that a third would shrink everything by more than a third.
  function pickDrawerCount() {
    const [d2, d3, d4] = [2, 3, 4].map((n) => fit(n));
    return d4 <= d3 * 1.02 ? 4 : d3 <= d2 * 1.35 ? 3 : 2;
  }

  // The sweep is aimed at the handle (view.handleX/Y) but never actually reaches it - "near"
  // the furniture, not "on top of" it, since a line landing on the drawer itself reads as
  // pointing at the metal rather than inviting a hand toward it. Stopped a fixed px margin
  // short of the furniture's own left edge while shut (view.shutLeft, set in fit() just above)
  // rather than at a fixed fraction of the curve's length: a fraction leaves
  // the gap shrinking or growing with how far apart the text and the handle happen to land on
  // a given frame, where a px margin against the furniture's own silhouette stays "near" on
  // every one of them.
  const HINT_ARROW_MARGIN = 48;
  const ARC_START = 0.85; // where along the block's width the sweep leaves it
  const ARC_K = 0.5523; // the cubic that draws a 90° arc: 4/3 * tan(45°/2)
  const ARC_TOP_MIN = 8; // the type may not climb out of the top of the box for the geometry
  /** The sweep's own `d`, and the height the type has to sit at for it, solved fresh each
   *  resize. It is exactly a quarter circle: it leaves the block straight down and arrives at
   *  the handle straight across, which are a 90° arc's own two tangents. That only holds while
   *  the arc is as tall as it is wide, so the drop is not free - the block's `top` is solved
   *  from it here and written back (CSS keeps a sensible one for the frame before this runs).
   *  Everything else is read, never assumed: the block's left and width are CSS's, and the end
   *  is the handle's own projected height (view.handleY) at HINT_ARROW_MARGIN short of the
   *  furniture's left edge (view.shutLeft) - "near" the metal, never on it, with the tip left
   *  pointing straight along the last stretch at the handle it stopped short of. */
  function layoutHintArrow() {
    hintArrow.setAttribute('width', w);
    hintArrow.setAttribute('height', h);
    hintArrow.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const hostRect = host.getBoundingClientRect();
    const textRect = hintText.getBoundingClientRect();
    // Out from under the right of the block, not its middle: the arc is as tall as it is wide,
    // so every pixel the sweep leaves further left is a pixel the type has to climb, and the
    // type runs out of box long before the drawer runs out of distance.
    const sx = textRect.left - hostRect.left + textRect.width * ARC_START;
    // level with the handle, stopped short of the metal - the tip's last stretch is horizontal,
    // so it is left aiming straight at the handle across that gap
    const ex = view.shutLeft - HINT_ARROW_MARGIN;
    const ey = view.handleY;
    // The quarter circle's own constraint, solved for where the block sits: its height above
    // the handle has to equal its distance from the tip. Clamped at the top of the box - the
    // arc then comes out a little wider than tall, which reads as the same sweep.
    const top = Math.max(ARC_TOP_MIN, ey - (ex - sx) - 6 - textRect.height / 2);
    hintText.style.top = `${top}px`;
    const sy = top + textRect.height / 2 + 6;
    // The 90° arc as one cubic: down out of the type, across into the handle, with the two
    // control points on those tangents at the standard 0.5523 of the radius.
    const c1y = sy + (ey - sy) * ARC_K;
    const c2x = ex - (ex - sx) * ARC_K;
    hintArrowPath.setAttribute('d', `M${sx} ${sy} C ${sx} ${c1y}, ${c2x} ${ey}, ${ex} ${ey}`);
  }

  function resize() {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    const total = pickDrawerCount();
    buildCabinet(total);
    fit(total);
    layoutHintArrow();
    billboardQuat.copy(camera.quaternion);
    layoutLabels();
    measureZAxis();
    renderer.setSize(w, h);
    css.setSize(w, h);
    // the card's spot is in screen space, so it and the room made for it follow the frame
    gsap.killTweensOf(view);
    view.shift = 0;
    frameFor(0);
    if (active) {
      render(); // pickShift() measures the category names off the page, so draw them at the new size first
      view.shift = pickShift();
      frameFor(view.shift);
      lift(active, 0);
    }
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
  // The card's own two runs. Coming out is the longer and the more sinuous of the two: it is
  // the moment the whole section exists for, and at 0.48s on a power3.out the card snapped
  // out of the rail rather than being drawn out of it. One curve carries position, scale and
  // rotation, in both directions - three tweens that land together read as one motion only if
  // they share an ease, which is what the old power3/power4 pairing was hand-matching by eye.
  const CARD_OUT = 0.78;
  const CARD_IN = 0.55;
  const CARD_EASE = 'power2.inOut';
  // The flex. A waypoint quaternion - out past square, then back - was two slerps sharing one
  // tween, and at the seam the card turned back at a different rate than it had arrived: that
  // kink read as two moves rather than as a bend. This overshoots along the arc the card is
  // already turning through, so it keeps going the way it was going, passes the reading plane
  // and eases back - one continuous motion, and the only flex available at all, since a folder
  // is DOM on a CSS3D plane with no geometry to curve. The number is the overshoot's strength:
  // 1.7 is GSAP's own default (~10% past the target), 3 lands near 8 degrees on this arc.
  // 'power2.inOut' here turns the flex off without touching anything else.
  const BEND_EASE = 'back.out(3)';
  /** The sheet's climb out of the rim, driven here rather than by its own CSS transition.
   *  CSS3DRenderer re-inserts a folder's element when the object changes parent - which is
   *  what scene.attach() does on a pick - and a transition never starts on an element the
   *  browser has just inserted. Measured, the sheet went from translateY(266px) to none
   *  inside a single frame whatever duration the stylesheet asked for: the content popped
   *  open and the card then travelled on for another three quarters of a second. That was
   *  the second of the two steps. On the travel's own tween clock, with the travel's curve,
   *  it is one motion. */
  function riseSheet(f, duration, ease) {
    const sheet = f.el.querySelector('.folder__sheet');
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    gsap.killTweensOf(sheet);
    sheet.style.transition = 'none'; // the 200ms hover transition would smear every write
    // CARD_H, never sheet.offsetHeight: CSS3DRenderer has just re-inserted this element, so at
    // this instant the browser measures it as zero and the climb began 54px above its landing
    // place instead of 266 below it - the sheet was already unrolled before the card moved.
    // The sheet is inset:0 inside a card authored at CARD_H, which is what its own CSS
    // translateY(calc(100% - 3.4rem)) resolves against in the first place.
    // ...and PEEK_REM off that when the pick came from the mouse, because the folder under it
    // is already peeking: started from the filed value, the sheet dropped those 2rem in a
    // single frame before it began to climb, which is the knock you feel on the click itself.
    const peek = f.el.matches(':hover') ? PEEK_REM : 0;
    gsap.fromTo(
      sheet,
      { y: CARD_H - (TAB_REM + peek) * rem },
      {
        y: 0,
        duration,
        ease,
        onComplete: () => {
          restSheet(f);
          // The close control only exists once there is a card under it. It hangs off the
          // folder's box rather than off the sheet, so while the sheet is still climbing it
          // would sit in the empty space above it - and its own CSS delay could not hold it
          // back, for the same reason the sheet's transition never ran: the element has just
          // been re-inserted, and a transition does not start on one the browser has only now
          // inserted, so it jumped straight to opaque. This class lands hundreds of frames
          // after that insert, where a transition behaves like any other.
          f.el.classList.add('is-landed');
        },
      },
    );
  }

  /** Hands the sheet back to the stylesheet. The rest position, the hover peek and the rim
   *  mask are all CSS, and an inline transform left behind would beat every one of them. */
  function restSheet(f) {
    const sheet = f.el.querySelector('.folder__sheet');
    gsap.killTweensOf(sheet);
    gsap.set(sheet, { clearProps: 'transform' });
    sheet.style.transition = '';
  }

  // How far a card climbs clear of the file before it comes forward. The folders are parallel
  // planes a GAP apart and a card sent straight at the reading spot crosses every one filed in
  // front of it; a CSS3D layer has no per-pixel depth - the browser sorts whole elements - so
  // a crossing shows as two cards cutting through each other. A tab stands about 0.6 above the
  // rim, and the painted strip of a filed folder is that tab, so clearing it is what the climb
  // has to buy. Both runs use it: the way back crosses the same planes in the same way.
  const CLEAR = 1.6;
  /** Move f to `target` along one quadratic through `over`, rather than straight there. One
   *  curve and not a climb tween followed by a travel tween: the seam between two moves is
   *  exactly what the card's own turn used to show, and this path has none - it leaves the
   *  file upward and arrives already heading where it is going. The tween runs on a per-folder
   *  proxy (f.posP), so everything that interrupts a card has to kill that alongside
   *  f.obj.position, or a dropped run keeps writing coordinates into a card that has moved on.
   *  Not named `travel`: that is already the drag's own pointer distance, a few hundred lines
   *  down in this same closure, and the collision is a SyntaxError that takes the whole module
   *  out - which main.js's .catch then hides by falling back to the flat wall, silently. */
  function arcTo(f, target, duration, ease, over, onDone) {
    const p = f.posP ?? (f.posP = {});
    gsap.killTweensOf(p);
    const path = new THREE.QuadraticBezierCurve3(f.obj.position.clone(), over, target.clone());
    p.t = 0;
    gsap.to(p, {
      t: 1,
      duration,
      ease,
      onUpdate: () => {
        path.getPoint(p.t, f.obj.position);
        render();
      },
      onComplete: onDone,
    });
  }

  /** Carry f to the pick spot and square it up to the camera: a card read at the drawer's
   *  own angle is foreshortened, and the whole reason it comes up is to be read. */
  function lift(f, duration) {
    const { pos, scale } = pickTarget();
    const ease = CARD_EASE;
    if (duration) riseSheet(f, duration, ease);
    // up out of its slot first, then forward to the spot - see CLEAR
    const over = f.obj.position.clone().setY(f.obj.position.y + CLEAR);
    arcTo(f, pos, duration, ease, over);
    gsap.to(f.obj.scale, { x: scale, y: scale, z: scale, duration, ease, onUpdate: render });
    // The turn waits out the first fifth of the run, and this is what keeps the card from
    // cutting through the ones filed in front of it. In the file every folder is a plane
    // parallel to its neighbours, and parallel planes cannot intersect however much they
    // overlap on screen; the moment this one starts squaring up to the camera it stops being
    // parallel, and while it is still among them the browser - which sorts whole elements and
    // has no per-pixel depth - draws that as the cards slicing each other. Held until the card
    // is clear of the file, there is nothing left to slice. The climb and the sheet carry the
    // motion in the meantime, so the run still reads as one move rather than two.
    // It also still ends with the travel: the flex has to settle on a card that is landing,
    // not on one already parked.
    // It starts from wherever hover left the card, never from square: rotateTo captures the
    // current quaternion, so a folder picked under the mouse carries its HOVER_TURN up with it
    // and the turn simply continues. Unturning it first was tried and is worse - the card
    // snapped flat under the cursor before it had moved at all.
    // The hold is 0.35 of the run, not the 0.18 it was. The ease is inOut, so a fifth of the
    // time is only ~6% of the travel: the card began squaring up while it was still filed
    // between its neighbours, which is the slicing this delay exists to prevent. 0.35 is where
    // the arc has actually bought the height that clears their tabs.
    rotateTo(f, billboardQuat, duration * 0.65, duration ? BEND_EASE : ease, duration * 0.35);
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
    if (f.posP) gsap.killTweensOf(f.posP); // the curved run writes through this, not position
    scene.attach(f.obj);
    // the furniture's pan is tied to the card's own run, or the scene keeps sliding under a
    // card that has already landed
    slideFrame(pickShift(), () => lift(f, CARD_OUT), CARD_OUT);
    pump(1400);
  }

  function collapse(f) {
    // aria updates now, the visual close deferred - see below
    f.el.setAttribute('aria-expanded', 'false');
    f.el.querySelector('.folder__close').tabIndex = -1;
    f.el.classList.remove('is-landed'); // the close goes first, before the card starts back
    // a climb still running would go on writing inline transforms over the filed rest state
    restSheet(f);
    // back into the file, so it rides with the index again; a lift still running would
    // otherwise keep writing world coordinates into what is now rail space
    gsap.killTweensOf([f.obj.position, f.obj.scale]);
    if (f.posP) gsap.killTweensOf(f.posP); // the curved run writes through this, not position
    rail.attach(f.obj);
    // The mirror of the way out: back over the file, then down into its own slot, so the return
    // crosses no plane the card did not already clear on its way out.
    // .is-open drives the sheet's own CSS rest position and the rim mask, which used to drop
    // the moment this tween started: the mask flipping back on at full CSS size, while the
    // object was still large mid-flight in world space, read as a jump. Held until the card is
    // actually back and small again, that same CSS change happens at rail scale, where it is
    // too small to see.
    const slot = new THREE.Vector3(0, RIM + CH / 2, f.z0);
    const over = slot.clone().setY(slot.y + CLEAR);
    arcTo(f, slot, CARD_IN, CARD_EASE, over, () => f.el.classList.remove('is-open'));
    // Square again before it sinks back between its neighbours, which is the way out's rule
    // read backwards: a tilted card entering a file of parallel planes is what slices them.
    rotateTo(f, RESTING_QUAT, CARD_IN * 0.72, CARD_EASE);
    gsap.to(f.obj.scale, {
      x: PX,
      y: PX,
      z: PX,
      duration: CARD_IN,
      ease: CARD_EASE,
      onUpdate: render,
    });
  }

  function close() {
    if (!active) return;
    collapse(active);
    active = null;
    host.classList.remove('has-open');
    slideFrame(0, undefined, CARD_IN);
    pump(1000);
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
        // steps between folders only - f.fi is this folder's place among them, not its slot
        // in the rail, so the gap between two categories is never a stop
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
   *  no way back except a drag, and the affordance reads the same either way. The category
   *  names bracket that run: out of the way before it goes in, back once it is all the way
   *  out, so they only ever stand beside a drawer that is open and still. */
  // One number for every run of the drawer, the entrance included - it is the same piece of
  // furniture each time, and a toggle that ran faster than the first pull used to make it feel
  // like a snappier one the moment a visitor touched the handle themselves.
  const DRAWER_RUN = 1.5;
  function runDrawer() {
    const shut = drawer.position.z < (SHUT_Z + OPEN_Z) / 2;
    const run = () => {
      // GSAP overwrites nothing by default, so two clicks on the handle left two tweens
      // fighting over the same z, frame by frame. The drag path has always killed them on
      // the grab; the click path has to as well, and it is what lets a click reverse a run
      // already under way.
      gsap.killTweensOf(drawer.position);
      gsap.to(drawer.position, {
        z: shut ? OPEN_Z : SHUT_Z,
        duration: DRAWER_RUN,
        // coming out is an entrance and wants its speed at the front, where the eye is;
        // going in is the deliberate half, and reads better easing into the cabinet
        ease: shut ? 'power3.out' : 'power2.inOut',
        onUpdate: render,
        onComplete: shut ? () => fadeLabels(1) : undefined,
      });
    };
    if (shut) {
      revealIndex(); // the index files itself in behind the drawer, the first time it comes out
      run();
    } else fadeLabels(0, run);
    pump((DRAWER_RUN + LABEL_FADE + LABEL_STAGGER * labels.length) * 1000 + 400);
  }

  const DRAG_MIN = 5; // px of travel that tells a drag of the face from a click on it
  let dragMode = null; // 'drawer' | 'index'
  let dragHid = false; // whether this drag has already taken the category names down
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
      // and the names' fade with it, callback included. Their `reveal` is left where the
      // fade got to: snapping it back to 1 here is what made a click on a shut drawer show
      // every name while the drawer was still coming out, since cull() would then have a
      // full factor to multiply in as each one cleared the cabinet face.
      labelTween?.kill();
      labelTween = null;
      // A hand pulling the drawer is its own stagger - the folders clear the mouth as fast as
      // it moves them - so the entrance tween is spent rather than fired behind the hand.
      revealed = true;
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
    // A drawer with a hand on it is a drawer in motion, and a name only ever stands beside
    // one that is open and still. They go on the first real movement rather than on the grab,
    // so a click that never moves is left to runDrawer()'s own fade.
    if (travel >= DRAG_MIN && !dragHid) {
      dragHid = true;
      for (const l of labels) l.reveal = 0;
    }
    drawer.position.z = THREE.MathUtils.clamp(
      startDrawerZ + (dx * zAxis.x + dy * zAxis.y) / (zAxis.lengthSq() || 1),
      SHUT_Z,
      OPEN_Z,
    );
    render();
  });
  const release = () => {
    if (dragMode === 'drawer') {
      // a grab that never went anywhere was a click on the face, not a drag of it
      if (travel < DRAG_MIN) runDrawer();
      // a drag ends wherever the hand left it, so the names come back only if that is all
      // the way out; short of it they stay down until a run of the drawer brings them in
      else if (dragHid) {
        dragHid = false;
        if (drawer.position.z > OPEN_Z - 0.15) fadeLabels(1);
        pump();
      }
    }
    dragMode = null;
  };
  host.addEventListener('pointerup', release);
  host.addEventListener('pointercancel', release);

  const onKey = (e) => e.key === 'Escape' && active && (active.el.focus(), close());
  window.addEventListener('keydown', onKey);

  // The set player (src/setPlayer.js) parks in this box's own corner and is not part of the
  // index: pressing play there is not "clicking away from the card", and without this
  // exemption it filed the open folder back in mid-track.
  const onOutside = (e) => {
    if (active && !e.target.closest('.folder, .set-player')) close();
  };
  window.addEventListener('click', onOutside);

  // ---- it waits to be pulled -----------------------------------------------------------
  // The section used to open itself the moment it scrolled into view, which spent the whole
  // gesture before anyone had looked at the furniture. It stays shut instead: the invitation
  // stands in the column a shut drawer leaves free (.drawer__hint in sections.css), and it runs
  // only when a hand - or a Tab key - actually pulls it.
  drawer.position.z = SHUT_Z;

  // The index files itself in the first time the drawer comes out, and only then: after that
  // the folders are simply what is in the drawer, and a second stagger on every reopen read as
  // the cabinet being restocked. fromTo, not from: a from() left the folders parked on their
  // start values, and an invisible wall of skills is a worse failure than no animation. It
  // tweens f.reveal, which cull() multiplies into the opacity it already owns, 40ms apart -
  // 20ms was under the floor where a stagger reads as one. onComplete renders once more, so a
  // reveal that finishes after pump() has stopped (a backgrounded tab) can't leave the index
  // half faded. The names are not here: fadeLabels(1), off the run's own onComplete, brings
  // them in on a drawer that has stopped, every time rather than just the first.
  let revealed = false;
  function revealIndex() {
    if (revealed) return;
    revealed = true;
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
  }

  // Tab is a pull too. The folders are real DOM inside the scene, so they take focus whether
  // the drawer is out or not, and without this a keyboard visitor would be reading a card
  // filed inside a shut cabinet.
  const onFocusIn = () => {
    if (host.classList.contains('is-shut')) runDrawer();
  };
  host.addEventListener('focusin', onFocusIn);

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // hero3d.js has no teardown at all; this module keeps one.
  return function dispose() {
    ro.disconnect();
    cancelAnimationFrame(frame);
    host.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('click', onOutside);
    gsap.killTweensOf(drawer.position);
    gsap.killTweensOf(view);
    gsap.killTweensOf(items);
    gsap.killTweensOf(labels);
    items.forEach((f) => {
      gsap.killTweensOf(f.obj.position);
      gsap.killTweensOf(f.obj.scale);
      if (f.rotP) gsap.killTweensOf(f.rotP);
      if (f.posP) gsap.killTweensOf(f.posP);
      gsap.killTweensOf(f.el.querySelector('.folder__sheet'));
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
