# assets/css — スタイルの置き場所

**「この見た目を変えたい」→「このファイル」** を迷わずたどれる状態を保つための規約。本体（`public/css/README.md`）と同じ FLOCSS で書く。

- `style.css` には **`@import` 以外を書かない**。並び＝詳細度の弱い順で、**入れ替えるとカスケードが壊れる**
- ファイルを足したら、`style.css` の該当レイヤーの位置に `@import` を足し、下の早見表にも1行足す
- ファイル名は `_` 始まり（単体では読み込まないパーシャルの目印）
- 各ファイルの先頭に、何を書くファイルかを1〜2行のコメントで書く

---

## 1. どこに書くか

| レイヤー | 接頭辞 | 置き場所 | 書くもの | 判断基準 |
|---|---|---|---|---|
| Foundation | なし | `foundation/` | reset、トークン、素の要素、文字サイズ、共有 `@keyframes` | サイト全体の前提か |
| Layout | `l-` | `layout/` | ヘッダー、フッター、スクロールの舞台 | 1ページに1つしか無い領域か |
| Component | `c-` | `object/component/` | ボタン、イベントカード、チャットボット | 2ページ以上で使い回すか |
| Project | `p-` | `object/project/` | ページ固有のブロック（`p-hero`、`p-top-concept` …） | 特定のページだけで意味を持つか |
| Utility | `u-` | `object/utility/` | `u-hidden` | 最後の手段。増やさない |

### 守ること

- Component は自身の外側の余白（margin）と位置を持たない。配置は親（`l-` / `p-`）が決める
- Project から Component の中身を直接上書きしない。必要なら `c-` に modifier を足す
  - ✗ `.p-top-archive .c-event-card__title { … }`
  - ✓ `.c-event-card--large .c-event-card__title { … }`
- `!important` 禁止（`u-hidden` だけ例外）。CSS Nesting を使わない。`id` にスタイルを当てない
- 色・サイズを直書きしない。`foundation/_variables.css` に名前を付けてから使う
- 状態は `is-` クラス（`is-active` / `is-open`）か `data-state` 属性で表す
- HTML に `<style>` / `style=""` を書かない

---

## 2. 早見表 — 変えたい見た目 → 触るファイル

| 変えたいもの | ファイル |
|---|---|
| 色・余白・文字サイズの段階・z-index・動きの時間の値そのもの | `foundation/_variables.css` |
| 画面の大きさに合わせた文字の伸び方（`--font-size-root`） | `foundation/_variables.css` |
| 画面全体の背景色・文字色・基本フォント・フォーカスの枠 | `foundation/_base.css` |
| 素の `h1`〜`h3`・本文の文字サイズ | `foundation/_typography.css` |
| 共有のアニメーション（`fade-in` / `fade-up`） | `foundation/_animation.css` |
| 要素の初期化（`box-sizing`、余白の全消しなど） | `foundation/_reset.css` |
| ヘッダー（ロゴ・Top / イベント一覧のリンク・今いるページの色） | `layout/_header.css` |
| 本文の領域（`l-main`） | `layout/_main.css` |
| フッター（コピーライト） | `layout/_footer.css` |
| Top のスクロールの舞台（scene の長さ・画面への固定・active 以外を隠す・ドットの置き場所） | `layout/_stage.css` |
| 現在位置のドット（`c-step-indicator`。今の画面は `.is-active`） | `object/component/_step-indicator.css` |
| Top の最初の画面（`p-hero`。出現アニメーションの例） | `object/project/_hero.css` |
| イベントのカード（`c-event-card`。ラベルは `__label--upcoming` / `--archive`） | `object/component/_event-card.css` |
| イベント一覧のページ（見出し・絞り込みのボタン・カードの並び・読み込み中などのメッセージ） | `object/project/_event-log.css` |
| イベント詳細のページ（ヘッダー画像・ラベル・開催日時と場所・概要・ナレッジの枠・戻るリンク） | `object/project/_event-detail.css` |
| 詳細のナレッジ1件（判定・タスク名・タグ・振り返り2項目・「詳しく」の本文・画像・ファイル） | `object/project/_event-knowledge.css` |
| 判定（うまくいった／つまずいた）の色 | `foundation/_variables.css` の `--color-outcome-*`（★つまずいたを警告の色にしない） |
| 文章の1行の長さの上限（詳細の概要・ナレッジ） | `foundation/_variables.css` の `--reading-max-width` |
| 角丸・本文の最大幅・カードの最小幅の値 | `foundation/_variables.css` |
| チャットボットの置き場所（右下に固定） | `layout/_chatbot.css` |
| チャットボットのボタン・パネル・吹き出し・選択肢・入力欄（開いている間は `.c-chatbot.is-open`） | `object/component/_chatbot.css` |
| キャラクター（目の位置・普段の目線・瞬きと目線の周期） | `object/component/_character.css` |
| 要素を隠す（`u-hidden`） | `object/utility/_hidden.css` |

---

## 3. 文字サイズの考え方

スマホ（375px）から 55インチ（1920×1080 / 3840×2160）まで同じ CSS で読めるようにしている。

- **基準**（`html` の font-size ＝ `--font-size-root`）が画面に合わせて伸びる
  - スマホ〜ノート PC：16px（ブラウザの設定の文字サイズ）
  - 1920×1080：20px
  - 3840×2160：40px
  - 幅と高さの小さいほうで決まる。横長の画面で一画面に収まらなくなるのを防ぐため
- 文字サイズ・余白は **rem で書く**。rem なら基準と一緒に伸びるので、55インチでも同じ比率で見える
- `px` で書くと、4K のモニターで文字だけが小さく残る。線の太さなど伸ばしたくないもの以外は使わない
- 見出しの段階（`--font-size-xl` 〜 `3xl`）は、スマホで小さく、広い画面で大きくなる

## 4. Top のスクロールの舞台

Top は縦に長いページではなく、スクロールに合わせて **scene（画面）が入れ替わり、いつも一画面で見せる**。
仕組みは `layout/_stage.css` と `assets/js/modules/scrollStage.js`。見せ方（出方・引き方）は scene ごとに `p-` のファイルで作る。

### 形

```html
<main class="l-main l-stage" data-stage>
  <section class="p-top-problem l-stage__scene" data-scene="problem" data-steps="2">
    <div class="l-stage__frame">
      <h2 class="p-top-problem__title">…</h2>
      …
    </div>
  </section>
  …
  <nav class="c-step-indicator l-stage__indicator" data-stage-indicator aria-label="画面の位置"></nav>
</main>
```

- `section`（`l-stage__scene`）は**スクロールの長さだけ**を持つ（`data-steps` × 100svh）。見えない
- 中の `l-stage__frame` が**画面に固定**されて見える部分。scene の中身は全部この中に書く
- 今の scene 以外の `__frame` は隠れる（`visibility: hidden`）。隠れるのは `--duration-slow` だけ遅れるので、その間に引いていく動きを見せられる
- scene は画面の上から下へスライドしない。入れ替わりの見せ方は全部 CSS で作る

### JS が付けるもの

| 付くもの | 値 | 使い方 |
|---|---|---|
| `data-state` | `before`（まだ来ていない）/ `active`（今）/ `after`（通り過ぎた） | 出る・引く。`before` と `after` で引き方を変えると、戻るときと進むときで違う動きにできる |
| `--progress` | 0〜1（その scene を通過した割合） | スクロールに合わせて連続で動かす。例：`transform: translateY(calc((1 - var(--progress)) * var(--space-8)))` |
| `data-step` | `0`、`1`、…（`data-steps` が 2 以上の scene だけ） | 中の要素を段階的に出す |

例：active になったら下からふわっと出る（`object/project/_hero.css` に書いてある）

```css
.p-hero__title { opacity: 0; transform: translateY(var(--space-6)); transition: opacity var(--duration-slow) var(--easing-base), transform var(--duration-slow) var(--easing-base); }
.p-hero[data-state="active"] .p-hero__title { opacity: 1; transform: none; }
```

例：`data-steps="4"` の使い方で、ステップが進むごとに項目を1つずつ出す

```css
.p-top-howto__item { opacity: 0; transition: opacity var(--duration-base); }
.p-top-howto[data-step="0"] .p-top-howto__item:nth-child(-n + 1),
.p-top-howto[data-step="1"] .p-top-howto__item:nth-child(-n + 2),
.p-top-howto[data-step="2"] .p-top-howto__item:nth-child(-n + 3),
.p-top-howto[data-step="3"] .p-top-howto__item { opacity: 1; }
```

### 新しい scene の足し方

1. `index.html` の `l-stage` の中、入れたい位置に `section` を足す。`class="p-top-○○ l-stage__scene"`、`data-scene="○○"`（英小文字の名前）、`data-steps="段階の数"`
2. 中に `<div class="l-stage__frame">` を置き、見出し（`h2`）と中身を書く。見出しの文字がドットの読み上げの名前になる
3. `object/project/_top-○○.css` を作り、`style.css` の Project の位置に `@import` を足し、上の早見表にも1行足す
4. ドットと、展示モードの自動送りの順番は自動で増える（JS は触らなくてよい）

### 気をつけること

- `data-steps` は 1〜8。9 以上にするときは `layout/_stage.css` に行を足す
- `l-stage__frame` に `transition` を書くときは、visibility を消さないように `transition: opacity …, visibility 0s linear var(--duration-slow);` と並べて書く
- scene（`section`）や `__frame` の親に `transform` / `filter` を付けない（画面への固定が効かなくなる）
- 一画面に収まらない分は切れる（`overflow: hidden`）。スマホ（375×667 くらい）でも収まる量にする
- JS が動く前は普通の縦並びのページとして読めるが、`opacity: 0` から出す要素は JS が動くまで見えない

## 5. イベント一覧・詳細のマークアップ

カードとナレッジ1件の HTML は、各ページの `<template>` に書いてある（`pages/event-log/index.html`、`pages/event-log/detail/index.html`）。JS はそれを複製して文字を入れるだけなので、**クラスや要素の並びは HTML の `<template>` を直せば変わる**。

- JS が探すのは `data-*` の属性だけ（カードは `data-card="…"`、ナレッジ1件は `data-knowledge="…"`）。**クラスは見た目のためのものなので、名前を変えてよい**。`data-*` の属性は消さないこと
- ナレッジ1件の判定は `[data-knowledge="outcome"]` に `data-state="success | struggle"` が付く。色はこれで変える

読み込み中・0件・失敗のときは、`p-event-log__message` / `p-event-detail__message` に文が入る。隠すときは `u-hidden` が付く。

## 6. 展示モードのときだけの見た目

展示モード（`?kiosk=1`）の間は `<html>` に `.is-kiosk` が付く。展示中だけ変えたいものは、それを起点に書く（例：カーソルを隠す、ドットを大きくする）。

```css
.is-kiosk .c-step-indicator__dot { … }
```

## 7. 動きを減らす設定

`prefers-reduced-motion: reduce` のとき、`--duration-*` が 0 になる。`transition` / `animation` の時間は直書きせず、このトークンを使うこと（使っていれば、設定に合わせて自動で止まる）。

## 8. チャットボットとキャラクター

チャットボットの要素は JS（`assets/js/modules/chatbot/chatbot.js` の `buildUi()`）が body の最後に足す。並びを変えるときはそこを直す。

```
div.l-chatbot
  div.c-chatbot（開いている間 .is-open）
    div.c-chatbot__panel（role="dialog"）
      div.c-chatbot__header  > span.c-character.c-chatbot__avatar / h2.c-chatbot__title / button.c-chatbot__close
      div.c-chatbot__log（aria-live="polite"）
        div.c-chatbot__message.c-chatbot__message--bot | --user
          p.c-chatbot__text（改行は white-space: pre-line）
          ul.c-chatbot__links > li > a.c-chatbot__link
          div.c-chatbot__choices > button.c-chatbot__choice--category | --question | --other
      form.c-chatbot__form > input.c-chatbot__input / button.c-chatbot__send
    button.c-chatbot__toggle > span.c-character.c-chatbot__toggle-character
```

キャラクター（`c-character`）は `assets/js/modules/character.js` の `createCharacter()` で作る。大きさは置く側が `width` で決める（高さは素材の比率で決まる）。
目の寸法・位置は素材から実測した値なので、素材を差し替えたとき以外は変えない（`_character.css` のコメントに計算がある）。
