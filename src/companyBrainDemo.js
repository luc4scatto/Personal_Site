// Company Brain "See it in action": each tab replays its scene like a live chat - the
// question is typed into the input, sent, a typing indicator runs, the tool call appears,
// then the answer, with its chart or list growing in. In the ambiguous-question scene the
// colorway buttons are real: picking one fetches that sheet (and one is picked for you
// after a while, so the scene still finishes without a mouse). Decorative, like the other
// mockups: the chat is aria-hidden and the tabs carry the meaning. Reduced motion skips
// straight to the finished scene.

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
  let run = { cancelled: true };

  function setColorway(panel, i) {
    const cw = COLORWAYS[i];
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

  function finish(panel) {
    steps(panel).forEach((s) => s.classList.add('is-shown'));
    panel.classList.add('is-done');
    typed.textContent = '';
    input.classList.remove('is-typing');
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
      panel.querySelectorAll('[data-cw]').forEach((b) => b.classList.remove('pp-btn--primary'));
    }
    if (reduced) {
      if (panel.dataset.cbPanel === 'ask') setColorway(panel, 2);
      finish(panel);
      return;
    }

    try {
      // the question is typed into the input, then sent
      const [question, ...rest] = all;
      input.classList.add('is-typing');
      typed.textContent = '';
      for (const ch of question.textContent) {
        typed.textContent += ch;
        await wait(18 + Math.random() * 28, me);
      }
      await wait(300, me);
      typed.textContent = '';
      input.classList.remove('is-typing');
      question.classList.add('is-shown');

      for (const step of rest) {
        if (
          step.hasAttribute('data-after-choice') &&
          !step.previousElementSibling.hasAttribute('data-after-choice')
        ) {
          // wait for a pick; one is made for the viewer if they don't
          const pick = await new Promise((resolve, reject) => {
            const buttons = [...panel.querySelectorAll('[data-cw]')];
            const done = (i) => {
              buttons.forEach((b) => b.removeEventListener('click', b._pick));
              clearTimeout(auto);
              me.cancelled ? reject(me) : resolve(i);
            };
            buttons.forEach((b) => {
              b._pick = () => done(+b.dataset.cw);
              b.addEventListener('click', b._pick, { once: true });
            });
            panel.classList.add('is-waiting');
            const auto = setTimeout(() => done(2), 4500);
            me.abort = () => done(-1);
          });
          panel.classList.remove('is-waiting');
          setColorway(panel, pick);
          await wait(250, me);
        }
        if (step.classList.contains('cb-msg--bot'))
          await typing(panel, step, 700 + Math.random() * 500);
        step.classList.add('is-shown');
        await wait(step.classList.contains('cb-tool') ? 450 : 350, me);
      }
      panel.classList.add('is-done');
    } catch {
      // a newer scene took over
    }
  }

  // after a pick, a different colorway can still be clicked to swap the sheet in place
  const askPanel = panels.find((p) => p.dataset.cbPanel === 'ask');
  askPanel.querySelectorAll('[data-cw]').forEach((b) =>
    b.addEventListener('click', () => {
      if (askPanel.classList.contains('is-done')) setColorway(askPanel, +b.dataset.cw);
    }),
  );

  function show(name) {
    tabs.forEach((t) => {
      const on = t.dataset.cbTab === name;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on);
    });
    panels.forEach((p) => p.classList.toggle('is-on', p.dataset.cbPanel === name));
    // cancel first, so a pending colorway pick rejects instead of resolving
    run.cancelled = true;
    if (run.abort) run.abort();
    play(panels.find((p) => p.dataset.cbPanel === name));
  }

  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.cbTab)));

  // the first scene starts the first time the chat comes into view, not on page load
  panels.forEach((p) => p.dataset.cbPanel !== 'chart' && finish(p));
  const first = panels.find((p) => p.classList.contains('is-on'));
  finish(first);
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      play(first);
    },
    { threshold: 0.5 },
  );
  io.observe(chat);
}
