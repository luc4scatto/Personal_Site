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
