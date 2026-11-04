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
  - main へのマージ（ユーザーの確認後）
- ユーザーに確認したいこと：main にマージしてよいか
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
