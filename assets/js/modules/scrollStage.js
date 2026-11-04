// Top のスクロールの舞台。スクロール量に応じて各 scene に状態を付ける。
//   data-state="before | active | after"、CSS 変数 --progress（0〜1）、data-step="0 | 1 | …"
// scene（section）はスクロールの長さ（data-steps × 100svh）だけを持ち、
// 見える中身（.l-stage__frame）は画面に固定してある（layout/_stage.css）。
// 見せ方は CSS 側が data-state / --progress / data-step を見て作る。

const KEYS_NEXT = new Set(['ArrowDown', 'PageDown']);
const KEYS_PREV = new Set(['ArrowUp', 'PageUp']);
// 端数でステップの境目を取り違えないための余裕（px）
const EDGE_PX = 1;

/**
 * @param {HTMLElement} stage  [data-stage] の要素
 * @param {{ indicator?: HTMLElement | null }} [options]  現在位置のドットを入れる要素
 */
export function createScrollStage(stage, { indicator = null } = {}) {
  const scenes = [...stage.querySelectorAll('[data-scene]')].map((el) => ({
    el,
    steps: Math.max(1, Number.parseInt(el.dataset.steps, 10) || 1),
    top: 0,
    length: 0,
    state: null,
    step: null,
    progress: null,
  }));
  if (!scenes.length) return null;

  // ステップの一覧（scene × step）。goTo / next / current の番号はこの並び
  const stepList = scenes.flatMap((scene, sceneIndex) =>
    Array.from({ length: scene.steps }, (_, step) => ({ sceneIndex, step })),
  );
  const firstStepOf = scenes.map((_, i) => stepList.findIndex((s) => s.sceneIndex === i));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeScene = -1;
  let currentIndex = 0;
  let pendingIndex = null; // goTo で移動中の行き先（連打しても飛ばさないように）
  let frameRequested = false;
  const dots = indicator ? buildIndicator(indicator) : [];

  stage.classList.add('is-ready');

  function measure() {
    const y = window.scrollY;
    for (const scene of scenes) {
      const rect = scene.el.getBoundingClientRect();
      scene.top = rect.top + y;
      scene.length = rect.height;
    }
  }

  function update() {
    frameRequested = false;
    const y = window.scrollY;

    // 上端が通り過ぎた最後の scene が今の scene（最初の scene より上にいるときは最初）
    let index = 0;
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].top <= y + EDGE_PX) index = i;
    }

    scenes.forEach((scene, i) => {
      const progress = clamp((y + EDGE_PX - scene.top) / scene.length, 0, 1);
      let state = 'active';
      if (i < index) state = 'after';
      else if (i > index) state = 'before';
      else if (y >= scene.top + scene.length) state = 'after'; // 最後の scene を通り過ぎた

      const step = Math.min(scene.steps - 1, Math.floor(progress * scene.steps));
      const rounded = Math.round(progress * 10000) / 10000;

      if (scene.state !== state) {
        scene.state = state;
        scene.el.dataset.state = state;
      }
      if (scene.steps > 1 && scene.step !== step) {
        scene.step = step;
        scene.el.dataset.step = String(step);
      }
      if (scene.progress !== rounded) {
        scene.progress = rounded;
        scene.el.style.setProperty('--progress', String(rounded));
      }
    });

    currentIndex = firstStepOf[index] + (scenes[index].steps > 1 ? scenes[index].step : 0);
    if (pendingIndex === currentIndex) pendingIndex = null;

    if (activeScene !== index) {
      activeScene = index;
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        if (i === index) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
    }
  }

  function requestUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(update);
  }

  function relayout() {
    measure();
    requestUpdate();
  }

  /**
   * @param {number} index  ステップの番号
   * @param {{ instant?: boolean }} [options]  instant：なめらかに動かさず瞬時に移動する
   */
  function goTo(index, { instant = false } = {}) {
    const target = clamp(index, 0, stepList.length - 1);
    const { sceneIndex, step } = stepList[target];
    const scene = scenes[sceneIndex];
    measure();
    const top = target === 0 ? 0 : Math.ceil(scene.top + (scene.length / scene.steps) * step);
    pendingIndex = target;
    window.scrollTo({ top, behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
  }

  function current() {
    return currentIndex;
  }

  function next() {
    goTo((pendingIndex ?? currentIndex) + 1);
  }

  function prev() {
    goTo((pendingIndex ?? currentIndex) - 1);
  }

  function isPastStage() {
    return scenes[scenes.length - 1].state === 'after';
  }

  function onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditable(event.target)) return;

    let dir = 0;
    if (KEYS_NEXT.has(event.key)) dir = 1;
    else if (KEYS_PREV.has(event.key)) dir = -1;
    else if (event.key === ' ' && !isClickable(event.target)) dir = event.shiftKey ? -1 : 1;
    if (!dir) return;

    // 舞台より下（フッター）にいるとき：↓ は普段どおり、↑ は最後の画面へ
    if (isPastStage()) {
      if (dir < 0) {
        event.preventDefault();
        goTo(stepList.length - 1);
      }
      return;
    }

    const target = (pendingIndex ?? currentIndex) + dir;
    // 最初より前・最後より後は、普段のスクロールに任せる（最後の次はフッターへ）
    if (target < 0 || target >= stepList.length) return;
    event.preventDefault();
    goTo(target);
  }

  function onUserScrollInput() {
    pendingIndex = null;
  }

  function buildIndicator(container) {
    const list = document.createElement('ol');
    list.className = 'c-step-indicator__list';
    const buttons = scenes.map((scene, i) => {
      const item = document.createElement('li');
      item.className = 'c-step-indicator__item';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'c-step-indicator__dot';
      const heading = scene.el.querySelector('h1, h2');
      button.setAttribute('aria-label', heading ? heading.textContent.trim() : scene.el.dataset.scene);
      button.addEventListener('click', () => goTo(firstStepOf[i]));
      item.append(button);
      list.append(item);
      return button;
    });
    container.replaceChildren(list);
    return buttons;
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  window.addEventListener('wheel', onUserScrollInput, { passive: true });
  window.addEventListener('touchstart', onUserScrollInput, { passive: true });
  document.addEventListener('keydown', onKeydown);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(stage);

  measure();
  update();

  return { goTo, next, prev, current, count: stepList.length };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isEditable(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

// Space で押せる要素（ボタン・リンクなど）では、Space を横取りしない
function isClickable(el) {
  return el instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(el.tagName);
}
