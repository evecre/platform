// 01-hero の雲。マスクの中で、右の外から左の外へゆっくり流れる。種類・高さ・速さ・出る間隔はランダム
//   値は CSS の変数（foundation/_motion.css）：--hero-cloud-speed・--hero-cloud-interval-min / -max・--hero-cloud-max・--hero-cloud-initial・--hero-cloud-band
//   雲ごとの高さ・大きさ・速さは CSS の変数（--cloud-top / --cloud-w / --cloud-duration / --cloud-delay）で渡す。動きそのものは CSS（_top.css の top-hero-cloud）
//   hero が今の画面でないときは新しい雲を出さない（出ている雲は CSS で止まる）。動きを減らす設定では、はじめの雲を止めて置くだけ
import { readCssTime, readCssNumber } from './cssVars.js';

// 雲の素材と、Figma（基準のフレーム 1728×1117）での幅（px。PDF から測った値）
const CLOUDS = [
  { src: '/assets/img/top/hero-cloud01.svg', w: 108 },
  { src: '/assets/img/top/hero-cloud02.svg', w: 62 },
  { src: '/assets/img/top/hero-cloud03.svg', w: 78 },
];
const SPEED_SPREAD = 0.15; // 速さのばらつき（±15%）

/**
 * @param {HTMLElement} container  [data-hero-clouds]
 * @param {HTMLElement} stage  [data-stage]（data-current を見る）
 */
export function startHeroClouds(container, stage) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;

  const conf = () => ({
    speed: readCssTime(container, '--hero-cloud-speed', 60000),
    min: readCssTime(container, '--hero-cloud-interval-min', 8000),
    max: readCssTime(container, '--hero-cloud-interval-max', 18000),
    limit: readCssNumber(container, '--hero-cloud-max', 4),
    initial: readCssNumber(container, '--hero-cloud-initial', 2),
    band: readCssNumber(container, '--hero-cloud-band', 0.4),
  });

  /** @param {number} progress  0〜1（はじめから流れている雲は途中から） */
  function spawn(progress = 0) {
    const c = conf();
    if (container.childElementCount >= c.limit) return;
    const cloud = CLOUDS[Math.floor(Math.random() * CLOUDS.length)];
    const duration = c.speed * (1 - SPEED_SPREAD + Math.random() * SPEED_SPREAD * 2);
    const img = document.createElement('img');
    img.className = 'p-top-hero__cloud';
    img.src = cloud.src;
    img.alt = '';
    img.decoding = 'async';
    img.style.setProperty('--cloud-w', String(cloud.w));
    img.style.setProperty('--cloud-top', `${(Math.random() * c.band * 100).toFixed(1)}%`);
    img.style.setProperty('--cloud-duration', `${Math.round(duration)}ms`);
    if (progress > 0) img.style.setProperty('--cloud-delay', `${-Math.round(duration * progress)}ms`);
    img.addEventListener('animationend', () => img.remove());
    container.append(img);
  }

  function scheduleNext() {
    window.clearTimeout(timer);
    const c = conf();
    timer = window.setTimeout(() => {
      spawn();
      scheduleNext();
    }, c.min + Math.random() * Math.max(0, c.max - c.min));
  }

  function update() {
    const onHero = stage.dataset.current === 'hero';
    if (!onHero || reducedMotion) {
      window.clearTimeout(timer);
      return;
    }
    scheduleNext();
  }

  // はじめから流れている雲（途中の位置から）。重ならないよう、進み具合を散らす
  const { initial } = conf();
  for (let i = 0; i < initial; i++) spawn((i + 0.3 + Math.random() * 0.4) / initial);

  new MutationObserver(update).observe(stage, { attributes: true, attributeFilter: ['data-current'] });
  update();
}
