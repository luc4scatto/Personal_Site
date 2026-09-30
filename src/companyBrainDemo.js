// Company Brain "See it in action": a scene plays like a live chat the first time it is shown -
// the question is typed into the input, sent, the answer follows, with its chart or list
// growing in. Coming back to a scene shows it finished, never blank; the Replay button plays
// it again and doubles as Skip while it runs. The strip above the chat lights the stage the
// question is at (chat, model, tools, systems), so the architecture is read off the demo
// instead of a separate diagram. In the ambiguous-question scene the colorway buttons are
// real: picking one fetches that sheet (and one is picked for you after a while, so the scene
// still finishes without a mouse, but only while the chat is actually in view). The chat is
// real text in the tab panels; the path list above it is a real list. Reduced motion never
// plays, scenes are always shown finished. On a phone a tab tap brings the chat into view
// and a chip in the chat header names the lit stage, since the list sits far above.

const COLORWAYS = [
  { material: 'Acetate', lens: 'Brown solid', hue: '#6b4a32' },
  { material: 'Metal', lens: 'Green classic', hue: '#3b5a48' },
  { material: 'Acetate', lens: 'Grey gradient', hue: '#3f4652' },
];

const wait = (ms, run) =>
  new Promise((resolve, reject) => {
    setTimeout(() => (run.cancelled ? reject(run) : resolve()), ms);
  });

export function initCompanyBrainDemo(chat) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tabs = [...document.querySelectorAll('[data-cb-tab]')];
  const panels = [...chat.querySelectorAll('[data-cb-panel]')];
  const typed = chat.querySelector('[data-cb-typed]');
  const input = chat.querySelector('.cb-chat__input');
  const replay = chat.querySelector('.cb-chat__replay');
  const stages = [...document.querySelectorAll('[data-stage]')];
  const stageChip = chat.querySelector('.cb-chat__stage');
  const narrow = matchMedia('(max-width: 860px)');
  let chatSeen = false;
  const seen = new Set();
  let run = { cancelled: true };
  let current = panels.find((p) => p.classList.contains('is-on'));

  // light one stage of the path; no argument clears it
  function light(name) {
    stages.forEach((s) => s.classList.toggle('is-lit', s.dataset.stage === name));
    const on = stages.find((s) => s.dataset.stage === name);
    if (stageChip) stageChip.textContent = on ? on.querySelector('.cb-path__name').textContent : '';
  }

  function setPlaying(on) {
    if (!replay) return;
    replay.textContent = on ? 'Skip' : 'Replay';
    replay.setAttribute('aria-label', on ? 'Skip to the finished answer' : 'Replay this example');
  }

  function setColorway(panel, i) {
    const cw = COLORWAYS[i];
    panel.dataset.picked = i;
    panel
      .querySelectorAll('[data-cw]')
      .forEach((b) => b.classList.toggle('pp-btn--primary', +b.dataset.cw === i));
    panel.querySelector('[data-cw-name]').textContent = `Colorway 0${i + 1}`;
    panel.querySelector('[data-cw-material]').textContent = cw.material;
    panel.querySelector('[data-cw-lens]').textContent = cw.lens;
    panel.querySelector('.cb-sheet__img').style.setProperty('--hue', cw.hue);
  }

  // a scene's steps are the panel's children; the ones marked data-after-choice wait
  function steps(panel) {
    return [...panel.children];
  }

  // the whole scene at once: what a scene looks like when it is not being played
  function finish(panel) {
    panel.querySelectorAll('.cb-typing').forEach((d) => d.remove());
    if (panel.dataset.cbPanel === 'ask' && panel.dataset.picked === undefined)
      setColorway(panel, 2);
    panel.classList.remove('is-waiting');
    steps(panel).forEach((s) => s.classList.add('is-shown'));
    panel.classList.add('is-done');
    typed.textContent = '';
    input.classList.remove('is-typing');
    light('');
    setPlaying(false);
  }

  async function typing(panel, before, ms) {
    const dots = document.createElement('p');
    dots.className = 'cb-msg cb-msg--bot cb-typing is-shown';
    dots.innerHTML = '<i></i><i></i><i></i>';
    panel.insertBefore(dots, before);
    try {
      await wait(ms, run);
    } finally {
      dots.remove();
    }
  }

  async function play(panel) {
    run.cancelled = true;
    const me = (run = { cancelled: false });
    panel.querySelectorAll('.cb-typing').forEach((d) => d.remove());
    panel.classList.remove('is-done');
    const all = steps(panel);
    all.forEach((s) => s.classList.remove('is-shown'));
    if (panel.dataset.cbPanel === 'ask') {
      delete panel.dataset.picked;
      panel.querySelectorAll('[data-cw]').forEach((b) => b.classList.remove('pp-btn--primary'));
    }
    setPlaying(true);

    try {
      // the question is typed into the input, then sent
      const [question, ...rest] = all;
      input.classList.add('is-typing');
      typed.textContent = '';
      for (const ch of question.textContent) {
        typed.textContent += ch;
        await wait(10 + Math.random() * 18, me);
      }
      await wait(200, me);
      typed.textContent = '';
      input.classList.remove('is-typing');
      question.classList.add('is-shown');
      light('chat');
      await wait(350, me);

      for (const step of rest) {
        if (
          step.hasAttribute('data-after-choice') &&
          !step.previousElementSibling.hasAttribute('data-after-choice')
        ) {
          // wait for a pick; one is made for the viewer if they don't
          const pick = await new Promise((resolve, reject) => {
            const buttons = [...panel.querySelectorAll('[data-cw]')];
            let auto = 0;
            let left = 4500;
            let armedAt = 0;
            const done = (i) => {
              buttons.forEach((b) => b.removeEventListener('click', b._pick));
              clearTimeout(auto);
              me.arm = me.disarm = null;
              me.cancelled ? reject(me) : resolve(i);
            };
            // the pick is made for the viewer only while they can watch it happen
            me.arm = () => {
              if (auto || !chatSeen) return;
              armedAt = Date.now();
              auto = setTimeout(() => done(2), left);
            };
            me.disarm = () => {
              if (!auto) return;
              clearTimeout(auto);
              auto = 0;
              left -= Date.now() - armedAt;
            };
            buttons.forEach((b) => {
              b._pick = () => done(+b.dataset.cw);
              b.addEventListener('click', b._pick, { once: true });
            });
            panel.classList.add('is-waiting');
            me.arm();
            me.abort = () => done(-1);
          });
          panel.classList.remove('is-waiting');
          setColorway(panel, pick);
          await wait(250, me);
        }
        if (step.classList.contains('cb-tool')) {
          light('model');
          await wait(400, me);
          light('tools');
        }
        if (step.classList.contains('cb-msg--bot')) {
          // an answer that cites sources has just come back from them
          light(step.querySelector('.cb-src') ? 'systems' : 'model');
          await typing(panel, step, 600 + Math.random() * 400);
        }
        step.classList.add('is-shown');
        await wait(step.classList.contains('cb-tool') ? 450 : 350, me);
      }
      finish(panel);
    } catch {
      // a newer scene took over, or the viewer skipped
    }
  }

  // after a pick, a different colorway can still be clicked to swap the sheet in place
  const askPanel = panels.find((p) => p.dataset.cbPanel === 'ask');
  askPanel.querySelectorAll('[data-cw]').forEach((b) =>
    b.addEventListener('click', () => {
      if (askPanel.classList.contains('is-done')) setColorway(askPanel, +b.dataset.cw);
    }),
  );

  function stop() {
    // cancel first, so a pending colorway pick rejects instead of resolving
    run.cancelled = true;
    if (run.abort) run.abort();
  }

  function show(name) {
    tabs.forEach((t) => {
      const on = t.dataset.cbTab === name;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => p.classList.toggle('is-on', p.dataset.cbPanel === name));
    stop();
    current = panels.find((p) => p.dataset.cbPanel === name);
    // a scene plays the first time it is opened; after that it is just there
    if (seen.has(name) || reduced) {
      finish(current);
    } else {
      seen.add(name);
      play(current);
    }
  }

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      show(t.dataset.cbTab);
      // on a phone the tabs sit above the chat: bring the answer into view
      if (narrow.matches && !chatSeen) {
        chat.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }
    }),
  );

  new IntersectionObserver(
    ([e]) => {
      chatSeen = e.intersectionRatio >= 0.6;
      if (chatSeen) run.arm?.();
      else run.disarm?.();
    },
    { threshold: [0, 0.6] },
  ).observe(chat);
  // arrow keys move between the tabs, the way a tablist is expected to
  tabs.forEach((t, i) =>
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      show(next.dataset.cbTab);
    }),
  );

  if (replay) {
    replay.hidden = reduced;
    replay.addEventListener('click', () => {
      const skipping = replay.textContent === 'Skip';
      stop();
      if (skipping) finish(current);
      else play(current);
    });
  }

  // every scene starts finished; the first one plays the first time the chat is in view
  panels.forEach(finish);
  if (!reduced) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        seen.add(current.dataset.cbPanel);
        play(current);
      },
      { threshold: 0.5 },
    );
    io.observe(chat);
  }
}
