import gsap from 'gsap';
import './styles/base.css';
import './styles/sections.css';
import { initAnimations } from './animations.js';
import { content } from './content.js';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// fill every [data-copy="a.b.c"] element from content.js — runs before any animation
// so GSAP only ever sees the final text, never a swap mid-reveal
document.querySelectorAll('[data-copy]').forEach((el) => {
  const value = el.dataset.copy.split('.').reduce((o, k) => o?.[k], content);
  if (typeof value !== 'string') return;
  el.innerHTML = value.split('\n').map(escapeHtml).join('<br>');
});
const emailLink = document.querySelector('[data-copy="contact.email"]');
if (emailLink) emailLink.href = `mailto:${content.contact.email}`;

// marquee band — duplicate the word list once for the seamless CSS loop
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack) {
  const words = content.marquee.words;
  marqueeTrack.innerHTML = [...words, ...words].map((w) => `<span>${escapeHtml(w)}</span>`).join('');
}

// highlight the nav link of the section currently in view
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav nav a');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) =>
        a.classList.toggle('active', a.hash === `#${entry.target.id}`)
      );
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((s) => observer.observe(s));

initAnimations();

// card spotlight: radial glow following the pointer
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// skills wall: every tool is a tile carrying its own brand mark and color. Picking one
// blurs the rest of the wall and unfolds its card in place, inside the category it belongs
// to — the same "focus one thing, let the rest recede" grammar as the 3D hero cloud.
// Copy lives in src/content.js.
const SKILL_DESCRIPTIONS = content.skills;

const skillsSection = document.querySelector('.skills');
const skillTiles = document.querySelectorAll('.skills-grid li[data-skill]');
if (skillsSection && skillTiles.length) {
  // the invitation, in the same place the hero puts its own "click on an object" line
  const hint = document.createElement('p');
  hint.className = 'skills-hint';
  hint.textContent = content.skillsHint?.text ?? 'Click any tool to see what I actually do with it.';
  skillsSection.querySelector('h2')?.after(hint);

  const card = document.createElement('div');
  card.className = 'skill-card';
  card.innerHTML =
    '<div class="skill-card__inner">' +
    // drawn, not a unicode glyph: one stroke weight, one line cap, scales with the button
    '<button class="skill-card__close" aria-label="Close">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg></button>' +
    '<h3 class="skill-card__title"></h3>' +
    '<p class="skill-card__badge"></p>' +
    '<p class="skill-card__text"></p>' +
    '<ul class="skill-card__bullets"></ul>' +
    '</div>';
  const inner = card.querySelector('.skill-card__inner');
  const title = card.querySelector('.skill-card__title');
  const badge = card.querySelector('.skill-card__badge');
  const text = card.querySelector('.skill-card__text');
  const bullets = card.querySelector('.skill-card__bullets');

  const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // bullets entries are either a plain string or { label, subs: [] } for a nested group
  // (e.g. Substance Painter / Designer under the Substance 3D card)
  const renderBullets = (items) => {
    bullets.innerHTML = '';
    bullets.hidden = !items || !items.length;
    if (!items) return;
    for (const item of items) {
      const li = document.createElement('li');
      if (typeof item === 'string') {
        li.textContent = item;
      } else {
        li.textContent = item.label;
        const sub = document.createElement('ul');
        for (const s of item.subs) {
          const subLi = document.createElement('li');
          subLi.textContent = s;
          sub.append(subLi);
        }
        li.append(sub);
      }
      bullets.append(li);
    }
  };

  const applyContent = (li) => {
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!d) return false;
    title.textContent = d.title;
    badge.textContent = d.selfTaught ? 'Self-taught' : '';
    badge.hidden = !d.selfTaught;
    text.textContent = d.text;
    renderBullets(d.bullets);
    card.style.setProperty('--brand', d.color);
    return true;
  };

  let activeEl = null;

  const closeCard = (instant) => {
    if (!activeEl) return;
    activeEl.classList.remove('is-active');
    activeEl = null;
    skillsSection.classList.remove('is-focused');
    card.closest('.skill-group')?.classList.remove('has-open-card');
    gsap.killTweensOf(card);
    if (instant || isReduced()) {
      card.remove();
      return;
    }
    gsap.to(card, {
      height: 0, opacity: 0, duration: 0.32, ease: 'power2.in',
      onComplete: () => card.remove(),
    });
  };

  const openCard = (li) => {
    const grid = li.closest('.skills-grid');
    if (!applyContent(li) || !grid) return;
    const movingRow = card.parentElement !== grid;

    activeEl?.classList.remove('is-active');
    activeEl = li;
    li.classList.add('is-active');
    skillsSection.classList.add('is-focused');
    document.querySelectorAll('.has-open-card').forEach((g) => g.classList.remove('has-open-card'));
    li.closest('.skill-group')?.classList.add('has-open-card');

    // the card is a grid item spanning the row, appended to the category that owns the
    // pick — so it always unfolds under the tool, never somewhere else on the wall
    gsap.killTweensOf(card);
    gsap.killTweensOf(inner);
    grid.append(card);
    if (isReduced()) {
      gsap.set(card, { height: 'auto', opacity: 1 });
      gsap.set(inner, { y: 0, opacity: 1 });
      return;
    }
    // switching within a row is a content swap, not a second unfold: only the height
    // re-measures. Landing in a new row unfolds from nothing.
    gsap.fromTo(
      card,
      { height: movingRow ? 0 : card.offsetHeight, opacity: movingRow ? 0 : 1 },
      { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out' }
    );
    gsap.fromTo(
      inner,
      { y: movingRow ? 18 : 8, opacity: movingRow ? 0 : 0.4 },
      { y: 0, opacity: 1, duration: movingRow ? 0.5 : 0.32, delay: movingRow ? 0.08 : 0, ease: 'power3.out' }
    );
  };

  skillTiles.forEach((li) => {
    // the tiles are <li>, so keyboard access has to be granted explicitly
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    // each tile carries its own brand color; CSS washes the tile and the open card with it
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (d) li.style.setProperty('--brand', d.color);

    const toggle = () => (activeEl === li ? closeCard() : openCard(li));
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Space would scroll the page
      toggle();
    });
  });

  card.querySelector('.skill-card__close').addEventListener('click', () => {
    activeEl?.focus(); // send focus back to the tile that opened the card
    closeCard();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeEl) {
      activeEl.focus();
      closeCard();
    }
  });
  // clicking away from the wall closes it; the card and the tiles handle their own clicks
  window.addEventListener('click', (e) => {
    if (!activeEl || card.contains(e.target) || e.target.closest('.skills-grid li')) return;
    closeCard();
  });
}

// floating 3D hobby icons — lazy, respects reduced motion
const heroCanvas = document.querySelector('#hero-canvas');
if (heroCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  import('./hero3d.js').then((m) => {
    m.initHero3D(heroCanvas);
    // the "click the objects" hint only makes sense once the 3D scene exists
    const hint = document.querySelector('.hero-hint');
    if (hint) hint.hidden = false;
  });
}
