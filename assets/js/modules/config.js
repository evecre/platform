// データの取り方の設定。ブラウザ（api.js）と Node（scripts/fetch-snapshot.mjs）の両方から読む

// イベクリ本体の公開 API の根元（例：'https://evecre.onrender.com'）。空なら API は使わない
// TODO: 本体の公開 API ができたら、本番の Render の URL を入れる
export const API_BASE = '';

// 仮データ（assets/data/mock/）を最後の手段として使うか。★本番に出す前に false にする
export const USE_MOCK_DATA = true;

export const API_TIMEOUT_MS = 8000;

export const SNAPSHOT_BASE = '/assets/data/snapshot';
export const MOCK_BASE = '/assets/data/mock';

// イベントの id として受け付ける形（ファイル名・URL に使うので、それ以外は弾く）
export const EVENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
