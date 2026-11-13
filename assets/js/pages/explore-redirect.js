// 古い URL（一覧 /pages/event-log/・詳細 /pages/event-log/detail/?id=…・索引 /pages/event-log/struggles/）から、
// 本体の「みんなの記録」（config.js の EXPLORE_URL）に移るだけのページの入口（指示書 05）
//   ?id= があって形が正しければ EXPLORE_URL/<id>（ナレッジが無いイベントは、本体が告知のモーダルに置き換える）、無ければ一覧
//   Cloudflare Pages の _redirects は ?id= の値をパスに移せないので、JS で移す。展示モードなら ?kiosk=1 を足す
import { EXPLORE_URL, EVENT_ID_RE } from '../modules/config.js';
import { exploreHref } from '../modules/exploreLink.js';

const id = new URLSearchParams(window.location.search).get('id');
const target = exploreHref(id && EVENT_ID_RE.test(id) ? `${EXPLORE_URL}/${encodeURIComponent(id)}` : EXPLORE_URL);

// JS が動かないときのために、リンクも同じ行き先にしておく
const link = document.querySelector('[data-explore-redirect]');
if (link) link.href = target;
window.location.replace(target);
