import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // hero title: masked lines sliding up (home page only)
  if (document.querySelector('.hero h1')) {
    const split = SplitText.create('.hero h1', { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12,
      delay: 0.15,
    });
  }

  // kicker / tagline / cta follow
  gsap.from('[data-stagger]', {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.12,
    delay: 0.45,
  });

  // section titles: clip reveal from the left
  gsap.utils.toArray('main h2').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 100% 0 0)', x: -30 },
      {
        clipPath: 'inset(0 0% 0 0)',
        x: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      }
    );
  });

  // reveal on scroll for everything else
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.tagName === 'H2') return;
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // scroll progress bar under the nav
  gsap.to('.scroll-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  // magnetic buttons
  document.querySelectorAll('.btn').forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    btn.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
