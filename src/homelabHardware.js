// Physical hardware/network topology, transcribed from a Miro sketch. Layout is
// hand-authored (not content.js data) — this is a fixed physical diagram, not
// editable service copy. Coordinates are a design-space approximation of the
// sketch, not pixel-exact.
const SVG_NS = 'http://www.w3.org/2000/svg';
// every room/node coordinate below is a multiple of this — the diagram is drawn
// ON the blueprint grid (same <svg>, same coordinate space), not just over it
const GRID = 25;

// One layout at every width: the two rooms side by side, and on a narrow screen the canvas
// keeps its own scale and scrolls sideways (.homelab-hardware-scroll). A stacked phone
// variant used to shrink the labels to 8px to fit; a wiring diagram you can read beats one
// that fits the screen.
const VB_W = 1000;
const VB_H = 600;

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

const ROOMS = [
  // server room takes the studio's accent border and vice versa, per Luca's request
  { label: 'Server Room', x: 50, y: 75, w: 600, h: 475, cls: 'hw-room hw-room--accent' },
  { label: 'Studio Room', x: 700, y: 75, w: 250, h: 475, cls: 'hw-room' },
];

// padded 12 units on every side around the two node boxes it wraps
const GROUPS = [{ label: 'Proxmox Cluster', x: 250.5, y: 260.5, w: 174, h: 99 }];

// one small monoline glyph per device family, viewBox 0 0 24 24, stroke-only -
// same "hand-drawn, no unicode glyph" rule as the rest of the site's icon system
const ICONS = {
  ups: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="10" y="0.5" width="4" height="3" rx="1"/><path d="M13 8l-4 6h3.5l-1.5 5 5-7h-3.5z" fill="currentColor" stroke="none"/>',
  minipc:
    '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="17.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M8 21h8M12 18v3"/>',
  nas: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M7.5 7h9M7.5 11h9M7.5 15h9"/><circle cx="12" cy="18.5" r="0.6" fill="currentColor" stroke="none"/>',
  kvm: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 17v3"/><circle cx="12" cy="11" r="2"/>',
  switch:
    '<rect x="3" y="8" width="18" height="9" rx="1.5"/><path d="M6.5 12v2M10 12v2M13.5 12v2M17 12v2"/>',
  modem:
    '<rect x="4" y="12" width="16" height="8" rx="1.5"/><circle cx="9" cy="16" r="0.6" fill="currentColor" stroke="none"/><path d="M8 10c1.3-1.4 2.7-2 4-2s2.7.6 4 2M9.5 8.2c.8-.8 1.6-1.2 2.5-1.2s1.7.4 2.5 1.2"/>',
  computer: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  laptop: '<rect x="5" y="4" width="14" height="10" rx="1.2"/><path d="M2 19h20l-2-3H4z"/>',
};

// Both rooms read top to bottom as three bands, like a circuit board:
//   network (y 162.5)  -> LAN bus at y 245, dropping into each device's top
//   devices (y 310)
//   power   (y 462.5)  -> one trace per device, rising into its bottom
// Every line therefore meets an icon dead center, from a side nothing else
// uses. Node CENTERS sit on the grid; a few box edges land on half-steps.
// Boxes carrying a two-line label (Switch) get a taller box.
const NODES = [
  { id: 'modem', x: 250, y: 137.5, w: 100, h: 50, label: 'Modem 2.5G', icon: 'modem' },
  {
    id: 'switch-server',
    x: 375,
    y: 125,
    w: 150,
    h: 75,
    label: '2.5G + 10G Switch',
    icon: 'switch',
  },
  { id: 'node2', x: 262.5, y: 272.5, w: 75, h: 75, label: 'Node 2', icon: 'minipc' },
  { id: 'node1', x: 337.5, y: 272.5, w: 75, h: 75, label: 'Node 1', icon: 'minipc' },
  { id: 'jetkvm', x: 437.5, y: 285, w: 75, h: 50, label: 'Jet KVM', icon: 'kvm' },
  { id: 'unas', x: 525, y: 272.5, w: 75, h: 75, label: 'UNAS 2x 4TB', icon: 'nas' },
  { id: 'ups', x: 162.5, y: 437.5, w: 75, h: 75, label: 'UPS', icon: 'ups' },
  { id: 'strip-server', x: 262.5, y: 455, w: 175, h: 15, label: 'Power Strip' },

  {
    id: 'switch-studio',
    x: 750,
    y: 125,
    w: 150,
    h: 75,
    label: '2.5G + 10G Switch',
    icon: 'switch',
  },
  { id: 'computer', x: 737.5, y: 272.5, w: 75, h: 75, label: 'Computer', icon: 'computer' },
  { id: 'laptop', x: 837.5, y: 272.5, w: 75, h: 75, label: 'Laptop', icon: 'laptop' },
  { id: 'strip-studio', x: 775, y: 455, w: 100, h: 15, label: 'Power Strip' },
];

const nodeCenterX = (id) => {
  const n = NODES.find((node) => node.id === id);
  return n.x + n.w / 2;
};

// type: power | lan | ftth | data | usb, arrow: end | both | none.
// socket: x of the power-strip socket the line leaves from (horizontal strips).
// via: corner points between the two ends, at right angles like PCB traces
// (corners rounded on draw). No via = a straight line.
const LAN_BUS = 245;
const fromSwitch = (sw, x) => [
  [nodeCenterX(sw), LAN_BUS],
  [x, LAN_BUS],
];
// one socket per powered device, its own trace: up from the socket to a lane,
// across to the device, up into its bottom. Lanes are picked so no two traces
// cross (a trace turning further out runs on a lower lane).
const power = (from, to, socket, y, rest = [[nodeCenterX(to), y]]) => ({
  from,
  to,
  type: 'power',
  arrow: 'end',
  socket,
  via: [[socket, y], ...rest],
});

const CONNECTIONS = [
  // modem and switch take the two channels round the left edge of the room,
  // nested so they never cross; the UPS drops under the strip
  power('strip-server', 'ups', 275, 530, [[200, 530]]),
  power('strip-server', 'switch-server', 300, 410, [
    [75, 410],
    [75, 100],
    [450, 100],
  ]),
  power('strip-server', 'modem', 325, 395, [
    [100, 395],
    [100, 162.5],
  ]),
  power('strip-server', 'node2', 350, 380),
  { from: 'strip-server', to: 'node1', type: 'power', arrow: 'end', socket: 375 },
  power('strip-server', 'jetkvm', 400, 380),
  power('strip-server', 'unas', 425, 395),

  power('strip-studio', 'computer', 800, 395),
  power('strip-studio', 'laptop', 825, 395),
  // round the laptop and into the switch's free right side
  power('strip-studio', 'switch-studio', 850, 410, [
    [937.5, 410],
    [937.5, 162.5],
  ]),

  { from: 'node1', to: 'jetkvm', type: 'data', arrow: 'end' },

  ...['node2', 'node1', 'jetkvm', 'unas'].map((to) => ({
    from: 'switch-server',
    to,
    type: 'lan',
    arrow: 'end',
    via: fromSwitch('switch-server', nodeCenterX(to)),
  })),
  ...['computer', 'laptop'].map((to) => ({
    from: 'switch-studio',
    to,
    type: 'lan',
    arrow: 'end',
    via: fromSwitch('switch-studio', nodeCenterX(to)),
  })),
  // dedicated cluster link, cabled node to node outside the switch
  { from: 'node2', to: 'node1', type: 'lan', arrow: 'both' },
  { from: 'modem', to: 'switch-server', type: 'lan', arrow: 'end' },

  { from: 'switch-server', to: 'switch-studio', type: 'ftth', arrow: 'none' },
];

function nodeCenter(node) {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 };
}

// polyline through pts with each corner cut by a quadratic curve of radius r,
// shrunk on short legs so two corners never overlap
function tracePath(pts, r = 10) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p0, p, p1] = [pts[i - 1], pts[i], pts[i + 1]];
    const l0 = Math.hypot(p.x - p0.x, p.y - p0.y);
    const l1 = Math.hypot(p1.x - p.x, p1.y - p.y);
    const k = Math.min(r, l0 / 2, l1 / 2);
    const a = { x: p.x - ((p.x - p0.x) / l0) * k, y: p.y - ((p.y - p0.y) / l0) * k };
    const b = { x: p.x + ((p1.x - p.x) / l1) * k, y: p.y + ((p1.y - p.y) / l1) * k };
    d += ` L ${a.x} ${a.y} Q ${p.x} ${p.y} ${b.x} ${b.y}`;
  }
  const end = pts[pts.length - 1];
  return `${d} L ${end.x} ${end.y}`;
}

export function initHomelabHardware(container) {
  function render() {
    container.replaceChildren();
    const vbW = VB_W;
    const vbH = VB_H;
    const rooms = ROOMS;
    const nodes = NODES;
    const nodesById = Object.fromEntries(nodes.map((n) => [n.id, n]));

    const inner = document.createElement('div');
    inner.className = 'homelab-hardware';

    const svg = svgEl('svg', { viewBox: `0 0 ${vbW} ${vbH}`, 'aria-hidden': 'true' });

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
    gridPattern.append(
      svgEl('path', { class: 'hw-grid-line', d: `M ${GRID} 0 L 0 0 L 0 ${GRID}` }),
    );
    defs.append(gridPattern);
    svg.append(defs);
    svg.append(svgEl('rect', { x: 0, y: 0, width: vbW, height: vbH, fill: 'url(#hw-grid)' }));
    // the pattern's first row/column lands its line exactly on the canvas edge, reading
    // as an outer frame around the whole diagram — mask just those two outermost lines
    // so the grid still ends flush with the canvas, unbordered
    svg.append(svgEl('rect', { class: 'hw-grid-mask', x: 0, y: 0, width: vbW, height: 2 }));
    svg.append(svgEl('rect', { class: 'hw-grid-mask', x: 0, y: 0, width: 2, height: vbH }));

    // rooms + the Proxmox Cluster sub-group, drawn first so everything else sits on top.
    // Corner brackets are a technical-drawing tell (registration marks on a schematic) —
    // the one detail that says "wiring diagram" rather than "generic node graph".
    const bracketCls = (room) =>
      room.cls.includes('accent') ? 'hw-room-bracket hw-room-bracket--accent' : 'hw-room-bracket';
    rooms.forEach((room) => {
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
    nodes
      .filter((n) => n.id.startsWith('strip-'))
      .forEach((node) => {
        const conns = CONNECTIONS.filter((c) => c.type === 'power' && c.from === node.id);
        const vertical = node.h > node.w;
        const span = vertical ? node.h : node.w;
        const step = span / (conns.length + 1);
        stripSockets.set(
          node.id,
          conns.map((conn, idx) => ({
            conn,
            x: vertical ? node.x + node.w / 2 : (conn.socket ?? node.x + step * (idx + 1)),
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
      const via = (conn.via || []).map(([x, y]) => ({ x, y }));
      const d = tracePath([a, ...via, b]);

      const base = svgEl('path', { class: `hw-line hw-line--${conn.type}`, d });
      if (conn.arrow === 'end' || conn.arrow === 'both')
        base.setAttribute('marker-end', 'url(#hw-arrow)');
      if (conn.arrow === 'both') base.setAttribute('marker-start', 'url(#hw-arrow)');
      svg.append(base);

      if (ANIMATED_TYPES.has(conn.type)) {
        svg.append(svgEl('path', { class: `hw-line hw-line--${conn.type}-pulse`, d }));
      }
    });

    // strips are drawn as a real power-strip silhouette — a capsule with one socket
    // dot per device it actually powers (read off CONNECTIONS, not a fixed count),
    // per the reference photo Luca sent, instead of a plain grey box that told him
    // nothing. Every other device's icon (drawn in the HTML label layer, below)
    // carries its own fixed-size circular backdrop in CSS — same coordinate system
    // as the icon itself, so it can't drift out of alignment at different widths.
    nodes.forEach((node) => {
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
      el.style.left = `${(x / vbW) * 100}%`;
      el.style.top = `${(y / vbH) * 100}%`;
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

    rooms.forEach((room) =>
      addLabel('hw-label hw-label--room', room.x + room.w / 2, room.y - 14, room.label),
    );
    // sits outside the box's left edge, near its top: only the two power
    // channels run further left, past the label's end
    GROUPS.forEach((group) =>
      addLabel('hw-label hw-label--group', group.x - 10, group.y + 8, group.label),
    );
    nodes.forEach((node) => {
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

  render();
}
