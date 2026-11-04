// 依存なしの静的サーバー（開発・展示会場用）
//   node scripts/serve.mjs            → http://localhost:5173
//   node scripts/serve.mjs --port 8080
//   node scripts/serve.mjs --kiosk    → 展示モードで開く URL を表示
// 展示会場で一日動かし続ける前提なので、どの例外でもプロセスを落とさない。

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_PORT = 5173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

function parseArgs(argv) {
  const args = { port: DEFAULT_PORT, kiosk: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kiosk') args.kiosk = true;
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a.startsWith('--port=')) args.port = Number(a.slice('--port='.length));
  }
  if (!Number.isInteger(args.port) || args.port <= 0 || args.port > 65535) {
    console.error(`ポート番号が正しくありません。${DEFAULT_PORT} を使います。`);
    args.port = DEFAULT_PORT;
  }
  return args;
}

// URL のパスを ROOT の中のファイルパスに変える。ROOT の外を指すなら null
function resolvePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const filePath = path.resolve(ROOT, '.' + path.posix.normalize(decoded));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return null;
  return filePath;
}

function send(res, status, body, headers = {}) {
  if (res.headersSent) return res.end();
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

function serveFile(req, res, filePath, stat) {
  const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Accept-Ranges': 'bytes',
  };

  // 動画のシーク用に Range を受ける（Safari は Range が無いと動画を再生しない）
  let start = 0;
  let end = stat.size - 1;
  let status = 200;
  const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range && stat.size > 0) {
    if (range[1] === '') {
      start = Math.max(0, stat.size - Number(range[2]));
    } else {
      start = Number(range[1]);
      if (range[2] !== '') end = Math.min(end, Number(range[2]));
    }
    if (start > end || start >= stat.size) {
      return send(res, 416, '', { 'Content-Range': `bytes */${stat.size}` });
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = stat.size === 0 ? 0 : end - start + 1;

  res.writeHead(status, headers);
  if (req.method === 'HEAD' || stat.size === 0) return res.end();

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}

function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  const url = new URL(req.url, 'http://localhost');
  let filePath = resolvePath(url.pathname);
  if (!filePath) return send(res, 400, 'Bad Request');

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      // /foo → /foo/ に揃えてから index.html を返す（相対パスがずれないように）
      if (!url.pathname.endsWith('/')) {
        return send(res, 301, '', { Location: url.pathname + '/' + url.search });
      }
      filePath = path.join(filePath, 'index.html');
      return fs.stat(filePath, (err2, stat2) => {
        if (err2 || !stat2.isFile()) return send(res, 404, 'Not Found');
        serveFile(req, res, filePath, stat2);
      });
    }
    if (err || !stat.isFile()) return send(res, 404, 'Not Found');
    serveFile(req, res, filePath, stat);
  });
}

const args = parseArgs(process.argv.slice(2));

const server = http.createServer((req, res) => {
  try {
    handle(req, res);
  } catch (err) {
    console.error('[serve] リクエストの処理に失敗:', err);
    send(res, 500, 'Internal Server Error');
  }
});

server.on('clientError', (_err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  else socket.destroy();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ポート ${args.port} は使用中です。--port で別の番号を指定してください。`);
    process.exit(1);
  }
  console.error('[serve] サーバーのエラー:', err);
});

// 会場で落ちないように、拾い損ねた例外も記録だけして動かし続ける
process.on('uncaughtException', (err) => console.error('[serve] uncaughtException:', err));
process.on('unhandledRejection', (err) => console.error('[serve] unhandledRejection:', err));

server.listen(args.port, () => {
  const base = `http://localhost:${args.port}`;
  console.log(`配信中：${base}/`);
  if (args.kiosk) console.log(`展示モード：${base}/?kiosk=1`);
  console.log('止めるには Ctrl+C');
});
