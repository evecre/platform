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

## 2026-11-14 — Top の修正（ユーザーの確認 1 回目）

- 依頼：スクロールが心地よくない／スライダーの文字を Ultra に／09 → 08 も 09 が中央へ縮む／目の動きを少なく／02 の目玉が白目から飛び出す／03 の丘の左右に余白／開いた瞬間にロゴが大きく出る／本文を font-weight 500 に
- やったこと：
  - スクロール：原因は (1) 出現が終わるまで（1.6〜2.3秒）入力を止めていた、(2) その間に回した分を使い済みにして、手を止めるまで反応しなかった。入力を止める長さを `--scene-input-lock`（0.7秒）に分けた（active になるのは今までどおり `--scene-lock`。途中で次へ進んだら前の切り替えを終わらせる）。ホイールは「途切れた」か「強まった」ら新しい操作（慣性は弱まるだけなので捨てる）。しきい値 24 → 12、行単位の deltaMode も px に
  - スライダー：Ultra（`--font-family-display`）
  - 09 → 08：展示モードの 09 → 01 と同じく、09 が中央へ縮み、その下で 08 が出る。縮みきるまで入力を止める
  - 目：瞬き 2〜6 → 5〜12秒（2回続ける 0.2 → 0.15）、目線 4〜9 → 10〜20秒
  - 目玉のはみ出し：CSS の clamp は縦横べつべつなので、斜めに動くと白目の円の外へ出ていた。`eyes.js` で、ふだんの目線から動かしても円の中に収まる方向だけを選ぶようにした（02 の水は left / down / down-left など）
  - 03 の丘：基準のフレームではなく、画面の左右の端から下の端まで（`object-fit: cover`）
  - 開いた瞬間のロゴ：JS が舞台を整えるまで（`.is-ready`）舞台を見せない。JS が無いときは `assets/css/noscript.css`（`<noscript>` の link）で見せる
  - 本文：body を font-weight 500
  - ユーザーが `_top.css` を整形し、02 の見出しに font-weight 700 を足していた（そのまま残した）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 28 / 28 件 OK、コンソールのエラーなし
  - マウスのホイール（1ノッチずつ 1秒おき ×3）で 3画面進む。トラックパッドの1回のフリック（慣性 1.2秒）で1画面。慣性の途中でもう一度フリックするともう1画面
  - 09 → 08：09 の円が中央へ縮む
  - 03 の丘：2560×1080・1728×1117・1280×1024・390×844 で、左右の端から画面の下まで
  - 本文 500・スライダー Ultra
- 残っていること：main へのマージ（ユーザーの確認待ち）
- 本体側に頼むこと：なし

## 2026-11-14 — 06 Phase 5：展示モードの 09 → 01、縦長の画面、仕上げ（06 完了）

- 指示書：docs/instructions/06_top-visual.md（Phase 5・完了条件まで）
- やったこと：
  - 09 → 01（展示モード）：去る 09 を 01 より上（z-index 6）に重ね、09 の枠を `clip-path: circle()` で中央へ縮める。09 の要素は個別に消さない。その下で 01 の出現が同時に起きる（`--motion-shrink-duration`・`--motion-ease-shrink`）。01 の `--scene-lock` は出現の終わり（順番 5 の iPad）まで
  - 縦長の画面（`max-aspect-ratio: 4/5`）：基準のフレームを 390×844 にし、`_top.css` の末尾で全画面の位置を組み替えた（上にテキスト、下にスマホとイラスト。hero のマスクと 03 の UI は `--box-u` で中身ごと縮める）。`<br>` を外す、ヘッダーを小さく、現在位置のドットを出さない
  - 重なりを直した：画面をまたぐ要素（キャラクター・スマホ）を今の画面より上（5）にした（03 の丘の絵がキャラクターを覆っていた）。09 は 6 にしてスマホを覆う
  - 不具合を直した：`#team` など画像のある画面から開くと真っ白のままだった（最初の画面が `display: none` のままで lazy の画像が読まれず、`decode()` を待ち続けた）。最初の画面に `.is-preload` を付けてから待つ
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 28 / 28 件 OK
  - `npm run build && node scripts/serve.mjs --root dist`、1920×1080、`?kiosk=1&fast=1`：hero → about → … → connect → hero（loop）→ about → … と回る。チャットボットを開くと止まる。コンソールのエラーなし
  - 09 → 01 の途中：09 の円が中央へ縮む
  - 縦長：390×844・375×667・768×1024 で全画面を確かめた（横スクロールなし）。横長（1728）の位置は変わっていない（iPad x600 y532 w500）
  - `#team` / `#how-to` / `#step-5` / `#about` で開ける。03 のキャラクターが丘の上に見える
  - noindex：meta・`robots.txt`・`X-Robots-Tag`（dist）
- 残っていること：
  - Usami の調整（速さ・距離・イージング。`assets/css/README.md` §4）と、縦長の構図の確認
  - ユーザーに確認したいこと：09 のスライダーの文（指示書は上「Knowledge Platform」下「Evecre」、PDF は上下とも「Evecre　Knowledge Platform」。今は PDF）／02 の岩の形が素材と PDF で少し違う
  - main にマージ済み（2026-11-14、`f39bf20`）。本番（evecre.pages.dev）で Top が開き、Adobe Fonts（りょうゴシック）と Ultra が読めた（`wf-active`）。X-Robots-Tag あり・コンソールのエラーなし
- 本体側に頼むこと：なし

## 2026-11-14 — 06 Phase 4：04〜08（スマホの持ち越し・中身・背景色）と 09（円形の出現・スライダー）

- 指示書：docs/instructions/06_top-visual.md（Phase 4 まで）
- やったこと：
  - 位置（PDF に方眼を重ねて測った）：スマホ x1065（04・08）/ x365（05〜07）y165 w378。テキストは STEP の上端から、見出し +115・本文 +205（STEP 64・見出し 46・本文 31、行の高さ 2.1）。イラスト：04 mountaineering x422 y467 w578／05 role x957 y752 w502／06 planning x955 y493 w513／07 summit x1138 y594 w517／08 writing x222 y520 w656
  - スマホ（`.p-top-phone`）：1つのまま位置が移る（`--motion-persist-*`）。中身5枚は新しい中身を上に重ねてフェードで出し、出しきってから古い中身を消す（`--motion-phone-screen-duration`）。03 より前（と最初の画面が決まる前）は `display: none` にして、画像を hero で読まないようにした
  - 背景色は Phase 1 の仕組み（1枚の背景の色が替わる）のまま
  - 09：枠を `clip-path: circle()` で中央から広げる（`--motion-iris-duration`・`--motion-ease-iris`）。08 の要素は消さずに残し、背景色は被さりきってから替える。スマホは 09 の下に残る。中身は個別の出現なし
  - スライダー：「Evecre　Knowledge Platform　」を6つ並べた帯を半分ずらして無限に流す（上は右から左・下は左から右、`--slider-speed`）。文字は 140・細い（200）・白 35%。2つ目からの文と下の帯は読み上げない。09 以外・動きを減らす設定では止める
  - ★スライダーの文：指示書は「上：Knowledge Platform／下：Evecre」だが、PDF は上下とも「Evecre　Knowledge Platform」なので PDF に合わせた（ユーザーに確認したい）
  - 仮の四角（`p-top-ph`）はすべて画像に置き換えて、CSS も消した
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 28 / 28 件 OK、コンソールのエラーなし
  - PDF を半透明で重ねて、04〜09 の位置がほぼ一致（STEP の文字は Ultra なので形が違う）
  - 04 → 05 の途中：スマホが右から左へ移りながら、中身が create-event → invite に重なって替わる
  - 08 → 09 の途中：08（テキスト・イラスト・スマホ）がそのまま残り、中央の円が広がる
  - スライダー：1秒で上は左へ、下は右へ動く
  - hero を開いた時点で読む画像は hero のものだけ（スマホの中身は 03 で読み始める）
  - 09 から ↑ で 08 に戻ると、スマホは 08 の中身
- 残っていること・次にやること：Phase 5（展示モードの 09 → 01 のループ、スマホの見せ方、仕上げ、ドキュメント）
- ユーザーに確認したいこと：スライダーの文（上記）
- 本体側に頼むこと：なし

## 2026-11-14 — 06 Phase 3：02・03（キャラクターの持ち越し）とキャラクターの目

- 指示書：docs/instructions/06_top-visual.md（Phase 3 まで）
- やったこと：
  - 測り方：PDF を 3 倍で書き出し、色の外接矩形で測った（白目・黒目・体）。体の素材（`character-*-body.svg`）は四辺に約 4% の余白があるので、その分を足して置いた
  - 02 と 03 のキャラクターは同じ並びで、02 は 03 の 4.82 倍（白目の幅で確かめた）。3体を1つの箱（`.p-top-chara`。森がいちばん手前）にして、02（x-96.8 y525.5 w1920）→ 03（x663.8 y889.6 w398.3）へ縮みながら移る。03 → 04 で 03 の位置のままポンッと消える
  - 目：`object/component/_eyes.css`（`c-eyes`：白目＋黒目を `<img>` で重ねる。瞬き `.is-blink`、目線 `data-look` 8方向、白目からはみ出さないよう clamp）・`assets/js/modules/eyes.js`（目ごとに別々のタイマー。`data-eyes` の画面が今の画面のときだけ動く。値は `--eye-*`）。SVG をページに書き込まないので、Illustrator の id・色の干渉は起きない
  - 目の位置・ふだんの目線（PDF）：02/03 は 水 20.1%/-44.9%・森 0/-74.8%・岩 -20.2%/-44.9%。hero は目が傾いている（水 -9.1°・岩 10.8°）ので `--eyes-rotate` で合わせた。目線は 水 14.3%/-33.7%・森 4%/36.9%（下向き）・岩 -12.1%/33.7%
  - 02：テキスト（見出し 60・本文 32、行の高さ 2.1）、斜めの線2本（CSS。テキストと一緒に出る・消える）
  - 03：`about-landform`（画面の下いっぱい）、テキスト（33、行の高さ 2.05）、UI（PC x1195 y222 w968 ＋ スマホ x965 y316 w235。まとめて右から）。画像は `loading="lazy"`（02 にいるときに先に読まれる）
  - トークン：`--color-chara-mizu` / `--color-chara-iwa`
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 28 / 28 件 OK、コンソールのエラーなし
  - PDF を半透明で重ねて、02・03・hero の位置がほぼ一致（03 の背景は about-landform なので違う）。目線を戻した状態の黒目の位置：02 の水 (263.9, 777.3) ／ PDF (264.0, 777.3)、岩・森も一致。hero の目も数 px 以内
  - 12 秒の記録：hero にいる間は hero の目だけが動き、3体がばらばらのタイミングで瞬き（ときどき2回）・目線を動かした
- 残っていること・次にやること：Phase 4（04〜08 のスマホの持ち越し・中身の切り替え・背景色、09 の円形の出現・スライダー）
- 本体側に頼むこと：なし

## 2026-11-14 — 06 Phase 2：01-hero（マスク・雲・出現・白い幕）

- 指示書：docs/instructions/06_top-visual.md（Phase 2 まで）
- やったこと：
  - 位置は PDF（`.tmp-measure/` に書き出して方眼を重ねて測った。`.tmp-measure/` は .gitignore）：ロゴ x536 y152 w670／マスク x315 y343 w1105 h707／landform03（奥の三角）x528 y483 w700／landform02（青い山並み）x315 y640 w1105／landform01（手前の緑）x315 y680 w1105／iPad x600 y532 w500／キャラクター x448 y726 w844／mizu-phone x444 y930 w87。雲の幅は 108 / 62 / 78
  - マスク：`hero-mask.svg` を CSS の `mask`（`-webkit-mask` も）。中の要素は `.p-top-box` で、数字は Figma の座標のまま
  - 出現：ロゴ fade-up 1／キャラクター pop 2（mizu-phone も pop 2。ふくらむ中心をキャラクターの中心にした）／landform 01・03 slide-left 2・02 slide-right 2（距離 0.75rem）／iPad fade-up 5
  - 雲：`assets/js/modules/heroClouds.js`。はじめから2つ（途中の位置から）、そのあと 8〜18 秒おきに1つ、同時に4つまで。右の外 → 左の外、60 秒 ±15%。高さはマスクの上 40% のどこか。hero 以外では新しく出さず、出ている雲は CSS で止める。動きを減らす設定では止めて置くだけ
  - hero → 02：幕（`l-stage__curtain`。02 の背景色）が下からせり上がる。hero の要素は消さずに残す。舞台の背景色は被さりきってから替える。02 の要素とキャラクターの出現は幕のあと（`--motion-delay-base`）。02 の `--scene-lock` は幕＋1.4s（`@property` で `calc()` を時間として読めるようにした）
  - 読み込み：hero の画像は `fetchpriority="high"`・srcset/sizes。見えない画面は `display: none`、前後の画面は `.is-preload`（隠したまま描く）。共通の `assets/js/modules/cssVars.js`
  - 重なりを 去る画面 1 ＜ 幕 2 ＜ 画面をまたぐ要素 3 ＜ 今の画面 4 にした
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 27 / 27 件 OK、コンソールのエラーなし
  - 1728×1117 で PDF とほぼ同じ構図（目は Phase 3）。幕：450ms で半分まで上がり、hero は下に残る／1050ms で被さりきり、02 のテキストはまだ（このあと出る）。`--scene-lock` は 2.3s として読めた
  - 読む画像：1280×800 で landform 768w・1536w、3840×2160 で 1920w・2560w（5120w は読まない）、iPad は avif。開いた時点で読むのは hero の画像だけ
  - 1280×800 で構図が保たれる。動きを減らす設定で雲が止まる
- 残っていること・次にやること：Phase 3（02・03 のキャラクター、目の動き、03 の素材）
- 本体側に頼むこと：なし

## 2026-11-13 — 06 Phase 0・1：Top の切り替えの仕組みと、動きの変数・プリセット

- 指示書：docs/instructions/06_top-visual.md（Usami の回答を入れた版。`docs/` 直下の新しい版を写した）。Phase 1 まで
- Phase 0：Figma は MCP の月の回数制限があるので使わず、Usami の PDF（`docs/evecre-web.pdf`、9画面・1728×1117。commit していない）から、素材の使い道・背景色・文字を確かめた
- Usami の決定（2026-11-13）：ヘルプを先に main へ（`aed9e89`）／英字は Ultra（Google Fonts）・日本語はりょうゴシック PlusN（Adobe Fonts）／03 の背景は `about-landform`／02 の斜めの線は CSS／04〜08 のイラストと role はテキストと一緒／08 の文は PDF のとおり／ヘッダーのロゴは消す／目の位置は PDF から／背景色は PDF から測った値
- やったこと（Phase 1）：
  - `scrollStage.js` を作り直した：1回の操作で1画面（ホイールはひと続きの回転で1画面・スワイプ・キー・ドット）。`data-state` は before / entering / active / leaving / after、舞台に `data-current`・`data-direction`。切り替え中は `--scene-lock`（CSS）の間、入力を受けない。`#how-to` など（id か data-scene）で開く・移る（チャットボットの `/#how-to` のため）。最初の画面の画像を読んでから出す（`ready`）
  - `autoAdvance.js`：最後の次は `goTo(0, { direction: 'loop' })`。`top.js` は `stage.ready` のあとで自動送りを始める
  - CSS：`foundation/_motion.css`（動きの値）・`_animation.css` に `motion-*`（形）・`layout/_stage.css`（作り直し）・`layout/_stage-motion.css`（プリセット）・`object/project/_top.css`（位置は Figma の座標 `--x/--y/--w/--h`、`--top-u`。背景色・画面をまたぐ要素）。`_hero.css` は消した
  - `index.html`：9画面（hero / about / team / step-1〜5 / connect）。テキストは指示書と PDF のとおり。画像の場所は仮の四角（`p-top-ph`）。画面をまたぐキャラクターとスマホは `l-stage__persistent`
  - ヘッダー：ロゴを消した（Top・ヘルプ）。Top は舞台の上に重ねる（`l-header--overlay`）。「Top」→「TOP」
  - フォント：`assets/js/modules/webfonts.js`（Adobe Fonts の kit は JS だけ。インラインスクリプトの代わり）・Top の `<head>` に Ultra。`--font-family-base` / `--font-family-display`
  - トークン：`--color-top-sky/cream/butter/mint/green`、`--top-frame-w/h`・`--top-u`
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 25 / 25 件 OK
  - 1728×1117：hero から出現。トラックパッドの慣性（60回の小さなホイール）で1画面だけ進む。切り替え中の ↓ の連打は無視。↑ で戻ると去る画面は短いフェード。ドットで飛べる。09 から ↓ で進まない。`/#how-to` で STEP 1 から開く。タッチのスワイプで次へ。ページの scrollY は 0 のまま
  - 02 → 03 でキャラクター（仮の四角）が1つのまま縮みながら移る。04 → 05 でスマホが右から左へ移り、背景色がなめらかに替わる。09 はスマホを覆う
  - 展示モード（fast）：09 → 01（direction loop）→ 02 と回る
  - 動きを減らす設定で `--scene-lock` が 0.5s・距離 0
  - 1280×720 で全体が縮んで構図が保たれる。コンソールのエラーなし。りょうゴシック・Ultra が localhost で読めた
- 残っていること・次にやること：Phase 2（01-hero：マスク・雲・出現・白い幕の切り替え、素材の読み込み）
- 本体側に頼むこと：なし

## 2026-11-13 — ヘルプのページ（仕組みと記事の下書き）・05 のマージ

- 依頼：「ヘルプページを新しく作成して。https://aday.hitotabi.design/help を参考に」（指示書なし）。05 は main にマージ済み（`cd3172a`）
- ユーザーの決定：記事は Claude が下書き → ユーザーが確かめる／参考と同じ3階層／お問い合わせのボタンは置かない（行き先が無い）
- 参考ページから取ったのは構成だけ（トップ＝「なにかお困りですか？」＋検索＋カテゴリのカード、カテゴリ＝記事の一覧、記事＝パンくず・タイトル・最終更新・見出しと番号つきの手順）。文言・見た目・ロゴは使っていない
- やったこと：
  - `pages/help/`（トップ・category・article）、`assets/js/modules/help.js`、`assets/js/pages/help-top.js`・`help-category.js`・`help-article.js`、`assets/data/help.json`（4カテゴリ・16記事）、`scripts/check-help.mjs`（`npm run check:help`）
  - CSS：`component/_help-search.css`・`_help-list.css`・`_breadcrumb.css`、`project/_help.css`（仮の見た目）。トークン `--content-max-width`（05 で消しすぎていたのを戻した）・`--reading-max-width`・`--help-category-min-width`
  - Top のヘッダーに「ヘルプ」。ヘルプのページにもチャットボット
  - 展示モード：ヘルプは Top 以外なので、3分操作が無ければ Top に戻す。05 で消した `idleReturn.js`・`IDLE_RETURN_MS` を戻した
  - 検索はチャットボットの normalize（類義語・ひらがな/カタカナ）を使う。`synonyms.json` に読みがな（つうち・しょうたい・もくてき・ひきつぎ・こうかい・たすく）を足した
  - 記事の下書きは、本体（`c017185`）の CLAUDE.md（アカウント作成・イベント作成・目的と柱・振り返り・通知・Discord/Slack・引き継ぎ・みんなの記録・退会）を読んで書いた。全部 `checked: false`
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 24 / 24 件 OK。`check:help` → 誤りなし（確認がまだ 16 件・todo 5 件）。`check:faq` → 26/31・到達 31/31・誤答 0（読みがなを足しても変わらない）
  - dist で：トップに4カテゴリ、検索「つうち」→「通知を受け取る」が先頭、「やること」→ タスクの記事、「退会」→「アカウントを削除する」、0件のときは案内。カテゴリ・記事のパンくず・title・最終更新「2026/11/13」・関連する記事・カテゴリへ戻る。無い id は「見つかりませんでした」
  - 375px で横スクロールなし。コンソールのエラーなし。展示モード（fast）で記事を開いて 18 秒で Top（`?kiosk=1&fast=1`）に戻る
- 分かったこと：本体は `/explore` に `X-Robots-Tag` を付けない（本体の CLAUDE.md：2026-11-12 ユーザー判断）。CLAUDE.md §6 を直した
- 残っていること・次にやること：
  - **記事の中身の確認（ユーザー）**：`npm run check:help` で一覧が出る。特に todo の5つ（イベントを作るボタン名・招待リンクの場所・タスクを作るボタン名・山の説明・アカウント削除の場所）
  - 画像（スクリーンショット）を入れるなら `assets/img/help/` に置き、`image` ブロックで
  - チャットボットの答えから、ヘルプの記事へリンクする（faq.json の links に `/pages/help/article/?id=…`）
  - main へのマージ（ユーザーの確認待ち）
- 本体側に頼むこと：なし

## 2026-11-12 — 05 Phase 2：一覧・詳細・索引を消し、古い URL から「みんなの記録」へ移す

- 指示書：docs/instructions/05_move-archive.md（Phase 2・完了条件まで）
- やったこと：
  - 消した：`pages/event-log/` の一覧・詳細・索引の中身、`assets/js/pages/event-log.js`・`event-detail.js`・`event-struggles.js`、`modules/api.js`・`eventView.js`・`filterButtons.js`・`idleReturn.js`、`_event-log.css`・`_event-detail.css`・`_event-knowledge.css`・`_event-struggles.css`・`component/_event-card.css`、`assets/img/event-log/`、`assets/data/mock/`・`assets/data/snapshot/`、`scripts/fetch-snapshot.mjs`・`npm run snapshot`
  - 中身を減らした：`config.js`（`EXPLORE_URL`・`EVENT_ID_RE` だけ）、`format.js`（`safeUrl()` だけ）、`kiosk.js`（`IDLE_RETURN_MS`）、`common.js`（idleReturn・`CHATBOT_TOP_ONLY`）、`_variables.css`（判定の色・`--reading-max-width`・`--card-min-width`・`--detail-header-max-height`）、`build-dist.mjs`・`.gitignore`（mock・snapshot）
  - 使われているか確かめてから消した：Top（`top.js`）が使うのは `common.js`・`scrollStage.js`・`autoAdvance.js`、チャットボットは `format.js` の `safeUrl()`・`kiosk.js`・`character.js`・`exploreLink.js`。消したファイルを読んでいるところは残っていない（grep で0件）。`--content-max-width`・`--radius-sm`・`--space-9`・`--z-overlay` も今は使われていないが、トークンの段階として残した
  - 古い URL：`pages/event-log/index.html`・`detail/index.html`・`struggles/index.html` を、`assets/js/pages/explore-redirect.js` で移すだけのページにした。`?id=` が `EVENT_ID_RE` に合えば `EXPLORE_URL/<id>`、それ以外は一覧。展示モードなら `?kiosk=1`。JS が動かないときのリンクも置いた。`_redirects` はクエリの値をパスに移せないので使っていない
  - `style.css` の @import、`assets/css/README.md`（早見表・§5）、`_header.css` の説明、`docs/api-contract.md` の冒頭（もう読まない）、CLAUDE.md（§1・§2・§3・§5・§6・§7・§9・§10・§11・§12・§13）、START（展示会場の手順・表）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 18 / 18 件 OK。`check:faq` は 26/31・到達 31/31・誤答 0
  - `npm run build && node scripts/serve.mjs --root dist`：dist に Top・チャットボット・移すページだけ（mock・snapshot・消したファイルは無い）
  - 移す先（本体は Playwright で止めて URL だけ確認）：一覧 → `/explore`、`detail/?id=1792979092586` → `/explore/1792979092586`、`?id=<script>`・id 無し・索引 → `/explore`、展示モードの詳細 → `/explore/1792979092586?kiosk=1`、展示モードの一覧 → `/explore?kiosk=1`
  - Top：`X-Robots-Tag: noindex, nofollow`・meta も noindex, nofollow。チャットボットが開き、「みんなの記録って何？」のリンクが `/explore`。コンソールのエラーなし
  - `robots.txt`・`_headers` は変えていない
- 残っていること・次にやること：main へのマージ（ユーザーの確認待ち）。マージしたら Cloudflare Pages で `https://evecre.pages.dev/pages/event-log/detail/?id=…` が移ることを確かめる
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：`/explore` に `X-Robots-Tag: noindex, nofollow`（本体の指示書 §2）。外部サイトはもう公開 API を読まない（`PUBLIC_SITE_ORIGINS` は本体の「イベクリについて」の戻り先として使われている）

## 2026-11-12 — 05 Phase 1：「みんなの記録」（本体の /explore）へのリンク

- 指示書：docs/instructions/05_move-archive.md（Phase 1 まで。ユーザーから「本体の /explore が本番に出た」）
- ブランチ：`feature/05-move-archive`（main ＋ `chore/top-logo`（Top のロゴ）＋ `docs/explore-kiosk-request` を取り込んで始めた）
- やったこと：
  - `config.js` に `EXPLORE_URL`（`https://evecre-ver-2-2-1.onrender.com/explore`）
  - `assets/js/modules/exploreLink.js`：`exploreHref()`（展示モードなら `?kiosk=1` を足す。EXPLORE_URL の下だけ）・`setupExploreLinks()`（`[data-explore-link]` の href を書き直す。`common.js` から）
  - Top：ヘッダー「イベント一覧」→「みんなの記録」、アーカイブの画面のボタン「みんなの記録を見る」と、アプリに移ることが分かる文（仮の文言）。同じタブ
  - チャットボット：`knowledge-public` の links を本番の /explore（faq.json に URL を直接）・「みんなの記録を見る」。`chatbot.js` は links を `exploreHref()` に通す。patterns に「みんなの記録って何」、keywords に「みんなの記録」
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 25 / 25 件 OK。`check:faq` は 26/31・到達 31/31・誤答 0（変化なし）
  - ふだん：ヘッダー・ボタン・チャットボットのリンクが `…/explore`。展示モード：3つとも `…/explore?kiosk=1`
  - 本番の /explore に移ると、本体が `evecre:explore-kiosk` を保存して URL から kiosk を消し、ヘッダーの「イベクリについて」が `https://evecre.pages.dev/?kiosk=1`
  - コンソールのエラーなし
- 本体の確認で分かったこと：本体の依頼文（kiosk で戻る・ログインの導線を隠す）は実装済み（`public/js/views/explore.js`）。**`/explore` の応答に `X-Robots-Tag` が付いていない**（本体の指示書 §2）。本体の `index.html` 全体に `<meta name="robots" content="noindex">` があるので検索には載らないが、nofollow とヘッダーが無い
- 次にやること：Phase 2（一覧・詳細・索引を消す、古い URL から移す小さなページ、使わなくなった JS・CSS・データを消す）
- 本体側に頼むこと：`/explore` に `X-Robots-Tag: noindex, nofollow`（本体の指示書 §2 のとおり）

## 2026-11-11 — 05（公開イベントの閲覧を本体に移す）の調査と決定

- 指示書：docs/instructions/05_move-archive.md（まだ始めない。本体の `/explore` が本番に出てから。本体は `243cbcb` でまだ無い）
- ユーザーの決定：
  1. 「つまずいたこと」の索引は消してよい（本体にも当面作らない）
  2. 展示モードで `/explore` に移ったあと、しばらく操作が無ければ外部サイトの Top に戻したい（難しければ無くてもよい）。**「みんなの記録」（/explore）から Top へ移れること**は必須 → 本体への依頼文 `docs/requests/main-app-explore-kiosk-return.md`
  3. `EXPLORE_URL` は任せる → `https://evecre-ver-2-2-1.onrender.com/explore`（config.js に1か所。独自ドメインにしたら変える）
  4. 編集中だった Top のロゴ（`index.html`・`logo-with-tagline.svg`）は `chore/top-logo` に commit・push 済み
- 05 で外部サイト側がやること（調査の結果。指示書への追加を含む）：
  - ボタンの文言は「みんなの記録を見る」。展示モードのときは `EXPLORE_URL?kiosk=1` へ（依頼文 1-2）
  - 古い URL：`_redirects` はクエリの値をパスに移せないので、詳細（`?id=`）は「id を `EVENT_ID_RE` で確かめて `EXPLORE_URL/<id>` へ `location.replace` するだけ」の小さなページにする。一覧も同じ小さなページにすれば、URL を config.js の1か所に保てる（`_redirects` を使うなら build-dist の INCLUDE に足す）。どちらも noindex を残す
  - チャットボット：faq.json の `public-…` 項目の links `/pages/event-log/` → 本体の URL を直接書く（JSON なので config.js を読めない。ドメインを変えたらここも）
  - 消せる：`api.js`・`eventView.js`・`filterButtons.js`・`idleReturn.js`（Top 以外のページが無くなる）・`pages/event-*.js`・`_event-*.css`・`c-event-card`・`img/event-log/`・`assets/data/mock/`・`assets/data/snapshot/`・`fetch-snapshot.mjs`・`npm run snapshot`・config.js の API 関係の定数・一覧/詳細だけのトークン
  - 残す：`format.js`（チャットボットが `safeUrl()`。日付の関数は消せる）・`common.js`・`kiosk.js`・`EVENT_ID_RE`
  - CLAUDE.md の §2・§5（API のキャッシュの保存）・§6・§7・§10・§12・§13、START の展示の手順（snapshot）を直す
- 本体側に頼むこと：`docs/requests/main-app-explore-kiosk-return.md`（`/explore` のヘッダーに外部サイトの Top へのリンク、`?kiosk=1` のときの無操作で戻る・ログインの導線を隠す）。索引を消すので、本番に移ったあとは外部サイトは公開 API を読まなくなる（`PUBLIC_SITE_ORIGINS` は `publicSiteUrl` の元としては引き続き使う）

## 2026-11-10 — eventType・lastUpdated・blocks・reflections を読む（本体からの連絡）

- 元：`docs/external-site-eventtype-lastupdated-blocks-reflections.md`（本体からの連絡。2026-11-10 デプロイ済み）。指示書04 §7 と §8 の続き
- やったこと：
  - `eventType`：`eventView.js` に `EVENT_TYPE_LABEL`・`eventTypeLabel()`（表示名はここだけ。知らない id は出さない）。一覧のカードに表示名、一覧に2つ目の絞り込み「すべての種別＋一覧にある種別」（`data-type-filter`・`<template data-type-filter-template>`。告知・アーカイブのボタンは `data-status-filter` の中に）。詳細に「種別」の行
  - `lastUpdated`：`format.js` に `formatDate()`。詳細に「最終更新」の行。一覧のカードには出していない（04 §7「実際のデータを見てから」）
  - `blocks`：`renderKnowledgeText()` が見出し（h4）・段落・箇条書き（続いた item を1つの ul に）で描く。無ければ `text` を1段落。テンプレートの本文を `<p>` から `<div>` に
  - reflections：`api.js` に `listReflections()`。つまずいたことの索引は、ふだんこれを1回だけ取る。取れない（404・古い snapshot）ときだけ今までの「詳細を1件ずつ」（`collectByDetails()`）。429 なら「混み合っています」。`truncated` ならお知らせ
  - `fetch-snapshot.mjs`：`reflections.json` も保存（API に無い 404 なら作らず、古いものは消す）
  - mock：一覧・詳細に eventType・lastUpdated（ワークショップは eventType null）、knowledge に blocks（サマーキャンプの1件目は見出し＋箇条書き）、`mock/reflections.json`
  - `.gitignore`：snapshot の `events/`・`img/`・`reflections.json` を足した（実データを誤って commit しないように。今までは入っていなかった）
  - `docs/api-contract.md` の「依頼中・変更待ち」の節を、届いた4つの取り決めに置き換えた。CLAUDE.md §10・§13
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 24 / 24 件 OK
  - mock：種別のボタン「すべての種別／フェス・マーケット／ライブ・公演／交流会・パーティー／その他」（null のワークショップはカードに種別なし）。交流会 →「5件中 1件」、さらに告知 →「該当するイベントはありません。」。詳細：種別・最終更新「2026/7/25（土）」、本文が h4・p・h4・ul(li×2)。ワークショップは種別の行なし・本文1段落
  - 索引（mock）：`mock/reflections.json` 1回で2件（詳細は取らない）。reflections.json を 404 にすると詳細を1件ずつ取って同じ2件
  - 本番：索引は API に `/api/public/reflections` の1回だけ（今は振り返り0件で「まだ公開されていません」）。一覧に「ライブ・公演」、詳細に「種別 ライブ・公演」「最終更新 2026/11/6（金）」。375px で横スクロールなし
  - reflections が 429：snapshot があればそれを使う。無ければ「ただいま混み合っています。…」だけ（API に1回だけ）
  - `node scripts/fetch-snapshot.mjs`：「1 件、振り返り 0 件」。展示モードの索引は snapshot の events.json と reflections.json だけを読む（API に行かない）。確かめたあと snapshot は空に戻した
- 分かったこと：本番の公開イベントは2026-11-10 時点で1件（劇団四畳羊きらきらクリスマス公演・告知）。テスト公開は非公開になっていた
- 残っていること・次にやること：main にマージ済み（2026-11-11。目的・柱と本体への依頼文も一緒に）。見た目（種別・最終更新・本文の見出し／箇条書き）は Usami が作り込む。一覧のカードに最終更新を出すかは、データが増えてから
- 本体側に頼むこと：なし（依頼文 `docs/requests/main-app-public-reflections.md` は実装済み）

## 2026-11-09 — 詳細に「目的」と「柱」を出す（本体からの連絡）

- 元：`docs/external-site-purpose-pillars.md`（本体 `26e8c62` からの連絡。詳細の API に `purpose`・`pillars` が増えた）
- やったこと：
  - 詳細ページのナレッジの前に「目的」（文章）と「柱」（名前の並び）。`pages/event-log/detail/index.html` に `data-detail="purposeSection" / purposeBlock / purpose / pillarsBlock / pillars`、`event-detail.js` に `renderPurpose()`、`_event-detail.css` に `p-event-detail__purpose*` / `__pillars` / `__pillar`（仮の見た目）
  - 値が無い（null・空・項目が無い古い snapshot）見出しは外す。両方無ければまとまりごと外す
  - mock：サマーキャンプに目的＋柱2つ、ワークショップは `purpose: null`・`pillars: []`（出ないことの確認用）
  - `docs/api-contract.md` に項目と「いつ値が入るか」の表、CLAUDE.md §13 に1行
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 24 / 24 件 OK
  - mock（API_BASE を空にして）：サマーキャンプ＝目的と柱2つがナレッジの前に出る／ワークショップ・開催前のフェスタ＝まとまりごと出ない。375px で横スクロールなし
  - 本番：テスト公開の詳細に `purpose: null`・`pillars: []` が入っている（目的が未記入なので、まだ何も出ない）
- 分かったこと：本番に **`GET /api/public/reflections` がもう入っている**（2026-11-08 の依頼文のもの。`items[].event.eventType` も入っている）。本体からの正式な報告はまだ受け取っていない
- 残っていること・次にやること：main にマージ済み（2026-11-11）
  - （済み 2026-11-10）索引（`event-struggles.js`）を reflections に切り替える（依頼文 §5 の「外部サイト側で変えること」）。本体の報告を `api-contract.md` に貼ってから
  - 目的・柱の見た目は Usami が作り込む
- 本体側に頼むこと：reflections の正式な報告（api-contract.md に貼れる形）。eventType の id と文言の対応

## 2026-11-08 — 本体への依頼文：振り返りをまとめて返すエンドポイント

- やったこと：`docs/requests/main-app-public-reflections.md`（本体の Claude Code に渡す指示書）。`GET /api/public/reflections`：全公開イベントの振り返り（title・tags・outcome・struggle・solution と出どころのイベント）を1回で返す。値は `buildPublicEvent()` の knowledge から作る、basic が null のイベントは出さない、text・images・files は入れない、1000件で切って truncated
- 着手の目安：ナレッジのある公開イベントが10件を超えたら（ユーザーが本体側に渡す）
- 分かったこと：本体（`evecre01-node 2`、`432dd15`）はすでに公開 API の basic に `eventType`（`exhibit` / `festival_market` / `live_performance` / `contest` / `social` / `other` か null）と `lastUpdated` を足していて、本番の一覧にも出ている。指示書04 §7 の作業に入れる（本体からの正式な報告と、id ごとの文言を待つ）
- 本体側に頼むこと：上の依頼文（10件を超えたら）。eventType の id と文言の対応の報告

## 2026-11-08 — 04 §5：つまずいたことの横断索引（04 完了）

- 指示書：docs/instructions/04_event-reading.md（§5・完了条件まで。ユーザーの指示「1」＝今作る）
- やったこと：
  - `pages/event-log/struggles/index.html`・`assets/js/pages/event-struggles.js`・`object/project/_event-struggles.css`（style.css の Project に @import）
  - 1件：困ったこと → 次にやるなら → 出どころ（イベント名＝詳細へのリンク・タスク名）→ タグ。タグ（企画／運営／制作／広報）で絞る。件数「2件」／「2件中 1件」
  - 取り方：hasKnowledge が true だけ・開催の最終日が新しい順に 20 件まで・順に。読み込み中は「（3 / 20件）」。20件を超えたら「新しい20件のイベントから集めています。」
  - 429：その時点で止め、取れた分＋「ただいま混み合っているため、20件のイベントのうち 5件から…」。1件も取れていなければ「ただいま混み合っています。…」だけ
  - 導線：一覧の見出しの下「イベントをまたいで「つまずいたこと」を読む」、詳細のナレッジの節の終わり「ほかのイベントの「つまずいたこと」も読む」
  - `assets/js/modules/filterButtons.js` に絞り込みのボタンをまとめ、一覧も使う
- 直したこと：
  - **`api.js` の `getEvent()`**：API が 429 で、次の mock / snapshot にその id が無いと「見つからない（null）」を返していた（localhost と展示モードで起きる）。429 があれば `RateLimitedError` を投げるようにした。詳細ページも「混み合っています」になる
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 24 / 24 件 OK、check-faq は変化なし、`innerHTML` 0件
  - 本番データ：一覧1回＋詳細1回（テスト公開）だけ問い合わせ、「つまずいた記録は、まだ公開されていません。」（テスト公開の1件は success）
  - mock：2件（サマーキャンプ「当日のタイムテーブル」struggle／ワークショップ「材料の準備」null）。運営 →「2件中 1件」、企画 →「このタグのつまずいた記録はありません。」
  - 偽の API（Playwright で 25 件、hasKnowledge は 24 件）：詳細は 20 回だけ・同時に1つ（並列なし）・新しい順・お知らせが出る。6回目で 429 → 6回で止まり5件＋お知らせ。1回目で 429 →「混み合っています」だけ。開き直すとキャッシュで詳細0回。success と solution が空白だけのものは載らない
  - 展示モード：snapshot の events.json と詳細だけを読む（API に行かない）。確かめたあと snapshot は空に戻した
  - dist：/pages/event-log/struggles/ と新しい JS・CSS が 200
  - 375・1920×1080・3840×2160 で横スクロールなし。noindex あり
- 何件まで実用的か：
  - 1回開くと「一覧1回＋詳細（hasKnowledge のイベント数、最大20）回」。1人なら 20 件でも 21 回で 60 回に収まる。2回目以降の5分はキャッシュで0回
  - ただし回数制限は IP ごと。同じ回線（学内の Wi-Fi・展示会場）から1分に3人が初めて開くと 60 回を超える。順に取るので待ち時間も 20 件で数秒（1回 0.3 秒として 6 秒くらい）
  - 目安：ナレッジのあるイベントが **10 件を超えたら**本体に「振り返りをまとめて返すエンドポイント」を頼む時期。20 件を超えると古いものが索引に出なくなる
- 残っていること・次にやること：main にマージ済み（2026-11-08）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：knowledge[].blocks（依頼中）。ナレッジのあるイベントが10件を超えたら、振り返りをまとめて返すエンドポイント

## 2026-11-08 — 04 §3・§4・§6：ナレッジの見せ方・一覧の件数・文言

- 指示書：docs/instructions/04_event-reading.md（§12 の3：§5 の前の報告まで）
- やったこと：
  - §3：ナレッジ1件を「頭（判定＋タイトル＋タグ）→ 振り返り → 詳しく（本文・画像・ファイル）」に。判定は「うまくいった／つまずいた」、`data-state` で色。分け方は `eventView.js` の `outcomeKey()` だけ（REVIEW_LABELS・判定・件数の内訳が使う。§5 の索引も使う予定）。本文を描くのは `renderKnowledgeText()` だけ（blocks に備えて）。概要をタイトル直後のリードに。ナレッジの件数「2件（つまずいた 1件・うまくいった 1件）」。カードで囲まず区切り線と余白、文章の幅は `--reading-max-width: 44rem`
  - §3-0：ナレッジのテンプレートの目印を `data-knowledge="…"` に、カードを `data-card="…"` に付け替え（この2つのテンプレートだけ）。CSS の README §5 を直した
  - §4：一覧の見出しの横に件数「2件」／絞ると「2件中 1件」。0件（公開なし・絞って該当なし）は出さない
  - §6：一覧・詳細の title・description・フッター。詳細の読み込み中の title は「イベントの記録 | イベクリ」。フッターは Top と揃えて「© イベクリ」のまま（TODO だけ外した）。ロゴと Top は触っていない
  - api-contract.md に §7（eventType・lastUpdated 待ち）と §8（blocks を依頼中）を記録
- 決めたこと・理由：
  - 判定の色：うまくいった＝薄い緑の地に深い緑（#E8F2EA / #2F6A3B）、つまずいた＝薄い青の地に深い藍（#E6ECF5 / #34527E）。赤・橙・黄（警告の色）を避け、どちらも同じ明るさの落ち着いた色にした
  - 判定のトークン `--color-outcome-*` を _variables.css に
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 22 / 22 件 OK
  - mock（config.js を通信の途中で API なしに差し替え）：success は「うまくいった」＋「何をしたら、うまくいった？」だけ、struggle と null は「つまずいた」＋「困ったこと」「次にやるなら」。並びは head → review → detail
  - 本番データ：「テスト公開」は「1件（うまくいった 1件）」
  - 一覧：本番 2件 →「2件」／告知・アーカイブで「2件中 1件」。mock 5件 →「5件中 2件」「5件中 3件」。API が 0件 → 件数は出ず「公開されているイベントはまだありません。」
  - 375・1920×1080・3840×2160 で一覧・詳細とも横スクロールなし
- 残っていること・次にやること：§5（つまずいたことの横断索引）はユーザーの指示待ち。そのあと dist・展示モードの確認、CLAUDE.md の追記
- ユーザーに確認したいこと：
  - 公開は2件、hasKnowledge が true は1件（テスト公開）。その1件のナレッジは success だけなので、§5 の索引は今は0件になる
  - 1920×1080 では詳細のヘッダー画像（50svh）で、最初の画面にナレッジが入らない
- 本体側に頼むこと：knowledge[].blocks（api-contract.md の「本体へ依頼中」）

## 2026-11-06 — 03 Phase 3：Cloudflare Pages に出すファイルを絞る（03 完了）

- 指示書：docs/instructions/03_api-connect.md（Phase 3・完了条件まで）
- 本番データでの確認（Phase 2 の残り。ユーザーが「テスト公開」を公開）：
  - 公開は2件（1787536757139「テスト公開」archive・ナレッジ1件・画像1枚／1783149606759「イベクリ展示企画」upcoming・日程未定）
  - http://localhost:5173 の 1280・375：一覧2件、詳細は「何をしたら、うまくいった？」だけ（struggle 空）、R2 の画像が出る、横スクロールなし、コンソールのエラーなし。開催前は「ナレッジは開催後に公開されます。」
  - `npm run snapshot -- --with-images` → 2件・画像1枚。`?kiosk=1`（1920×1080）で一覧・詳細が snapshot だけから出る（API・mock・R2 に行かない）
  - **snapshot は実際のデータなので commit しない**ことにし、確かめたあと空に戻した。会場の端末で作る（START に手順）
  - Render は有料プラン（ユーザー確認済み）なので、止まって遅くなる心配はない。`API_TIMEOUT_MS` は 8 秒のまま
- やったこと：
  - `scripts/build-dist.mjs`（依存なし）：`dist/` を空にして `index.html`・`pages/`・`assets/`・`favicon.ico`・`robots.txt`・`_headers` をコピー。`assets/data/faq-tests.json`・`assets/data/mock/`・`.md`（assets/css/README.md）・`.DS_Store` は除く
  - `package.json` に `build`、`.gitignore` に `dist/`、`check-js.mjs` は `dist/` を見ない
  - `serve.mjs --root dist`（無いフォルダならエラーで止まる）
  - START に Cloudflare Pages の設定値・dist の確かめ方・展示会場の手順。CLAUDE.md §12（公開 API と配信）
- 決めたこと・理由：
  - mock も dist から除いた（本番では USE_MOCK_DATA が false で読まないため）。`.md` も開発用の説明なので除いた
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 22 / 22 件 OK、`node scripts/check-faq.mjs` → 正答 26 / 31・誤答 0
  - `npm run build` → dist に CLAUDE.md・docs/・scripts/・package.json・faq-tests.json・README.md・mock が無い
  - `node scripts/serve.mjs --root dist`：/CLAUDE.md・/package.json・/docs/START.md・/assets/data/faq-tests.json・/assets/data/mock/events.json は 404。Top（チャットボット）・一覧・詳細が本番データで動く、noindex の meta あり、エラーなし
- 残っていること・次にやること：
  - main にマージ済み（2026-11-06）。Pages のプロジェクトはユーザーが先に作っていて、マージ前の main（bf300d7、build スクリプトが無い）で `Missing script: "build"` になっていた。マージの push（041efa4）で作り直され、デプロイできた
  - https://evecre.pages.dev で確かめた：Top（チャットボット）・一覧2件・詳細（R2 の画像）が本番データで出る、コンソールのエラーなし、`X-Robots-Tag: noindex, nofollow`、robots.txt は `Disallow: /`
  - Pages は 404.html が無いと、無い URL にも Top の HTML を 200 で返す（シングルページアプリの扱い）。/CLAUDE.md・/package.json・/assets/data/faq-tests.json なども中身は Top の HTML で、ファイルは公開されていない。無い URL を 404 にしたいなら dist に 404.html を足す
  - FAQ の回答本文（12件 TODO）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし（PUBLIC_SITE_ORIGINS には localhost:5173 と evecre.pages.dev が入っている）

## 2026-11-06 — 03 Phase 2：本番の API に切り替える

- 指示書：docs/instructions/03_api-connect.md（Phase 2 まで）
- やったこと：
  - `config.js`：`API_BASE = 'https://evecre-ver-2-2-1.onrender.com'`、`USE_MOCK_DATA = globalThis.location?.hostname === 'localhost'`（Node の scripts からは false）、`API_CACHE_MS = 5分`
  - `api.js`：API の成功した応答（形が正しいものだけ）を sessionStorage（`evecre:api:<URL>`、`{ savedAt, data }`）に5分置いて使い回す。読み書きは try/catch。snapshot・mock は置かない
  - CLAUDE.md のブラウザ保存の決まりに、API のキャッシュを足した
- 確かめたこと（コマンドと結果）：
  - `curl -H "Origin: …" https://evecre-ver-2-2-1.onrender.com/api/public/events`：`http://localhost:5173` と `https://evecre.pages.dev` の両方で `Access-Control-Allow-Origin` が返る（PUBLIC_SITE_ORIGINS に両方入っている）。`Cache-Control: public, max-age=300`、`Vary: Origin`
  - **公開しているイベントは 0 件**（`{"ok":true,"events":[]}`）。本番データでの一覧・詳細の見た目はまだ確かめられていない
  - Playwright（http://localhost:5173）：一覧が本番の API から取れて「公開されているイベントはまだありません。」（API が答えたので mock には行かない）／2回目は API に行かない（キャッシュ）／保存時刻を5分前にずらすと取り直す／存在しない id は API の 404 で「見つかりませんでした」
  - `npm run snapshot -- --with-images` → 0 件・画像 0 枚で正常終了。snapshot から出ることは Phase 1 で偽の API で確かめ済み
  - `npm run check` → 21 / 21 件 OK
- 残っていること・次にやること：
  - イベクリでイベントを1件「宣伝用に公開」にしてもらい、本番データで一覧・詳細・snapshot・展示モードを確かめる（→ Phase 3 の記録で済ませた）
  - Phase 3（dist/ を作る・Cloudflare Pages の設定値）
- ユーザーに確認したいこと：
  - 確認用に、イベントを1件公開できるか
  - Render の無料プランなら、15分アクセスが無いと止まり、起きるまで30秒〜1分かかる。今の `API_TIMEOUT_MS` は 8 秒なので、止まっているときの最初の1回は失敗する（Pages では snapshot が空なので「読み込めませんでした」）。有料プランか、時間を延ばすか
- 本体側に頼むこと：なし

## 2026-11-06 — 03 Phase 1：応答の形を実際の API に合わせる

- 指示書：docs/instructions/03_api-connect.md（Phase 1 まで）
- やったこと：
  - `api.js`：一覧は `{ ok: true, events }` を読む（`ok` が true でない・events が配列でない → 失敗として次の取り先へ）。詳細も `ok` を確かめる。429 は `RateLimitedError`（export）。次の取り先を試し、どこからも取れなかったときに 429 があればそれを投げる。失敗した一覧はキャッシュに残さない
  - `event-log.js` / `event-detail.js`：429 なら「ただいま混み合っています。1分ほどおいて開き直してください。」
  - `event-detail.js`：success の見出しを「効いたこと」／「何をしたら、うまくいった？」に。struggle は空白だけでも出さない。画像は本文の後ろ・PDF は target=_blank で download なし・thumb があれば画像（これは 01 で済んでいたのを確かめた）
  - mock の一覧・詳細を `{ ok: true, … }` の形に。success の振り返りは struggle を空にし、solution に「何をしたら、うまくいった？」の中身を入れた
  - snapshot の空の状態を `{ "ok": true, "events": [] }` に
  - `fetch-snapshot.mjs`：API の応答の形で保存する（一覧は `{ ok: true, events }`、詳細はそのまま）。形が違えば失敗。429 なら 61 秒待って1回だけ取り直す
- 決めたこと・理由：
  - 429 でも mock / snapshot があればそちらを見せる（展示モードでは snapshot が先なので、そもそも API に行かない）
  - 日付：`new Date("YYYY-MM-DD")` を使っている所は無かった（format.js は `new Date(y, m - 1, d)`）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 21 / 21 件 OK、`node scripts/check-faq.mjs` → 正答 26 / 31・誤答 0（変化なし）
  - Playwright（config.js を通信の途中で差し替えて偽の API に向けた。ファイルは変えていない）：一覧・詳細が API の形で出る（数字の id・HTML の入ったタイトルは文字のまま）／存在しない id → 見つかりません／429 で mock なし → 一覧・詳細とも「混み合っています」／429 で mock あり → mock の一覧に切り替わる
  - mock：success の振り返りは「何をしたら、うまくいった？」だけ、struggle は「困ったこと」「次にやるなら」、PDF は target=_blank・download なし
  - 偽の API（scratchpad の fakeapi/server.mjs）に `node scripts/fetch-snapshot.mjs --api http://localhost:5299 --with-images` → 2件・画像4枚を保存、URL が snapshot/img/ に書き換わる。`?kiosk=1` で一覧・詳細が snapshot から出る（API にも mock にも行かない）。確かめたあと snapshot を空に戻した
  - 429 の待ち直し（61秒）は実際には試していない
- 残っていること・次にやること：Phase 2（本番の API_BASE・mock はローカルだけ・sessionStorage に 5 分キャッシュ・本番データで確認・snapshot）
- ユーザーに確認したいこと：本体の本番 URL（Render）、`PUBLIC_SITE_ORIGINS` を入れたか
- 本体側に頼むこと：なし（main へのマージ・デプロイ・PUBLIC_SITE_ORIGINS はユーザーが行う）

## 2026-11-04 — 02 Phase 4：正答率のチェック（02 完了）

- 指示書：docs/instructions/02_chatbot.md（Phase 4・完了条件まで）
- やったこと：
  - `scripts/check-faq.mjs`（`npm run check:faq`、`--tune` でしきい値の表）。faq.json の検査（id の重複・無い related・自分自身の related・patterns 5個未満・無いカテゴリ・リンクの形・テストの expect が無い id）、正答・到達・誤答・answer / suggest / fallback の割合、外れた質問の一覧
  - テストを 15 → 31 件に（答えない質問 5件を含む）
  - 精度の調整：`FILLER_PHRASES` に話し言葉（って・なに・なんで・したらいい・すればいい・いいですか）、`synonyms.json` に はじめ（最初・まず）・流れ・機能・イベクリ（アプリ）・育つ を追加、keywords の重複をまとめる（類義語で同じ語になったものの二重加点を防ぐ）、質問が keyword そのものだけなら近さ 1（「山ってなに？」→「山」の1文字になり、2文字ずつでは点が出なかったため）
  - faq.json の誤りを直した：task-create と member-invite の related にあった `task-assign`（存在しない）を、それぞれ [review-write, process-flow] と [event-create, task-create] に
- 決めたこと・理由：
  - 答えない質問（expect: null）は fallback のときだけ正答とする（関係の無い「もしかして」を出すのもよくないため）
  - しきい値は初期値のまま（ANSWER 0.55 / SUGGEST 0.30 / MARGIN 0.05）。表で誤答 0・到達 100% のうち一番答える範囲。0.50 以下にすると誤答が1件出る（「後輩に記録を残したい」→ review-write）
  - テストの文は patterns に写していない（類義語と言い回しの規則で上げた）
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 21 / 21 件 OK
  - `npm run check:faq` → 検査の誤り 0（注意：answer が TODO 12件）。正答 26 / 31（84%）・到達 31 / 31（100%）・誤答 0。answer 68% / suggest 16% / fallback 16%
  - 調整前（31件）：正答 21・到達 28
  - 完了条件のパネル表示（375 / 1920×1080）と展示モードの止まる・再開は Phase 3 で確認済み
- 残っていること・次にやること：
  - FAQ の回答本文（12件とも TODO）を書く
  - 「もしかして」に残る5件（後輩を入れたい・ゴールの決め方・準備の進め方・どんな機能・後輩に記録）は、回答本文が入ってから言い回しを見直す
  - main にマージ済み（2026-11-04、fast-forward）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

## 2026-11-04 — 02 Phase 3：パネル UI ＋ キャラクター

- 指示書：docs/instructions/02_chatbot.md（Phase 3 まで）
- やったこと：
  - チャットボットのパネル `assets/js/modules/chatbot/chatbot.js`（`startChatbot({ kiosk })`）。`common.js` から全ページで起動。Top だけにするなら `config.js` の `CHATBOT_TOP_ONLY = true`
  - キャラクターの部品 `assets/js/modules/character.js` ＋ `object/component/_character.css`（`c-character`）。ユーザーが `assets/img/character/` に入れた素材を使い、読み込みごとに mizu / mori / iwa から1体を選ぶ。右下のボタンとパネルの見出しに同じ1体を出す
  - 瞬き（`character-blink`：13 / 16 / 19 秒に1回、目を縦に潰す）と目線（`character-glance`：29 / 34 / 41 秒に1回、正面→ちらっと見る先→普段の目線）。動きを減らす設定では止まる
  - 置き場所 `layout/_chatbot.css`（`l-chatbot`。右下に固定）、中身 `object/component/_chatbot.css`
  - Top の使い方の scene に `id="how-to"`（FAQ のリンク先）
- 変えたファイル：上のほか `common.js`・`config.js`・`kiosk.js`（`CHATBOT_RESET_MS`）・`style.css`・`_variables.css`（`--radius-full`・`--chatbot-*`）・`index.html`
- 決めたこと・理由：
  - 目の寸法はユーザーの参考コードのまま。目の位置（`--face-left` / `--face-top`、幅 20.5%）は `suggest-box-*.svg` の白目の円から実測（参考コードの top 12% / width 27% は別の素材向けの値だったため）。普段の目線は参考コードの値
  - 参考コードの `style="--char-body:url(…)"` は HTML に `style` を書かない決まりに合わないので、体は `<img>`、目の位置は modifier（`c-character--mizu` など）の CSS 変数にした
  - `character-closed-eyes.svg`（参考コードの閉じた目）はフォルダに無いので使っていない。瞬きは目を縦に潰すだけ
  - Component は位置を持たない決まりなので、右下に固定するのは Layout の `l-chatbot`
  - パネルの中のキー操作は Top の舞台に渡さない（入力欄やボタンで ↓ を押しても画面が送られない）
  - 自由入力・選択のたびに、ユーザーの発言が一覧の一番上に来るようにスクロールする（長い回答を頭から読めるように）
  - スマホ（〜600px）の全画面のあいだは右下のボタンを隠す（送信ボタンに重なるため）。閉じるのは見出しの ×
  - 答えられなかった質問の `console.info` は localhost / 127.0.0.1 のときだけ
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 20 / 20 件 OK
  - Playwright（1280×800・375×667・1920×1080）：開く→ aria-expanded=true・入力欄にフォーカス／カテゴリ→ featured→回答→ links・related・ほかの質問をする／自由入力で answer・fallback／`<img onerror>` を入れても img は作られない／パネルで ↓ を押しても Top は動かない／Esc で閉じてトグルにフォーカス／chatbot:open・close が1回ずつ発火／375 で全画面・横スクロールなし／リンクで `/#how-to` に移ってパネルが閉じる／6回読み込んで3体とも出る
  - 展示モード（`?kiosk=1&fast=1`）：開いている間は自動送りが止まる → 18秒操作なしで閉じてあいさつだけに戻る → 閉じたあと自動送りが再開
  - 動きを減らす設定で瞬き・目線のアニメーションが無くなる
- 残っていること・次にやること：Phase 4（`scripts/check-faq.mjs`、テストを30件に、精度の調整）。FAQ の回答本文はまだ TODO
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

## 2026-11-04 — 02 Phase 2：判定エンジン

- 指示書：docs/instructions/02_chatbot.md（Phase 2 まで）
- やったこと：`assets/js/modules/chatbot/normalize.js`・`matcher.js`・`engine.js`（DOM に依存しない ES Module）
- 決めたこと・理由：
  - normalize：NFKC → 小文字 → ひらがなをカタカナに → 記号・空白を除く → 類義語を代表の語へ（長い順の1つの正規表現）→ 言い回しの語尾・つなぎを除く（`FILLER_PHRASES`）。1文字の助詞は除かない（2文字ずつの手がかりが減りすぎるため）
  - matcher：scorer は `{ prepare(raw, normalized), similarity(a, b) }` の形で差し替えられる。既定は `bigramScorer`（Dice 係数）。意味検索を足すときは `combineScorers([{ scorer, weight }, …])` で重み付きの平均にする。prepare に元の文も渡すのは、意味検索は正規化前の文を使うため
  - keywords は1つ含まれるごとに `KEYWORD_BONUS = 0.1` を足す（点数は 1 を超えることがある）
  - engine：`createEngine({ faq, synonyms, scorer?, thresholds?, onUnanswered? })` → `ask` / `getItem` / `featured` / `categories` / `unanswered` / `normalize`。答えられなかった質問はメモリ上の配列に貯め、`onUnanswered` で知らせる（console.info は Phase 3 のパネル側で、開発中だけ出す）
  - suggest の候補は上位3件のうち点数が 0 より大きいもの
- 確かめたこと（コマンドと結果）：
  - `npm run check` → 18 / 18 件 OK
  - 15件のテスト（しきい値は指示書の初期値のまま）：answer が正しい 5件、答えない質問 3件が正しく fallback → 8 / 15。外れた 7件のうち 4件は suggest の1位が正解（もしかしてで正解が一番上に出る）。fallback になった3件：「山ってなに？」0.24、「まず何をしたらいい？」0.25、「準備って何から進める？」（1位が howto-start）
  - 正規化の例：「やること増やすには？」→「タスク作成」、「ＴＯＤＯを作りたいです！」→「タスクヲ作成」
- 残っていること・次にやること：Phase 3（パネル UI）。精度の調整は Phase 4（言い回しの追加・「って」「なに」など話し言葉のつなぎの追加・しきい値）
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

## 2026-11-04 — 02 Phase 1：チャットボットのデータの形

- 指示書：docs/instructions/02_chatbot.md（Phase 1 まで）。ブランチ `feature/02-chatbot`
- やったこと：`assets/data/faq.json`（4カテゴリ × 3件 = 12件、言い回し各10個）、`assets/data/synonyms.json`（11グループ）、`assets/data/faq-tests.json`（15件。答えない質問 3件を含む）
- 決めたこと・理由：
  - 回答本文はすべて `TODO`。質問は、01 の指示書に書かれた機能（タスク・山・振り返り・引き継ぎ・通知・メンバー・目的）と、本体のコードで存在を確かめた機能（招待・プッシュ通知・アーカイブ）だけから選んだ（機能を推測で書かないため）
  - Top の使い方へのリンクは `/#how-to`。Phase 3 で how-to の section に `id="how-to"` を付ける（今は付いていない）
  - テストの質問は、patterns と同じ文にしない（そのまま当たってしまい、チェックにならないため）。Phase 4 で 30 件程度に増やす
  - 類義語の「公開」に「アーカイブ」「ナレッジ」を寄せた（イベント一覧を見たい質問を、公開の項目に集めるため）。言葉の意味としては近くないので、本番のデータで見直す
- 確かめたこと：3ファイルとも JSON として読める
- 残っていること・次にやること：Phase 2（判定エンジン）
- ユーザーに確認したいこと：12件の質問の選び方／類義語
- 本体側に頼むこと：なし

## 2026-11-04 — GitHub に push・main を作成

- 指示書：なし（01 の仕上げ）
- やったこと：リモート `origin` = https://github.com/evecre/platform.git を登録し、`feature/01-foundation` を push。ユーザーの確認後、同じ commit から `main` を作って push
- 決めたこと・理由：
  - 最初は `evecre-developer/evecre-platform` に push しようとしたが、`Usamy1106` に権限が無く（403 → 招待後も Repository not found）、ユーザーが `evecre/platform` に切り替えた
  - main は feature ブランチから早送りで作った（まだ main に commit が無かったため、マージ commit は無い）
- 確かめたこと（コマンドと結果）：`git push -u origin HEAD` が通った
- 残っていること・次にやること：GitHub の Default branch を `main` にする（ユーザー）。指示書 02（チャットボット）は `feature/02-chatbot` で作業する
- ユーザーに確認したいこと：なし
- 本体側に頼むこと：なし

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
