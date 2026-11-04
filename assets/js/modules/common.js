// 全ページ共通の初期化。各ページの入口（pages/*.js）の最初で呼ぶ。
//   展示モードの判定（kiosk.js）。展示中は <html> に .is-kiosk
//   Top 以外で無操作なら Top に戻る（idleReturn.js。展示モードのときだけ）
//   チャットボットの起動（指示書 02：chatbot/）
import { isKiosk } from './kiosk.js';
import { startIdleReturn } from './idleReturn.js';

/**
 * @param {{ page: 'top' | 'event-log' | 'event-detail' }} options
 * @returns {{ kiosk: boolean }}
 */
export function initCommon({ page }) {
  const root = document.documentElement;
  const kiosk = isKiosk();
  root.dataset.page = page;
  root.classList.toggle('is-kiosk', kiosk);

  if (kiosk && page !== 'top') startIdleReturn();

  return { kiosk };
}
