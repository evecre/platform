// キャラクターの目（c-eyes）。ランダムに瞬きし、ランダムに目線を動かして、しばらくしてふだんの目線に戻す
//   [data-eyes="画面の名前 …"] の目は、舞台の今の画面（data-current）がそのどれかのときだけ動く（見えていない目は動かさない）
//   目ごとに別々のタイマーで動くので、3体がそろって動かない
//   時間・間隔は CSS の変数（foundation/_motion.css の --eye-*）。見た目（縮め方・動く量）は object/component/_eyes.css
//   動きを減らす設定では動かさない
import { readCssTime, readCssNumber } from './cssVars.js';

// 目線を動かす方向（x / y は動く量の向き）
const LOOKS = [
  { name: 'left', x: -1, y: 0 },
  { name: 'right', x: 1, y: 0 },
  { name: 'up', x: 0, y: -1 },
  { name: 'down', x: 0, y: 1 },
  { name: 'up-left', x: -1, y: -1 },
  { name: 'up-right', x: 1, y: -1 },
  { name: 'down-left', x: -1, y: 1 },
  { name: 'down-right', x: 1, y: 1 },
];

// 黒目が白目の円の中に収まるかの判定（素材の寸法。object/component/_eyes.css）
//   黒目の動きは、黒目の幅（50.2）・高さ（13.91）に対する %。黒目の中心が動ける半径は 白目 r20 − 黒目 r6.95 = 13.05
//   CSS の clamp は縦・横べつべつの上限なので、斜めに動くと円の外へ出る。方向を選ぶときに円で確かめる
const IRIS_W = 50.2;
const IRIS_H = 13.91;
const IRIS_ROOM = 13.05 * 0.92; // 少し内側まで

function fits(xPercent, yPercent) {
  return Math.hypot((xPercent / 100) * IRIS_W, (yPercent / 100) * IRIS_H) <= IRIS_ROOM;
}

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

  // ふだんの目線から動かしても、白目の円の中に収まる方向だけ
  function lookChoices() {
    const gx = readCssNumber(el, '--gaze-x', 0);
    const gy = readCssNumber(el, '--gaze-y', 0);
    const dx = readCssNumber(el, '--eye-look-distance-x', 14);
    const dy = readCssNumber(el, '--eye-look-distance-y', 45);
    return LOOKS.filter((look) => fits(gx + look.x * dx, gy + look.y * dy));
  }

  function scheduleLook() {
    window.setTimeout(() => {
      const choices = visible() ? lookChoices() : [];
      if (choices.length) {
        el.dataset.look = choices[Math.floor(Math.random() * choices.length)].name;
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
