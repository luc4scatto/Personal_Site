import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* In-place page swaps, only while a DJ set is playing.
 *
 * The site is an MPA and stays one: every link is an ordinary page load, which is the path
 * every visitor who never presses play takes. Once a set has started, a full load would kill
 * the SoundCloud iframes and the music with them, so from then on Swup fetches the next page
 * and swaps the parts that differ (the page, the nav links, the logo link) under a header and
 * a <body> that stay put - the iframes live on <body>, and the player docks in the header
 * (src/setPlayer.js, liftPlayer()).
 *
 * `leave` tears the outgoing page down (main.js aborts its AbortController, which every
 * listener, loop and WebGL context of that page is tied to) and returns the next controller;
 * `enter` runs main.js's page setup against the new markup.
 */
export function initRouter(leave, enter) {
  const nav = document.querySelector('.nav');
  // Same module instance main.js loads for the drawer: the router only asks it questions,
  // and on a page with no player it answers "not playing" until one exists.
  let player = null;
  import('./setPlayer.js').then((m) => (player = m));

  const swup = new Swup({
    containers: ['#main-content', '.nav nav', '.nav-logo'],
    // downloads (the CV) and new tabs are never page visits
    linkSelector: 'a[href]:not([download]):not([target])',
    // A short fade, not for show: the new page is swapped in and set up (reveals hidden,
    // drawer pending, scroll placed) while #main-content is invisible, so none of its
    // half-initialised first frames are ever seen. The transition itself is in sections.css.
    animationSelector: '#main-content',
    ignoreVisit: (url, { el } = {}) => !player?.playerActive() || !!el?.closest('[data-no-swup]'),
    plugins: [new SwupA11yPlugin()],
  });

  let next = null;
  swup.hooks.before('content:replace', () => {
    // out of the page before the page goes
    player?.liftPlayer(nav);
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.globalTimeline.clear();
    next = leave();
  });

  swup.hooks.on('content:replace', (visit) => {
    // page-level styling hangs off <body>'s class (cb-page, vt-page, ...)
    document.body.className = visit.to.document?.body.className ?? '';
    // index.html decides this in an inline <head> script before first paint; a swap into the
    // home page has no such script to run, so it is repeated here (same test, same 701px)
    if (
      document.querySelector('#skill-drawer') &&
      matchMedia('(min-width: 701px)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      document.documentElement.classList.add('drawer-pending');
    enter(next);
  });

  // Scrolling to the anchor (index.html#contact from a project page) is ours, not Swup's: the
  // home page settles its height after the swap (the drawer goes live, ScrollTrigger
  // re-measures), so a scroll taken at swap time lands short. It is taken once now and once
  // more on the first ScrollTrigger refresh, which is the moment that layout lands.
  swup.hooks.replace('content:scroll', () => {
    const target = location.hash && document.querySelector(location.hash);
    if (!target) {
      // instant: html has scroll-behavior: smooth, and a bare scrollTo(0, 0) would scroll the
      // whole way up from wherever the last page was, in full view of the new one
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    const go = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
    requestAnimationFrame(go);
    const once = () => {
      ScrollTrigger.removeEventListener('refresh', once);
      go();
    };
    ScrollTrigger.addEventListener('refresh', once);
    setTimeout(() => ScrollTrigger.removeEventListener('refresh', once), 3000);
  });

  // GA4 only counts real page loads by itself
  swup.hooks.on('page:view', () => {
    window.gtag?.('event', 'page_view', {
      page_location: location.href,
      page_title: document.title,
    });
  });
}
