import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { content } from './content.js';

gsap.registerPlugin(ScrollTrigger);

// The skill drawer's chunk loads async and, once live, hides the flat `.drawer__strip`
// grid in favour of a much shorter `aspect-ratio` box (src/styles/sections.css). Every
// ScrollTrigger below it — the h2 clip reveals and [data-reveal] cards on Projects/Contact
// included — was measured against the taller flat-grid layout that was on the page when
// initAnimations() ran, moments before that swap. GSAP never re-measures on its own for a
// class-driven height change (only on window resize or its own load-event refresh, and the
// drawer's chunk often isn't done by then), so those triggers keep firing at their old,
// too-far-down pixel offsets — the section behind them scrolls past empty until the stale
// threshold is finally crossed. main.js calls this the moment `.is-live` lands.
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}

// One gsap.matchMedia() per page: everything below is built only while the visitor has not
// asked for reduced motion, and is reverted (tweens, ScrollTriggers, listeners, the word loop)
// when they do ask, or when the page is torn down (`signal`, main.js). Turning reduced motion
// back off rebuilds it.
export function initAnimations(signal) {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', (context) => animate(context));
  signal?.addEventListener('abort', () => mm.revert(), { once: true });
}

function animate(context) {
  // pointer listeners go on elements that outlive a run (the cookie banner's button sits
  // outside the swapped page), so each run owns an AbortController instead of trusting the
  // revert to remove them
  const listeners = new AbortController();
  const on = { signal: listeners.signal };
  let cycler = null;

  // hero title: masked lines sliding up (home page only). Explicit .hero-line masks
  // keep the line spacing fixed — no SplitText reflow that shifts the two lines apart.
  const heroLines = document.querySelectorAll('.hero h1 .hero-line-inner');
  if (heroLines.length) {
    // hide immediately, then build the word slot BEFORE revealing so the accent's
    // inline-block conversion doesn't reflow the line mid-animation (that caused a jump)
    gsap.set(heroLines, { yPercent: 110 });
    const run = () => {
      // the word in the headline changes every 1.8s: a screen reader gets the sentence once, as it is on load
      const h1 = document.querySelector('.hero h1');
      h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
      cycler = initWordCycler(document.querySelector('.hero h1 .accent'));
      gsap.to(heroLines, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.08,
        delay: 0.15,
        onComplete: () => {
          // Same cure as the h2 reveal below: GSAP leaves its transform inline, which leaves
          // the compositing layer behind it. On iOS, under the memory pressure of two WebGL
          // contexts, that layer gets rasterized at reduced scale and re-upscaled - the first
          // hero line came out a blurred ghost while the second, shorter one stayed sharp.
          gsap.set(heroLines, { clearProps: 'transform' });
          cycler.start();
        },
      });
    };
    // wait for the display font so the slot width is measured correctly. context.add: a
    // callback that runs after the matchMedia handler returned is not in its context unless
    // it says so, and its tweens would survive the revert
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!listeners.signal.aborted) context.add(run);
    });
  }

  // kicker / tagline / cta follow. On the home they wait for the masked title lines; a project
  // page has no such lines, and there its h1 is one of these: waiting 0.45s left the page's
  // largest text (its LCP) blank for most of a second
  gsap.from('[data-stagger]', {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.08,
    delay: heroLines.length ? 0.45 : 0.05,
    // Same cure as the h1 and h2 reveals: GSAP leaves `translate(0px, 0px)` inline, which
    // keeps the compositing layer behind it (a ghost on Firefox, a downscaled layer on iOS).
    // On a project page the h1 is one of these.
    onComplete: () => gsap.set('[data-stagger]', { clearProps: 'transform' }),
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
        // Firefox keeps the transform/clip-path compositing layer from the tween's start
        // state painted behind the finished text - a blurred ghost of the heading, offset
        // by the -30px it started at. Chrome drops that layer on its own; Firefox needs
        // the inline props gone before it will.
        onComplete: () => gsap.set(el, { clearProps: 'clipPath,transform' }),
      },
    );
  });

  // reveal on scroll for everything else. Short and early on purpose: a block that waits
  // until 85% and then fades for 0.8s is a blank screen on a fast scroll. A block taller than
  // most of the screen (Homelab's diagram, a Pipeline tool's text) is the content itself,
  // not a card arriving, so it is never hidden at all.
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.tagName === 'H2') return;
    if (el.offsetHeight > window.innerHeight * 0.6) return;
    gsap.from(el, {
      y: 24,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%' },
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
    btn.addEventListener(
      'pointermove',
      (e) => {
        // mouse only: on touch this fires during a tap that slides even slightly, and the
        // button crawls out from under the finger that is pressing it
        if (e.pointerType !== 'mouse') return;
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      },
      on,
    );
    btn.addEventListener(
      'pointerleave',
      () => {
        xTo(0);
        yTo(0);
      },
      on,
    );
  });

  // project cards tilt toward the pointer. Rotation, not x/y: the [data-reveal] tween
  // above owns the card's y
  document.querySelectorAll('.card').forEach((card) => {
    gsap.set(card, { transformPerspective: 800 });
    const rxTo = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ryTo = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
    card.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return; // same reason as the magnetic buttons
        const r = card.getBoundingClientRect();
        ryTo(((e.clientX - r.left) / r.width - 0.5) * 12);
        rxTo(-((e.clientY - r.top) / r.height - 0.5) * 12);
      },
      on,
    );
    card.addEventListener(
      'pointerleave',
      () => {
        rxTo(0);
        ryTo(0);
      },
      on,
    );
  });

  return () => {
    listeners.abort();
    cycler?.stop();
  };
}

// builds the accent-word slot and returns { start, stop }: start() begins the looping cascade,
// stop() ends it (the loop reschedules itself, so reverting the context alone would not)
function initWordCycler(el) {
  if (!el) return { start() {}, stop() {} };
  const WORDS = content.hero.words;
  const HOLD = 1.8; // seconds a word stays before the next slides in
  const DURATION = 0.5;

  // what stop() puts back: the word as the HTML had it, before the slot was built
  const original = { text: el.textContent, style: el.getAttribute('style') };
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
  // Cut to the longest word once, then never touched again. Tweening the slot's width relaid
  // the whole headline out every frame, half a second in every 1.8, for the life of the page:
  // the only perpetual non-GPU animation on the site. What moves now is the trailing period,
  // on a transform, so the word still reads as tight against it.
  const maxWidth = Math.max(...widths);
  // A wide heavy face with tight tracking draws its last glyph past its advance width, so a
  // slot cut to the advance clipped the D of "3D". The box gets that ink room back on the
  // right and gives it up again in a negative margin, so nothing after it moves.
  const inkRoom = Math.ceil(parseFloat(getComputedStyle(el).fontSize) * 0.12);
  el.style.width = `${maxWidth + inkRoom}px`;
  el.style.marginRight = `${-inkRoom}px`;
  el.style.height = `${height}px`;
  el.style.overflow = 'hidden';
  el.style.verticalAlign = 'bottom';

  // The "." lives as a bare text node right after the accent span, and a text node cannot
  // carry a transform, so it gets an element of its own.
  const period = document.createElement('span');
  period.style.display = 'inline-block';
  const tail = el.nextSibling;
  if (tail?.nodeType === Node.TEXT_NODE && tail.textContent.trim()) {
    period.textContent = tail.textContent.trim();
    tail.replaceWith(period);
    gsap.set(period, { x: widths[0] - maxWidth });
  }

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
  let timer = null;

  const next = () => {
    index = (index + 1) % WORDS.length;
    const incoming = makeWord(WORDS[index]);
    // enter from above, exit downward (top → bottom cascade)
    gsap.set(incoming, { yPercent: -100, opacity: 0 });
    const outgoing = current;
    // hidden immediately, not after the tween: assistive tech otherwise announces both
    // words for the ~0.5s both spans coexist in the DOM mid-crossfade
    outgoing.setAttribute('aria-hidden', 'true');
    gsap.to(outgoing, {
      yPercent: 100,
      opacity: 0,
      duration: DURATION,
      // the pair moves as one, so the word leaving takes the same ease-out as the one
      // arriving; power3.inOut held it back through the first half of its own exit
      ease: 'power3.out',
      onComplete: () => outgoing.remove(),
    });
    gsap.to(incoming, { yPercent: 0, opacity: 1, duration: DURATION, ease: 'power3.out' });
    // the period slides over to hug the new word - a transform, so no layout runs for it
    gsap.to(period, { x: widths[index] - maxWidth, duration: DURATION, ease: 'power3.out' });
    current = incoming;
    timer = gsap.delayedCall(HOLD, next);
  };

  return {
    start: () => (timer = gsap.delayedCall(HOLD, next)),
    // Reduced motion switched on mid-page: the loop ends, and the slot goes back to the plain
    // word and a plain ".". A half-run crossfade would otherwise stay on screen, both words
    // stacked, and the period would sit at the far end of a slot cut for the longest word.
    stop: () => {
      timer?.kill();
      el.textContent = original.text;
      if (original.style === null) el.removeAttribute('style');
      else el.setAttribute('style', original.style);
      if (period.isConnected) period.replaceWith(document.createTextNode(period.textContent));
    },
  };
}
