import { content } from './content.js';

// hub-and-spoke network diagram for the homelab page — plain SVG/DOM, no
// libraries. All spoke nodes sit at the same fixed radius so a single shared
// CSS keyframe (stroke-dashoffset) animates every connection line identically,
// no per-line path-length math needed.
const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = 640;
const CENTER = VIEWBOX / 2;
const SPOKE_RADIUS = 220;
// labels sit further out than their node so the connecting line never runs
// through the text itself
const LABEL_RADIUS = SPOKE_RADIUS + 45;
const HUB_R = 34;
const SPOKE_R = 10;
const PULSE_STAGGER = 0.3; // seconds between each line's pulse start

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  return el;
}

function buildLabel(className, x, y, title, services) {
  const label = document.createElement('div');
  label.className = className;
  label.style.left = `${(x / VIEWBOX) * 100}%`;
  label.style.top = `${(y / VIEWBOX) * 100}%`;

  const titleEl = document.createElement('p');
  titleEl.className = 'hd-label__title';
  titleEl.textContent = title;
  label.append(titleEl);

  if (services) {
    const list = document.createElement('ul');
    list.className = 'hd-label__services';
    services.forEach((service) => {
      const li = document.createElement('li');
      li.textContent = service;
      list.append(li);
    });
    label.append(list);
  }
  return label;
}

export function initHomelabDiagram(container) {
  const { hub, categories } = content.homelab.diagram;
  const n = categories.length;

  const inner = document.createElement('div');
  inner.className = 'homelab-diagram__inner';

  const graphic = document.createElement('div');
  graphic.className = 'homelab-diagram__graphic';
  const svg = svgEl('svg', { viewBox: `0 0 ${VIEWBOX} ${VIEWBOX}`, 'aria-hidden': 'true' });

  const labels = document.createElement('div');
  labels.className = 'homelab-diagram__labels';
  labels.append(buildLabel('hd-label hd-label--hub', CENTER, CENTER, hub));

  categories.forEach((cat, i) => {
    const angle = -Math.PI / 2 + i * ((2 * Math.PI) / n);
    const x = CENTER + SPOKE_RADIUS * Math.cos(angle);
    const y = CENTER + SPOKE_RADIUS * Math.sin(angle);
    const lx = CENTER + LABEL_RADIUS * Math.cos(angle);
    const ly = CENTER + LABEL_RADIUS * Math.sin(angle);

    svg.append(svgEl('line', { class: 'hd-line', x1: CENTER, y1: CENTER, x2: x, y2: y }));
    const pulse = svgEl('line', { class: 'hd-line-pulse', x1: CENTER, y1: CENTER, x2: x, y2: y });
    pulse.style.animationDelay = `${i * PULSE_STAGGER}s`;
    svg.append(pulse);
    svg.append(svgEl('circle', { class: 'hd-node-spoke', cx: x, cy: y, r: SPOKE_R }));

    labels.append(buildLabel('hd-label', lx, ly, cat.label, cat.services));
  });

  // drawn last so it sits above the lines that emanate from its own center
  svg.append(svgEl('circle', { class: 'hd-node-hub', cx: CENTER, cy: CENTER, r: HUB_R }));

  graphic.append(svg);
  inner.append(graphic, labels);
  container.append(inner);
}
