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
// colors extracted from each icon's actual fill in public/icons/ (not guessed from memory)
const SKILL_DESCRIPTIONS = {
  blender: { title: 'Blender', text: 'Placeholder — what I actually do with Blender goes here.', color: '#E87D0D' },
  'autodesk-maya': { title: 'Autodesk Maya', text: 'Placeholder — what I actually do with Maya goes here.', color: '#37A5CC' },
  'adobe-substance-3d': { title: 'Adobe Substance 3D', text: 'Placeholder — what I actually do with Substance 3D goes here.', color: '#E03028' },
  'nvidia-omniverse': { title: 'NVIDIA Omniverse', text: 'Placeholder — what I actually do with Omniverse goes here.', color: '#76B900' },
  'unreal-engine': { title: 'Unreal Engine', text: 'Placeholder — what I actually do with Unreal Engine goes here.', color: '#FFFFFF' },
  touchdesigner: { title: 'TouchDesigner', text: 'Placeholder — what I actually do with TouchDesigner goes here.', color: '#707D51' },
  'after-effects': { title: 'After Effects', text: 'Placeholder — what I actually do with After Effects goes here.', color: '#9999FF' },
  'premiere-pro': { title: 'Premiere Pro', text: 'Placeholder — what I actually do with Premiere Pro goes here.', color: '#9999FF' },
  'davinci-resolve': { title: 'DaVinci Resolve', text: 'Placeholder — what I actually do with DaVinci Resolve goes here.', color: '#F0506B' },
  photoshop: { title: 'Photoshop', text: 'Placeholder — what I actually do with Photoshop goes here.', color: '#31A8FF' },
  illustrator: { title: 'Illustrator', text: 'Placeholder — what I actually do with Illustrator goes here.', color: '#FF9A00' },
  python: { title: 'Python', text: 'Placeholder — what I actually do with Python goes here.', color: '#3776AB' },
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
  import('./hero3d.js').then((m) => {
    m.initHero3D(heroCanvas);
    // the "click the objects" hint only makes sense once the 3D scene exists
    const hint = document.querySelector('.hero-hint');
    if (hint) hint.hidden = false;
  });
}
