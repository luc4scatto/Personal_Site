// Skill drawer cards as trading cards: every folder gets the card zones (category, logo window,
// number), and the open card gets a holo foil inside its logo window that follows the pointer.
// The foil is simeydotme's pokemon-cards-css (public/holo/, GPL-3.0, used with the author's
// permission): their CSS untouched apart from paths, the .card class (renamed .holo-card, or it
// styled the project cards) and edge fixes; we add their .card__shine/.card__glare layers and
// feed them the pointer variables their component would. Look in skill-card-holo.css.
import gsap from 'gsap';
import './styles/skill-card-holo.css';

const HOLO_CSS = [
  'cards',
  'base',
  'basic',
  'regular-holo',
  'cosmos-holo',
  'v-regular',
  'v-full-art',
  'trainer-full-art',
  'rainbow-holo',
  'shiny-rare',
  'shiny-v',
];
// one effect per skill category, in the page's category order (3D Software, Real-time, Code, AI,
// Motion & Video, 2D, Audio): Luca's pick, 2026-11-06. As data-rarity|supertype|subtypes.
const RARITIES = [
  'rare holo v|pokémon|',
  'rare ultra|pokémon|',
  'rare rainbow|pokémon|',
  'rare shiny v|pokémon|',
  'rare holo|pokémon|',
  'rare holo cosmos|pokémon|',
  'rare ultra|trainer|supporter',
];

// Category, number and total per skill. Read from the strip BEFORE initSkillDrawer(), which lifts
// the <li>s out of their groups into the 3D scene.
export function readSkillMeta(strip) {
  const groups = [...strip.querySelectorAll('.skill-group')];
  const items = groups.flatMap((g, cat) =>
    [...g.querySelectorAll('li[data-skill]')].map((li) => ({
      key: li.dataset.skill,
      cat,
      name: g.querySelector('h3')?.textContent.trim() ?? '',
    })),
  );
  return new Map(items.map((it, i) => [it.key, { ...it, no: i + 1, total: items.length }]));
}

function addZones(folder, meta) {
  const sheet = folder.querySelector('.folder__sheet');
  if (!sheet || sheet.querySelector('.lay-art')) return;
  const m = meta.get(folder.dataset.skill) ?? { name: '', no: 0, total: 0 };
  const no = String(m.no).padStart(2, '0');
  const selfTaught = !!sheet.querySelector('.folder__badge');
  const icon = sheet.querySelector('.folder__tab .skill-icon');
  const zone = (cls, text) => {
    const e = document.createElement('div');
    e.className = cls;
    e.setAttribute('aria-hidden', 'true'); // decoration: the sheet's own text carries the content
    if (text) {
      const s = document.createElement('span');
      s.textContent = text;
      e.append(s);
    }
    return e;
  };
  // sentences (Python, Second Brain) or nested items (Substance): one column of attacks
  const bullets = [...sheet.querySelectorAll('.folder__bullets > li')];
  if (bullets.some((li) => li.firstChild?.textContent.length > 45 || li.querySelector('ul'))) {
    sheet.classList.add('lay-long');
  }
  const art = zone('lay-art');
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
    zone('lay-cat', m.name),
    art,
    zone('lay-strip', `${selfTaught ? 'Self-taught · ' : ''}No. ${no}`),
    zone('lay-foot', `${no}/${m.total} ★`),
  );
}

function ensureFoil(sheet, meta) {
  const host = sheet.querySelector('.lay-art');
  let card = host.querySelector('.holo-card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'holo-card interactive';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<div class="card__shine"></div><div class="card__glare"></div>';
    const cat = meta.get(sheet.closest('.folder')?.dataset.skill)?.cat ?? 0;
    const [rarity, supertype, subtypes] = RARITIES[cat % RARITIES.length].split('|');
    Object.assign(card.dataset, { rarity, supertype, subtypes });
    host.prepend(card);
  }
  return card;
}

let cssLoaded = false;

export function initSkillCardHolo(scene, meta, signal) {
  const root = document.documentElement;
  root.classList.add('holo-cards');
  signal.addEventListener('abort', () => root.classList.remove('holo-cards'));
  scene.querySelectorAll('.folder[data-skill]').forEach((f) => addZones(f, meta));

  // the foil only moves with the pointer: nothing to load or run under reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!cssLoaded) {
    cssLoaded = true;
    for (const f of HOLO_CSS) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = `/holo/css/${f}.css`;
      document.head.append(l);
    }
  }

  // where the light rests when the pointer is off the card: off-centre, because some effects
  // (shiny, cosmos) scale with the distance from the centre and vanish in the middle
  const REST = [30, 25];
  const pose = (card, px, py, duration = 0.3, ease = 'power2.out') => {
    // a zero-length gsap.to only renders on the next tick, and the tween after it would kill it
    const go = (target, vars) => (duration ? gsap.to(target, vars) : gsap.set(target, vars));
    // light direction for the logo's sheen, -1..1 from the window centre
    go(card.parentElement, {
      '--lx': (px - 50) / 50,
      '--ly': (py - 50) / 50,
      duration,
      ease,
      overwrite: 'auto',
    });
    // the same variables the original component computes from the pointer
    go(card, {
      '--pointer-x': `${px}%`,
      '--pointer-y': `${py}%`,
      '--background-x': `${37 + px * 0.26}%`,
      '--background-y': `${33 + py * 0.34}%`,
      '--pointer-from-center': Math.min(1, Math.hypot(px - 50, py - 50) / 50),
      '--pointer-from-top': py / 100,
      '--pointer-from-left': px / 100,
      '--card-opacity': 1,
      '--card-scale': 1,
      duration,
      ease,
      overwrite: 'auto',
    });
  };

  // the foil is on as soon as a card starts out of the drawer (.is-open, at the click; the CSS
  // shows it from there too): a light sweep while it flies,
  // ending at the rest pose
  const watch = new MutationObserver((records) => {
    for (const r of records) {
      const f = r.target;
      if (r.oldValue?.includes('is-open') || !f.classList.contains('is-open')) continue;
      const sheet = f.querySelector('.folder__sheet');
      if (!sheet?.querySelector('.lay-art')) continue;
      const card = ensureFoil(sheet, meta);
      gsap.killTweensOf([card, card.parentElement]);
      pose(card, 85, 90, 0);
      pose(card, ...REST, 1.4, 'power2.inOut');
    }
  });
  scene
    .querySelectorAll('.folder[data-skill]')
    .forEach((f) =>
      watch.observe(f, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }),
    );
  signal.addEventListener('abort', () => watch.disconnect());

  window.addEventListener(
    'pointermove',
    (e) => {
      const sheet = scene.querySelector('.folder.is-landed .folder__sheet');
      if (!sheet?.querySelector('.lay-art')) return;
      const r = sheet.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const card = ensureFoil(sheet, meta);
      if (!inside) return pose(card, ...REST, 0.6);
      // measured on the logo window and clamped to it, so moving anywhere on the card sweeps the
      // window edge to edge
      const hr = card.parentElement.getBoundingClientRect();
      const clamp = (v) => Math.min(100, Math.max(0, v));
      pose(
        card,
        clamp(((e.clientX - hr.left) / hr.width) * 100),
        clamp(((e.clientY - hr.top) / hr.height) * 100),
      );
    },
    { signal },
  );
}
