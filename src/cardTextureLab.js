// TEMPORARY: switcher and pointer light for the foil trials in card-textures.css. Dev server only.
// Not bound to the page signal or tidy on purpose: it goes away once a foil is chosen.
import gsap from 'gsap';
import './styles/card-textures.css';

const OPTIONS = [
  ['', 'Originale'],
  ['j', 'J Carta V sobria'],
  ['k', 'K Carta V piena'],
  ['l', 'L Rilievo'],
  ['m', 'M Impronta'],
  ['p', 'P Repo poke-holo'],
];

// P: LOCAL TEST ONLY of the original pokemon-cards-css (GPL-3.0) files, copied into public/lab-holo/,
// which is listed in .git/info/exclude so it can never be committed or deployed. Their CSS is loaded
// untouched apart from the image paths; we only add the .card__shine/.card__glare layers to the open
// card and feed them their pointer variables.
const HOLO_CSS = [
  'cards',
  'base',
  'basic',
  'regular-holo',
  'cosmos-holo',
  'amazing-rare',
  'radiant-holo',
  'v-regular',
  'v-full-art',
  'v-max',
  'v-star',
  'trainer-full-art',
  'rainbow-holo',
  'rainbow-alt',
  'secret-rare',
  'shiny-rare',
  'shiny-v',
  'shiny-vmax',
  'reverse-holo',
  'swsh-pikachu',
  'trainer-gallery-holo',
  'trainer-gallery-v-regular',
  'trainer-gallery-v-max',
  'trainer-gallery-secret-rare',
];
const HOLO_RARITIES = [
  ['rare ultra|pokémon|', 'V full art (Celebi)'],
  ['rare rainbow alt|pokémon|', 'Rainbow alt art'],
  ['rare holo v|pokémon|', 'Holo V'],
  ['rare holo vmax|pokémon|', 'Holo VMAX'],
  ['rare holo vstar|pokémon|', 'Holo VSTAR'],
  ['rare rainbow|pokémon|', 'Rainbow'],
  ['rare secret|pokémon|', 'Secret (gold)'],
  ['rare shiny v|pokémon|', 'Shiny V'],
  ['rare shiny vmax|pokémon|', 'Shiny VMAX'],
  ['rare shiny|pokémon|', 'Shiny'],
  ['rare holo|pokémon|', 'Holo'],
  ['rare holo cosmos|pokémon|', 'Cosmos'],
  ['radiant rare|pokémon|', 'Radiant'],
  ['amazing rare|pokémon|', 'Amazing'],
  ['rare ultra|trainer|supporter', 'Trainer full art'],
];
let holoLoaded = false;
function loadHolo() {
  if (holoLoaded) return;
  holoLoaded = true;
  for (const f of HOLO_CSS) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `/lab-holo/css/${f}.css`;
    document.head.append(l);
  }
}
const holoPick = document.createElement('select');
holoPick.className = 'tex-lab__holo';
holoPick.setAttribute('aria-label', 'Rarità poke-holo');
holoPick.append(new Option('Casuale per card', 'random'));
for (const [value, label] of HOLO_RARITIES) holoPick.append(new Option(label, value));
// random: one rarity per skill, drawn the first time its card opens and kept for the visit
const drawn = new Map();
function rarityFor(card) {
  if (holoPick.value !== 'random') return holoPick.value;
  const key = card.closest('.folder')?.dataset.skill ?? '';
  if (!drawn.has(key)) {
    drawn.set(key, HOLO_RARITIES[Math.floor(Math.random() * HOLO_RARITIES.length)][0]);
  }
  return drawn.get(key);
}
function applyRarity(card) {
  const [rarity, supertype, subtypes] = rarityFor(card).split('|');
  card.dataset.rarity = rarity;
  card.dataset.supertype = supertype;
  card.dataset.subtypes = subtypes;
  // lab only: name the drawn effect, so a disliked one can be named and dropped from the list
  holoName.textContent = HOLO_RARITIES.find(([v]) => v === rarityFor(card))?.[1] ?? '';
}
const holoName = document.createElement('span');
holoName.className = 'tex-lab__name';
holoPick.addEventListener('change', () => {
  document.querySelectorAll('.folder__sheet .card').forEach(applyRarity);
});
// With a layout on, the foil lives only inside the art window (the logo frame); without, on the sheet.
function holoHost(sheet) {
  return (root.dataset.layout && sheet.querySelector('.lay-art')) || sheet;
}
function ensureHolo(sheet) {
  let card = sheet.querySelector('.card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'card interactive';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<div class="card__shine"></div><div class="card__glare"></div>';
  }
  const host = holoHost(sheet);
  if (card.parentElement !== host) host.prepend(card);
  applyRarity(card);
  return card;
}
const RELIEF_REST = 0.08; // relief with the card still: almost gone, it lives on movement

// L: a height map of fingerprint ridges (banded noise, blurred so the 8-bit steps don't sparkle) lit by an SVG specular light, one card-sized
// image per light side (no tiling, no seams), crossfaded by the pointer in CSS. The specular alpha is the mask: only lit ridges show.
function reliefTile(azimuth) {
  const bands = Array.from({ length: 90 }, (_, i) => i % 2).join(' ');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='640'><filter id='r' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.003' numOctaves='1' seed='7' stitchTiles='stitch'/><feComponentTransfer><feFuncR type='table' tableValues='${bands}'/></feComponentTransfer><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0'/><feGaussianBlur stdDeviation='1.2'/><feSpecularLighting surfaceScale='6' specularConstant='1.6' specularExponent='20' lighting-color='#fff'><feDistantLight azimuth='${azimuth}' elevation='18'/></feSpecularLighting></filter><rect width='100%' height='100%' filter='url(#r)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const REST = 0.3; // foil strength with the pointer away from the card
const LIT = 0.9;

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const bar = document.createElement('div');
bar.className = 'tex-lab';

// stopPropagation: the drawer closes the open card on any click reaching window
bar.addEventListener('click', (e) => e.stopPropagation());

function pick(value) {
  if (value === 'p') loadHolo();
  if (value) root.dataset.tex = value;
  else delete root.dataset.tex;
  for (const b of bar.children) b.setAttribute('aria-pressed', b.dataset.value === value);
  const url = new URL(location.href);
  if (value) url.searchParams.set('tex', value);
  else url.searchParams.delete('tex');
  history.replaceState(history.state, '', url);
}

for (const [value, label] of OPTIONS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.value = value;
  b.textContent = label;
  b.addEventListener('click', () => pick(value));
  bar.append(b);
}

// M: crisp etched rings like a full-art foil, drawn here (float maths, antialiased edges) because
// SVG noise only has 256 levels and banding it that finely saws the edges. Distances to three tilted
// centres are merged with a smooth min, so the rings bend into each other instead of crossing.
function swirlLines(W = 500, H = 640, period = 0.012, k = 18) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const eyes = [
    [0.3, 0.3],
    [0.72, 0.58],
    [0.25, 0.85],
  ];
  const ar = H / W;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const v = (y / H) * ar;
      const wu = u + 0.035 * Math.sin(v * 11 + 1.3) + 0.02 * Math.sin(u * 17);
      const wv = v + 0.035 * Math.sin(u * 9 - 0.7) + 0.02 * Math.sin(v * 15);
      let sum = 0;
      for (const [cx, cy] of eyes) {
        const dx = wu - cx;
        const dy = wv - cy * ar;
        sum += Math.exp(-k * Math.hypot((dx * 0.8 + dy * 0.6) * 0.6, -dx * 0.6 + dy * 0.8));
      }
      const s = Math.sin((-Math.log(sum) / k / period) * Math.PI * 2);
      const i = (y * W + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = Math.min(1, Math.max(0, s * 2.2 + 0.5)) * 120; // soft lines: they tint the foil, not cover it
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL()})`;
}

// color-dodge (theirs) brightens the art under it: on our black sheet it gives black. This swaps
// only that blend, to see their foil on black.
const holoScreen = document.createElement('button');
holoScreen.type = 'button';
holoScreen.textContent = 'Fondo nero: screen';
root.classList.add('holo-screen'); // on by default: the faithful color-dodge is black on our card
holoScreen.setAttribute('aria-pressed', 'true');
holoScreen.addEventListener('click', () => {
  const on = root.classList.toggle('holo-screen');
  holoScreen.setAttribute('aria-pressed', on);
});
// ---- card layouts, Pokemon-like zones (spike) ----
// Category and card number come from the page's own skill groups (read from the served index.html,
// so it doesn't race the drawer moving the real <li>s into the 3D scene). No invented data.
const LAYOUTS = [
  ['', 'Layout attuale'],
  ['a', 'A Carta completa'],
  ['b', 'B Full art'],
  ['c', 'C Minimale'],
];
const skillMeta = new Map();
fetch('/')
  .then((r) => r.text())
  .then((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = [...doc.querySelectorAll('.skill-group')].flatMap((g) =>
      [...g.querySelectorAll('li[data-skill]')].map((li) => [
        li.dataset.skill,
        g.querySelector('h3')?.textContent.trim() ?? '',
      ]),
    );
    items.forEach(([key, cat], i) => skillMeta.set(key, { cat, no: i + 1, total: items.length }));
  });
const layoutPick = document.createElement('select');
layoutPick.className = 'tex-lab__holo';
layoutPick.setAttribute('aria-label', 'Layout card');
for (const [value, label] of LAYOUTS) layoutPick.append(new Option(label, value));
function pickLayout(value) {
  if (value) root.dataset.layout = value;
  else delete root.dataset.layout;
  layoutPick.value = value;
  const url = new URL(location.href);
  if (value) url.searchParams.set('layout', value);
  else url.searchParams.delete('layout');
  history.replaceState(history.state, '', url);
}
layoutPick.addEventListener('change', () => pickLayout(layoutPick.value));
pickLayout(new URLSearchParams(location.search).get('layout') ?? 'a');

function ensureLayout(folder) {
  const sheet = folder.querySelector('.folder__sheet');
  if (sheet.querySelector('.lay-art')) return;
  const meta = skillMeta.get(folder.dataset.skill) ?? { cat: '', no: 0, total: 0 };
  const no = String(meta.no).padStart(2, '0');
  const selfTaught = !!sheet.querySelector('.folder__badge');
  const icon = sheet.querySelector('.folder__tab .skill-icon');
  const el = (cls, html) => {
    const e = document.createElement('div');
    e.className = cls;
    e.setAttribute('aria-hidden', 'true');
    if (html) e.innerHTML = html;
    return e;
  };
  // sentences instead of tool names: one column of attacks, or two columns crush the art window
  const bullets = [...sheet.querySelectorAll('.folder__bullets > li')];
  if (bullets.some((li) => li.firstChild?.textContent.length > 45 || li.querySelector('ul'))) {
    sheet.classList.add('lay-long');
  }
  const art = el('lay-art');
  if (icon) {
    // the logo plus a gloss cut to its exact shape (the icon itself as the mask)
    const logo = document.createElement('span');
    logo.className = 'lay-art__logo';
    const big = icon.cloneNode();
    big.className = 'lay-art__icon';
    big.alt = '';
    const gloss = document.createElement('span');
    gloss.className = 'lay-art__gloss';
    gloss.style.maskImage = gloss.style.webkitMaskImage = `url("${icon.src}")`;
    logo.append(big, gloss);
    art.append(logo);
  }
  sheet.append(
    el('lay-cat', `<span>${meta.cat}</span>`),
    art,
    el('lay-strip', `${selfTaught ? 'Self-taught · ' : ''}No. ${no}`),
    el('lay-foot', `<span>Illus. Luca Scattolin</span><span>${no}/${meta.total} &#9733;</span>`),
  );
}

bar.append(holoPick, holoName, holoScreen, layoutPick);
window.__labEnsureLayout = ensureLayout; // lab only: lets a console check fit every card
document.body.append(bar);
root.style.setProperty('--foil-lines', swirlLines());
root.style.setProperty('--relief-a', reliefTile(200));
root.style.setProperty('--relief-b', reliefTile(-20));
pick(new URLSearchParams(location.search).get('tex') ?? 'm');

if (!reduced) {
  let last = null;
  let decay;
  window.addEventListener('pointermove', (e) => {
    const speed = last ? Math.hypot(e.clientX - last.x, e.clientY - last.y) : 0;
    last = { x: e.clientX, y: e.clientY };
    const sheet = document.querySelector('.folder.is-landed .folder__sheet');
    if (!sheet) return;
    const r = sheet.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const inside = x >= 0 && x <= 100 && y >= 0 && y <= 100;
    gsap.to(sheet, {
      '--hx': inside ? x : 50,
      '--hy': inside ? y : 30,
      '--hon': inside ? LIT : REST,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    if (root.dataset.tex === 'p') {
      const card = ensureHolo(sheet);
      // light measured on the foil's own box (the art window, with a layout), clamped to it, so
      // moving anywhere on the card still sweeps the window edge to edge
      const hr = card.parentElement.getBoundingClientRect();
      const clamp = (v) => Math.min(100, Math.max(0, v));
      const px = inside ? clamp(((e.clientX - hr.left) / hr.width) * 100) : 50;
      const py = inside ? clamp(((e.clientY - hr.top) / hr.height) * 100) : 50;
      // the same variables the original component computes from the pointer
      // light direction for the embossed logo, -1..1 from the window centre (rest: from above)
      gsap.to(card.parentElement, {
        '--lx': inside ? (px - 50) / 50 : 0,
        '--ly': inside ? (py - 50) / 50 : -0.6,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(card, {
        '--pointer-x': `${px}%`,
        '--pointer-y': `${py}%`,
        '--background-x': `${37 + px * 0.26}%`,
        '--background-y': `${33 + py * 0.34}%`,
        '--pointer-from-center': Math.min(1, Math.hypot(px - 50, py - 50) / 50),
        '--pointer-from-top': py / 100,
        '--pointer-from-left': px / 100,
        '--card-opacity': inside ? 1 : 0,
        '--card-scale': 1,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    if (!inside) return;
    // relief rides on movement: up with speed, then fades back once the pointer stops
    decay?.kill();
    gsap.to(sheet, { '--hmove': Math.min(1, RELIEF_REST + speed / 18), duration: 0.15 });
    decay = gsap.to(sheet, {
      '--hmove': RELIEF_REST,
      duration: 1.1,
      delay: 0.2,
      ease: 'power2.out',
    });
  });

  // One sweep of light when a card lands
  new MutationObserver((records) => {
    for (const { target } of records) {
      if (!target.classList.contains('is-landed') || target.dataset.swept) continue;
      target.dataset.swept = '1';
      const sheet = target.querySelector('.folder__sheet');
      ensureLayout(target);
      if (!sheet.querySelector('.tex-relief')) {
        for (const side of ['a', 'b']) {
          const r = document.createElement('span');
          r.className = `tex-relief tex-relief--${side}`;
          r.setAttribute('aria-hidden', 'true');
          sheet.prepend(r);
        }
      }
      gsap.fromTo(
        sheet,
        { '--hmove': 1 },
        { '--hmove': RELIEF_REST, duration: 1.6, ease: 'power2.inOut' },
      );
      gsap.fromTo(
        sheet,
        { '--hx': -20, '--hy': 0, '--hon': LIT },
        { '--hx': 50, '--hy': 30, '--hon': REST, duration: 1.2, ease: 'power2.inOut' },
      );
      gsap.delayedCall(1.5, () => delete target.dataset.swept);
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
}
