# 指示書 01：開発環境・ページの骨組み・スクロールの舞台・展示モード・イベント一覧/詳細

> 前提：`CLAUDE.md` と `docs/START.md` を読んでから始めること。
> **Phase ごとに止まって報告し、ユーザーの確認を待ってから次へ進む。**
> 見た目（色・装飾・アニメーションの作り込み）はユーザーが行う。ここでは**構造と仕組み**を作る。

---

## Phase 0：現状確認と開発環境

1. 既存のファイル・フォルダを確認して報告する（`index.html` と `pages/event-log/index.html` は空、`assets/css/vendor/reset/` の中身の有無）
2. `git init`、`.gitignore` に `.DS_Store` と `node_modules/` を書く（`assets/data/snapshot/` は展示用に commit するので書かない）
3. `package.json`：`"type": "module"`、`"private": true`、依存なし。scripts：
   - `"dev": "node scripts/serve.mjs"`
   - `"snapshot": "node scripts/fetch-snapshot.mjs"`
   - `"check": "node scripts/check-js.mjs"`（全 JS に `node --check` をかける小さなスクリプト）
4. `scripts/serve.mjs`：**依存なし**の静的サーバー（Node の `http` だけ）
   - 既定ポート 5173（`--port` で変更可）。`/foo/` は `/foo/index.html` を返す。MIME（html/css/js/json/svg/png/jpg/webp/woff2/mp4/webm）
   - `--kiosk` を付けたら `http://localhost:5173/?kiosk=1` を表示する
   - 展示会場で一日動かし続ける前提。例外で落ちないようにする
5. 検索エンジン対策（`CLAUDE.md` §6 の3点）：`robots.txt`、`_headers`、各 HTML の meta
6. `docs/api-contract.md` を作り、「本体側の公開 API の報告をここに貼る」とだけ書いておく

**報告して止まる。**

---

## Phase 1：CSS の骨組み（FLOCSS）

- `assets/css/style.css`：`@import` だけ。順番：foundation → layout → component → project → utility
- `foundation/`：`_reset.css`（vendor/reset に中身があれば取り込み、無ければ最小の reset）、`_variables.css`、`_base.css`、`_typography.css`、`_animation.css`
- `_variables.css` には、仮の値で次の名前だけ用意する（値はユーザーが決める）：色（背景・文字・アクセント）、余白の段階、文字サイズの段階、z-index（header / chatbot / overlay）、展示用の時間（`--kiosk-*` は JS で使うので不要。時間は JS の定数にする）
- 文字サイズは `clamp()` で、スマホ（375px）〜 55インチ（1920×1080 と 3840×2160）まで読めるようにする
- `object/utility/_hidden.css`（`u-hidden` だけ）
- 各ファイルの先頭に、何を書くファイルかを1〜2行のコメントで書く
- `assets/css/README.md`：本体の `public/css/README.md` と同じく「変えたい見た目 → 触るファイル」の早見表を作る（以降、ファイルを足すたびに更新）

**報告して止まる。**

---

## Phase 2：共通レイアウトと3ページのひな形

- 3ページ：`index.html`（Top）、`pages/event-log/index.html`（一覧）、`pages/event-log/detail/index.html`（詳細）
- 共通：`l-header`（ロゴ／Top・イベント一覧へのリンク）、`l-main`、`l-footer`
  - ヘッダーは HTML に直接書く（JS で差し込まない）。3ページで同じ内容を保つ
- 各ページの入口 JS：`assets/js/pages/top.js` / `event-log.js` / `event-detail.js`
- 共通の初期化：`assets/js/modules/common.js`（展示モード判定・無操作で戻る・チャットボットの起動〈02 で中身を作る〉をここから呼ぶ）
- `<html lang="ja">`、viewport、`<title>`、description、noindex

**報告して止まる。**

---

## Phase 3：Top のスクロールの舞台（いちばん大事）

### やりたいこと

一般的な縦スクロールではなく、スクロールに応じて**画面（section）の要素が出てきて・引いていき、常に一画面で見せる**。
紙芝居と同じ構造だが、一枚ずつスライドさせるアニメーションではない。**出現の仕方は section ごとに変える**（CSS はユーザーが作る）。

### 仕組み

```html
<main class="l-stage" data-stage>
  <section class="p-hero l-stage__scene" data-scene="hero" data-steps="1">…</section>
  <section class="p-top-problem l-stage__scene" data-scene="problem" data-steps="2">…</section>
  …
</main>
```

- 各 scene は `position: sticky; top: 0; height: 100svh` で画面に貼り付き、その scene の「スクロールの長さ」は `data-steps × 100svh`
  - `data-steps="2"` の scene は、2画面分スクロールする間とどまり、その間に中の要素を2段階で出せる
- `assets/js/modules/scrollStage.js`：
  - 各 scene に状態を付ける：`data-state="before | active | after"`
  - 各 scene に CSS 変数 `--progress`（0〜1。その scene を通過する割合）を渡す
  - 複数ステップの scene には `data-step="0 | 1 | …"` を付ける
  - ステップの一覧（scene × step）を持ち、`goTo(index)`、`next()`、`current()` を公開する（展示モードの自動送りで使う）
  - 計算は `requestAnimationFrame` で間引く。`scroll` のたびに重い処理をしない
  - キー操作：↓ / PageDown / Space で次、↑ / PageUp で前（`goTo` を使う）
  - 右端に現在位置のドット（`c-step-indicator`）。クリックでその scene へ
  - `prefers-reduced-motion` のときは `goTo` を瞬時移動にする
- CSS 側（`layout/_stage.css`）は仕組みに必要な最小限だけ。出現アニメーションの例を **1つだけ** 書いて、ユーザーが真似できるようにする：

```css
/* 例：active になったら下からふわっと出る（各 scene の見せ方はユーザーが作る） */
.p-hero__title { opacity: 0; transform: translateY(var(--space-6)); transition: opacity .6s, transform .6s; }
.p-hero[data-state="active"] .p-hero__title { opacity: 1; transform: none; }
```

- `assets/css/README.md` に「新しい scene の足し方」と「`data-state` / `--progress` / `data-step` の使い方」を書く

### Top の scene（仮。文言は TODO として置き、ユーザーが差し替える）

| scene | class | 内容（仮） |
|---|---|---|
| hero | `p-hero` | ロゴ・キャッチコピー（`h1`） |
| problem | `p-top-problem` | 学生のイベントづくりで、目的を見失い「終わらせること」が目的になってしまう |
| concept | `p-top-concept` | イベクリは「目的を定める・見失わない・共有する」 |
| world | `p-top-world` | イベントという山を、3体のキャラクター（水・森・岩）と登る |
| how-to | `p-top-howto` | 使い方の流れ（例：イベントを作る → 目的を決める → タスクを進める → 振り返る）。`data-steps` を流れの数にする |
| features | `p-top-features` | できること（タスク、山の可視化、振り返り・引き継ぎ、通知 など） |
| archive | `p-top-archive` | 公開されたイベントの紹介 → イベント一覧へのボタン |
| closing | `p-top-closing` | まとめ・研究について |

- 文言は HTML に `<!-- TODO: 文言 -->` を付けて仮で置く。画像は `assets/img/top/` にプレースホルダー（なければ枠だけ）
- 各 section には見出しを持たせる（hero は `h1`、それ以外は `h2`）

**報告して止まる。**（ユーザーがこの段階で CSS を作り込めるように、ここで一度区切る）

---

## Phase 4：展示モード

`CLAUDE.md` §7 のとおり。

- `assets/js/modules/kiosk.js`
  - `isKiosk()`：`?kiosk=1` / `?kiosk=0` を読み、`sessionStorage` に保存（try/catch）
  - 展示モード中は `<html>` に `is-kiosk` を付ける（CSS で、展示中だけカーソルを隠すなどができるように）
- Top（`top.js`）：展示モードなら 30 秒ごとに `scrollStage.next()`。最後なら `goTo(0)`
  - ユーザーの操作（wheel / touchstart / pointerdown / keydown）で止め、30 秒操作が無ければ再開
  - チャットボットが開いている間は止める（02 で `chatbot:open` / `chatbot:close` のイベントを発火するので、それを聞く）
- `assets/js/modules/idleReturn.js`：Top 以外で 3 分操作が無ければ Top（`/?kiosk=1`）へ。展示モードのときだけ
- 時間は定数で1か所にまとめる（`AUTO_ADVANCE_MS = 30000`、`RESUME_AFTER_MS = 30000`、`IDLE_RETURN_MS = 180000`）。確認用に `?kiosk=1&fast=1` で 10 分の 1 にする

**報告して止まる。**

---

## Phase 5：イベント一覧・詳細（仮データ）

本体の公開 API はまだ無い。応答の形は本体側の指示書で決めてあるので、それに合わせた**仮データ**で作る。

### 応答の形（本体側の指示書と同じ）

- 一覧 `GET /api/public/events` → 配列：`{ id, title, headerImage, summary, venue, dates, dateTimes, status: 'upcoming'|'archive', hasKnowledge }`
- 詳細 `GET /api/public/events/:id` → `{ id, status, basic: { title, headerImage, summary, venue, dates, dateTimes }, knowledge: [ { title, tags, outcome: 'success'|'struggle'|null, struggle, solution, text, images, files:[{url,name,size,thumb}] } ] | null }`
- 振り返りの見出しは `outcome` で変わる（本体と同じ）：
  - `success` → 「効いたこと」／「なぜうまくいった？」
  - `struggle`（と null）→ 「困ったこと」／「次にやるなら」

### 作るもの

- `assets/data/mock/events.json`、`assets/data/mock/events/<id>.json`（告知2件・アーカイブ3件程度。個人名を入れない）
- `assets/js/modules/config.js`：`API_BASE`（本番の Render URL。今は空）、データの取り方
- `assets/js/modules/api.js`：`listEvents()` / `getEvent(id)`
  - 順番：展示モード → snapshot を優先。それ以外 → API → 失敗したら snapshot → 無ければ mock（mock は開発中だけ。`config.js` のフラグで切る）
  - タイムアウト 8 秒
- 一覧（`pages/event-log/`）
  - カード（`c-event-card`）：サムネイル（`headerImage`。無ければ代わりの画像）、タイトル、日付、場所、「告知」「アーカイブ」のラベル
  - 絞り込み：すべて／告知／アーカイブ
  - カードをタップ → `detail/?id=…`
  - 0件・読み込み中・失敗の表示
- 詳細（`pages/event-log/detail/`）
  - 基礎情報（タイトル、ヘッダー画像、概要、開催日時、場所）
  - ナレッジ（タスクごとに：タスク名、タグ、振り返り2項目、本文、画像、PDF などのファイル）。`knowledge` が `null` なら「ナレッジは公開されていません／開催後に公開されます」
  - 一覧へ戻るリンク
  - 404 のときの表示
- 文字列の差し込みは `textContent` を使う。`innerHTML` に API の値を入れない
- `scripts/fetch-snapshot.mjs`：API から一覧と全件の詳細を取り、`assets/data/snapshot/` に保存。`--with-images` で画像も `assets/data/snapshot/img/` に保存し、URL を書き換える（会場でネットが無くても画像が出るように）

**報告して止まる。**

---

## 完了条件（01 全体）

- 全 JS が `node --check` を通る（`npm run check`）
- `node scripts/serve.mjs` で3ページが開き、コンソールにエラーが無い
- Top：スクロールで scene の `data-state` / `--progress` / `data-step` が変わる。キー操作とドットで移動できる
- `?kiosk=1&fast=1` で、Top の自動送り・操作で止まる・再開、Top 以外の無操作で戻る、が確認できる
- 375px・1280px・1920×1080・3840×2160 で表示を確認し、スクリーンショットの所見を報告
- noindex の3点が入っている
- `CLAUDE.md`、`assets/css/README.md`、`docs/START.md` の表、`docs/HANDOFF.md` を更新
- commit → `git push origin HEAD`（GitHub のリポジトリはユーザーが作る。未作成なら、作ってもらうよう報告する）
