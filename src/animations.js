import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // hero title: masked lines sliding up (home page only). Explicit .hero-line masks
  // keep the line spacing fixed — no SplitText reflow that shifts the two lines apart.
  const heroLines = document.querySelectorAll('.hero h1 .hero-line-inner');
  if (heroLines.length) {
    // hide immediately, then build the word slot BEFORE revealing so the accent's
    // inline-block conversion doesn't reflow the line mid-animation (that caused a jump)
    gsap.set(heroLines, { yPercent: 110 });
    const run = () => {
      const startWordLoop = initWordCycler(document.querySelector('.hero h1 .accent'));
      gsap.to(heroLines, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.15,
        onComplete: startWordLoop,
      });
    };
    // wait for the display font so the slot width is measured correctly
    (document.fonts?.ready ?? Promise.resolve()).then(run);
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

// builds the accent-word slot and returns a start() that begins the looping cascade
function initWordCycler(el) {
  if (!el) return () => {};
  const WORDS = ['3D', '2D', 'AI'];
  const HOLD = 1.8; // seconds a word stays before the next slides in
  const DURATION = 0.5;

  const height = Math.ceil(el.getBoundingClientRect().height);

  // measure each word's rendered width (inherits the h1 font + letter-spacing) so the
  // slot can resize per word and the trailing period always hugs it
  const measure = document.createElement('span');
  measure.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
  el.parentElement.appendChild(measure);
  const widths = WORDS.map((w) => {
    measure.textContent = w;
    return Math.ceil(measure.getBoundingClientRect().width);
  });
  measure.remove();

  el.textContent = '';
  el.style.display = 'inline-block';
  el.style.position = 'relative';
  el.style.width = `${widths[0]}px`;
  el.style.height = `${height}px`;
  el.style.overflow = 'hidden';
  el.style.verticalAlign = 'bottom';

  const makeWord = (text) => {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.position = 'absolute';
    span.style.left = '0';
    span.style.bottom = '0';
    span.style.whiteSpace = 'nowrap';
    el.appendChild(span);
    return span;
  };

  let index = 0;
  let current = makeWord(WORDS[0]);

  const next = () => {
    index = (index + 1) % WORDS.length;
    const incoming = makeWord(WORDS[index]);
    // enter from above, exit downward (top → bottom cascade)
    gsap.set(incoming, { yPercent: -100, opacity: 0 });
    const outgoing = current;
    gsap.to(outgoing, {
      yPercent: 100,
      opacity: 0,
      duration: DURATION,
      ease: 'power3.inOut',
      onComplete: () => outgoing.remove(),
    });
    gsap.to(incoming, { yPercent: 0, opacity: 1, duration: DURATION, ease: 'power3.out' });
    // resize the slot to the new word so the period stays tight and slides smoothly
    gsap.to(el, { width: widths[index], duration: DURATION, ease: 'power3.inOut' });
    current = incoming;
    gsap.delayedCall(HOLD, next);
  };

  return () => gsap.delayedCall(HOLD, next);
}
