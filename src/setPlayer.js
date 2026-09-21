import { content } from './content.js';

/* The DJ set player: a record and a waveform, filed in the corner the open drawer leaves
 * free. The visible UI is entirely ours - no SoundCloud chrome, no branding, no widget
 * waveform - but the audio itself streams through a hidden SoundCloud iframe, not a file
 * this site hosts. That split (their playback, our interface) is what the Widget API is
 * for: it needs no API key/registration (unlike the full REST API, which now sits behind a
 * paid Artist Pro plan), and it means the site never serves a copyrighted mp3 from its own
 * domain. See CLAUDE.md's "The DJ set player" for why that matters.
 *
 * Three things here are load-bearing and look like they could be simplified:
 *
 * - **The waveform comes from a committed JSON, never from the audio.** tools/peaks.js
 *   writes 1000 RMS buckets per set (~5KB) from Luca's own local copy of the file, before
 *   (or after) it's uploaded to SoundCloud - this file takes the max over a slice of them
 *   per bar, so one file serves every width and both pixel ratios, decoupled from wherever
 *   the audio happens to stream from.
 * - **The engine is a plain object shaped like `<audio>`** (`currentTime`, `duration`,
 *   `paused`, `play()`, `pause()`), not the widget's own async API directly. Everything
 *   below this point - waveform, scrubbing, keyboard, progress - was written against a
 *   native `<audio>` element and reads unchanged now that the element underneath is a
 *   SoundCloud iframe; only the block that builds `audio` and binds its events changed.
 * - **Seeking commits on pointerup, not on pointermove.** Firing `seekTo()` on every drag
 *   frame would flood the widget with commands for no visible gain. The drag paints a ghost
 *   playhead locally and the release is the only thing that moves the actual playback.
 *
 * The iframe lives on document.body, not inside the panel, so closing a skill card or
 * shutting the drawer cannot touch it. The site is an MPA, so navigation stops it for free.
 */

// px of pitch per bar: a 2px bar and a 1px gap. A one-device-pixel bar is invisible at 2x,
// which is why the bar count comes from CSS pixels and not from the canvas's own width.
const BAR = 3;
// Bars never quite reach the rails: a full-height bar in a short panel reads as clipping.
const WAVE_PAD = 0.88;
// The stored values are honest RMS, which for an hour of mastered techno sits high and flat.
// The curve is applied here, where it can be tuned without regenerating a single file.
const WAVE_CURVE = 0.7;
const SKIP = 15; // seconds per arrow key
const PAGE = 60; // seconds per page key

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function clock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function spoken(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} minute${m === 1 ? '' : 's'} ${s} second${s === 1 ? '' : 's'}`;
}

/** Fisher-Yates on a copy: the order is drawn once per page load, so two visitors - and the
 *  same visitor tomorrow - don't open the drawer to the same set. */
function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const svg = (paths, cls) =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const PLAY_GLYPH = '<path d="M9 6.5 18 12l-9 5.5z" fill="currentColor" stroke="none" />';
const PAUSE_GLYPH = '<path d="M9.5 7v10M14.5 7v10" />';
const REWIND_GLYPH =
  '<path d="M12 6.5 5 12l7 5.5V6.5Z" fill="currentColor" stroke="none" /><path d="M19 6.5 12 12l7 5.5V6.5Z" fill="currentColor" stroke="none" />';
const FORWARD_GLYPH =
  '<path d="M12 6.5 19 12l-7 5.5V6.5Z" fill="currentColor" stroke="none" /><path d="M5 6.5 12 12l-7 5.5V6.5Z" fill="currentColor" stroke="none" />';

// The chrome SoundCloud itself documents switching off for a custom player (their own
// "Custom Players" post) - not a hack, the sanctioned way to run their audio behind a UI
// that isn't theirs. We draw our own waveform and vinyl; none of this would ever be seen.
const WIDGET_CHROME = {
  show_artwork: false,
  show_playcount: false,
  show_user: false,
  sharing: false,
  buying: false,
  download: false,
};
const ENGINE_ID = 'set-player-engine';
// How long to wait for a PLAY event after asking for one before admitting it isn't coming.
// Long enough to cover a slow first buffer, short enough that a blocked start doesn't read as
// a hang. iOS can refuse playback for a reload it doesn't consider user-initiated, and that
// refusal is silent: no ERROR, no PLAY, nothing to react to but the absence.
const PLAY_WAIT = 3000;

let widgetScriptPromise = null;
function loadWidgetScript() {
  if (window.SC?.Widget) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;
  widgetScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://w.soundcloud.com/player/api.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('soundcloud widget script failed to load'));
    document.head.appendChild(s);
  });
  return widgetScriptPromise;
}

export function initSetPlayer(mount) {
  const sets = (content.djSets ?? []).filter((s) => s?.track);
  // No sets, no panel. An empty player is worse than none, and this is what keeps the
  // feature invisible on the live site until the real URLs are pasted into content.js.
  if (!mount || !sets.length) return () => {};

  const order = shuffled(sets);
  let index = 0;
  let current = order[0];

  // ---- DOM ---------------------------------------------------------------------------
  const el = document.createElement('div');
  el.className = 'set-player';
  // The invitation is inside the same root as the panel, so the one reveal rule carries both
  // and the line can never stand beside a player that isn't there.
  el.innerHTML = `
    ${content.djSetsInvite ? `<p class="set-player__invite">${content.djSetsInvite}</p>` : ''}
    <div class="set-player__panel">
    <button class="set-player__disc" type="button">
      <span class="set-player__vinyl" aria-hidden="true">
        <span class="set-player__label"></span>
      </span>
      ${svg(PLAY_GLYPH, 'set-player__glyph')}
    </button>
    <div class="set-player__body">
      <p class="set-player__title"></p>
      <p class="set-player__note" hidden></p>
      <div class="set-player__wave" role="slider" tabindex="0" aria-label="Seek within the set" aria-valuemin="0">
        <canvas class="set-player__canvas set-player__canvas--rest"></canvas>
        <canvas class="set-player__canvas set-player__canvas--played"></canvas>
        <span class="set-player__head"></span>
      </div>
      <p class="set-player__foot">
        <span class="set-player__time">0:00</span>
        <span class="set-player__total"></span>
        ${
          order.length > 1
            ? `<button class="set-player__next" type="button" aria-label="Next set">${svg('<path d="M7 6.5 14 12l-7 5.5z" fill="currentColor" stroke="none" /><path d="M17 6.5v11" />', 'set-player__next-glyph')}</button>`
            : ''
        }
      </p>
      <div class="set-player__controls">
        <button class="set-player__skip" data-dir="-1" type="button" aria-label="Back ${SKIP} seconds">${svg(REWIND_GLYPH, 'set-player__skip-glyph')}</button>
        <button class="set-player__mini" type="button" aria-label="Play">${svg(PLAY_GLYPH, 'set-player__mini-glyph')}</button>
        <button class="set-player__skip" data-dir="1" type="button" aria-label="Forward ${SKIP} seconds">${svg(FORWARD_GLYPH, 'set-player__skip-glyph')}</button>
        <input class="set-player__volume" type="range" min="0" max="100" value="100" aria-label="Volume" />
      </div>
    </div>
    </div>`;

  const disc = el.querySelector('.set-player__disc');
  const glyph = el.querySelector('.set-player__glyph');
  const miniBtn = el.querySelector('.set-player__mini');
  const miniGlyph = el.querySelector('.set-player__mini-glyph');
  const labelEl = el.querySelector('.set-player__label');
  const titleEl = el.querySelector('.set-player__title');
  // carries nothing at rest: a set is a title and a waveform. It only ever speaks up to say
  // the audio failed to load.
  const noteEl = el.querySelector('.set-player__note');
  const wave = el.querySelector('.set-player__wave');
  const restCanvas = el.querySelector('.set-player__canvas--rest');
  const playedCanvas = el.querySelector('.set-player__canvas--played');
  const timeEl = el.querySelector('.set-player__time');
  const totalEl = el.querySelector('.set-player__total');
  const nextBtn = el.querySelector('.set-player__next');
  const volumeInput = el.querySelector('.set-player__volume');

  /** The record's label: a set's own artwork when `label` names one, a plain coloured disc
   *  when it doesn't - no placeholder text. The image element is created only when there is
   *  a file to point it at - one carried in the markup with no source is a 404 on every page
   *  load and a broken-image box in the middle of the record until the artwork exists. */
  function showLabel(set) {
    let mark = labelEl.querySelector('.set-player__mark');
    if (!set.label) {
      mark?.remove();
      return;
    }
    if (!mark) {
      mark = document.createElement('img');
      mark.className = 'set-player__mark';
      mark.alt = '';
      mark.addEventListener('error', () => mark.remove());
      labelEl.appendChild(mark);
    }
    mark.src = set.label;
  }

  mount.appendChild(el);

  // ---- engine (SoundCloud Widget API) --------------------------------------------------
  // `audio` mimics just the <audio> surface the rest of this file reads - currentTime,
  // duration, paused, play(), pause() - so everything below (waveform, scrubbing, keyboard,
  // progress) needed no changes when the real element underneath became a hidden iframe.
  // curDuration starts NaN, not 0, so duration()'s Number.isFinite() fallback below still
  // works before the widget has reported anything - the same state a fresh <audio> is in.
  // `widget` is always the engine the transport is driving (cur.widget); see the engine pair
  // below for why there are two.
  let widget = null;
  let curTime = 0;
  let curDuration = NaN;
  let curPaused = true;
  let curVolume = 100; // 0-100, the Widget API's own scale - re-applied on every READY below,
  // since a track swap is a fresh SoundCloud player and there's no guarantee it inherits
  // the last one's level
  let pendingPlay = false; // a play() called before the widget exists yet, honoured on READY

  const audio = {
    get currentTime() {
      return curTime;
    },
    set currentTime(v) {
      curTime = v;
      widget?.seekTo(v * 1000);
    },
    get duration() {
      return curDuration;
    },
    get paused() {
      return curPaused;
    },
    get volume() {
      return curVolume / 100;
    },
    set volume(v) {
      curVolume = Math.round(clamp(v, 0, 1) * 100);
      widget?.setVolume(curVolume);
    },
    play() {
      if (widget) askPlay();
      else pendingPlay = true;
      return Promise.resolve();
    },
    pause() {
      pendingPlay = false;
      clearTimeout(playWatchdog);
      widget?.pause();
    },
  };

  // A touch device refuses any play that isn't answered inside the tap, and the widget can't
  // answer the first one in time: its first play() has to fetch the stream URL before it can
  // call play() on its own media element, and by the time that comes back (~250ms) iOS no
  // longer counts it as part of the gesture - one PLAY, one PAUSE, silence. A second press
  // worked because the stream was resolved by then. So on touch every engine spends that
  // first, doomed play itself, muted, as soon as it is READY, and the visitor's press is the
  // one that finds the stream ready. Desktop never had the problem and skips it.
  const WARM = matchMedia('(pointer: coarse)').matches;
  function startWarm(eng) {
    eng.warmed = true;
    eng.warming = true;
    eng.widget.setVolume(0);
    eng.widget.play();
    eng.warmTimer = setTimeout(() => endWarm(eng), 4000); // iOS may answer with nothing at all
  }
  function endWarm(eng) {
    if (!eng.warming) return;
    eng.warming = false;
    clearTimeout(eng.warmTimer);
    eng.widget.seekTo(0);
    if (eng === cur) eng.widget.setVolume(curVolume);
  }

  // Every request for playback goes through here, so there is one place that knows a PLAY is
  // owed and one timer watching for it. Without this a refused start leaves the transport
  // showing Pause over a bar that never moves - the player looks broken when it is only
  // waiting for a tap it never asked for.
  let playWatchdog = 0;
  function askPlay() {
    endWarm(cur);
    widget.play();
    clearTimeout(playWatchdog);
    playWatchdog = setTimeout(() => {
      if (!curPaused) return; // it started after all
      onPause(); // repaint the real state: the glyphs may still say Pause from the last set
      noteEl.textContent = 'Tap play to start this set.';
      noteEl.hidden = false;
    }, PLAY_WAIT);
  }

  // One engine per set, all made and warmed up front. Changing set with widget.load() replaces
  // the iframe's document, and the new one has the same cold stream as the very first play plus
  // no user activation of its own: on iPad the next set started and stopped on its own. A second
  // engine reloaded and warmed behind the playing one failed differently but just as surely:
  // iOS lets a page play one media element at a time, so the spare's muted warm-up play paused
  // the set being listened to. So nothing is ever loaded or warmed once audio is running - every
  // set has its own iframe from page load, warmed while nothing plays yet, and "next" is only a
  // swap inside the click: play the new engine, pause the old one. An auto-advance at the end of
  // a set has no tap behind it, so on iOS it can still stop there: the watchdog then asks for one.
  let cur = null;
  const engines = new Map(); // track url -> engine
  let engineSeq = 0;
  function makeEngine(trackUrl) {
    const eng = {
      url: trackUrl,
      widget: null,
      ready: false,
      warmed: false,
      warming: false,
      failed: false,
    };
    const params = new URLSearchParams({
      url: trackUrl,
      auto_play: 'false', // loading is never a play; the button always is
      ...Object.fromEntries(Object.entries(WIDGET_CHROME).map(([k, v]) => [k, String(v)])),
    });
    const id = `${ENGINE_ID}-${engineSeq++}`;
    eng.iframe = document.createElement('iframe');
    eng.iframe.id = id;
    eng.iframe.hidden = true;
    eng.iframe.setAttribute('allow', 'autoplay');
    eng.iframe.src = `https://w.soundcloud.com/player/?${params}`;
    document.body.appendChild(eng.iframe);
    loadWidgetScript().then(() => {
      const w = window.SC.Widget(id);
      const E = window.SC.Widget.Events;
      eng.widget = w;
      if (eng === cur) widget = w;
      // every event is routed by engine: only `cur` ever reaches the transport, and a warm-up
      // is answered here without the transport ever seeing it
      w.bind(E.READY, () => engineReady(eng));
      w.bind(E.PLAY, () => (eng.warming ? w.pause() : eng === cur && onPlay()));
      w.bind(E.PAUSE, () => (eng.warming ? endWarm(eng) : eng === cur && onPause()));
      w.bind(E.FINISH, () => eng === cur && onEnded());
      w.bind(E.ERROR, () => {
        eng.failed = true;
        if (eng === cur) onError();
      });
      w.bind(E.PLAY_PROGRESS, (e) => eng === cur && !eng.warming && onProgress(e));
    });
    return eng;
  }

  function engineReady(eng) {
    eng.ready = true;
    if (eng === cur) return onReady();
    eng.widget.setVolume(0); // a waiting engine is never heard until it is the current one
    if (WARM && !eng.warmed) startWarm(eng);
  }

  function engineLoad(trackUrl, play) {
    if (!engines.size) for (const s of order) engines.set(s.track, makeEngine(s.track));
    const old = cur;
    cur = engines.get(trackUrl);
    widget = cur.widget; // null until the widget script lands; makeEngine fills it in then
    pendingPlay = play;
    // synchronous, so askPlay() still runs inside the click that asked for it; otherwise
    // pendingPlay waits for this engine's own READY
    if (cur.ready) onReady();
    if (old && old !== cur) {
      old.widget?.pause();
      // the old engine's own PAUSE no longer reaches the transport, so a switch that isn't a
      // play (the crate running out, back to the top) repaints the stop itself
      if (!play && !curPaused) onPause();
    }
  }
  let peaks = null; // the current set's 1000 values, or null while loading
  const peakCache = new Map();

  const duration = () => (Number.isFinite(audio.duration) ? audio.duration : current.duration || 0);

  // ---- waveform ----------------------------------------------------------------------
  // Two canvases, same bars, different colour. The played one is clipped in CSS off a single
  // custom property, so progress costs one style write per painted pixel column and never
  // touches the canvas - which matters because this sits over a WebGL layer that is also
  // drawing during the drawer's own runs.
  function paint(canvas, color, values) {
    const rect = wave.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = color;

    const bars = Math.max(8, Math.floor(rect.width / BAR));
    const mid = rect.height / 2;
    const span = rect.height * WAVE_PAD;
    for (let i = 0; i < bars; i++) {
      let v;
      if (values) {
        // one bar covers a slice of the stored buckets; the loudest one in the slice wins,
        // so a single sharp transient never disappears into an average
        const from = Math.floor((i * values.length) / bars);
        const to = Math.max(from + 1, Math.floor(((i + 1) * values.length) / bars));
        v = 0;
        for (let k = from; k < to; k++) if (values[k] > v) v = values[k];
      } else {
        v = 0.22; // no peaks yet (or none to be had): a flat rail still scrubs
      }
      const height = Math.max(2, v ** WAVE_CURVE * span);
      ctx.fillRect(i * BAR, mid - height / 2, BAR - 1, height);
    }
  }

  function drawWave() {
    const cs = getComputedStyle(el);
    paint(restCanvas, cs.getPropertyValue('--set-rest').trim() || '#3a3a3a', peaks);
    paint(playedCanvas, cs.getPropertyValue('--set-played').trim() || '#a78bfa', peaks);
  }

  async function loadPeaks(set) {
    if (!set.peaks) return null;
    if (peakCache.has(set.id)) return peakCache.get(set.id);
    try {
      const res = await fetch(set.peaks);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const values = Array.isArray(data?.peaks) ? data.peaks : null;
      peakCache.set(set.id, values);
      return values;
    } catch {
      // A missing waveform is a cosmetic failure, never a reason not to play: the flat rail
      // seeks exactly as well. Cached as null so a broken file isn't re-fetched every switch.
      peakCache.set(set.id, null);
      return null;
    }
  }

  // ---- progress ----------------------------------------------------------------------
  let scrubbing = false;
  let lastPx = -1;
  let lastSec = -1;

  function showProgress(seconds) {
    const total = duration();
    const ratio = total ? clamp(seconds / total, 0, 1) : 0;
    const px = Math.round(ratio * wave.clientWidth);
    if (px !== lastPx) {
      lastPx = px;
      el.style.setProperty('--played', `${ratio * 100}%`);
    }
    const sec = Math.floor(seconds);
    if (sec !== lastSec) {
      lastSec = sec;
      timeEl.textContent = clock(seconds);
    }
  }

  /** aria is updated on user action only - on seek, on load, on pause. A slider that
   *  rewrites its value while playing makes a screen reader recite the clock for an hour. */
  function announce(seconds) {
    const total = duration();
    wave.setAttribute('aria-valuemax', String(Math.round(total)));
    wave.setAttribute('aria-valuenow', String(Math.round(seconds)));
    wave.setAttribute('aria-valuetext', `${spoken(seconds)} of ${spoken(total)}`);
  }

  // A rAF loop for the visible repaint, reading whatever curTime the widget's own
  // PLAY_PROGRESS messages (below) last set - smoother than repainting straight off those
  // messages, which arrive on their own schedule, not the screen's.
  let frame = 0;
  function tick() {
    if (!scrubbing) showProgress(audio.currentTime);
    frame = audio.paused ? 0 : requestAnimationFrame(tick);
  }

  function seekTo(seconds) {
    const total = duration();
    if (!total) return;
    audio.currentTime = clamp(seconds, 0, total);
    showProgress(audio.currentTime);
    announce(audio.currentTime);
  }

  // ---- set switching -------------------------------------------------------------------
  async function load(set, { play = false } = {}) {
    current = set;
    curDuration = NaN;
    // A new set starts at zero and nobody is dragging it. curTime is otherwise only ever
    // written by the widget's own progress messages, so without this the first frame after a
    // switch repaints the *previous* set's position; and scrubbing, if a drag lost its
    // pointerup (capture stolen, panel hidden mid-drag), stays true forever and gags both the
    // rAF loop and its PLAY_PROGRESS fallback.
    curTime = 0;
    scrubbing = false;
    el.classList.remove('is-error');
    titleEl.textContent = set.title;
    noteEl.hidden = true;
    showLabel(set);
    totalEl.textContent = clock(set.duration ?? 0);
    disc.setAttribute('aria-label', `Play ${set.title}`);
    lastPx = -1;
    lastSec = -1;
    showProgress(0);
    announce(0);
    // Fires the request before the peaks await, same discipline as the old audio.play():
    // whatever gesture-timing rule the browser applies to starting playback, it applies to
    // the call that asks for it, not to whatever runs after.
    engineLoad(set.track, play);
    peaks = await loadPeaks(set);
    drawWave();
  }

  function advance({ play = true } = {}) {
    index += 1;
    if (index >= order.length) {
      // the crate is empty: back to the top, stopped. Looping an hour-long set list forever
      // is a decision no visitor asked for.
      index = 0;
      load(order[0]);
      return;
    }
    load(order[index], { play });
  }

  // ---- events --------------------------------------------------------------------------
  // The disc and the mini button both toggle the same play/pause - the disc for the gesture
  // that reads as "put the needle down", this one for a visitor who wants an ordinary,
  // unambiguous button and never discovers a record is clickable.
  const onDisc = () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  disc.addEventListener('click', onDisc);
  miniBtn.addEventListener('click', onDisc);
  nextBtn?.addEventListener('click', () => advance({ play: !audio.paused }));
  el.querySelectorAll('.set-player__skip').forEach((btn) => {
    btn.addEventListener('click', () => seekTo(audio.currentTime + Number(btn.dataset.dir) * SKIP));
  });
  volumeInput.addEventListener('input', () => {
    audio.volume = Number(volumeInput.value) / 100;
  });

  // Bound per engine in makeEngine(), which only lets the current one through - there is no
  // DOM element here to addEventListener on.
  const onPlay = () => {
    curPaused = false;
    clearTimeout(playWatchdog);
    if (!el.classList.contains('is-error')) noteEl.hidden = true;
    el.classList.add('is-playing');
    disc.setAttribute('aria-label', `Pause ${current.title}`);
    miniBtn.setAttribute('aria-label', 'Pause');
    glyph.innerHTML = PAUSE_GLYPH;
    miniGlyph.innerHTML = PAUSE_GLYPH;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  const onPause = () => {
    curPaused = true;
    el.classList.remove('is-playing');
    disc.setAttribute('aria-label', `Play ${current.title}`);
    miniBtn.setAttribute('aria-label', 'Play');
    glyph.innerHTML = PLAY_GLYPH;
    miniGlyph.innerHTML = PLAY_GLYPH;
    announce(audio.currentTime);
  };
  const onEnded = () => {
    curPaused = true;
    advance();
  };
  // PLAY_PROGRESS is the widget's own periodic postMessage, in place of native <audio>'s
  // timeupdate - it both feeds the rAF loop's next frame and, like timeupdate did, repaints
  // directly whenever that loop isn't already running (a backgrounded tab throttles rAF,
  // not postMessage).
  const onProgress = (e) => {
    curTime = (e?.currentPosition ?? 0) / 1000;
    if (!frame && !scrubbing) showProgress(curTime);
  };
  const onError = () => {
    // a real failure outranks the watchdog's guess, and otherwise its timer would land three
    // seconds later and replace this message with the milder one
    clearTimeout(playWatchdog);
    pendingPlay = false;
    el.classList.add('is-error');
    noteEl.textContent = "Couldn't load this set - check your connection.";
    noteEl.hidden = false;
  };
  // Fired from engineLoad's READY bind - once for the very first track, and again (per the
  // widget's own docs) each time load() swaps in a new one.
  const onReady = () => {
    if (pendingPlay) {
      pendingPlay = false;
      askPlay(); // first, so it is the first message a click sends
    } else if (WARM && !cur.warmed && curPaused) startWarm(cur);
    // a waiting engine sits at 0, so the level is re-applied every time one becomes current
    if (!cur.warming) widget.setVolume(curVolume);
    widget.getDuration((ms) => {
      curDuration = ms / 1000;
      totalEl.textContent = clock(duration());
      announce(audio.currentTime);
      // The widget can report PLAY before it reports a duration, and until it has one
      // showProgress() paints a ratio of zero - so the loop could be running against a bar
      // pinned at 0%, or not running at all if PLAY landed while frame was still 0.
      if (!curPaused && !frame) frame = requestAnimationFrame(tick);
    });
  };

  // scrubbing: paint where the finger is, move the audio only when it lets go
  const at = (e) => {
    const r = wave.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1) * duration();
  };
  const onDown = (e) => {
    if (!duration()) return;
    scrubbing = true;
    wave.setPointerCapture?.(e.pointerId);
    showProgress(at(e));
  };
  const onMove = (e) => {
    if (scrubbing) showProgress(at(e));
  };
  const onUp = (e) => {
    if (!scrubbing) return;
    scrubbing = false;
    seekTo(at(e));
  };
  wave.addEventListener('pointerdown', onDown);
  wave.addEventListener('pointermove', onMove);
  wave.addEventListener('pointerup', onUp);
  wave.addEventListener('pointercancel', () => (scrubbing = false));

  const onKey = (e) => {
    const step = { ArrowLeft: -SKIP, ArrowRight: SKIP, PageDown: -PAGE, PageUp: PAGE }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      seekTo(audio.currentTime + step);
      return;
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      seekTo(e.key === 'Home' ? 0 : duration());
    }
  };
  wave.addEventListener('keydown', onKey);

  // The bar count is solved from the CSS width, so a resize is a redraw, not a stretch.
  const ro = new ResizeObserver(() => drawWave());
  ro.observe(wave);

  load(order[0]);

  return function dispose() {
    ro.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(playWatchdog);
    widget?.pause();
    for (const e of engines.values()) e.iframe.remove();
    el.remove();
  };
}
