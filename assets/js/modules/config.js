// サイトの設定

// 本体の公開ページ「みんなの記録」（一覧・告知・ナレッジ。いいね・コメントがあるので本体に置く）。末尾の / は付けない
// ★独自ドメインにしたら変える。assets/data/faq.json の links にも同じ URL を直接書いている（JSON はここを読めない）
export const EXPLORE_URL = 'https://evecre-ver-2-2-1.onrender.com/explore';

// イベントの id として受け付ける形（古い詳細の URL の ?id= を、みんなの記録の URL に移すときに確かめる）
export const EVENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
