# START — 新しいセッションで最初にやること

## 読む順番

1. `CLAUDE.md`（規約・決定事項）
2. `docs/HANDOFF.md` の**いちばん新しい記録**（前回どこまで進んだか・次にやること）
3. ユーザーから渡された指示書（`docs/instructions/` の該当ファイル）
4. イベントのデータを扱うなら `docs/api-contract.md`

## ローカルで動かす

```
node scripts/serve.mjs          # http://localhost:5173
node scripts/serve.mjs --kiosk  # 展示モードで開く URL を表示
npm run build && node scripts/serve.mjs --root dist   # Cloudflare Pages に出すもの（dist/）で確かめる
```

本番の API を読めるのは `http://localhost:5173` だけ（127.0.0.1 や別のポートは CORS で読めない）。

## 展示会場で

```
npm run snapshot -- --with-images   # 本番の公開データを assets/data/snapshot/ に保存（会場に出る前に、その端末で）
node scripts/serve.mjs --kiosk      # → http://localhost:5173/?kiosk=1 を全画面で開く
```

snapshot は実際のイベントのデータなので commit しない（リポジトリの snapshot は空のまま）。

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

`dist/` に入るのは `index.html`・`pages/`・`assets/`・`favicon.ico`・`robots.txt`・`_headers` だけ（`faq-tests.json`・`assets/data/mock/`・`.md` は除く）。中身は `scripts/build-dist.mjs`。

## 指示書の一覧と状態

| 番号 | 内容 | 状態 |
|---|---|---|
| 01 | 開発環境・ページの骨組み・スクロールの舞台・展示モード・イベント一覧/詳細（仮データ） | 完了（2026-11-04。main にマージ済み） |
| 02 | チャットボット（自作 FAQ エンジン・パネル UI・正答率チェック） | 完了（2026-11-04。main にマージ済み） |
| 03 | 本体の公開 API につなぐ・Cloudflare Pages に出す準備 | 完了（2026-11-06。main にマージ済み） |
| 04 | イベント一覧・詳細を読み物にする（判定・件数・つまずいたことの索引） | 進行中（§3・§4・§6 完了。§5 は件数の報告後） |
| — | 本体側：公開 API（別の Claude Code が担当） | 完了（本体 d7ed899。main にマージ・Render にデプロイ済み） |

状態は作業のたびにこの表を更新すること。

## 作業の終わりに

1. `docs/HANDOFF.md` に記録を追加（テンプレートはファイル内）
2. `CLAUDE.md` に新しい決まり・機能を追記
3. この表の状態を更新
4. commit → `git push origin HEAD`
