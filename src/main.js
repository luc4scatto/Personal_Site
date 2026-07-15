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

// skill pill click → info card (copy lives in src/content.js)
const SKILL_DESCRIPTIONS = content.skills;

const skillPills = document.querySelectorAll('.skills-grid li[data-skill]');
if (skillPills.length) {
  const backdrop = document.createElement('div');
  backdrop.className = 'skill-panel-backdrop';
  const panel = document.createElement('div');
  panel.className = 'skill-panel';
  panel.innerHTML =
    '<button class="skill-panel__close" aria-label="Close">&times;</button>' +
    '<h3 class="skill-panel__title"></h3>' +
    '<p class="skill-panel__text"></p>';
  document.body.append(backdrop, panel);
  const title = panel.querySelector('.skill-panel__title');
  const text = panel.querySelector('.skill-panel__text');

  let activeSkillEl = null;

  // keep the panel clear of the grid: center it in the leftover space between the
  // grid's actual right edge and the viewport edge, so it never lands on top of a pill
  const positionSkillPanel = () => {
    if (window.innerWidth <= 700) {
      panel.style.left = '';
      panel.style.right = '';
      return;
    }
    const grid = document.querySelector('.skills-grid');
    if (!grid) return;
    const gridRect = grid.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || 360;
    const available = window.innerWidth - gridRect.right;
    const maxLeft = window.innerWidth - panelWidth - 16;
    const left = Math.min(gridRect.right + (available - panelWidth) / 2, maxLeft);
    panel.style.left = `${Math.max(left, 16)}px`;
    panel.style.right = 'auto';
  };

  const closeSkillPanel = () => {
    activeSkillEl?.classList.remove('is-active');
    activeSkillEl = null;
    backdrop.classList.remove('is-open');
    panel.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openSkillPanel = (li) => {
    const wasOpen = !!activeSkillEl;
    activeSkillEl?.classList.remove('is-active');
    activeSkillEl = li;
    li.classList.add('is-active');
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!d) return;
    const applyContent = () => {
      title.textContent = d.title;
      text.textContent = d.text;
      panel.style.setProperty('--skill-accent', d.color);
    };
    if (wasOpen) {
      // switching straight from one pill to another — cross-fade the content
      // instead of an instant swap (the panel itself stays put, only the text fades)
      panel.classList.add('is-switching');
      setTimeout(() => {
        applyContent();
        panel.classList.remove('is-switching');
      }, 150);
    } else {
      applyContent();
    }
    positionSkillPanel();
    backdrop.classList.add('is-open');
    panel.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  skillPills.forEach((li) => {
    li.addEventListener('click', () => {
      if (activeSkillEl === li) closeSkillPanel();
      else openSkillPanel(li);
    });
  });

  window.addEventListener('resize', () => {
    if (activeSkillEl) positionSkillPanel();
  });

  panel.querySelector('.skill-panel__close').addEventListener('click', closeSkillPanel);
  // click outside the panel/pills closes it — pill clicks are excluded here so switching
  // straight to another pill re-targets in one click instead of closing first
  window.addEventListener('click', (e) => {
    if (!activeSkillEl) return;
    if (panel.contains(e.target) || e.target.closest('li[data-skill]')) return;
    closeSkillPanel();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeSkillEl) closeSkillPanel();
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
