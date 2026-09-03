// Physical hardware/network topology, transcribed from a Miro sketch. Layout is
// hand-authored (not content.js data) — this is a fixed physical diagram, not
// editable service copy. Coordinates are a design-space approximation of the
// sketch, not pixel-exact.
const SVG_NS = 'http://www.w3.org/2000/svg';
const VB_W = 1000;
const VB_H = 525;
// every room/node coordinate below is a multiple of this — the diagram is drawn
// ON the blueprint grid (same <svg>, same coordinate space), not just over it
const GRID = 25;

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

const ROOMS = [
  // server room takes the studio's accent border and vice versa, per Luca's request
  { label: 'Server Room', x: 50, y: 75, w: 600, h: 400, cls: 'hw-room hw-room--accent' },
  { label: 'Studio Room', x: 700, y: 75, w: 250, h: 400, cls: 'hw-room' },
];

// padded 12 units on every side around the Mini PC node it wraps
const GROUPS = [{ label: 'Proxmox Cluster', x: 338, y: 203.25, w: 174, h: 99 }];

// one small monoline glyph per device family, viewBox 0 0 24 24, stroke-only —
// same "hand-drawn, no unicode glyph" rule as the rest of the site's icon system
const ICONS = {
  ups: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="10" y="0.5" width="4" height="3" rx="1"/><path d="M13 8l-4 6h3.5l-1.5 5 5-7h-3.5z" fill="currentColor" stroke="none"/>',
  minipc:
    '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="17.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M8 21h8M12 18v3"/>',
  nvme: '<rect x="4" y="3" width="16" height="16" rx="1.5"/><path d="M8 3v-1.5M12 3v-1.5M16 3v-1.5M8 22.5V19M12 22.5V19M16 22.5V19"/>',
  hdd: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none"/>',
  kvm: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 17v3"/><circle cx="12" cy="11" r="2"/>',
  switch:
    '<rect x="3" y="8" width="18" height="9" rx="1.5"/><path d="M6.5 12v2M10 12v2M13.5 12v2M17 12v2"/>',
  modem:
    '<rect x="4" y="12" width="16" height="8" rx="1.5"/><circle cx="9" cy="16" r="0.6" fill="currentColor" stroke="none"/><path d="M8 10c1.3-1.4 2.7-2 4-2s2.7.6 4 2M9.5 8.2c.8-.8 1.6-1.2 2.5-1.2s1.7.4 2.5 1.2"/>',
  computer: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  laptop: '<rect x="5" y="4" width="14" height="10" rx="1.2"/><path d="M2 19h20l-2-3H4z"/>',
};

// every x/y/w/h is a multiple of GRID (25) — boxes land exactly on the drawn grid lines.
// Boxes carrying a two-line label (Switch, HDD) get a taller box so the text sits
// inside it instead of spilling past the drawn edge.
// server-room y's carry a .25/.5 offset — the whole cluster (nvme row down to
// switch/modem) is shifted up from a first pass so it sits with an equal
// 31.25-unit margin above and below inside the room rectangle. switch-studio
// shares switch-server's y so the FTTH line between them stays horizontal.
const NODES = [
  { id: 'ups', x: 100, y: 215.25, w: 75, h: 75, label: 'UPS', icon: 'ups' },
  { id: 'strip-server', x: 230, y: 165.25, w: 15, h: 175, label: 'Power Strip' },
  { id: 'minipc', x: 350, y: 215.25, w: 150, h: 75, label: 'Mini PC', icon: 'minipc' },
  { id: 'nvme1', x: 350, y: 90.25, w: 50, h: 75, label: 'nvme', icon: 'nvme' },
  { id: 'nvme2', x: 425, y: 90.25, w: 50, h: 75, label: 'nvme', icon: 'nvme' },
  { id: 'hdd', x: 500, y: 90.25, w: 100, h: 75, label: '2x 4TB HDD (USB)', icon: 'hdd' },
  { id: 'jetkvm', x: 550, y: 240.25, w: 75, h: 50, label: 'Jet KVM', icon: 'kvm' },
  {
    id: 'switch-server',
    x: 350,
    y: 352.75,
    w: 150,
    h: 75,
    label: '2.5G + 10G Switch',
    icon: 'switch',
  },
  { id: 'modem', x: 100, y: 365.25, w: 100, h: 50, label: 'Modem 2.5G', icon: 'modem' },
  { id: 'strip-studio', x: 775, y: 105, w: 100, h: 15, label: 'Power Strip' },
  { id: 'computer', x: 725, y: 225, w: 75, h: 75, label: 'Computer', icon: 'computer' },
  { id: 'laptop', x: 850, y: 225, w: 75, h: 75, label: 'Laptop', icon: 'laptop' },
  {
    id: 'switch-studio',
    x: 750,
    y: 352.75,
    w: 150,
    h: 75,
    label: '2.5G + 10G Switch',
    icon: 'switch',
  },
];

// type: power | lan | ftth | data | usb — arrow: end | both | none
const CONNECTIONS = [
  { from: 'strip-server', to: 'minipc', type: 'power', arrow: 'end' },
  { from: 'strip-server', to: 'jetkvm', type: 'power', arrow: 'end' },
  // ups sits in the middle of these five — the exact center of five evenly
  // spaced sockets — so its line stays perfectly horizontal for free, no
  // special-casing needed
  { from: 'strip-server', to: 'ups', type: 'power', arrow: 'end' },
  { from: 'strip-server', to: 'switch-server', type: 'power', arrow: 'end' },
  { from: 'strip-server', to: 'modem', type: 'power', arrow: 'end' },
  { from: 'strip-studio', to: 'computer', type: 'power', arrow: 'end' },
  { from: 'strip-studio', to: 'switch-studio', type: 'power', arrow: 'end' },
  { from: 'strip-studio', to: 'laptop', type: 'power', arrow: 'end' },

  { from: 'nvme1', to: 'minipc', type: 'data', arrow: 'end' },
  { from: 'nvme2', to: 'minipc', type: 'data', arrow: 'end' },
  { from: 'hdd', to: 'minipc', type: 'data', arrow: 'end' },
  { from: 'minipc', to: 'jetkvm', type: 'data', arrow: 'end' },

  { from: 'switch-server', to: 'minipc', type: 'lan', arrow: 'end' },
  { from: 'switch-server', to: 'jetkvm', type: 'lan', arrow: 'end' },
  { from: 'switch-server', to: 'modem', type: 'lan', arrow: 'end' },
  { from: 'switch-studio', to: 'computer', type: 'lan', arrow: 'end' },
  { from: 'switch-studio', to: 'laptop', type: 'lan', arrow: 'end' },

  { from: 'switch-server', to: 'switch-studio', type: 'ftth', arrow: 'none' },
];

function nodeCenter(node) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

export function initHomelabHardware(container) {
  const nodesById = Object.fromEntries(NODES.map((n) => [n.id, n]));

  const inner = document.createElement('div');
  inner.className = 'homelab-hardware';

  const svg = svgEl('svg', { viewBox: `0 0 ${VB_W} ${VB_H}`, 'aria-hidden': 'true' });

  const defs = svgEl('defs', {});
  const marker = svgEl('marker', {
    id: 'hw-arrow',
    viewBox: '0 0 10 10',
    refX: 7,
    refY: 5,
    markerWidth: 7.5,
    markerHeight: 7.5,
    orient: 'auto-start-reverse',
  });
  marker.append(svgEl('path', { d: 'M0,0 L10,5 L0,10 Z', fill: 'context-stroke' }));
  defs.append(marker);

  // the blueprint grid, drawn IN the diagram's own coordinate space (not a CSS
  // background layer) — every room/node coordinate is a multiple of GRID, so
  // edges land exactly on these lines instead of merely floating over them
  const gridPattern = svgEl('pattern', {
    id: 'hw-grid',
    width: GRID,
    height: GRID,
    patternUnits: 'userSpaceOnUse',
  });
  gridPattern.append(svgEl('path', { class: 'hw-grid-line', d: `M ${GRID} 0 L 0 0 L 0 ${GRID}` }));
  defs.append(gridPattern);
  svg.append(defs);
  svg.append(svgEl('rect', { x: 0, y: 0, width: VB_W, height: VB_H, fill: 'url(#hw-grid)' }));
  // the pattern's first row/column lands its line exactly on the canvas edge, reading
  // as an outer frame around the whole diagram — mask just those two outermost lines
  // so the grid still ends flush with the canvas, unbordered
  svg.append(svgEl('rect', { class: 'hw-grid-mask', x: 0, y: 0, width: VB_W, height: 2 }));
  svg.append(svgEl('rect', { class: 'hw-grid-mask', x: 0, y: 0, width: 2, height: VB_H }));

  // rooms + the Proxmox Cluster sub-group, drawn first so everything else sits on top.
  // Corner brackets are a technical-drawing tell (registration marks on a schematic) —
  // the one detail that says "wiring diagram" rather than "generic node graph".
  const bracketCls = (room) =>
    room.cls.includes('accent') ? 'hw-room-bracket hw-room-bracket--accent' : 'hw-room-bracket';
  ROOMS.forEach((room) => {
    svg.append(
      svgEl('rect', {
        class: room.cls,
        x: room.x,
        y: room.y,
        width: room.w,
        height: room.h,
        rx: 14,
      }),
    );
    const len = 16;
    const corners = [
      { cx: room.x, cy: room.y, dx: 1, dy: 1 },
      { cx: room.x + room.w, cy: room.y, dx: -1, dy: 1 },
      { cx: room.x, cy: room.y + room.h, dx: 1, dy: -1 },
      { cx: room.x + room.w, cy: room.y + room.h, dx: -1, dy: -1 },
    ];
    corners.forEach(({ cx, cy, dx, dy }) => {
      svg.append(
        svgEl('path', {
          class: bracketCls(room),
          d: `M ${cx} ${cy + dy * len} L ${cx} ${cy} L ${cx + dx * len} ${cy}`,
        }),
      );
    });
  });
  GROUPS.forEach((group) => {
    svg.append(
      svgEl('rect', {
        class: 'hw-group',
        x: group.x,
        y: group.y,
        width: group.w,
        height: group.h,
        rx: 8,
      }),
    );
  });

  // each strip's power-out lines start from their own socket dot instead of
  // converging on the strip's bounding-box center — computed once, upfront, so
  // both the connector pass below (line start point) and the strip-drawing pass
  // further down (dot placement) read the exact same numbers
  const stripSockets = new Map(); // node.id -> [{ conn, x, y }]
  NODES.filter((n) => n.id.startsWith('strip-')).forEach((node) => {
    const conns = CONNECTIONS.filter((c) => c.type === 'power' && c.from === node.id);
    const vertical = node.h > node.w;
    const span = vertical ? node.h : node.w;
    const step = span / (conns.length + 1);
    stripSockets.set(
      node.id,
      conns.map((conn, idx) => ({
        conn,
        x: vertical ? node.x + node.w / 2 : node.x + step * (idx + 1),
        y: vertical ? node.y + step * (idx + 1) : node.y + node.h / 2,
      })),
    );
  });
  const socketFor = (conn) => stripSockets.get(conn.from)?.find((s) => s.conn === conn);

  // connectors, drawn before the node boxes so their ends disappear under them.
  // power/lan/ftth get a solid/dashed BASE line (always fully visible, carries
  // the color/meaning) plus a thin animated PULSE line riding on top — a bare
  // sparse-dash line with no base underneath reads as almost invisible.
  const ANIMATED_TYPES = new Set(['power', 'lan', 'ftth']);
  CONNECTIONS.forEach((conn) => {
    const from = nodesById[conn.from];
    const to = nodesById[conn.to];
    const a = (conn.type === 'power' && socketFor(conn)) || nodeCenter(from);
    const b = nodeCenter(to);
    const coords = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };

    const base = svgEl('line', { class: `hw-line hw-line--${conn.type}`, ...coords });
    if (conn.arrow === 'end' || conn.arrow === 'both')
      base.setAttribute('marker-end', 'url(#hw-arrow)');
    if (conn.arrow === 'both') base.setAttribute('marker-start', 'url(#hw-arrow)');
    svg.append(base);

    if (ANIMATED_TYPES.has(conn.type)) {
      svg.append(svgEl('line', { class: `hw-line hw-line--${conn.type}-pulse`, ...coords }));
    }
  });

  // strips are drawn as a real power-strip silhouette — a capsule with one socket
  // dot per device it actually powers (read off CONNECTIONS, not a fixed count),
  // per the reference photo Luca sent, instead of a plain grey box that told him
  // nothing. Every other device's icon (drawn in the HTML label layer, below)
  // carries its own fixed-size circular backdrop in CSS — same coordinate system
  // as the icon itself, so it can't drift out of alignment at different widths.
  NODES.forEach((node) => {
    if (!node.id.startsWith('strip-')) return;
    const capRadius = Math.min(node.w, node.h) / 2;
    svg.append(
      svgEl('rect', {
        class: 'hw-node-strip',
        x: node.x,
        y: node.y,
        width: node.w,
        height: node.h,
        rx: capRadius,
      }),
    );
    const socketR = capRadius - 2;
    (stripSockets.get(node.id) || []).forEach(({ x, y }) => {
      svg.append(svgEl('circle', { class: 'hw-node-socket', cx: x, cy: y, r: socketR }));
    });
  });

  const labels = document.createElement('div');
  labels.className = 'homelab-hardware__labels';

  const addLabel = (className, x, y, text, icon, chip = false) => {
    if (!text) return;
    const el = document.createElement('p');
    el.className = className;
    el.style.left = `${(x / VB_W) * 100}%`;
    el.style.top = `${(y / VB_H) * 100}%`;
    if (icon)
      el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
    if (chip) {
      // an opaque chip behind the caption only (the icon already carries its own
      // circular backdrop) — with icons packed 75 units apart in the top row,
      // captions floating directly on the grid blended into it and into each
      // other; a chip per caption keeps each one legible on its own
      const span = document.createElement('span');
      span.className = 'hw-label__text';
      span.textContent = text;
      el.append(span);
    } else {
      el.append(document.createTextNode(text));
    }
    labels.append(el);
  };

  ROOMS.forEach((room) =>
    addLabel('hw-label hw-label--room', room.x + room.w / 2, room.y - 14, room.label),
  );
  // sits outside the box's right edge, near its top — the strip's power lines
  // sweep diagonally through the whole left/lower approach to the box, and the
  // data lines converge on its top-center, but nothing reaches this corner
  GROUPS.forEach((group) =>
    addLabel('hw-label hw-label--group', group.x + group.w + 10, group.y + 8, group.label),
  );
  NODES.forEach((node) => {
    const isStrip = node.id.startsWith('strip-');
    const c = nodeCenter(node);
    // the strip caption sits just below the bar instead of on top of its sockets
    const y = isStrip ? node.y + node.h + 16 : c.y;
    // icon nodes get a class that anchors the ICON's own center on the node's
    // true center point — connections target that same point (nodeCenter), but
    // centering the whole icon+caption block there (the base .hw-label rule)
    // put the block's midpoint, not the icon, on it, so lines met the icon low
    const cls = node.icon ? 'hw-label hw-label--icon' : 'hw-label';
    addLabel(cls, c.x, y, node.label, ICONS[node.icon], true);
  });

  inner.append(svg, labels);
  container.append(inner);
}
