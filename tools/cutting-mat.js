#!/usr/bin/env node
/* The cutting mat behind About and Projects, drawn as one static SVG.
 *
 *   node tools/cutting-mat.js            (writes public/images/cutting-mat.svg)
 *
 * A mat is geometry and nothing else - a fine and a coarse grid, rulers on the edges, a
 * protractor fan, 30/45/60 guides, circle templates, no printed brand - so it is generated from numbers
 * rather than drawn by hand, and tweaking a spacing means editing a constant and re-running.
 * White strokes at low alpha: the page's own palette, not the green of a real mat.
 * The CSS (sections.css, #about::before / #projects::before) crops a different region of it
 * into each section and fades the edges, so the whole sheet is never seen at once.
 *
 * Run by hand, like tools/peaks.js - not a build step.
 */
/* global process */
import { writeFileSync } from 'node:fs';

const W = 1600;
const H = 1100;
const M = 40; // margin between the sheet edge and the grid, where the rulers sit
const CELL = 20; // one "cm"
const X0 = M,
  Y0 = M,
  X1 = W - M,
  Y1 = H - M;

const clipped = []; // guides and curves, trimmed to the grid
const free = []; // grid, rulers, labels
const line = (x1, y1, x2, y2, cls, into = free) =>
  into.push(
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}"/>`,
  );
const circle = (cx, cy, r, cls) =>
  clipped.push(`<circle cx="${cx}" cy="${cy}" r="${r}" class="${cls}"/>`);
const text = (x, y, s, cls, anchor = 'middle') =>
  free.push(
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" text-anchor="${anchor}">${s}</text>`,
  );
const rad = (deg) => (deg * Math.PI) / 180;

// grid: fine every cell, strong every 5 cells
for (let x = X0; x <= X1; x += CELL) line(x, Y0, x, Y1, (x - X0) % (CELL * 5) ? 'g' : 'G');
for (let y = Y0; y <= Y1; y += CELL) line(X0, y, X1, y, (y - Y0) % (CELL * 5) ? 'g' : 'G');

// rulers: a tick every half cell ("mm" feel), long ones on the cm, numbers every 5 cm
for (let x = X0, i = 0; x <= X1; x += CELL / 2, i++) {
  const len = i % 10 === 0 ? 12 : i % 2 === 0 ? 7 : 4;
  line(x, Y1, x, Y1 + len, 't');
  line(x, Y0, x, Y0 - len, 't');
  if (i % 10 === 0) text(x, Y1 + 26, i / 2, 'n');
}
for (let y = Y1, i = 0; y >= Y0; y -= CELL / 2, i++) {
  const len = i % 10 === 0 ? 12 : i % 2 === 0 ? 7 : 4;
  line(X0, y, X0 - len, y, 't');
  line(X1, y, X1 + len, y, 't');
  if (i % 10 === 0 && i) text(X0 - 16, y + 4, i / 2, 'n', 'end');
}

// angle guides from the bottom-left corner
for (const a of [30, 45, 60])
  line(X0, Y1, X0 + 3000 * Math.cos(rad(a)), Y1 - 3000 * Math.sin(rad(a)), 'd', clipped);

// protractor fan: rays every 15 degrees, ticks every 5, numbers every 30
const P = { x: 420, y: 560, r: 300 };
for (let a = 0; a <= 180; a += 5) {
  const c = Math.cos(rad(a)),
    s = Math.sin(rad(a));
  if (a % 15 === 0) line(P.x, P.y, P.x + P.r * c, P.y - P.r * s, 'd');
  const len = a % 10 === 0 ? 14 : 8;
  line(P.x + P.r * c, P.y - P.r * s, P.x + (P.r + len) * c, P.y - (P.r + len) * s, 't');
  if (a % 30 === 0) text(P.x + (P.r + 30) * c, P.y - (P.r + 30) * s + 4, a, 'n');
}
clipped.push(`<path d="M${P.x - P.r} ${P.y} A${P.r} ${P.r} 0 0 1 ${P.x + P.r} ${P.y}" class="G"/>`);

// circle templates: a concentric target and two columns of small holes
const T = { x: 1150, y: 300 };
for (let r = 30; r <= 180; r += 30) circle(T.x, T.y, r, 'G');
line(T.x - 200, T.y, T.x + 200, T.y, 'g');
line(T.x, T.y - 200, T.x, T.y + 200, 'g');
[12, 16, 20, 24, 28].forEach((r, i) => {
  const y = 170 + i * 80;
  for (const x of [1420, 1500]) {
    circle(x, y, r, 'G');
    line(x - r - 6, y, x + r + 6, y, 'g');
  }
});

// long sweeping arcs across the lower right, like the curve guides on a real mat
for (let R = 1500; R <= 2000; R += 100) circle(1050, Math.round(1900 + R * 0.35), R, 'd');

// the sheet itself is an outline only: a filled plate at 1% white is one or two 8-bit steps
// above the page black, and under the fade those steps show up as bands
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><clipPath id="c"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}"/></clipPath></defs>
<style>
line,circle,path{fill:none;stroke:#fff}
.g{stroke-opacity:.022}.G{stroke-opacity:.05}.d{stroke-opacity:.035}.t{stroke-opacity:.11}
.sheet{fill:none;stroke:#fff;stroke-opacity:.07}
text{font-family:Helvetica,Arial,sans-serif;fill:#fff}
.n{font-size:10px;fill-opacity:.18}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" class="sheet"/>
<g clip-path="url(#c)">
${clipped.join('\n')}
</g>
${free.join('\n')}
</svg>
`;

const dest = process.argv[2] ?? 'public/images/cutting-mat.svg';
writeFileSync(dest, svg);
console.log(`${dest}: ${(svg.length / 1024).toFixed(1)}KB`);
