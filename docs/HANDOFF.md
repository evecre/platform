# HANDOFF — 作業の引き継ぎ記録

新しい記録を**上に**追加する。次のセッションは一番上だけ読めば続きができるように書く。

## テンプレート

```
## YYYY-MM-DD — <やったことの短い題>
- 指示書：docs/instructions/XX_….md（Phase ○まで）
- やったこと：
- 変えたファイル：
- 決めたこと・理由：
- 確かめたこと（コマンドと結果）：
- 残っていること・次にやること：
- ユーザーに確認したいこと：
- 本体側に頼むこと：
```

---

## 2026-11-04 — 01 Phase 5：イベント一覧・詳細（仮データ）／01 完了

- 指示書：docs/instructions/01_foundation.md（Phase 5 まで。01 はすべて完了）
- やったこと：仮データ（告知2件・アーカイブ3件、仮の画像・PDF）、`config.js`・`api.js`・`format.js`・`eventView.js`、一覧（カード・絞り込み・読み込み中／0件／失敗）、詳細（基礎情報・ナレッジ・404・失敗）、`scripts/fetch-snapshot.mjs`、CSS（`c-event-card`・`p-event-log`・`p-event-detail`・`p-event-knowledge`）、`docs/api-contract.md` に暫定の形
- 変えたファイル：`assets/data/mock/**`・`assets/data/snapshot/events.json`（空の配列）・`assets/img/event-log/no-image.svg`・`assets/js/modules/{config,api,format,eventView}.js`・`assets/js/pages/{event-log,event-detail}.js`・`pages/event-log/index.html`・`pages/event-log/detail/index.html`・`scripts/fetch-snapshot.mjs`・`assets/css/**`（4ファイル新規・variables・style・README）・`docs/api-contract.md`・`CLAUDE.md`
- 決めたこと・理由：
  - `dateTimes` は `{ "YYYY-MM-DD": { start, end } }`（本体の calendar.js で確認）。日付の表示は本体の `formatEventPeriodLines` と同じ考え方に年を足した（アーカイブは年をまたぐため）
  - snapshot と mock は、一覧に載っている id の詳細だけを取りに行く（無いファイルの 404 をコンソールに出さない）。snapshot の `events.json` は空の配列で commit しておき、空なら「まだ無い」とみなす
  - API の 404 は「公開されていない」という答えなので、ほかの取り先に聞き直さない。静的ファイルに無いときは次の取り先へ
  - id は `^[A-Za-z0-9_-]{1,64}$` だけ（本体の `SAFE_ITEM_ID_RE` と同じ。snapshot のファイル名に使うため）
  - カードとナレッジ1件の HTML は `<template>` に置いた（ユーザーが HTML を見てクラスを直せるように）
  - 表示の切り替えは `u-hidden`。`hidden` 属性はクラスの `display` に負けるため
  - URL は `safeUrl()`（http / https とサイト内のパスだけ）。javascript: などは捨てる
  - 読めない画像：カード・ヘッダーは代わりの画像、ナレッジの画像は枠ごと外す
  - ナレッジの見出しは outcome で変える（success →「効いたこと／なぜうまくいった？」、struggle・null →「困ったこと／次にやるなら」）。`knowledge: null` は告知なら「開催後に公開されます」、アーカイブなら「公開されていません」、空の配列なら「まだありません」
  - 詳細のヘッダー画像は高さを 50svh までにした（1280×800 でタイトルが一画面目から外れたため）
  - fetch-snapshot：全部取れてから古いものを消して書き込む。id の形が違うものは飛ばす。画像1枚の失敗では止めない（元の URL のまま残す）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 15 / 15 件 OK
  - 一覧：5件が新しい順、すべて／告知 2／アーカイブ 3、`aria-pressed`、カードのリンク、画像が無いと代わりの画像
  - 詳細：アーカイブ（success / struggle の見出し・タグ・画像・PDF のリンク）、outcome null、告知（開催後に公開されます）、ナレッジ非公開、存在しない id・`../events`・空・id なしは「見つかりませんでした」
  - データを取れないとき（ヘッドレス Chrome で events.json をブロック）：一覧・詳細とも「読み込めませんでした」
  - fetch-snapshot：API の URL が無いと止まる（exit 1）。偽の API から `--with-images` で 6 件・画像 3 枚を保存、`../bad` は飛ばした、取れない画像は警告だけ。`?kiosk=1` で偽の API を止めても snapshot から表示できた（画像もローカル）
  - 悪意のあるデータ（タイトルに `<img onerror>`、`<script>`、javascript: の URL）：文字のまま表示され、実行されない。javascript: のリンク・画像は出ない
  - 確認後、snapshot は空（`[]`）に戻した
  - 3ページ × 375 / 1280 / 1920×1080 / 3840×2160：コンソールのエラーなし・横スクロールなし・壊れた画像なし
- 01 の完了条件：すべて満たした（push はリモートが無いのでまだ）
- 残っていること・次にやること：
  - GitHub のリポジトリを作ってもらい、`git remote add origin …` → `git push origin HEAD`
  - 指示書 02（チャットボット）。開閉で `chatbot:open` / `chatbot:close` を document に発火する
  - 本体の公開 API の報告が来たら `docs/api-contract.md` を置き換え、`config.js` の `API_BASE` を入れる。本番前に `USE_MOCK_DATA = false`
- ユーザーに確認したいこと：GitHub のリポジトリ（名前・公開範囲）
- 本体側に頼むこと：なし（公開 API の指示書はすでに送ってある。CORS に `http://localhost:5173` を入れてもらうことは指示書に書いてある）

## 2026-11-04 — 01 Phase 4：展示モード

- 指示書：docs/instructions/01_foundation.md（Phase 4 まで）
- やったこと：`kiosk.js`（判定・時間の定数・fast）、`autoAdvance.js`（Top の自動送り）、`idleReturn.js`（Top 以外の無操作で戻る）、`common.js` と `top.js` から呼ぶ、CSS の README に `.is-kiosk` の使い方、CLAUDE.md §10
- 変えたファイル：`assets/js/modules/{kiosk,autoAdvance,idleReturn}.js`（新規）・`assets/js/modules/common.js`・`assets/js/modules/scrollStage.js`（goTo に instant）・`assets/js/pages/top.js`・`assets/css/README.md`・`CLAUDE.md`
- 決めたこと・理由：
  - 自動送りは指示書の `top.js` に直接書かず `autoAdvance.js` に分けた（top.js は呼ぶだけ）
  - sessionStorage は1つのキー `evecre:kiosk` に `1` か `fast` を入れる（保存してよいのは展示モードのフラグだけ、という決まりのため。fast もページを移っても続く）
  - Top の「操作」は wheel / touchstart / pointerdown / keydown。scroll を入れると、自動送り自身のスクロールで止まってしまうため。Top 以外の無操作の判定には scroll も入れる（スクロールバーを掴んで動かすことがあるため）
  - 再開するときは、すぐ1つ進めてから元の間隔に戻る（止まっている間に、もうその画面を見せたので）
  - 最後から最初へは瞬時に戻す（なめらかに戻すと 8 画面が全部流れて見えるため）。`scrollStage.goTo(index, { instant: true })` を足した
  - チャットボットを閉じたら「操作があった」とみなし、RESUME_AFTER_MS 後に再開
  - Top へ戻るのは `location.replace`（一日動かしても履歴が積み上がらないように）。fast のときは `/?kiosk=1&fast=1` へ
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 10 / 10 件 OK
  - ヘッドレス Chrome で `?kiosk=1&fast=1`（3秒ごと・3秒で再開・18秒で戻る）：`is-kiosk` が付き、保存は `fast`。3.3秒で problem0、6.3秒で problem1。pointerdown の 2.5秒後は止まったまま、3.5秒後に concept0 へ。chatbot:open の間 7秒動かない、close の 3.5秒後に concept1。一番下（scroll は操作にしない）から 3.2秒で一番上（瞬時）・hero
  - 一覧へ移っても is-kiosk。10秒で scroll → その 12秒後はまだ一覧、20秒後には `/?kiosk=1&fast=1` に戻った
  - `?kiosk=0` で is-kiosk が外れ、保存も消える。そのあと Top は自動で進まない
  - コンソールのエラーなし
- 残っていること・次にやること：Phase 5（イベント一覧・詳細〈仮データ〉）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

## 2026-11-04 — 01 Phase 3：Top のスクロールの舞台

- 指示書：docs/instructions/01_foundation.md（Phase 3 まで）
- やったこと：`scrollStage.js`（data-state / --progress / data-step、goTo / next / prev / current、キー操作、ドット、rAF で間引き、reduced-motion で瞬時移動）、`layout/_stage.css`、`c-step-indicator`、`p-hero` の出現アニメーションの例、Top の8つの scene（仮の文言に TODO）、CSS の README に使い方と scene の足し方、CLAUDE.md §10
- 変えたファイル：`index.html`・`assets/js/modules/scrollStage.js`（新規）・`assets/js/pages/top.js`・`assets/css/layout/_stage.css`（新規）・`assets/css/object/component/_step-indicator.css`（新規）・`assets/css/object/project/_hero.css`（新規）・`assets/css/layout/_footer.css`・`assets/css/style.css`・`assets/css/README.md`・`CLAUDE.md`
- 決めたこと・理由：
  - **指示書と違う点**：section 自体を sticky にせず、section はスクロールの長さ（`data-steps` × 100svh）だけを持ち、中の `.l-stage__frame` を `position: fixed` で画面に固定した。sticky だと scene の境目で、前の画面が上に流れ、次の画面が下から押し上がる（＝スライド）ため。今の scene 以外の frame は `visibility: hidden`（`--duration-slow` だけ遅らせて、引いていく動きを見せられる）
  - 最後の scene も最後のステップまで行けるように、舞台の下に一画面分の余白（`padding-bottom: 100svh`）。フッターは `position: relative` ＋背景色で、固定した scene の上に出る
  - scene の長さは `[data-steps="N"]` の属性セレクタで 1〜8 まで（JS からスタイルを書かない決まりのため）
  - `.l-stage.is-ready`（JS が付ける）のときだけ固定・非表示にする。JS が動かなくても縦並びで読める
  - 今の位置は「上端が通り過ぎた最後の scene」。最初の scene より上（ヘッダーの分）も hero を active にする。`goTo(0)` はページの一番上へ
  - goTo で移動中は行き先を覚えておき、キーの連打でも1つずつ進む。ホイール・タッチで忘れる
  - キー：↓ / PageDown / Space で次、↑ / PageUp / Shift+Space で前。入力欄では横取りしない。ボタン・リンクの上の Space は横取りしない。最後の次・最初の前は普段のスクロールに任せる。フッターで ↑ を押すと最後の scene へ
  - ドットのボタンは JS が作る（読み上げの名前は scene の見出しの文字）。今の画面に `.is-active` と `aria-current="step"`
  - frame の右の余白を広げた（375px でドットと文字が重なりかけたため）
  - `data-steps`：hero 1 / problem 2 / concept 3（定める・見失わない・共有する）/ world 1 / how-to 4 / features 1 / archive 1 / closing 1
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 7 / 7 件 OK
  - ヘッドレス Chrome（1280×800）：最初は hero だけ active。problem の途中で problem が active・step 1・--progress が進む。↓ 3回 → concept step 0、Space → concept 1、PageUp → concept 0、Shift+Space → problem 1。ドットのクリックで archive へ。一番下でフッターが見え、全 scene が after・frame は全部隠れる。そこで ↑ → closing。how-to のステップの境目（0.99 画面 → step 0、1 画面 → step 1）。入力欄では ↓ を横取りしない
  - 引いていく間を過ぎると、見えている frame は1枚だけ
  - reduced-motion：↓ で 50ms 後には移動し終わっている（普段はなめらかに移動中）
  - 375×812 / 1280×800 / 1920×1080 / 3840×2160：コンソールのエラーなし・横スクロールなし・how-to の frame から中身があふれない
- 残っていること・次にやること：Phase 4（展示モード）。scene の見せ方の CSS はユーザーが作る
- ユーザーに確認したいこと：section を sticky にせず frame を固定にしたこと／各 scene の data-steps の数
- 本体側に頼むこと：なし

## 2026-11-03 — 01 Phase 2：共通レイアウトと3ページのひな形

- 指示書：docs/instructions/01_foundation.md（Phase 2 まで）
- やったこと：3ページの HTML（`index.html`、`pages/event-log/index.html`、`pages/event-log/detail/index.html`）、`l-header` / `l-main` / `l-footer` の CSS、ページの入口 JS 3つ、`assets/js/modules/common.js`、favicon
- 変えたファイル：上記の HTML 3つ・`assets/css/layout/_header.css` `_main.css` `_footer.css`・`assets/css/style.css`・`assets/css/README.md`・`assets/css/foundation/_base.css`・`assets/js/pages/{top,event-log,event-detail}.js`・`assets/js/modules/common.js`・`favicon.ico`・`assets/img/common/evecre-icon-{32,192}.png`
- 決めたこと・理由：
  - CSS・JS・リンクは `/assets/…` のルートからのパスで書く（ページの深さが違っても同じ書き方で済む。Cloudflare Pages もローカルもルートで配信する）
  - 今いるページのリンクは HTML に `aria-current="page"` を直接書く（ヘッダーを JS で差し込まない決まりなので）。詳細ページはどちらにも付けない
  - ロゴは web 用の画像が無い（`03_material/06_logo` は .ai だけ）ので、文字の「イベクリ」に TODO を付けて置いた
  - favicon は本体の `public/favicon.ico` と `public/images/icon/evecre-icon-{32,192}.png` をコピーした（本体のリポジトリはコピー元として読んだだけ）。無いと /favicon.ico の 404 がコンソールに出るため
  - `body` を縦の flex にし、`l-main` を伸ばして、本文が短くてもフッターを画面の下に置く
  - `initCommon({ page })` は今は `<html data-page="…">` を付けるだけ。Phase 4 で展示モード・無操作で戻る、02 でチャットボットをここから呼ぶ
  - Top の `main` は Phase 3 で `l-stage` にする。今は `l-main` に仮の `p-hero` だけ
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 6 / 6 件 OK
  - ヘッドレス Chrome（CDP で端末のサイズを指定）で3ページ × 375×812 / 1280×800 / 1920×1080 / 3840×2160：コンソールのエラーなし、横スクロールなし、noindex の meta あり、今いるページのリンクが正しい、フッターの下端＝画面の下端。基準の文字サイズは 16 / 16 / 20 / 40px、h1 は 32 / 64 / 80 / 160px（375px も確認できた）
- 残っていること・次にやること：Phase 3（Top のスクロールの舞台）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

## 2026-11-03 — 01 Phase 1：CSS の骨組み（FLOCSS）

- 指示書：docs/instructions/01_foundation.md（Phase 1 まで）
- やったこと：`assets/css/style.css`（@import だけ）、`foundation/` の5ファイル、`object/utility/_hidden.css`、`assets/css/README.md`（規約・早見表・文字サイズの考え方）
- 変えたファイル：上記すべて新規。`layout/` `object/component/` `object/project/` は空フォルダ（git には載らない。Phase 2 以降でファイルが入る）
- 決めたこと・理由：
  - `vendor/reset/` が空だったので、最小の reset を `foundation/_reset.css` に自前で書いた（余白の全消し・見出しのサイズ継承・ボタンの素化・フォームのフォント継承）
  - 仮の色は本体の `_variables.css` のブランド色を借りた。名前は本体と同じ意味ベース（`--color-text` / `--color-accent` …）
  - 文字サイズ：`html` の font-size を `clamp(100%, min(1.0417vw, 1.8519vh), 250%)` にした → スマホ〜ノート PC 16px、1920×1080 で 20px、3840×2160 で 40px。幅と高さの小さいほうで決まる（Top は一画面で見せるので横長の画面であふれないように）。各段階は rem なので一緒に伸びる。見出し（xl〜3xl）は vw で、スマホで小さく広い画面で大きい
  - 動きの時間を `--duration-*` のトークンにし、`prefers-reduced-motion: reduce` で 0 にする（`!important` を使わずに動きを止めるため）
- 確かめたこと（コマンドと結果）：
  - serve.mjs 経由で `style.css` の @import 6件すべて 200（text/css）
  - ヘッドレス Chrome で計測（ウィンドウの枠の分、高さは指定より少し小さい）：1280×713 → 基準 16px / h1 64px、1920×993 → 18.4px（高さで決まった。全画面の 1080 なら 20px）、3840×2073 → 38.4px、2560×993（横長）→ 18.4px（高さで抑えられている）。h1 の margin 0、`u-hidden` は display:none
  - 375px はヘッドレス Chrome の最小幅（500px）より狭くて測れなかった（計算上は基準 16px・h1 約 32px）。Phase 2 以降で端末のエミュレーションで確かめる
- 残っていること・次にやること：Phase 2（共通レイアウトと3ページのひな形）
- ユーザーに確認したいこと：文字サイズの伸び方（4K で基準 40px）でよいか
- 本体側に頼むこと：なし

## 2026-11-03 — 01 Phase 0：開発環境

- 指示書：docs/instructions/01_foundation.md（Phase 0 まで）
- やったこと：既存ファイルの確認、`git init -b main`、`.gitignore`、`package.json`（依存なし）、`scripts/serve.mjs`（依存なしの静的サーバー）、`scripts/check-js.mjs`（全 JS に `node --check`）、`robots.txt`、`_headers`、`docs/api-contract.md`（置き場だけ）、`index.html` と `pages/event-log/index.html` に最小の HTML（noindex の meta 入り）
- 変えたファイル：上記すべて新規（HTML 2つは空だったものに書き込み）
- 決めたこと・理由：
  - serve.mjs は Range に対応（Safari は Range が無いと動画を再生しない）。`/foo` は `/foo/` にリダイレクトしてから index.html を返す（相対パスがずれないように）。ルートの外は返さない。`Cache-Control: no-store` と `X-Robots-Tag` をローカルでも付ける
  - 例外は `uncaughtException` / `unhandledRejection` で記録だけして動かし続ける（会場で一日動かすため）
  - まだ commit していない（01 の最後にまとめて commit する予定）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 2 / 2 件 OK
  - serve.mjs：`/` 200、`/pages/event-log` 301 → `/pages/event-log/` 200、存在しないパス 404、`%2e%2e` でルートの外は出ない、壊れた URL 400、POST 405、Range 206、壊れたリクエストの後も応答する、`--kiosk` で `/?kiosk=1` を表示
- 残っていること・次にやること：Phase 1（CSS の骨組み）
- ユーザーに確認したこと（回答済み）：
  - ホーム（/Users/usami）に空の git リポジトリがあった → ユーザーの指示で `/Users/usami/.git` を削除（commit・ref・object なしを確認してから）
  - `Claude outputs/`（本体に送った指示書の控え）→ `.gitignore` に入れて commit しない
- 本体側に頼むこと：なし

## 2026-11-03 — 初期設定（Claude.ai での相談）

- ユーザーが作ったもの：`index.html`（空）、`pages/event-log/index.html`（空）、`assets/{css/vendor/reset, img/{common,event-log,top}, js/vendor}`（空のフォルダ）
- Claude.ai が置いたもの：`CLAUDE.md`、`docs/START.md`、`docs/HANDOFF.md`、`docs/instructions/01_foundation.md`、`docs/instructions/02_chatbot.md`
- まだ git リポジトリではない → 01 の Phase 0 で初期化する
- 本体側には「公開 API」の指示書を別に送った。完成したら、その報告（応答の例・注意点）を `docs/api-contract.md` に貼る
- 次にやること：`docs/instructions/01_foundation.md` を Phase 0 から
