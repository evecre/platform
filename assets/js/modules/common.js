// 全ページ共通の初期化。各ページの入口（pages/*.js）の最初で呼ぶ。
//   展示モードの判定（kiosk.js）。展示中は <html> に .is-kiosk
//   チャットボットの起動（chatbot/chatbot.js）
//   「みんなの記録」（本体の /explore）へのリンク（exploreLink.js。展示モードなら ?kiosk=1）
import { isKiosk } from './kiosk.js';
import { startChatbot } from './chatbot/chatbot.js';
import { setupExploreLinks } from './exploreLink.js';

/**
 * @param {{ page: 'top' }} options
 * @returns {{ kiosk: boolean }}
 */
export function initCommon({ page }) {
  const root = document.documentElement;
  const kiosk = isKiosk();
  root.dataset.page = page;
  root.classList.toggle('is-kiosk', kiosk);

  setupExploreLinks();
  startChatbot({ kiosk });

  return { kiosk };
}
