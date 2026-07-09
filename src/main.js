import './styles/base.css';
import './styles/sections.css';
import { initAnimations } from './animations.js';

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

// skill pill click → info card (placeholder copy, real text TBD)
const SKILL_DESCRIPTIONS = {
  blender: { title: 'Blender', text: 'Placeholder — what I actually do with Blender goes here.' },
  'autodesk-maya': { title: 'Autodesk Maya', text: 'Placeholder — what I actually do with Maya goes here.' },
  'adobe-substance-3d': { title: 'Adobe Substance 3D', text: 'Placeholder — what I actually do with Substance 3D goes here.' },
  'nvidia-omniverse': { title: 'NVIDIA Omniverse', text: 'Placeholder — what I actually do with Omniverse goes here.' },
  'unreal-engine': { title: 'Unreal Engine', text: 'Placeholder — what I actually do with Unreal Engine goes here.' },
  touchdesigner: { title: 'TouchDesigner', text: 'Placeholder — what I actually do with TouchDesigner goes here.' },
  'after-effects': { title: 'After Effects', text: 'Placeholder — what I actually do with After Effects goes here.' },
  'premiere-pro': { title: 'Premiere Pro', text: 'Placeholder — what I actually do with Premiere Pro goes here.' },
  'davinci-resolve': { title: 'DaVinci Resolve', text: 'Placeholder — what I actually do with DaVinci Resolve goes here.' },
  photoshop: { title: 'Photoshop', text: 'Placeholder — what I actually do with Photoshop goes here.' },
  illustrator: { title: 'Illustrator', text: 'Placeholder — what I actually do with Illustrator goes here.' },
  python: { title: 'Python', text: 'Placeholder — what I actually do with Python goes here.' },
};

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

  const closeSkillPanel = () => {
    activeSkillEl = null;
    backdrop.classList.remove('is-open');
    panel.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openSkillPanel = (li) => {
    activeSkillEl = li;
    const d = SKILL_DESCRIPTIONS[li.dataset.skill];
    if (!d) return;
    title.textContent = d.title;
    text.textContent = d.text;
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
  import('./hero3d.js').then((m) => m.initHero3D(heroCanvas));
}
