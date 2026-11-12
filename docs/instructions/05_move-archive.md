# 指示書 05：公開イベントの閲覧を本体に移す（外部サイト側）

> 送り先：イベクリ外部サイト（別リポジトリ・Cloudflare Pages）を開発している Claude Code
> 作成：2026-11-11（Claude.ai での相談をもとに作成）
> **Phase ごとに止まって報告し、確認を待つこと。**

## 0. 背景

公開イベントに、いいね・コメントを付けることになった。外部サイト（pages.dev）からは本体（Render）のログイン Cookie を使えず、本体は他サイトからの書き込みを止めているので、**公開イベントの一覧・告知・ナレッジは本体の `/explore` で見せる**ことにした（本体側は別の指示書で実装中）。

外部サイトの役割はこうなる：

- **残す**：Top（イベクリの価値・使い方）、チャットボット
- **なくす**：イベント一覧（`pages/event-log/`）、詳細（`pages/event-log/detail/`）、「つまずいたこと」の索引（04 で作っていれば）
- **足す**：本体の一覧（`<本体の URL>/explore`）へ移動するボタン・リンク

★**本体の `/explore` が本番に出るまでは、このフェーズを始めないこと。** 先に消すと、公開イベントを見る場所がなくなる。ユーザーから「本体の /explore が本番に出た」と聞いてから始める。

★指示書 04 が途中なら、そこで止めて、どこまで進んだかを報告すること。

## 1. 最初に読むもの

1. `CLAUDE.md`
2. `docs/HANDOFF.md` の最新の記録
3. `docs/api-contract.md`

## 2. Phase 1：移動先の設定

- `assets/js/modules/config.js` に `EXPLORE_URL`（本体の `/explore` の URL）を足す。値はユーザーに確認する
- ヘッダーの「イベント一覧」リンクと、Top のアーカイブ紹介の画面のボタンを、`EXPLORE_URL` へのリンクにする
  - 同じタブで開く（別のサイトに移ることが分かる文言にする。例：「公開イベントを見る」）
- チャットボットの回答や `links` に `pages/event-log/` を指しているものがあれば、`EXPLORE_URL` に変える

**報告して止まる。**

## 3. Phase 2：一覧・詳細のページをなくす

- `pages/event-log/` 以下を消す（`index.html` / `detail/` / 04 の索引）
- 古い URL で来た人のために、Cloudflare Pages の `_redirects` を足す：
  - `/pages/event-log/` → `EXPLORE_URL`（302）
  - `/pages/event-log/detail/?id=<id>` → `<本体の URL>/explore/<id>`（`_redirects` でクエリを引き継げるか確かめ、できなければ、詳細ページだけ「id を読んで移動するだけの小さなページ」として残す）
- 一覧・詳細でしか使っていない JS / CSS / 仮データを消す（`api.js` / `eventView.js` / `_event-*.css` / `assets/data/mock/` など）。**Top やチャットボットで使っているものは残す**。消す前に、どこから使われているかを確かめて一覧で報告する
- `assets/css/style.css` の `@import` と `assets/css/README.md` の早見表を更新する
- `docs/api-contract.md` は消さずに残し、冒頭に「一覧・詳細は本体の `/explore` に移した」と書く

**報告して止まる。**

## 4. 完了条件

- `npm run check` が通る
- `npm run build && node scripts/serve.mjs --root dist` で、Top・チャットボットが動き、コンソールにエラーが無い
- 「公開イベントを見る」で本体の `/explore` が開く
- 古い一覧・詳細の URL で来ても、本体の対応するページに移る
- `noindex, nofollow` の3点（meta・`robots.txt`・`_headers`）は残っている
- `CLAUDE.md`（サイトの役割・決定事項）、`docs/START.md` の表、`docs/HANDOFF.md` を更新
- feature ブランチ → commit → `git push origin HEAD`
