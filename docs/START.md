# START — 新しいセッションで最初にやること

## 読む順番

1. `CLAUDE.md`（規約・決定事項）
2. `docs/HANDOFF.md` の**いちばん新しい記録**（前回どこまで進んだか・次にやること）
3. ユーザーから渡された指示書（`docs/instructions/` の該当ファイル）
4. 公開イベントは本体の「みんなの記録」（`/explore`）に移した（05）。本体の公開 API の取り決めは `docs/api-contract.md`（記録として残している）

## ローカルで動かす

```
node scripts/serve.mjs          # http://localhost:5173
node scripts/serve.mjs --kiosk  # 展示モードで開く URL を表示
npm run build && node scripts/serve.mjs --root dist   # Cloudflare Pages に出すもの（dist/）で確かめる
```

## 展示会場で

```
node scripts/serve.mjs --kiosk      # → http://localhost:5173/?kiosk=1 を全画面で開く
```

- 「みんなの記録」は本体（Render）のページなので、**会場でネットが要る**（前の snapshot の仕組みは 05 で消した）
- 本体のページで3分操作が無いと、本番の Top（`https://evecre.pages.dev/?kiosk=1`）に戻る。ローカルで動かしていても戻り先は本番になる。会場でも本番の `https://evecre.pages.dev/?kiosk=1` を開いて使うと、行き来が揃う

ES Modules と fetch を使うので、HTML をファイルとして直接開かない（必ずローカルサーバー経由）。

## 確認コマンド

```
node --check <編集した JS>
npm run check                    # 全 JS に node --check
node scripts/check-faq.mjs       # チャットボットの正答率（02 以降）
```

## Cloudflare Pages の設定（本番：https://evecre.pages.dev）

| 項目 | 値 |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| 環境変数 | 不要（秘密情報は無い） |

`dist/` に入るのは `index.html`・`pages/`・`assets/`・`favicon.ico`・`robots.txt`・`_headers` だけ（`faq-tests.json`・`.md` は除く）。中身は `scripts/build-dist.mjs`。

## 指示書の一覧と状態

| 番号 | 内容 | 状態 |
|---|---|---|
| 01 | 開発環境・ページの骨組み・スクロールの舞台・展示モード・イベント一覧/詳細（仮データ） | 完了（2026-11-04。main にマージ済み） |
| 02 | チャットボット（自作 FAQ エンジン・パネル UI・正答率チェック） | 完了（2026-11-04。main にマージ済み） |
| 03 | 本体の公開 API につなぐ・Cloudflare Pages に出す準備 | 完了（2026-11-06。main にマージ済み） |
| 04 | イベント一覧・詳細を読み物にする（判定・件数・つまずいたことの索引） | 完了（2026-11-08。main にマージ済み） |
| 05 | 公開イベントの閲覧を本体の「みんなの記録」（/explore）に移す（一覧・詳細・索引を消す・古い URL から移す） | Phase 2 まで完了（2026-11-12。`feature/05-move-archive`。main へのマージ待ち） |
| — | 本体側：公開 API（別の Claude Code が担当） | 完了（本体 d7ed899。main にマージ・Render にデプロイ済み） |

状態は作業のたびにこの表を更新すること。

## 作業の終わりに

1. `docs/HANDOFF.md` に記録を追加（テンプレートはファイル内）
2. `CLAUDE.md` に新しい決まり・機能を追記
3. この表の状態を更新
4. commit → `git push origin HEAD`
