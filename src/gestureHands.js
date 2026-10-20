// Vivatech "The visitor's path": a small animated hand under each step, acting out the gesture
// the step names. Each step is a short sequence of hand poses that cross-fade in a loop (the
// thumbs up also fills a ring while held, like the booth's hold-to-confirm). Decorative
// (aria-hidden): the step's own text says what the gesture is. The loops run only while the
// steps are on screen; reduced motion shows each step's key pose, still.
//
// Hand outlines from Tabler Icons (https://tabler.io/icons), MIT License,
// Copyright (c) 2020-2024 Pawel Kuna. Drawn on a 24-unit grid.

const PALM =
  'M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47';

const POSES = {
  // fingers curled: the closed hand every gesture starts from
  fist: [
    'M8 11v-3.5a1.5 1.5 0 0 1 3 0v2.5',
    'M11 9.5v-3a1.5 1.5 0 0 1 3 0v3.5',
    'M14 7.5a1.5 1.5 0 0 1 3 0v2.5',
    'M17 9.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47',
  ],
  one: [
    'M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5',
    'M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5',
    'M14 10.5a1.5 1.5 0 0 1 3 0v1.5',
    PALM,
  ],
  two: [
    'M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5',
    'M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5',
    'M14 10.5a1.5 1.5 0 0 1 3 0v1.5',
    PALM,
  ],
  open: [
    'M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5',
    'M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5',
    'M14 5.5a1.5 1.5 0 0 1 3 0v6.5',
    'M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47',
  ],
  thumb: [
    'M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3',
  ],
};

// per step: the poses in order, and which one stands still under reduced motion
const STEPS = [
  { kind: 'thumbs', poses: ['fist', 'thumb'], key: 1 },
  { kind: 'count', poses: ['one', 'two'], key: 1 },
  { kind: 'pick', poses: ['one', 'two', 'fist'], key: 0 },
  { kind: 'pinch', poses: ['open', 'fist'], key: 1 },
  { kind: 'thumbs', poses: ['fist', 'thumb'], key: 1 },
];

function pose(name, i, isKey) {
  const paths = POSES[name].map((d) => `<path d="${d}" />`).join('');
  return `<g class="vt-hand__pose${isKey ? ' is-key' : ''}" style="--i: ${i}">${paths}</g>`;
}

export function initGestureHands(list) {
  [...list.querySelectorAll('.vt-step')].forEach((step, i) => {
    const s = STEPS[i];
    if (!s) return;
    const hand = document.createElement('span');
    hand.className = `vt-hand vt-hand--${s.kind}`;
    hand.style.setProperty('--n', s.poses.length);
    // the pinch: a dot where thumb and index meet, which a closed hand alone doesn't say
    const dot =
      s.kind === 'pinch' ? '<circle class="vt-hand__touch" cx="9.5" cy="9" r="1.2" />' : '';
    hand.innerHTML = `
<svg class="vt-hand__svg" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
  <circle class="vt-hand__track" cx="40" cy="40" r="37" />
  <circle class="vt-hand__ring" cx="40" cy="40" r="37" pathLength="100" />
  <svg x="19" y="18" width="42" height="42" viewBox="0 0 24 24" overflow="visible">
    <g class="vt-hand__hand">${s.poses.map((p, j) => pose(p, j, j === s.key)).join('')}${dot}</g>
  </svg>
</svg>`;
    step.append(hand);
  });

  // play only while the path is in view: five loops running off screen buy nothing
  new IntersectionObserver(([e]) => list.classList.toggle('is-playing', e.isIntersecting)).observe(
    list,
  );
}
