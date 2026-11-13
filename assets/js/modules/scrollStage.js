// Top の舞台。1回のスクロール操作で1画面ずつ切り替える（紙芝居。スクロール量にアニメーションを連動させない）
//   入力：ホイール／トラックパッド、タッチのスワイプ、キー（↓ PageDown Space で次・↑ PageUp Shift+Space で前）、現在位置のドット
//   画面（[data-scene]）に data-state を付ける：before → entering → active → leaving → after（戻るときは after → entering … → before）
//   舞台（[data-stage]）に付ける：data-current（今の画面の data-scene）・data-direction（forward / back / loop）
//   見せ方はすべて CSS（layout/_stage.css・_stage-motion.css・foundation/_motion.css）。JS はアニメーションの時間を持たない
//   ★切り替え中は次の入力を受け付けない。その長さは行き先の画面の CSS 変数 --scene-lock（foundation/_motion.css）
//   JS が動かないときは、ふつうの縦に並んだページとして読める（.is-ready が付かないため）
//   URL の #…（画面の id か data-scene）で、その画面から始める・移る（チャットボットの「/#how-to」など）

const KEYS_NEXT = new Set(['ArrowDown', 'PageDown']);
const KEYS_PREV = new Set(['ArrowUp', 'PageUp']);
// ホイール：これだけ回したら1回の操作とみなす（px）。トラックパッドの小さな揺れで動かないように
const WHEEL_THRESHOLD = 24;
// ホイール：この間（ms）イベントが途切れたら、次の回転を新しい操作とみなす（慣性で何画面も進まないように。動きの時間ではない）
const WHEEL_GESTURE_GAP = 180;
// スワイプ：これだけ動かしたら1回の操作とみなす（px）
const SWIPE_THRESHOLD = 40;

/**
 * @param {HTMLElement} stage  [data-stage] の要素
 * @param {{ indicator?: HTMLElement | null }} [options]  現在位置のドットを入れる要素
 * @returns {{ goTo: Function, next: Function, prev: Function, current: () => number, count: number, ready: Promise<void> } | null}
 */
export function createScrollStage(stage, { indicator = null } = {}) {
  const scenes = [...stage.querySelectorAll('[data-scene]')];
  if (!scenes.length) return null;

  let current = -1;
  let busy = false;
  let lockTimer = 0;
  const dots = indicator ? buildIndicator(indicator) : [];

  stage.classList.add('is-ready');
  document.documentElement.classList.add('is-stage-locked'); // ページ自体はスクロールさせない（_stage.css）
  for (const scene of scenes) scene.dataset.state = 'before';

  function setState(index, state) {
    scenes[index].dataset.state = state;
  }

  function markCurrent(index) {
    stage.dataset.current = scenes[index].dataset.scene;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      if (i === index) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
  }

  /**
   * @param {number} index  画面の番号（0 から）
   * @param {{ direction?: 'forward' | 'back' | 'loop' }} [options]  省略時は番号の大小で決める
   * @returns {boolean} 切り替えを始めたか（切り替え中・同じ画面なら false）
   */
  function goTo(index, { direction } = {}) {
    const target = clamp(index, 0, scenes.length - 1);
    if (busy || target === current) return false;

    const from = current;
    const dir = direction ?? (target > from ? 'forward' : 'back');
    stage.dataset.direction = dir;
    if (from >= 0) setState(from, 'leaving');
    setState(target, 'entering');
    markCurrent(target);
    current = target;

    busy = true;
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(() => {
      if (from >= 0) setState(from, dir === 'back' ? 'before' : 'after');
      setState(target, 'active');
      busy = false;
    }, readTime(scenes[target], '--scene-lock'));
    return true;
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // --- 入力 ---------------------------------------------------------------
  let wheelSum = 0;
  let wheelLast = 0;
  let wheelUsed = false; // この操作（ひと続きの回転）で、もう1画面動かしたか

  function onWheel(event) {
    if (isInsideScrollable(event.target)) return;
    event.preventDefault();
    const now = event.timeStamp;
    if (now - wheelLast > WHEEL_GESTURE_GAP) {
      wheelSum = 0;
      wheelUsed = false;
    }
    wheelLast = now;
    if (wheelUsed) return; // 慣性の続きは捨てる
    wheelSum += event.deltaY;
    if (Math.abs(wheelSum) < WHEEL_THRESHOLD) return;
    const moved = wheelSum > 0 ? next() : prev();
    // 切り替え中で動けなかったときは、この操作を使い切ったことにしない（止まってから回し直せば動く）
    wheelUsed = moved || busy;
    wheelSum = 0;
  }

  let touchStartY = null;
  function onTouchStart(event) {
    touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
  }
  function onTouchEnd(event) {
    if (touchStartY === null) return;
    const dy = touchStartY - event.changedTouches[0].clientY;
    touchStartY = null;
    if (Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (dy > 0) next();
    else prev();
  }

  function onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isEditable(event.target)) return;
    let dir = 0;
    if (KEYS_NEXT.has(event.key)) dir = 1;
    else if (KEYS_PREV.has(event.key)) dir = -1;
    else if (event.key === ' ' && !isClickable(event.target)) dir = event.shiftKey ? -1 : 1;
    if (!dir) return;
    event.preventDefault();
    if (dir > 0) next();
    else prev();
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
      const heading = scene.querySelector('h1, h2');
      button.setAttribute('aria-label', heading ? heading.textContent.trim() : scene.dataset.scene);
      button.addEventListener('click', () => goTo(i));
      item.append(button);
      list.append(item);
      return button;
    });
    container.replaceChildren(list);
    return buttons;
  }

  // #… の画面の番号。無ければ -1
  function indexFromHash(hash) {
    const name = decodeURIComponent(String(hash || '').replace(/^#/, ''));
    if (!name) return -1;
    return scenes.findIndex((scene) => scene.id === name || scene.dataset.scene === name);
  }

  // 同じページの中の #… へのリンク（すでに同じ # のときは hashchange が起きないので、クリックで受ける）
  function onLinkClick(event) {
    const link = event.target instanceof Element ? event.target.closest('a[href*="#"]') : null;
    if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname) return;
    const index = indexFromHash(link.hash);
    if (index < 0) return;
    event.preventDefault();
    window.history.replaceState(null, '', link.hash);
    goTo(index);
  }

  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('touchstart', onTouchStart, { passive: true });
  stage.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('click', onLinkClick);
  window.addEventListener('hashchange', () => {
    const index = indexFromHash(window.location.hash);
    if (index >= 0) goTo(index);
  });

  // 最初の画面の画像が読めてから、最初の出現を始める（読み込み中に出現が空振りしないように）
  const first = Math.max(0, indexFromHash(window.location.hash));
  const ready = waitForImages(scenes[first]).then(() => {
    goTo(first, { direction: 'forward' });
  });

  return { goTo, next, prev, current: () => current, count: scenes.length, ready };
}

/** CSS の時間の変数（"0.8s" / "800ms"）を ms にする。無い・読めないときは 0 */
function readTime(el, name) {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return value.endsWith('ms') ? n : n * 1000;
}

function waitForImages(root) {
  const images = [...root.querySelectorAll('img')];
  return Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))).then(() => {});
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// 中でスクロールできる場所（チャットボットのパネルなど）のホイールは横取りしない
function isInsideScrollable(el) {
  return el instanceof Element && Boolean(el.closest('[data-stage-scrollable]'));
}

function isEditable(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

// Space で押せる要素（ボタン・リンクなど）では、Space を横取りしない
function isClickable(el) {
  return el instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(el.tagName);
}
