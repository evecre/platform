// Top 以外で、操作（スクロール・タッチ・クリック・キー入力）が一定時間無ければ Top に戻る。展示モードのときだけ使う
import { IDLE_RETURN_MS, kioskTime, kioskTopUrl } from './kiosk.js';

const ACTIVITY_EVENTS = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'];

export function startIdleReturn() {
  let timer = 0;

  function reset() {
    window.clearTimeout(timer);
    // replace：一日動かしても履歴が積み上がらないように
    timer = window.setTimeout(() => window.location.replace(kioskTopUrl()), kioskTime(IDLE_RETURN_MS));
  }

  for (const type of ACTIVITY_EVENTS) {
    window.addEventListener(type, reset, { passive: true, capture: true });
  }
  reset();
}
