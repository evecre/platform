// 公開 API から一覧と全件の詳細を取り、assets/data/snapshot/ に保存する（展示会場でネットが無くても見せるため）
//   node scripts/fetch-snapshot.mjs                       → config.js の API_BASE から取る
//   node scripts/fetch-snapshot.mjs --api https://…       → 取り先を指定する
//   node scripts/fetch-snapshot.mjs --with-images         → 画像も snapshot/img/ に保存し、URL を書き換える
// 全部取れてから古い snapshot を消して書き込む（途中で失敗したら、前の snapshot はそのまま残る）

import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { API_BASE, API_TIMEOUT_MS, SNAPSHOT_BASE, EVENT_ID_RE } from '../assets/js/modules/config.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_DIR = path.join(ROOT, SNAPSHOT_BASE);
const IMAGE_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

function parseArgs(argv) {
  const args = { api: API_BASE, withImages: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--with-images') args.withImages = true;
    else if (argv[i] === '--api') args.api = argv[++i];
    else if (argv[i].startsWith('--api=')) args.api = argv[i].slice('--api='.length);
  }
  args.api = (args.api || '').replace(/\/+$/, '');
  return args;
}

async function fetchWithTimeout(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res;
}

async function fetchJson(url) {
  return (await fetchWithTimeout(url)).json();
}

// 画像を取って、保存するファイルの中身と名前を返す。同じ URL は1回だけ取る
function createImageStore(apiBase) {
  const files = new Map(); // 保存するファイル名 → 中身
  const urls = new Map(); // 元の URL → サイト内のパス

  async function localize(url) {
    if (typeof url !== 'string' || !url) return url;
    if (urls.has(url)) return urls.get(url);
    let absolute;
    try {
      absolute = new URL(url, apiBase);
    } catch {
      return url;
    }
    if (absolute.protocol !== 'http:' && absolute.protocol !== 'https:') return url;

    try {
      const res = await fetchWithTimeout(absolute.href);
      const type = (res.headers.get('content-type') || '').split(';')[0].trim();
      const ext = IMAGE_EXT[type];
      if (!ext) throw new Error(`画像ではありません（${type || '種類不明'}）`);
      const name = createHash('sha256').update(absolute.href).digest('hex').slice(0, 16) + ext;
      files.set(name, Buffer.from(await res.arrayBuffer()));
      const local = `${SNAPSHOT_BASE}/img/${name}`;
      urls.set(url, local);
      return local;
    } catch (err) {
      // 1枚取れなくても止めない（元の URL のまま残す。会場でネットがあれば出る）
      console.warn(`  画像を保存できませんでした：${url}（${err.message}）`);
      urls.set(url, url);
      return url;
    }
  }

  return { localize, files };
}

async function localizeEvent(detail, listItem, store) {
  if (detail.basic) detail.basic.headerImage = await store.localize(detail.basic.headerImage);
  listItem.headerImage = await store.localize(listItem.headerImage);
  for (const item of Array.isArray(detail.knowledge) ? detail.knowledge : []) {
    if (Array.isArray(item.images)) item.images = await Promise.all(item.images.map(store.localize));
    for (const file of Array.isArray(item.files) ? item.files : []) {
      file.thumb = await store.localize(file.thumb);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.api) {
    console.error('API の URL がありません。assets/js/modules/config.js の API_BASE を入れるか、--api で指定してください。');
    process.exit(1);
  }

  console.log(`一覧を取得：${args.api}/api/public/events`);
  const list = await fetchJson(`${args.api}/api/public/events`);
  if (!Array.isArray(list)) throw new Error('一覧の形が違います（配列ではない）');

  const events = list.filter((event) => {
    const ok = event && typeof event.id === 'string' && EVENT_ID_RE.test(event.id);
    if (!ok) console.warn(`  id の形が違うので飛ばします：${JSON.stringify(event?.id)}`);
    return ok;
  });

  const details = new Map();
  for (const event of events) {
    console.log(`  詳細を取得：${event.id}`);
    details.set(event.id, await fetchJson(`${args.api}/api/public/events/${encodeURIComponent(event.id)}`));
  }

  const store = args.withImages ? createImageStore(args.api) : null;
  if (store) {
    console.log('画像を保存しています…');
    for (const event of events) await localizeEvent(details.get(event.id), event, store);
  }

  // ここまで全部取れたら、古い snapshot を消して書き込む
  await rm(path.join(SNAPSHOT_DIR, 'events'), { recursive: true, force: true });
  await mkdir(path.join(SNAPSHOT_DIR, 'events'), { recursive: true });
  if (store) {
    await rm(path.join(SNAPSHOT_DIR, 'img'), { recursive: true, force: true });
    await mkdir(path.join(SNAPSHOT_DIR, 'img'), { recursive: true });
    for (const [name, data] of store.files) await writeFile(path.join(SNAPSHOT_DIR, 'img', name), data);
  }
  for (const [id, detail] of details) {
    await writeFile(path.join(SNAPSHOT_DIR, 'events', `${id}.json`), JSON.stringify(detail, null, 2) + '\n');
  }
  await writeFile(path.join(SNAPSHOT_DIR, 'events.json'), JSON.stringify(events, null, 2) + '\n');

  console.log(`保存しました：${events.length} 件${store ? `、画像 ${store.files.size} 枚` : ''}（${path.relative(ROOT, SNAPSHOT_DIR)}/）`);
}

main().catch((err) => {
  console.error(`snapshot を作れませんでした：${err.message}`);
  console.error('前の snapshot はそのまま残っています。');
  process.exit(1);
});
