// Company Brain hero: the problem and the answer in one picture. Five separate company systems
// sit scattered on the left, each in its own colour; every few seconds one of them sends a
// small packet along a curve to the answer card on the right, and the matching source pill on
// the card lights up. The card is what the Brain returns: a heading, a line of text, a chart
// and the systems it came from. Canvas 2D, no deps. Decorative: the canvas is aria-hidden,
// reduced-motion gets one still frame.

const ORANGE = '#ff6a13';
const BLUE = '#5c8dff';
const TEAL = '#4fd1c5';
const INK = 'rgba(226, 232, 244, 0.86)';
const DIM = 'rgba(190, 200, 220, 0.5)';
const LINE = 'rgba(190, 200, 220, 0.16)';

// unit space: x in [-1, 1], y in [-0.8, 0.8]; the card holds x from 0.2 to 0.98
const SOURCES = [
  { label: 'Technical data', color: ORANGE, x: -0.5, y: -0.62, tag: 0 },
  { label: 'Catalog', color: BLUE, x: -0.86, y: -0.24, tag: 1 },
  { label: 'Photos', color: BLUE, x: -0.46, y: 0.04, tag: 1 },
  { label: 'Drawings', color: TEAL, x: -0.88, y: 0.34, tag: 2 },
  { label: 'Prototypes', color: ORANGE, x: -0.5, y: 0.64, tag: 0 },
];
const CARD = { x: 0.2, y: -0.55, w: 0.78, h: 1.1 };
// packet order: not top to bottom, so the card does not read as a scan line
const ORDER = [0, 3, 1, 4, 2];
const PERIOD = 1.5; // seconds between two packets
const FLIGHT = 1.9; // seconds one packet takes to cross

const ease = (t) => 1 - Math.pow(1 - t, 3);

export function initSourcesGraph(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const family = getComputedStyle(document.body).fontFamily;
  let w = 0;
  let h = 0;
  let scale = 1;
  let raf = 0;
  let visible = true;
  let start = performance.now() / 1000;
  let done = false;

  const px = (x) => w / 2 + x * scale;
  const py = (y) => h / 2 + y * scale;

  // where a source's curve meets the card's left edge
  const landing = (i) => ({
    x: CARD.x,
    y: CARD.y + 0.2 + (i / (SOURCES.length - 1)) * (CARD.h - 0.4),
  });
  const point = (s, i, t) => {
    const a = { x: px(s.x), y: py(s.y) };
    const b = { x: px(landing(i).x), y: py(landing(i).y) };
    const c = { x: (a.x + b.x) / 2, y: a.y };
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    };
  };

  function draw(now, still) {
    ctx.clearRect(0, 0, w, h);
    const t = now - start;
    const font = (size, weight = 400) => `${weight} ${size}px ${family}`;

    // how lit each tag on the card is, 0 to 1
    const lit = [0, 0, 0];
    const packets = [];
    ORDER.forEach((si, slot) => {
      const s = SOURCES[si];
      const cycle = SOURCES.length * PERIOD;
      let local = (t - slot * PERIOD) % cycle;
      if (local < 0) local += cycle;
      const k = local / FLIGHT;
      if (still) {
        lit[s.tag] = 1;
      } else if (k < 1) {
        packets.push({ s, si, k });
      } else if (local < FLIGHT + 1.1) {
        lit[s.tag] = Math.max(lit[s.tag], 1 - (local - FLIGHT) / 1.1);
      }
    });

    // curves: faint, always there
    ctx.lineWidth = 1;
    SOURCES.forEach((s, i) => {
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      const a = { x: px(s.x), y: py(s.y) };
      const b = { x: px(landing(i).x), y: py(landing(i).y) };
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, a.y, b.x, b.y);
      ctx.stroke();
    });

    // the card
    const cx = px(CARD.x);
    const cy = py(CARD.y);
    const cw = CARD.w * scale;
    const ch = CARD.h * scale;
    const pad = 0.055 * scale;
    ctx.fillStyle = 'rgba(20, 22, 28, 0.9)';
    ctx.strokeStyle = 'rgba(190, 200, 220, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.arc(cx + pad + 3, cy + pad + 4, 3, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = font(Math.max(11, scale * 0.052), 500);
    ctx.textBaseline = 'middle';
    ctx.fillText('Brain', cx + pad + 12, cy + pad + 4);

    // a line of answer text, as grey bars
    [0.82, 0.6].forEach((f, i) => {
      ctx.fillStyle = 'rgba(190, 200, 220, 0.3)';
      ctx.beginPath();
      ctx.roundRect(
        cx + pad,
        cy + pad * 2.1 + i * 0.075 * scale,
        (cw - pad * 2) * f,
        0.035 * scale,
        3,
      );
      ctx.fill();
    });

    // the chart: five bars, drawn to a common baseline
    const base = cy + ch - 0.36 * scale;
    const barW = (cw - pad * 2) / 9;
    [0.35, 0.6, 1, 0.72, 0.46].forEach((f, i) => {
      const bh = f * 0.36 * scale * 0.8;
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.roundRect(cx + pad + i * barW * 1.8, base - bh, barW, bh, [3, 3, 0, 0]);
      ctx.fill();
    });
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(cx + pad, base + 0.5);
    ctx.lineTo(cx + cw - pad, base + 0.5);
    ctx.stroke();

    // the systems it came from
    const tags = [
      { text: 'Technical data', color: ORANGE },
      { text: 'Catalog', color: BLUE },
      { text: 'Drawings', color: TEAL },
    ];
    // the three pills share the card's width, so the type gives way before the pills do
    let fs = Math.max(10, scale * 0.046);
    const span = () => {
      ctx.font = font(fs);
      return tags.reduce((n, tag) => n + ctx.measureText(tag.text).width + 14 + 5, -5);
    };
    while (span() > cw - pad * 2 && fs > 8) fs -= 0.5;
    const th = 0.085 * scale;
    let tx = cx + pad;
    const ty = cy + ch - pad - th;
    tags.forEach((tag, i) => {
      const tw = ctx.measureText(tag.text).width + 14;
      const on = 0.35 + lit[i] * 0.65;
      ctx.strokeStyle = tag.color;
      ctx.fillStyle = tag.color;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, th, th / 2);
      ctx.globalAlpha = on * (0.1 + lit[i] * 0.25);
      ctx.fill();
      ctx.globalAlpha = on;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.fillText(tag.text, tx + 7, ty + th / 2 + 0.5);
      tx += tw + 5;
    });
    ctx.globalAlpha = 1;

    // sources: a dot and a label each
    ctx.font = font(Math.max(11, scale * 0.052));
    SOURCES.forEach((s) => {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(px(s.x), py(s.y), 5, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = DIM;
      ctx.fillText(s.label, px(s.x) + 12, py(s.y) + 0.5);
    });

    // packets in flight
    packets.forEach(({ s, si, k }) => {
      const p = point(s, si, ease(k));
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, 6.2832);
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
    draw(performance.now() / 1000, reduced || done);
  }

  // one full round each time the picture comes into view, then it rests on the finished
  // answer: every source has arrived and every pill is lit. Motion never runs for long.
  const ROUND = SOURCES.length * PERIOD + FLIGHT + 1.1;
  function frame(now) {
    if (now / 1000 - start > ROUND) {
      draw(now / 1000, true);
      done = true;
      raf = 0;
      return;
    }
    draw(now / 1000, false);
    raf = requestAnimationFrame(frame);
  }
  const run = () => {
    if (raf || reduced || !visible || document.hidden) return;
    start = performance.now() / 1000;
    done = false;
    raf = requestAnimationFrame(frame);
  };
  const halt = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? run() : halt();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? halt() : run()));
  resize();
  run();
}
