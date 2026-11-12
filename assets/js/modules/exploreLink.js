// 本体の公開ページ「みんなの記録」（config.js の EXPLORE_URL）へのリンク
//   展示モードのときは ?kiosk=1 を付ける。本体側は、それを受けて「3分操作が無ければこのサイトの Top に戻る」
//   （本体への依頼文 docs/requests/main-app-explore-kiosk-return.md）
import { EXPLORE_URL } from './config.js';
import { isKiosk } from './kiosk.js';

function isExploreUrl(href) {
  return href === EXPLORE_URL || href.startsWith(`${EXPLORE_URL}/`) || href.startsWith(`${EXPLORE_URL}?`);
}

/**
 * みんなの記録へのリンクの href。展示モードなら ?kiosk=1 を足す。EXPLORE_URL の下でない href はそのまま返す
 * @param {string} [href]
 */
export function exploreHref(href = EXPLORE_URL) {
  if (!isKiosk() || typeof href !== 'string' || !isExploreUrl(href)) return href;
  const url = new URL(href);
  url.searchParams.set('kiosk', '1');
  return url.href;
}

/** [data-explore-link] の href を EXPLORE_URL にする（HTML に書いた URL より config.js を優先する） */
export function setupExploreLinks(root = document) {
  for (const link of root.querySelectorAll('[data-explore-link]')) link.href = exploreHref(EXPLORE_URL);
}
