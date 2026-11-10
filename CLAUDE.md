# イベクリ 外部サイト — CLAUDE.md

作業を始める前に必ずこのファイルと `docs/START.md`、`docs/HANDOFF.md` の最新の記録を読むこと。
作業が終わったら、`docs/HANDOFF.md` に記録を追加し、このファイルに新しい決まりや機能を追記すること。

---

## 1. このサイトは何か

イベクリ（学生のイベントづくりを支える Web アプリ）の**外部サイト**。イベクリ本体とは別のリポジトリ。

目的：
- イベクリを知らない人に、価値と有効性を伝える
- ユーザーの「何ができるの？」「どう使うの？」を解消する（Top ＋ チャットボット）
- イベクリで公開設定されたイベントの**告知**と**アーカイブ（ナレッジ）**を見せる。将来はプラットフォームにする
- **展示会**で、イベクリの実機と並べて展示する。55インチモニターにも映す

イベクリ自体の説明は、ほぼ **Top ページだけ**にある。操作方法も Top で簡潔に伝える。

## 2. 技術と方針

- 静的サイト：HTML ＋ CSS ＋ Vanilla JS（ES Modules）。**ビルド工程なし・フレームワークなし**
- 依存は最小限。npm パッケージを足す前に、自前で短く書けないか考え、足すなら理由を HANDOFF に書く
- 配信：Cloudflare Pages（本番 https://evecre.pages.dev）。**配信するのは `npm run build` で作る `dist/` だけ**（§12）。展示会場では**ローカルで動かす**（`node scripts/serve.mjs` → http://localhost:5173）
- イベントのデータは、イベクリ本体の**公開 API**（`/api/public/events`）からだけ取る。応答の形は `docs/api-contract.md`
  - API が使えないとき・展示モードのときは、`assets/data/snapshot/` に書き出したデータを読む
- チャットボットは**外部サービスを使わない自作**（ブラウザ内で完結。無料・回数無制限）

## 3. ディレクトリ

```
index.html                         Top（スクロールで画面が切り替わる）
pages/event-log/index.html         イベント一覧（告知・アーカイブ）
pages/event-log/detail/index.html  イベント詳細（?id=…）
pages/event-log/struggles/index.html  つまずいたことの横断索引（04）
assets/
  css/
    style.css                      @import だけを書く（並び＝詳細度の弱い順）
    vendor/reset/                  既存の reset（中身を確かめてから foundation に取り込む）
    foundation/  layout/  object/component/  object/project/  object/utility/
  js/
    pages/                         ページごとの入口（top.js / event-log.js / event-detail.js）
    modules/                       共通の部品（scrollStage, kiosk, idleReturn, api, chatbot/ …）
    vendor/
  img/  common/ top/ event-log/
  data/
    faq.json  synonyms.json  faq-tests.json   チャットボットのデータ
    mock/                          API ができるまでの仮データ
    snapshot/                      展示用に書き出した公開データ
scripts/                           serve.mjs / fetch-snapshot.mjs / check-faq.mjs など（Node）
docs/                              START / HANDOFF / api-contract / instructions/
robots.txt  _headers               検索エンジン対策（§6）
```

## 4. CSS — FLOCSS（必須）

イベクリ本体と同じ規約で書く。

| レイヤー | 接頭辞 | 書くもの | 判断基準 |
|---|---|---|---|
| Foundation | なし | reset、変数（トークン）、素の要素、文字サイズ、共有 `@keyframes` | サイト全体の前提か |
| Layout | `l-` | ヘッダー、フッター、スクロールの舞台 | 1ページに1つしか無い領域か |
| Component | `c-` | ボタン、イベントカード、チャットボット | 2ページ以上で使い回すか |
| Project | `p-` | ページ固有のブロック（`p-hero`、`p-top-concept`、`p-event-detail` …） | 特定のページだけで意味を持つか |
| Utility | `u-` | `u-hidden` など | 最後の手段。増やさない |

守ること：
- Component は自身の外側の余白（margin）と位置を持たない。配置は親（`l-` / `p-`）が決める
- Project から Component の中身を直接上書きしない。必要なら `c-` に modifier を足す
- `!important` 禁止（`u-hidden` だけ例外）。CSS Nesting を使わない。`id` にスタイルを当てない
- 色・サイズを直書きしない。`foundation/_variables.css` に名前を付けてから使う
- 状態は `is-` クラス（`is-active` / `is-open`）または `data-state` 属性。JS からスタイルを直接書かない（例外：スクロール量を渡す CSS 変数 `--progress`）
- HTML に `<style>` / `style=""` を書かない
- 命名は BEM（`p-hero__title` / `c-button--primary`）
- **見た目はユーザー（Usami）が作り込む**。Claude Code は構造と動きの仕組みを作り、装飾は最小限（仮の配置・仮の文字サイズ）に留める

## 5. JS の決まり

- JS を編集したら必ず `node --check <file>` を通す
- `<script type="module">` で読み込む。インラインスクリプトを書かない
- ブラウザ保存は `sessionStorage` の展示モードフラグ（`evecre:kiosk`）と、API の応答のキャッシュ（`evecre:api:<URL>`、5分）だけ。読み書きは try/catch で包む
- `prefers-reduced-motion: reduce` のときは、自動送りのスクロールを瞬時に切り替える

## 6. 公開範囲（必須）

最初は**検索エンジンに載せない。リンクを知っている人だけが見る**。次の3つを必ず入れる：
1. 全ページの `<meta name="robots" content="noindex, nofollow">`
2. `robots.txt`：`User-agent: *` / `Disallow: /`
3. `_headers`（Cloudflare Pages）：`/*` に `X-Robots-Tag: noindex, nofollow`

注意：これは「検索に載らない」だけで、URL を知っている人は誰でも見られる。強い制限が必要になったら Cloudflare Access を検討する（ユーザーに相談）。

イベントの表示：
- API が返すフィールドだけを表示する。**団体名・メンバー名・ユーザー名は出さない**（API 側で落としてあるが、サイト側で別の手段で足さない）

## 7. 展示モード

- URL に `?kiosk=1` が付いたときだけ有効。`sessionStorage` に保存し、ページを移っても続く（`?kiosk=0` で解除）
- **Top**：30秒ごとに次の画面へ自動で進む。最後まで行ったら最初へ。ユーザーが操作したら止め、30秒操作が無ければ再開
- **Top 以外**：3分間操作（スクロール・タッチ・クリック・キー入力）が無ければ Top に戻る
- チャットボットを開いている間は自動送りを止める
- 展示モードのデータは `assets/data/snapshot/` を優先する

## 8. git

- feature ブランチで作業 → commit → `git push origin HEAD`（`git push origin main` は使わない）→ 確認できたら main にマージ
- `.env` や秘密情報を置かない（このサイトに秘密情報は不要）
- イベクリ本体のリポジトリは触らない。本体側の変更が必要なら、HANDOFF に「本体側に頼むこと」として書く

## 9. 決定事項（2026-11-03 Claude.ai での相談）

- 本体とは別リポジトリで開発する。本体側には公開 API の指示書を別に送る
- ホスティングは Cloudflare Pages（静的配信は本体側の Cloudflare 無料枠を消費しない）
- 展示モードは `?kiosk=1` のときだけ
- 公開の種類は「基礎情報だけ（告知）」と「ナレッジ（タスクと振り返り）」の2つ。ナレッジの中身は振り返りごとの `shareable` で決まる（本体側で設定済み）
- チャットボットは自作：文字の重なり（2文字ずつ）＋ 言い回し・類義語の登録 ＋ 自信がないときの「もしかして」。外部サービス・LLM は使わない。精度が足りなければ、ブラウザ内の意味検索（Transformers.js）を後から足す
- チャットボットは Top 右下のボタンからパネルを重ねて開く（別ページにしない）。部品として作り、他のページにも置ける
- hero は `<section class="p-hero">` で書いてよい（見出し `h1` を持たせる）

## 10. 作った仕組み（01 で追加）

- **Top のスクロールの舞台**：`assets/js/modules/scrollStage.js` ＋ `assets/css/layout/_stage.css`
  - `section.l-stage__scene` はスクロールの長さだけ（`data-steps` × 100svh）。中の `.l-stage__frame` を画面に固定して見せる（指示書の「section を sticky」だと scene の境目で画面がスライドするため、こうした）
  - JS が付けるのは `data-state`（before / active / after）、`--progress`、`data-step` だけ。見せ方は `p-` の CSS で作る。使い方と scene の足し方は `assets/css/README.md` §4
  - `createScrollStage()` は `{ goTo, next, prev, current, count }` を返す（展示モードの自動送りで使う）
- **展示モード**：`assets/js/modules/kiosk.js` に判定と時間の定数（`AUTO_ADVANCE_MS` / `RESUME_AFTER_MS` / `IDLE_RETURN_MS`）。sessionStorage のキーは `evecre:kiosk`（値 `1` / `fast`）。`?kiosk=1&fast=1` で時間が 10 分の 1
  - Top の自動送り：`autoAdvance.js`（操作＝wheel / touchstart / pointerdown / keydown。scroll は自動送り自身が起こすので含めない）。最後から最初へは瞬時に戻す
  - Top 以外の無操作で戻る：`idleReturn.js`（操作に scroll も含める。`location.replace` で戻る）
  - チャットボットは開いたとき `chatbot:open`、閉じたとき `chatbot:close` を **document で**発火すること（自動送りが止まる・再開する）
  - 展示中は `<html class="is-kiosk">`
- **イベントのデータ**：`assets/js/modules/api.js`（`listEvents()` / `getEvent(id)` / `listReflections()`）。設定は `config.js`（`API_BASE`・`USE_MOCK_DATA`）
  - 取る順番：展示モードは snapshot → API → mock、それ以外は API → snapshot → mock。`API_BASE` が空なら API を飛ばす。snapshot の `events.json` の `events` が空なら「まだ無い」とみなして次へ
  - snapshot と mock も API と同じ形（一覧 `{ ok, events }`・詳細 `{ ok, id, status, basic, knowledge }`）。API の 429 は `RateLimitedError`（ほかの取り先でも取れなかったときだけ投げる。ページは「混み合っています」）
  - `API_BASE` は本番の Render（`https://evecre-ver-2-2-1.onrender.com`）。`USE_MOCK_DATA` は localhost のときだけ true（自動。Node から読むと false）
  - API の成功した応答は sessionStorage に `API_CACHE_MS`（5分）置いて使い回す（API は同じ IP から1分60回まで）
  - CORS：本体の Render の `PUBLIC_SITE_ORIGINS` に入っている Origin だけ読める（2026-11-06 時点：`http://localhost:5173`・`https://evecre.pages.dev`）。`127.0.0.1` や別のポートでは読めない
  - snapshot：`npm run snapshot -- --with-images`（または `node scripts/fetch-snapshot.mjs --api <URL> --with-images`）。全部取れてから入れ替える。`reflections.json` も保存する（API に無ければ作らず、古いものは消す）
  - snapshot の `events/`・`img/`・`reflections.json` は `.gitignore` に入れてある（`events.json` だけは空の形で commit してある）
  - カード・ナレッジ1件の HTML は各ページの `<template>` にある。文字は `textContent`、URL は `safeUrl()` を通す（`innerHTML` に API の値を入れない）
  - 表示・非表示の切り替えは `u-hidden`（`hidden` 属性は、クラスの `display` に負けるので使わない）
- **文字サイズ**：`html` の font-size が画面に合わせて伸びる（16px → 1920×1080 で 20px → 4K で 40px）。サイズは rem で書く
- **動きの時間**：`--duration-*` を使う。動きを減らす設定で 0 になる

## 11. チャットボット（02 で追加）

- 判定：`assets/js/modules/chatbot/`（`normalize.js` → `matcher.js` → `engine.js`。DOM に依存しない）。パネル：`chatbot.js`（`startChatbot({ kiosk })`。`common.js` から起動）
  - 全ページに出す。Top だけにするなら `config.js` の `CHATBOT_TOP_ONLY = true`
  - 答え・質問の文はすべて `textContent`、リンクは `safeUrl()` を通す
  - 展示モードで `CHATBOT_RESET_MS`（kiosk.js）操作が無ければ、閉じて最初のあいさつに戻す
  - パネルの中の keydown は Top の舞台に渡さない（stopPropagation）
- データ：`assets/data/faq.json`（カテゴリと質問）・`synonyms.json`（類義語）・`faq-tests.json`（正答率のテスト）
  - 質問を足す：`items` に1件足す。`id`（英小文字とハイフン）・`category`（`categories` の id）・`question`・`patterns`（言い回し。**5個以上**）・`keywords`（その項目らしい語。1つ含まれるごとに +0.1）・`answer`（改行可）・`links`（`/` か `https://` で始まる）・`related`（ほかの項目の id）・`featured`（カテゴリを選んだときに出すか）
  - 言い回しが違うだけで外れるときは、まず `synonyms.json`（代表の語 → 言い換えの一覧）に足す。全部の項目に効く。語尾・つなぎは `normalize.js` の `FILLER_PHRASES`
  - テストの文を、そのまま `patterns` に写さない（テストが意味を失う）
  - 足したら `npm run check:faq`（`--tune` でしきい値の表）。faq.json に誤り（id の重複・無い related・patterns 5個未満・無いカテゴリ）があると終了コード 1
- しきい値（`engine.js`）：1位の点数が `THRESHOLD_ANSWER`（0.55）以上で、2位との差が `MIN_MARGIN`（0.05）以上なら回答。`THRESHOLD_SUGGEST`（0.30）以上なら「もしかして」（上位3件）。それ未満は「答えられない」でカテゴリに戻す
  - 下げると答える数が増えるが、**違う答え（誤答）を出しやすくなる**。誤答は「もしかして」より悪いので、`--tune` の表で誤答 0 を保てる範囲で決める（2026-11-04：0.50 以下で誤答が出る）
- キャラクター：`assets/js/modules/character.js`（`pickCharacter()` は読み込みごとに1体。`createCharacter(ch, { className })`）＋ `object/component/_character.css`
  - 素材は `assets/img/character/`。目の寸法・位置は素材から実測した値。勝手に変えない
  - 瞬き・目線は「たまに」（瞬き 13〜19秒、目線 29〜41秒）。短くしない。動きを減らす設定では止める

## 12. 公開 API と配信（03 で追加）

- 公開 API：本体（`https://evecre-ver-2-2-1.onrender.com`）の `/api/public/events`・`/api/public/events/:id`。形と注意点は `docs/api-contract.md`
  - 一覧 `{ ok: true, events }`、詳細 `{ ok: true, id, status, basic, knowledge }`。404 は見つからない（非公開を含む）、429 は回数制限（同じ IP から1分60回）
  - CORS は本体の Render の `PUBLIC_SITE_ORIGINS` に入っている Origin だけ。新しい URL（独自ドメイン・プレビュー）で読むなら、そこに足してもらう
  - 利用者が書いた文章なので、すべて `textContent`。日付は `"YYYY-MM-DD"` の文字列のまま扱う（`new Date("YYYY-MM-DD")` は使わない）
  - PDF・画像は R2 の別ドメイン。PDF は `download` を付けず新しいタブで開く
- 配信：`scripts/build-dist.mjs` が `dist/` に `index.html`・`pages/`・`assets/`・`favicon.ico`・`robots.txt`・`_headers` だけをコピーする（`faq-tests.json`・`assets/data/mock/`・`.md`・`.DS_Store` は除く）
  - **配信するものを足したら `INCLUDE` に足す**。リポジトリの直下をそのまま配信しない（CLAUDE.md・docs/・scripts/ が公開される）
  - Cloudflare Pages の設定値は `docs/START.md`
- snapshot（`assets/data/snapshot/`）は実際のデータなので commit しない。展示の端末で `npm run snapshot -- --with-images`

## 13. 読み物としての一覧・詳細（04 で追加）

- 振り返りの判定：`assets/js/modules/eventView.js` の `outcomeKey(item)`（`'success'` / `'struggle'`。`null` は struggle）。**判定の分け方はここだけ**。文言は `event-detail.js` の `REVIEW_LABELS`・`OUTCOME_LABEL`
  - 色は `--color-outcome-*`。**つまずいたを警告の色（赤・橙・黄）にしない**（いちばん読まれる記録で、悪いものとして見せない）
- ナレッジ1件の並び：頭（判定＋タイトル＋タグ）→ 振り返り → 詳しく（本文・画像・ファイル）。**振り返りを本文より先に置く**。`knowledge[]` に日付は無いので出さない
- 本文を描くのは `event-detail.js` の `renderKnowledgeText()` だけ。`knowledge[].blocks`（見出し・段落・箇条書き）があればそれで、無ければ `text` を1段落で描く。印（`{{h}}` など）の解釈はサイト側に持たない
- 種別（`eventType`）の表示名は `eventView.js` の `EVENT_TYPE_LABEL` だけに書く（本体は id しか返さない）。知らない id・`null` は出さない（`eventTypeLabel()`）。一覧：カードに表示名・2つ目の絞り込み（`data-type-filter`。一覧にある種別だけボタンを足す）。詳細：「種別」の行
- 最終更新（`lastUpdated`）は詳細の情報の行だけ（`formatDate()`）。一覧のカードには出していない
- テンプレートの目印：カードは `data-card="…"`、ナレッジ1件は `data-knowledge="…"`、索引の1件は `data-struggle="…"`。JS は `data-*` だけを探す（クラスは見た目のため）
- 絞り込みのボタンは `assets/js/modules/filterButtons.js` の `setupFilterButtons()`（一覧・索引で共通）
- 一覧の件数：「2件」／絞ると「2件中 1件」。0件のときは出さない
- つまずいたことの横断索引（`pages/event-log/struggles/`、`assets/js/pages/event-struggles.js`）
  - ふだんは `listReflections()`（`GET /api/public/reflections`、snapshot・mock は `reflections.json`）を**1回だけ**取る。`truncated` ならお知らせ
  - それが取れない（404・古い snapshot）ときだけ、詳細を1件ずつ取る（`collectByDetails()`）：`hasKnowledge === true` だけ・開催の最終日が新しい順に `MAX_EVENTS`（20）件まで・**順に**（並列にしない）。`getEvent()` を使うのでキャッシュと展示モードの snapshot 優先が効く
  - 載せるのは `outcomeKey === 'struggle'` かつ `solution` が空でないもの。タグ（企画／運営／制作／広報）で絞る
  - 429 が出たらそこで止めて、取れた分＋お知らせ。1件も取れていなければ「混み合っています」だけ
  - 公開 API は同じ IP から1分60回。ふだんは1回開いて1回（reflections）。詳細から集める形に戻ったときは「一覧1回＋詳細最大20回」
- 目的と柱（詳細の `purpose`・`pillars`。2026-11-09 追加）：詳細ページの**ナレッジの前**に出す。描くのは `event-detail.js` の `renderPurpose()` だけ。値が無い（`null`・空・項目自体が無い）見出しは外し、両方無ければまとまりごと外す。値が入るのは knowledge が1件以上あるときだけ（`docs/api-contract.md`）
- `getEvent()`：API が 429 のときは、ほかの取り先に無くても「見つからない」にせず `RateLimitedError` を投げる
