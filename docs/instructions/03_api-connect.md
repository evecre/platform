# 指示書 03：本体の公開 API につなぐ・Cloudflare Pages に出す準備

> 前提：`CLAUDE.md`、`docs/START.md`、`docs/HANDOFF.md` の最新の記録、`docs/api-contract.md`（本体の報告に置き換え済み）を読むこと。
> **Phase ごとに止まって報告し、確認を待つ。**

---

## Phase 1：応答の形を実際の API に合わせる

`docs/api-contract.md` の末尾「サイト側の対応」の表のとおりに直す。

- `assets/js/modules/api.js`
  - 一覧は `data.events` を読む。`ok !== true` や `events` が配列でないときは失敗として扱う（次の取り先へ）
  - 詳細も `ok` を確認する。404 は「見つからない」、429 は「混み合っています」として、ほかの失敗と分ける
  - snapshot と mock も、API と同じ形（`{ ok, events }` / `{ ok, id, status, basic, knowledge }`）に揃える。`scripts/fetch-snapshot.mjs` は API の応答をそのまま保存する
- `assets/js/pages/event-detail.js`
  - success の見出しを「効いたこと」／「何をしたら、うまくいった？」に変える
  - `struggle` が空なら、その項目を出さない（success では普通は空）
  - 画像は本文の後ろにまとめて並べる。PDF は `download` を付けず、新しいタブで開くリンクにする（`thumb` があれば画像として出す）
- 日付を `new Date("YYYY-MM-DD")` で扱っている箇所がないか確かめる（あれば年月日に分けて扱う）
- mock のデータも実際の形に合わせて更新する

**報告して止まる。**

---

## Phase 2：本番の API に切り替える

- `assets/js/modules/config.js`
  - `API_BASE` に本体の本番 URL（ユーザーに確認して入れる。Render の URL）
  - `USE_MOCK_DATA` を、ローカル（`location.hostname === 'localhost'`）のときだけ true、それ以外は false にする
- 回数制限（1分 60 回）への対策：一覧・詳細の応答を `sessionStorage` に 5 分だけ保存して使い回す（API の `max-age=300` と同じ。読み書きは try/catch）
- `http://localhost:5173` で一覧と詳細が本番のデータで出ることを確かめる
  - 本体側の Render に `PUBLIC_SITE_ORIGINS` が入っていないと CORS で失敗する。失敗したら、その旨をユーザーに報告する（サイト側で回避しない）
- `npm run snapshot -- --with-images` を実行し、snapshot が作られることを確かめる。展示モード（`?kiosk=1`）で snapshot が使われることを確かめる

**報告して止まる。**

---

## Phase 3：Cloudflare Pages に出すファイルを絞る

今のままリポジトリの直下を配信すると、`CLAUDE.md`、`docs/`、`scripts/`、`package.json` も公開されてしまう。配信用のフォルダを作る。

- `scripts/build-dist.mjs`（依存なし）：`dist/` を空にしてから、次だけをコピーする
  - `index.html`、`pages/`、`assets/`、`favicon.ico`、`robots.txt`、`_headers`
  - `assets/data/faq-tests.json` は除く（テスト用）
- `package.json` に `"build": "node scripts/build-dist.mjs"`
- `.gitignore` に `dist/`
- `node scripts/serve.mjs --root dist` で、`dist/` を配信して確認できるようにする（`--root` が無ければ足す）
- Cloudflare Pages の設定値を `docs/START.md` に書く：
  - Framework preset：None
  - Build command：`npm run build`
  - Build output directory：`dist`
  - Production branch：`main`

---

## 完了条件

- `npm run check` と `node scripts/check-faq.mjs` が通る
- localhost で本番データの一覧・詳細が出る（または CORS の未設定を報告）
- `dist/` に `CLAUDE.md` / `docs/` / `scripts/` / `package.json` が無い
- `CLAUDE.md`（公開 API の節・配信の節）、`docs/START.md`、`docs/HANDOFF.md` を更新
- feature ブランチ → commit → `git push origin HEAD`
