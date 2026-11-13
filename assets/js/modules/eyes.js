// キャラクターの目（c-eyes）。ランダムに瞬きし、ランダムに目線を動かして、しばらくしてふだんの目線に戻す
//   [data-eyes="画面の名前 …"] の目は、舞台の今の画面（data-current）がそのどれかのときだけ動く（見えていない目は動かさない）
//   目ごとに別々のタイマーで動くので、3体がそろって動かない
//   時間・間隔は CSS の変数（foundation/_motion.css の --eye-*）。見た目（縮め方・動く量）は object/component/_eyes.css
//   動きを減らす設定では動かさない
import { readCssTime, readCssNumber } from './cssVars.js';

const LOOKS = ['left', 'right', 'up', 'down', 'up-left', 'up-right', 'down-left', 'down-right'];

const between = (min, max) => min + Math.random() * Math.max(0, max - min);

/**
 * @param {HTMLElement} root  目を探す範囲
 * @param {HTMLElement} stage  [data-stage]
 */
export function startEyes(root, stage) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const el of root.querySelectorAll('[data-eyes]')) animate(el, stage);
}

function animate(el, stage) {
  const scenes = (el.dataset.eyes || '').split(/\s+/).filter(Boolean);
  const visible = () => scenes.includes(stage.dataset.current);
  const time = (name, fallback) => readCssTime(el, name, fallback);

  function blinkOnce(then) {
    el.classList.add('is-blink');
    window.setTimeout(() => {
      el.classList.remove('is-blink');
      if (then) window.setTimeout(then, time('--eye-blink-duration', 150));
    }, time('--eye-blink-duration', 150) / 2);
  }

  function scheduleBlink() {
    window.setTimeout(() => {
      if (visible()) {
        // ときどき2回続ける
        const twice = Math.random() < readCssNumber(el, '--eye-blink-double-chance', 0.2);
        blinkOnce(twice ? () => blinkOnce() : null);
      }
      scheduleBlink();
    }, between(time('--eye-blink-interval-min', 2000), time('--eye-blink-interval-max', 6000)));
  }

  function scheduleLook() {
    window.setTimeout(() => {
      if (visible()) {
        el.dataset.look = LOOKS[Math.floor(Math.random() * LOOKS.length)];
        window.setTimeout(() => {
          delete el.dataset.look;
          scheduleLook();
        }, between(time('--eye-look-hold-min', 1200), time('--eye-look-hold-max', 2500)));
        return;
      }
      scheduleLook();
    }, between(time('--eye-look-interval-min', 4000), time('--eye-look-interval-max', 9000)));
  }

  scheduleBlink();
  scheduleLook();
}
