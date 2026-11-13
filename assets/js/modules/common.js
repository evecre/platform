// 全ページ共通の初期化。各ページの入口（pages/*.js）の最初で呼ぶ。
//   展示モードの判定（kiosk.js）。展示中は <html> に .is-kiosk
//   Top 以外で無操作なら Top に戻る（idleReturn.js。展示モードのときだけ）
//   チャットボットの起動（chatbot/chatbot.js）
//   「みんなの記録」（本体の /explore）へのリンク（exploreLink.js。展示モードなら ?kiosk=1）
import { isKiosk } from './kiosk.js';
import { startIdleReturn } from './idleReturn.js';
import { startChatbot } from './chatbot/chatbot.js';
import { setupExploreLinks } from './exploreLink.js';

/**
 * @param {{ page: 'top' | 'help' }} options
 * @returns {{ kiosk: boolean }}
 */
export function initCommon({ page }) {
  const root = document.documentElement;
  const kiosk = isKiosk();
  root.dataset.page = page;
  root.classList.toggle('is-kiosk', kiosk);

  setupExploreLinks();
  if (kiosk && page !== 'top') startIdleReturn();
  startChatbot({ kiosk });

  return { kiosk };
}
