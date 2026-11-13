// Cloudflare Pages に出すファイルだけを dist/ にコピーする（依存なし。Pages の Build command：npm run build）
//   node scripts/build-dist.mjs
// リポジトリの直下をそのまま配信すると CLAUDE.md・docs/・scripts/・package.json まで公開されるため、
// 配信するものを INCLUDE に並べ、そこから EXCLUDE に当たるものを除く。中身は書き換えない

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const INCLUDE = ['index.html', 'pages', 'assets', 'favicon.ico', 'robots.txt', '_headers'];

// 配信しないもの（ROOT からの相対パス・ファイル名）
const EXCLUDE_PATHS = new Set([
  'assets/data/faq-tests.json', // チャットボットのテスト用
]);
const EXCLUDE_NAMES = new Set(['.DS_Store']);
const EXCLUDE_EXT = new Set(['.md']); // assets/css/README.md など、開発用の説明

function shouldCopy(src) {
  const rel = path.relative(ROOT, src).split(path.sep).join('/');
  const name = path.basename(src);
  return !EXCLUDE_PATHS.has(rel) && !EXCLUDE_NAMES.has(name) && !EXCLUDE_EXT.has(path.extname(name).toLowerCase());
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  for (const entry of INCLUDE) {
    const src = path.join(ROOT, entry);
    try {
      await stat(src);
    } catch {
      throw new Error(`見つかりません：${entry}`);
    }
    await cp(src, path.join(DIST, entry), { recursive: true, filter: shouldCopy });
  }

  console.log(`dist/ を作りました（${INCLUDE.join('、')}）`);
}

main().catch((err) => {
  console.error(`dist/ を作れませんでした：${err.message}`);
  process.exit(1);
});
