// データの取り方の設定。ブラウザ（api.js）と Node（scripts/fetch-snapshot.mjs）の両方から読む

// イベクリ本体の公開 API の根元（末尾の / は付けない）。空なら API は使わない
// ★本体側の Render の環境変数 PUBLIC_SITE_ORIGINS に、このサイトの Origin が入っていないと CORS で読めない
export const API_BASE = 'https://evecre-ver-2-2-1.onrender.com';

// 仮データ（assets/data/mock/）を最後の手段として使うか。ローカル（localhost）で動かすときだけ使う
// （Node から読むとき（scripts/）は location が無いので false）
export const USE_MOCK_DATA = globalThis.location?.hostname === 'localhost';

// API の応答を sessionStorage に置いて使い回す時間（API の Cache-Control: max-age=300 と同じ）
// API は同じ IP から 1分 60 回までなので、ページを行き来しても取り直さないようにする
export const API_CACHE_MS = 5 * 60 * 1000;

export const API_TIMEOUT_MS = 8000;

export const SNAPSHOT_BASE = '/assets/data/snapshot';
export const MOCK_BASE = '/assets/data/mock';

// イベントの id として受け付ける形（ファイル名・URL に使うので、それ以外は弾く）
export const EVENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// チャットボットを Top だけに出すか（false なら全ページ）
export const CHATBOT_TOP_ONLY = false;

// 本体の公開ページ「みんなの記録」（一覧・告知・ナレッジ。いいね・コメントがあるので本体に置く）。末尾の / は付けない
// ★独自ドメインにしたら変える。assets/data/faq.json の links にも同じ URL を直接書いている（JSON はここを読めない）
export const EXPLORE_URL = 'https://evecre-ver-2-2-1.onrender.com/explore';
