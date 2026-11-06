// リポジトリ内の全 JS（.js / .mjs）に node --check をかける
//   node scripts/check-js.mjs

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist']); // dist/ は npm run build のコピー

function collect(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collect(path.join(dir, entry.name), out);
    } else if (/\.m?js$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const files = collect(ROOT);
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    console.error(`NG  ${path.relative(ROOT, file)}\n${result.stderr}`);
  }
}

console.log(`${files.length - failed} / ${files.length} 件 OK`);
process.exit(failed ? 1 : 0);
