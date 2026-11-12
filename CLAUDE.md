# イベクリ 外部サイト — CLAUDE.md

作業を始める前に必ずこのファイルと `docs/START.md`、`docs/HANDOFF.md` の最新の記録を読むこと。
作業が終わったら、`docs/HANDOFF.md` に記録を追加し、このファイルに新しい決まりや機能を追記すること。

---

## 1. このサイトは何か

イベクリ（学生のイベントづくりを支える Web アプリ）の**外部サイト**。イベクリ本体とは別のリポジトリ。

目的：
- イベクリを知らない人に、価値と有効性を伝える
- ユーザーの「何ができるの？」「どう使うの？」を解消する（Top ＋ チャットボット）
- 公開イベントの**告知**と**アーカイブ（ナレッジ）**は、本体の「みんなの記録」（`/explore`。いいね・コメント付き）で見せる。このサイトはそこへ案内する（2026-11-12 に移した。§13）
- **展示会**で、イベクリの実機と並べて展示する。55インチモニターにも映す

イベクリ自体の説明は、ほぼ **Top ページだけ**にある。操作方法も Top で簡潔に伝える。

## 2. 技術と方針

- 静的サイト：HTML ＋ CSS ＋ Vanilla JS（ES Modules）。**ビルド工程なし・フレームワークなし**
- 依存は最小限。npm パッケージを足す前に、自前で短く書けないか考え、足すなら理由を HANDOFF に書く
- 配信：Cloudflare Pages（本番 https://evecre.pages.dev）。**配信するのは `npm run build` で作る `dist/` だけ**（§12）。展示会場では**ローカルで動かす**（`node scripts/serve.mjs` → http://localhost:5173）
- イベントのデータは読まない（本体の公開 API は使わなくなった。取り決めの記録は `docs/api-contract.md`）。公開イベントへは `config.js` の `EXPLORE_URL` へのリンクで案内する
- チャットボットは**外部サービスを使わない自作**（ブラウザ内で完結。無料・回数無制限）

## 3. ディレクトリ

```
index.html                         Top（スクロールで画面が切り替わる）
pages/event-log/                   古い URL（一覧・detail/?id=…・struggles/）から「みんなの記録」へ移すだけのページ
assets/
  css/
    style.css                      @import だけを書く（並び＝詳細度の弱い順）
    vendor/reset/                  既存の reset（中身を確かめてから foundation に取り込む）
    foundation/  layout/  object/component/  object/project/  object/utility/
  js/
    pages/                         ページごとの入口（top.js / explore-redirect.js）
    modules/                       共通の部品（scrollStage, kiosk, autoAdvance, exploreLink, chatbot/ …）
    vendor/
  img/  common/ top/ character/
  data/
    faq.json  synonyms.json  faq-tests.json   チャットボットのデータ
scripts/                           serve.mjs / build-dist.mjs / check-js.mjs / check-faq.mjs（Node）
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
- ブラウザ保存は `sessionStorage` の展示モードフラグ（`evecre:kiosk`）だけ。読み書きは try/catch で包む
- `prefers-reduced-motion: reduce` のときは、自動送りのスクロールを瞬時に切り替える

## 6. 公開範囲（必須）

最初は**検索エンジンに載せない。リンクを知っている人だけが見る**。次の3つを必ず入れる：
1. 全ページの `<meta name="robots" content="noindex, nofollow">`
2. `robots.txt`：`User-agent: *` / `Disallow: /`
3. `_headers`（Cloudflare Pages）：`/*` に `X-Robots-Tag: noindex, nofollow`

注意：これは「検索に載らない」だけで、URL を知っている人は誰でも見られる。強い制限が必要になったら Cloudflare Access を検討する（ユーザーに相談）。

「みんなの記録」（本体の `/explore`）の noindex は本体側の担当（2026-11-12 時点：本体の `index.html` に `<meta name="robots" content="noindex">`。`X-Robots-Tag` は未対応で依頼中）

## 7. 展示モード

- URL に `?kiosk=1` が付いたときだけ有効。`sessionStorage` に保存し、ページを移っても続く（`?kiosk=0` で解除）
- **Top**：30秒ごとに次の画面へ自動で進む。最後まで行ったら最初へ。ユーザーが操作したら止め、30秒操作が無ければ再開
- **みんなの記録（本体）**：リンクに `?kiosk=1` を付けて移る（`exploreLink.js`）。本体が3分操作が無ければ `https://evecre.pages.dev/?kiosk=1` に戻す。展示中はログイン・コメントの入力欄を出さない（本体の `public/js/views/explore.js`、依頼文 `docs/requests/main-app-explore-kiosk-return.md`）
  - ★本体が戻す先は `PUBLIC_SITE_ORIGINS` の localhost でない値（今は本番の pages.dev）。会場でローカル（localhost:5173）で動かしても、戻る先は本番の Top になる
- チャットボットを開いている間は自動送りを止める

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
- （2026-11-11）公開イベントの一覧・告知・ナレッジは本体の `/explore`（「みんなの記録」）に移す。いいね・コメントのため（外部サイトからは本体のログイン Cookie を使えない）。「つまずいたこと」の索引は消す。展示モードで本体に移っても、しばらく操作が無ければ Top に戻す（本体側で実装）

## 10. 作った仕組み（01 で追加）

- **Top のスクロールの舞台**：`assets/js/modules/scrollStage.js` ＋ `assets/css/layout/_stage.css`
  - `section.l-stage__scene` はスクロールの長さだけ（`data-steps` × 100svh）。中の `.l-stage__frame` を画面に固定して見せる（指示書の「section を sticky」だと scene の境目で画面がスライドするため、こうした）
  - JS が付けるのは `data-state`（before / active / after）、`--progress`、`data-step` だけ。見せ方は `p-` の CSS で作る。使い方と scene の足し方は `assets/css/README.md` §4
  - `createScrollStage()` は `{ goTo, next, prev, current, count }` を返す（展示モードの自動送りで使う）
- **展示モード**：`assets/js/modules/kiosk.js` に判定と時間の定数（`AUTO_ADVANCE_MS` / `RESUME_AFTER_MS` / `CHATBOT_RESET_MS`）。sessionStorage のキーは `evecre:kiosk`（値 `1` / `fast`）。`?kiosk=1&fast=1` で時間が 10 分の 1
  - Top の自動送り：`autoAdvance.js`（操作＝wheel / touchstart / pointerdown / keydown。scroll は自動送り自身が起こすので含めない）。最後から最初へは瞬時に戻す
  - チャットボットは開いたとき `chatbot:open`、閉じたとき `chatbot:close` を **document で**発火すること（自動送りが止まる・再開する）
  - 展示中は `<html class="is-kiosk">`
  - 表示・非表示の切り替えは `u-hidden`（`hidden` 属性は、クラスの `display` に負けるので使わない）
- **文字サイズ**：`html` の font-size が画面に合わせて伸びる（16px → 1920×1080 で 20px → 4K で 40px）。サイズは rem で書く
- **動きの時間**：`--duration-*` を使う。動きを減らす設定で 0 になる

## 11. チャットボット（02 で追加）

- 判定：`assets/js/modules/chatbot/`（`normalize.js` → `matcher.js` → `engine.js`。DOM に依存しない）。パネル：`chatbot.js`（`startChatbot({ kiosk })`。`common.js` から起動）
  - Top に出す（`common.js` から。05 でページが Top だけになったので、`CHATBOT_TOP_ONLY` は消した）
  - 答え・質問の文はすべて `textContent`、リンクは `safeUrl()` を通す
  - 展示モードで `CHATBOT_RESET_MS`（kiosk.js）操作が無ければ、閉じて最初のあいさつに戻す
  - パネルの中の keydown は Top の舞台に渡さない（stopPropagation）
- データ：`assets/data/faq.json`（カテゴリと質問）・`synonyms.json`（類義語）・`faq-tests.json`（正答率のテスト）
  - 質問を足す：`items` に1件足す。`id`（英小文字とハイフン）・`category`（`categories` の id）・`question`・`patterns`（言い回し。**5個以上**）・`keywords`（その項目らしい語。1つ含まれるごとに +0.1）・`answer`（改行可）・`links`（`/` か `https://` で始まる。みんなの記録は本番の URL を直接書く。展示モードでは `exploreHref()` が `?kiosk=1` を足す）・`related`（ほかの項目の id）・`featured`（カテゴリを選んだときに出すか）
  - 言い回しが違うだけで外れるときは、まず `synonyms.json`（代表の語 → 言い換えの一覧）に足す。全部の項目に効く。語尾・つなぎは `normalize.js` の `FILLER_PHRASES`
  - テストの文を、そのまま `patterns` に写さない（テストが意味を失う）
  - 足したら `npm run check:faq`（`--tune` でしきい値の表）。faq.json に誤り（id の重複・無い related・patterns 5個未満・無いカテゴリ）があると終了コード 1
- しきい値（`engine.js`）：1位の点数が `THRESHOLD_ANSWER`（0.55）以上で、2位との差が `MIN_MARGIN`（0.05）以上なら回答。`THRESHOLD_SUGGEST`（0.30）以上なら「もしかして」（上位3件）。それ未満は「答えられない」でカテゴリに戻す
  - 下げると答える数が増えるが、**違う答え（誤答）を出しやすくなる**。誤答は「もしかして」より悪いので、`--tune` の表で誤答 0 を保てる範囲で決める（2026-11-04：0.50 以下で誤答が出る）
- キャラクター：`assets/js/modules/character.js`（`pickCharacter()` は読み込みごとに1体。`createCharacter(ch, { className })`）＋ `object/component/_character.css`
  - 素材は `assets/img/character/`。目の寸法・位置は素材から実測した値。勝手に変えない
  - 瞬き・目線は「たまに」（瞬き 13〜19秒、目線 29〜41秒）。短くしない。動きを減らす設定では止める

## 12. 配信（03 で追加）

- 配信：`scripts/build-dist.mjs` が `dist/` に `index.html`・`pages/`・`assets/`・`favicon.ico`・`robots.txt`・`_headers` だけをコピーする（`faq-tests.json`・`.md`・`.DS_Store` は除く）
  - **配信するものを足したら `INCLUDE` に足す**。リポジトリの直下をそのまま配信しない（CLAUDE.md・docs/・scripts/ が公開される）
  - Cloudflare Pages の設定値は `docs/START.md`
- 公開 API（本体の `/api/public/*`）は 05 で使わなくなった。取り決めは `docs/api-contract.md` に記録として残す

## 13. 「みんなの記録」への移行（05 で変更）

- 公開イベントの一覧・詳細・つまずいたことの索引（01〜04 で作ったもの）は消した。見せるのは本体の `/explore`（`config.js` の `EXPLORE_URL`）
  - 本体の URL の形：`/explore`（一覧）・`/explore?event=<id>`（告知のモーダル）・`/explore/<id>`（ナレッジのページ。ナレッジが無ければ本体が告知のモーダルに置き換える）
- リンク：HTML に `data-explore-link` を付けると、`common.js`（`setupExploreLinks()`）が href を `EXPLORE_URL` にする（展示モードなら `?kiosk=1`）。HTML にも同じ URL を書いておく（JS が動かないとき用）
  - **`EXPLORE_URL` を変えたら（独自ドメインなど）**：`config.js`・`index.html` の `data-explore-link`・`pages/event-log/*/index.html` の `data-explore-redirect`・`assets/data/faq.json` の links を直す
- 古い URL（本体の「リンクをコピー」が以前出していた `/pages/event-log/detail/?id=…` など）：`pages/event-log/` の3ページが `explore-redirect.js` で `location.replace` する。`?id=` が `EVENT_ID_RE` に合えば `EXPLORE_URL/<id>`、それ以外は一覧。Cloudflare の `_redirects` はクエリの値をパスに移せないので使わない。3ページとも noindex を残す。**消さないこと**
