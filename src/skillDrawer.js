// The skill drawer: an office filing drawer in brushed steel, rendered in WebGL, with the
// tool folders standing in it. The folders themselves are NOT in this scene — they are the
// same <li data-skill> elements the wall has always used, kept in the DOM so they stay
// clickable, tabbable and readable by a screen reader. This module only draws the metal and
// tells the DOM strip where the drawer's mouth landed on screen.
//
// Two things here are deliberate and should not be "simplified":
//
// - The canvas sits BEHIND the strip, and the camera is framed so the drawer's front rim
//   lands where the folders begin. That is why no occlusion machinery is needed: a canvas
//   overlay cannot selectively cover the folders' bottoms without a second render layer,
//   and framing the shot correctly costs nothing.
// - Rendering is on demand. The scene is static once the drawer has slid open, so the loop
//   stops entirely instead of burning a rAF next to hero3d.js's own permanent loop.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';

// world units. Wide and shallow, like a real card-index drawer.
const W = 10; // width
const D = 4.2; // depth
const H = 1.5; // side height
const T = 0.16; // wall thickness
const FILL = 0.9; // how much of the container width the drawer spans

/** Brushed steel, not chrome: a mirror would render RoomEnvironment's fake room legibly,
 *  which reads as a bug. Horizontal streaks break the reflection into a machined surface. */
function brushedRoughness() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a5a5a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const y = Math.random() * 512;
    const x = Math.random() * 512;
    const len = 12 + Math.random() * 90;
    const v = 60 + Math.random() * 90;
    ctx.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.lineWidth = Math.random() < 0.5 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

export function initSkillDrawer(host, strip) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // this renderer is its own island: hero3d.js sets neither of these and corrects sRGB by
  // hand in its blur shader, so configuring them here changes nothing over there
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);

  // metal needs something to reflect. Generated at runtime, so no HDRI ships.
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
  // the inside is the same metal, dulled: it sits in its own shadow, and a bright interior
  // would fight the folders standing in it
  const steelInner = new THREE.MeshStandardMaterial({
    color: 0x3c4046,
    metalness: 0.9,
    roughness: 0.55,
    roughnessMap,
    envMapIntensity: 0.5,
  });

  const drawer = new THREE.Group();
  scene.add(drawer);

  const box = (bw, bh, bd, mat) => new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 3, 0.05), mat);

  const bottom = box(W, T, D, steelInner);
  bottom.position.y = -H / 2;
  drawer.add(bottom);

  const back = box(W, H, T, steelInner);
  back.position.set(0, 0, -D / 2 + T / 2);
  drawer.add(back);

  for (const sx of [-1, 1]) {
    const side = box(T, H, D, steel);
    side.position.set(sx * (W / 2 - T / 2), 0, 0);
    drawer.add(side);
  }

  // the front: a proud panel with a pull. This is the piece that reads as office furniture
  // rather than open box.
  const front = box(W + 0.35, H * 1.35, 0.24, steel);
  front.position.set(0, -0.12, D / 2 + 0.12);
  drawer.add(front);

  const handle = box(2.8, 0.2, 0.26, steel);
  handle.position.set(0, -0.12, D / 2 + 0.36);
  drawer.add(handle);

  // one hard key on top of the environment, so the rim has a specular edge to catch
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-3, 6, 5);
  scene.add(key);

  // The two front corners of the mouth. Everything the DOM needs in order to line up is
  // derived by projecting these, never from a hardcoded breakpoint — CLAUDE.md's
  // STACKED_HERO note is the trap this avoids.
  const anchorL = new THREE.Object3D();
  const anchorR = new THREE.Object3D();
  anchorL.position.set(-W / 2 + T, H / 2, D / 2 - T);
  anchorR.position.set(W / 2 - T, H / 2, D / 2 - T);
  drawer.add(anchorL, anchorR);

  const v = new THREE.Vector3();
  const toScreen = (obj, cw, ch) => {
    obj.getWorldPosition(v).project(camera);
    return { x: ((v.x + 1) / 2) * cw, y: ((1 - v.y) / 2) * ch };
  };

  let w = 0;
  let h = 0;

  /** Put the folder strip exactly on the drawer's front rim. */
  function placeStrip() {
    if (!strip || !w || !h) return;
    // dragged down past the drawer's breakpoint: hand the row back to the CSS wall, which
    // cannot win against inline styles on its own
    if (!window.matchMedia('(min-width: 701px)').matches) {
      // opacity too: resizing down before the drawer ever opened would otherwise leave the
      // whole wall at zero
      strip.style.left = strip.style.width = strip.style.top = strip.style.opacity = '';
      return;
    }
    const l = toScreen(anchorL, w, h);
    const r = toScreen(anchorR, w, h);
    // host is inset from the top of #skill-drawer, and the strip is positioned against
    // #skill-drawer, so the canvas offset has to come back in
    strip.style.left = `${host.offsetLeft + l.x}px`;
    strip.style.width = `${Math.max(0, r.x - l.x)}px`;
    // the folders stand up out of the drawer, so the rim is their baseline
    strip.style.top = `${host.offsetTop + l.y}px`;
  }

  function render() {
    renderer.render(scene, camera);
    placeStrip();
  }

  let dist = 20;

  function aim() {
    camera.position.set(0, dist * 0.42, dist);
    camera.lookAt(0, -0.1, 0);
    camera.updateProjectionMatrix();
  }

  function resize() {
    w = host.clientWidth;
    h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;

    // Frame from the anchors themselves rather than from trigonometry. The analytic
    // distance is wrong here because the mouth sits proud of the drawer's centre and the
    // camera looks down at it, so the front edge projects wider than the body. Projected
    // width is inversely proportional to distance, so scaling by the error converges in a
    // couple of passes and stays correct at any aspect.
    // Solve against the OPEN position: while the drawer is still pushed in, the mouth sits
    // farther from the camera and projects narrower, so framing on it would leave the row
    // overflowing once the drawer slides forward.
    const z = drawer.position.z;
    drawer.position.z = 0;
    drawer.updateMatrixWorld(true);

    dist = W / FILL / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    for (let i = 0; i < 6; i++) {
      aim();
      const got = toScreen(anchorR, w, h).x - toScreen(anchorL, w, h).x;
      if (got <= 1) break;
      dist *= got / (FILL * w);
      if (Math.abs(got - FILL * w) < 1) break;
    }

    drawer.position.z = z;
    drawer.updateMatrixWorld(true);

    // Where the rim lands vertically is CSS's job, not the camera's: .drawer__scene only
    // occupies the lower part of #skill-drawer, so the folders rise into the empty space
    // above it. Solving that here too would fight the width solve, because moving the
    // camera vertically changes how wide the front edge projects.

    renderer.setSize(w, h);
    render();
  }

  // The drawer is pulled open once, when the section arrives. After that the scene never
  // changes, so nothing renders again until a resize.
  let opened = false;
  drawer.position.z = -D * 0.62;
  if (strip) strip.style.opacity = '0';

  function open() {
    if (opened) return;
    opened = true;
    gsap.to(drawer.position, { z: 0, duration: 1.1, ease: 'power3.out', onUpdate: render });
    if (!strip) return;
    gsap.to(strip, { opacity: 1, duration: 0.5, delay: 0.35, ease: 'power2.out' });
    // fromTo, not from: a `from` here leaves the folders parked on their start values if
    // anything interrupts it, and a wall of invisible skills is a worse failure than a
    // missing animation. clearProps hands the elements back to the stylesheet.
    gsap.fromTo(
      strip.querySelectorAll('.skills-grid > li, .skill-group > h3'),
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.018,
        delay: 0.4,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      },
    );
  }

  const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && open(), {
    threshold: 0.25,
  });
  io.observe(host);

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // hero3d.js has no teardown at all; this module establishes the pattern.
  return function dispose() {
    io.disconnect();
    ro.disconnect();
    gsap.killTweensOf(drawer.position);
    if (strip) gsap.killTweensOf(strip);
    scene.traverse((o) => o.geometry?.dispose());
    steel.dispose();
    steelInner.dispose();
    roughnessMap.dispose();
    envRT.texture.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
