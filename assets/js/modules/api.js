// イベントのデータを取る。応答の形は docs/api-contract.md
//   展示モード：snapshot → API → mock
//   それ以外  ：API → snapshot → mock
//   mock は config.js の USE_MOCK_DATA が true のときだけ。API は API_BASE が空なら飛ばす
// snapshot と mock は静的ファイルなので、一覧に載っている id の詳細だけを取りに行く（無いファイルを取りに行って 404 を出さない）
import { API_BASE, USE_MOCK_DATA, API_TIMEOUT_MS, SNAPSHOT_BASE, MOCK_BASE, EVENT_ID_RE } from './config.js';
import { isKiosk } from './kiosk.js';

class NotFoundError extends Error {}

function apiSource() {
  return {
    name: 'api',
    listUrl: () => `${API_BASE}/api/public/events`,
    detailUrl: (id) => `${API_BASE}/api/public/events/${encodeURIComponent(id)}`,
    isStatic: false,
  };
}

function staticSource(name, base) {
  return {
    name,
    listUrl: () => `${base}/events.json`,
    detailUrl: (id) => `${base}/events/${id}.json`,
    isStatic: true,
  };
}

function sources() {
  const api = API_BASE ? [apiSource()] : [];
  const snapshot = [staticSource('snapshot', SNAPSHOT_BASE)];
  const mock = USE_MOCK_DATA ? [staticSource('mock', MOCK_BASE)] : [];
  return isKiosk() ? [...snapshot, ...api, ...mock] : [...api, ...snapshot, ...mock];
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (res.status === 404) throw new NotFoundError(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 同じページの中では、各取り先の一覧を1回だけ取る
const listCache = new Map();

function loadList(source) {
  if (!listCache.has(source.name)) {
    const promise = fetchJson(source.listUrl()).then((data) => {
      if (!Array.isArray(data)) throw new Error(`一覧の形が違います: ${source.name}`);
      // snapshot がまだ無い（空の配列）ときは、次の取り先へ
      if (source.isStatic && data.length === 0) throw new Error(`データがありません: ${source.name}`);
      return data;
    });
    listCache.set(source.name, promise);
  }
  return listCache.get(source.name);
}

/**
 * 公開イベントの一覧
 * @returns {Promise<object[]>}
 * @throws どの取り先からも取れなかったとき
 */
export async function listEvents() {
  let lastError = null;
  for (const source of sources()) {
    try {
      return await loadList(source);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('取り先がありません');
}

/**
 * 公開イベントの詳細
 * @param {string} id
 * @returns {Promise<object | null>}  見つからない（非公開を含む）ときは null
 * @throws どの取り先にもつながらなかったとき
 */
export async function getEvent(id) {
  if (typeof id !== 'string' || !EVENT_ID_RE.test(id)) return null;

  let lastError = null;
  let answered = false; // どこかの取り先が「無い」と答えた
  for (const source of sources()) {
    try {
      if (source.isStatic) {
        const list = await loadList(source);
        if (!list.some((event) => event.id === id)) {
          answered = true;
          continue;
        }
      }
      const data = await fetchJson(source.detailUrl(id));
      if (!data || typeof data !== 'object' || !data.basic) throw new Error(`詳細の形が違います: ${source.name}`);
      return data;
    } catch (err) {
      // API の 404 は「公開されていない」という答え。ほかの取り先に聞き直さない
      if (err instanceof NotFoundError && !source.isStatic) return null;
      if (err instanceof NotFoundError) answered = true;
      else lastError = err;
    }
  }
  if (answered || !lastError) return null;
  throw lastError;
}
