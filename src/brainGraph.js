// Company Brain hero: a second brain drawn as a knowledge graph. Region hubs sit inside a
// side-view brain silhouette, each sprouting branches (sub-hubs, then atomic notes), coloured
// by lobe. Branches sway slowly around their parent, so the graph never sits still.
// Canvas 2D, no deps. Decorative: the canvas is aria-hidden, reduced-motion gets one frame.

// how fast the sway runs; 1 is glacial
const SPEED = 1.9;
const EDGE = 'rgba(190, 200, 220, 0.38)';

// unit space: x in [-1, 1], y in [-0.75, 0.9]; frontal lobe on the left
const ELLIPSES = [
  [0, -0.08, 0.98, 0.62], // cerebrum
  [-0.05, 0.3, 0.55, 0.2], // temporal lobe
  [0.62, 0.42, 0.3, 0.2], // cerebellum
];

// >0 inside; roughly the distance to the edge
function depth(x, y) {
  let best = -Infinity;
  for (const [cx, cy, rx, ry] of ELLIPSES) {
    const d = 1 - Math.hypot((x - cx) / rx, (y - cy) / ry);
    if (d > best) best = d;
  }
  if (x > 0.2 && x < 0.38 && y > 0.4 && y < 0.88) best = Math.max(best, 0.1);
  return best;
}

// one theme colour per lobe: orange at both ends, blue across the middle, teal underneath
const ORANGE = '#ff6a13';
const BLUE = '#5c8dff';
const TEAL = '#4fd1c5';
const MIST = '#9fb4d6';

function colorFor(x, y) {
  if (y > 0.34 && x > 0.3) return MIST; // cerebellum and stem
  if (y > 0.16) return TEAL; // temporal
  if (x < -0.3) return ORANGE; // frontal
  if (x < 0.25) return BLUE; // top and parietal
  return ORANGE; // occipital
}

// seeded, so the shape is the same on every load
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build() {
  const rand = rng(5);
  // nodes are stored parents-first; a root has p = -1 and an absolute (x, y)
  const nodes = [];
  const swing = () => 0.12 + rand() * 0.22;
  const sway = () => ({ w: 0.12 + rand() * 0.16, ph: rand() * 6.28 });

  const addRoot = (x, y, r, color) => {
    nodes.push({ p: -1, x, y, r, color, a: 0.006 + rand() * 0.006, ...sway() });
    return nodes.length - 1;
  };
  // child at an absolute spot: keeps the branch pointing where the drawing wants it
  const addAt = (p, x, y, r, color) => {
    const b = nodes[p].base;
    const bx = b ? b.x : nodes[p].x;
    const by = b ? b.y : nodes[p].y;
    nodes.push({
      p,
      ang: Math.atan2(y - by, x - bx),
      len: Math.hypot(x - bx, y - by),
      swing: swing(),
      r,
      color,
      base: { x, y },
      ...sway(),
    });
    return nodes.length - 1;
  };
  const baseOf = (i) => nodes[i].base || { x: nodes[i].x, y: nodes[i].y };

  // branches fan out from a node, skipping directions that would leave the brain
  const sprout = (parent, count, minLen, spanLen, subChance, leafSize) => {
    const { x, y } = baseOf(parent);
    const color = nodes[parent].color;
    const start = rand() * 6.28;
    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const ang = start + (i / count) * 6.28 + (rand() - 0.5) * 0.9 + attempt * 0.7;
        const len = minLen + rand() * spanLen;
        const cx = x + Math.cos(ang) * len;
        const cy = y + Math.sin(ang) * len;
        if (depth(cx, cy) < 0.035) continue;
        if (subChance && rand() < subChance) {
          const sub = addAt(parent, cx, cy, 4 + rand() * 2.5, color);
          sprout(sub, 3 + Math.floor(rand() * 3), 0.055, 0.05, 0, leafSize);
        } else {
          addAt(parent, cx, cy, leafSize[0] + Math.pow(rand(), 2) * leafSize[1], color);
        }
        break;
      }
    }
  };

  // region hubs, placed by hand so every lobe gets one and the outline reads:
  // frontal, top, parietal, occipital, temporal
  const spots = [
    [-0.72, -0.08], [-0.58, -0.42], [-0.28, -0.5], [0.06, -0.52], [0.4, -0.42],
    [-0.36, -0.12], [0.02, -0.14], [0.36, -0.08], [0.7, -0.06],
    [-0.5, 0.26], [-0.12, 0.3], [0.2, 0.28],
  ];
  const roots = spots.map(([x, y]) => {
    const i = addRoot(x, y, 7 + rand() * 3, colorFor(x, y));
    sprout(i, 7 + Math.floor(rand() * 4), 0.12, 0.1, 0.55, [1.8, 3.2]);
    return i;
  });

  // cerebellum, and the stem as a short chain of grey notes
  const cereb = addRoot(0.62, 0.42, 8, colorFor(0.62, 0.42));
  sprout(cereb, 7, 0.09, 0.07, 0.4, [1.8, 3.2]);
  let prev = cereb;
  [[0.36, 0.55, 5], [0.33, 0.66, 3.5], [0.31, 0.77, 5.5], [0.3, 0.87, 3]].forEach(([x, y, r]) => {
    prev = addAt(prev, x, y, r, '#8a8f98');
  });
  roots.push(cereb);

  // each hub reaches for its two nearest neighbours
  const links = new Set();
  roots.forEach((a) => {
    roots
      .filter((b) => b !== a)
      .map((b) => [b, Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y)])
      .sort((m, n) => m[1] - n[1])
      .slice(0, 2)
      .forEach(([b]) => links.add(a < b ? `${a}-${b}` : `${b}-${a}`));
  });

  // the field between the branches: many tiny notes, a few bigger ones, evenly thrown
  const field = [];
  const size = (min, spread) => min + Math.pow(rand(), 3) * spread;
  const add = (x, y, r, color, a, al, w = 0.1 + rand() * 0.15) =>
    field.push({ x, y, r, color, a, al, w, ph: rand() * 6.28 });
  const spaced = (x, y, gap) => !field.some((n) => Math.hypot(n.x - x, n.y - y) < gap);
  for (let tries = 0, n = 0; n < 800 && tries < 30000; tries++) {
    const x = rand() * 2 - 1;
    const y = rand() * 1.65 - 0.75;
    if (depth(x, y) < 0.04 || !spaced(x, y, 0.038)) continue;
    n++;
    const c = rand() < 0.6 ? MIST : [ORANGE, BLUE, TEAL][Math.floor(rand() * 3)];
    add(x, y, size(0.7, 2.8), c, 0.005 + rand() * 0.008, 0.55 + rand() * 0.3);
  }
  // a loose, dim ring along the outline so the edge fades out instead of cutting
  for (let tries = 0, n = 0; n < 300 && tries < 80000; tries++) {
    const x = rand() * 2 - 1;
    const y = rand() * 1.65 - 0.75;
    const d = depth(x, y);
    if (d < 0 || d > 0.06 || !spaced(x, y, 0.028)) continue;
    n++;
    // they sway wider and quicker than the inner field, or the edge looks frozen
    add(x, y, 0.8 + rand() * 0.9, MIST, 0.02 + rand() * 0.02, 0.25 + rand() * 0.3, 0.2 + rand() * 0.2);
  }
  return { nodes, links: [...links].map((k) => k.split('-').map(Number)), field };
}

export function initBrainGraph(canvas) {
  const ctx = canvas.getContext('2d');
  const { nodes, links, field } = build();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let scale = 1;
  let raf = 0;
  let visible = true;

  const px = (x) => w / 2 + x * scale;
  const py = (y) => h / 2 + (y - 0.075) * scale;
  const pos = nodes.map(() => ({ x: 0, y: 0 }));

  function draw(t) {
    t *= SPEED;
    ctx.clearRect(0, 0, w, h);

    // positions: roots drift a little, every branch sways around its parent
    nodes.forEach((n, i) => {
      if (n.p < 0) {
        pos[i].x = px(n.x + Math.sin(t * n.w + n.ph) * n.a);
        pos[i].y = py(n.y + Math.cos(t * n.w * 0.8 + n.ph) * n.a);
        return;
      }
      const ang = n.ang + Math.sin(t * n.w + n.ph) * n.swing;
      const len = n.len * scale * (1 + Math.sin(t * 0.3 + n.ph) * 0.05);
      pos[i].x = pos[n.p].x + Math.cos(ang) * len;
      pos[i].y = pos[n.p].y + Math.sin(ang) * len;
    });

    for (const n of field) {
      ctx.globalAlpha = n.al;
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(px(n.x + Math.sin(t * n.w + n.ph) * n.a), py(n.y + Math.cos(t * n.w + n.ph) * n.a), n.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    nodes.forEach((n, i) => {
      if (n.p < 0) return;
      ctx.moveTo(pos[n.p].x, pos[n.p].y);
      ctx.lineTo(pos[i].x, pos[i].y);
    });
    for (const [a, b] of links) {
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
    }
    ctx.stroke();

    nodes.forEach((n, i) => {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, n.r, 0, 6.2832);
      ctx.fill();
    });
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(w / 2.1, h / 1.75);
    draw(performance.now() / 1000);
  }

  function frame(now) {
    draw(now / 1000);
    raf = requestAnimationFrame(frame);
  }
  const start = () => {
    if (!raf && !reduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  resize();
  start();
}
