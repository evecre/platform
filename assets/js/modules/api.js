// イベントのデータを取る。応答の形は docs/api-contract.md（snapshot・mock も API と同じ形）
//   一覧：{ ok: true, events: [...] }　詳細：{ ok: true, id, status, basic, knowledge }
//   展示モード：snapshot → API → mock
//   それ以外  ：API → snapshot → mock
//   mock は config.js の USE_MOCK_DATA が true のときだけ。API は API_BASE が空なら飛ばす
// snapshot と mock は静的ファイルなので、一覧に載っている id の詳細だけを取りに行く（無いファイルを取りに行って 404 を出さない）
// API の成功した応答は sessionStorage に API_CACHE_MS だけ置いて使い回す（回数制限の対策）
import { API_BASE, USE_MOCK_DATA, API_TIMEOUT_MS, API_CACHE_MS, SNAPSHOT_BASE, MOCK_BASE, EVENT_ID_RE } from './config.js';
import { isKiosk } from './kiosk.js';

class NotFoundError extends Error {}

/** API が回数制限（429）で断った。ほかの取り先でも取れなかったときにだけ投げる（ページは「混み合っています」と出す） */
export class RateLimitedError extends Error {}

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

const CACHE_PREFIX = 'evecre:api:';

function readCache(url) {
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    if (typeof savedAt === 'number' && Date.now() - savedAt < API_CACHE_MS) return data;
    window.sessionStorage.removeItem(CACHE_PREFIX + url);
  } catch {
    // 読めなければ取り直す
  }
  return null;
}

function writeCache(url, data) {
  try {
    window.sessionStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // 保存できなくても（容量・プライベートブラウズ）、そのまま使う
  }
}

// API から取る。形が正しい応答だけを置いておく（isValid が false の応答は置かない）
async function fetchApiJson(url, isValid) {
  const cached = readCache(url);
  if (cached && isValid(cached)) return cached;
  const data = await fetchJson(url);
  if (isValid(data)) writeCache(url, data);
  return data;
}

const isListResponse = (data) => data?.ok === true && Array.isArray(data.events);
const isDetailResponse = (data) => data?.ok === true && Boolean(data.basic) && typeof data.basic === 'object';

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (res.status === 404) throw new NotFoundError(url);
    if (res.status === 429) throw new RateLimitedError(url);
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
    const url = source.listUrl();
    const promise = (source.isStatic ? fetchJson(url) : fetchApiJson(url, isListResponse)).then((data) => {
      if (!isListResponse(data)) throw new Error(`一覧の形が違います: ${source.name}`);
      // snapshot がまだ無い（events が空）ときは、次の取り先へ
      if (source.isStatic && data.events.length === 0) throw new Error(`データがありません: ${source.name}`);
      return data.events;
    });
    // 失敗した一覧は覚えておかない（同じページで取り直せるように）
    promise.catch(() => listCache.delete(source.name));
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
  const errors = [];
  for (const source of sources()) {
    try {
      return await loadList(source);
    } catch (err) {
      errors.push(err);
    }
  }
  throw pickError(errors);
}

// どこからも取れなかったときに投げるもの。回数制限で断られていたら、それを優先する（ページの文が変わる）
function pickError(errors) {
  return errors.find((err) => err instanceof RateLimitedError) ?? errors.at(-1) ?? new Error('取り先がありません');
}

/**
 * 公開イベントの詳細
 * @param {string} id
 * @returns {Promise<object | null>}  見つからない（非公開を含む）ときは null
 * @throws どの取り先にもつながらなかったとき
 */
export async function getEvent(id) {
  if (typeof id !== 'string' || !EVENT_ID_RE.test(id)) return null;

  const errors = [];
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
      const url = source.detailUrl(id);
      const data = source.isStatic ? await fetchJson(url) : await fetchApiJson(url, isDetailResponse);
      if (!isDetailResponse(data)) throw new Error(`詳細の形が違います: ${source.name}`);
      return data;
    } catch (err) {
      // API の 404 は「公開されていない」という答え。ほかの取り先に聞き直さない
      if (err instanceof NotFoundError && !source.isStatic) return null;
      if (err instanceof NotFoundError) answered = true;
      else errors.push(err);
    }
  }
  if (answered || !errors.length) return null;
  throw pickError(errors);
}
