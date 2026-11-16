// Notes rising out of the DJ set player while a set plays: small SVG notes slip out from
// behind the panel's top-right corner, drift up and right, and are gone by the time they
// reach the window's right edge (Luca, 2026-11-16). Drawn as SVG, not ♪ ♫ characters: iOS
// turns those into emoji. One short-lived element per note, animated on transform and opacity
// only (Web Animations, composited) and removed when it lands; nothing runs while paused.
// They live inside the player, under the drawer's open card, and head away from the metal.

const SHAPES = [
  // quarter
  '<ellipse cx="9" cy="17.5" rx="4" ry="3" transform="rotate(-20 9 17.5)"/><rect x="11.8" y="3" width="1.8" height="14.5" rx=".9"/>',
  // eighth
  '<ellipse cx="9" cy="17.5" rx="4" ry="3" transform="rotate(-20 9 17.5)"/><rect x="11.8" y="3" width="1.8" height="14.5" rx=".9"/><path d="M12.6 3c.4 3.4 5.4 4 5 9-1-2.6-2.8-3.6-5-3.6z"/>',
  // two beamed eighths
  '<ellipse cx="6" cy="18.5" rx="3.4" ry="2.6" transform="rotate(-20 6 18.5)"/><ellipse cx="17.5" cy="16.5" rx="3.4" ry="2.6" transform="rotate(-20 17.5 16.5)"/><rect x="8.4" y="5" width="1.6" height="13.5"/><rect x="19.9" y="3" width="1.6" height="13.5"/><path d="M8.4 5 21.5 3v3.2L8.4 8.2z"/>',
  // sixteenth
  '<ellipse cx="9" cy="17.5" rx="4" ry="3" transform="rotate(-20 9 17.5)"/><rect x="11.8" y="3" width="1.8" height="14.5" rx=".9"/><path d="M12.6 3c.4 2.6 4.6 3 4.4 6.6-1-2-2.6-2.6-4.4-2.6z"/><path d="M12.6 7.4c.4 2.6 4.6 3 4.4 6.6-1-2-2.6-2.6-4.4-2.6z"/>',
];
const COLOURS = ['var(--accent)', 'var(--accent-2)', 'var(--text)'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Colours dealt from a shuffled bag, not picked at random: every colour once per round of
// three, and a round never starts with the colour the last one ended on. A plain random pick
// ran in streaks (four blue, then three orange) where the eye wants them mixed.
let bag = [];
let lastColour = '';
const nextColour = () => {
  if (!bag.length) {
    bag = [...COLOURS].sort(() => Math.random() - 0.5);
    if (bag[bag.length - 1] === lastColour) bag.reverse();
  }
  lastColour = bag.pop();
  return lastColour;
};

/** Start/stop the notes for one player. `panel` is the box they come out of, `root` the player
 *  (its .is-docked class means it sits in the nav bar, with no room to the right). */
export function createSetNotes(root, panel) {
  const layer = document.createElement('div');
  layer.className = 'set-player__notes';
  layer.setAttribute('aria-hidden', 'true');
  panel.append(layer);
  let timer = 0;

  const spawn = () => {
    timer = setTimeout(spawn, rand(300, 550)); // closer together (Luca, 2026-11-16)
    if (document.hidden || reduced.matches || root.classList.contains('is-docked')) return;
    const from = layer.getBoundingClientRect();
    // the run ends at the window's edge: that is where the note has faded to nothing
    const dx = innerWidth - from.right - 6;
    if (dx < 40 || from.bottom < 0 || from.top > innerHeight) return;

    const note = document.createElement('span');
    note.className = 'set-player__notes-note';
    const size = rand(14, 22);
    note.style.width = note.style.height = `${size}px`;
    note.style.color = nextColour();
    note.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor">${pick(SHAPES)}</svg>`;
    layer.append(note);

    const rise = rand(60, 150);
    const tilt = rand(-18, 18);
    const sway = rand(-14, 14);
    note.animate(
      [
        { transform: `translate(-${size}px, ${size * 0.4}px) scale(.5) rotate(0deg)`, opacity: 0 },
        {
          offset: 0.12,
          transform: `translate(${dx * 0.1}px, -${rise * 0.15}px) scale(1) rotate(${tilt * 0.3}deg)`,
          opacity: 1,
        },
        {
          offset: 0.55,
          transform: `translate(${dx * 0.55}px, ${-(rise * 0.6 + sway)}px) rotate(${tilt}deg)`,
          opacity: 0.55,
        },
        { transform: `translate(${dx}px, -${rise}px) rotate(${tilt * 1.4}deg)`, opacity: 0 },
      ],
      // slower (Luca, 2026-11-16): the same run in about 1.5x the time
      { duration: rand(4200, 5800), easing: 'cubic-bezier(.25,.6,.4,1)' },
    ).onfinish = () => note.remove();
  };

  return {
    start() {
      if (!timer) spawn();
    },
    stop() {
      clearTimeout(timer);
      timer = 0;
    },
  };
}
