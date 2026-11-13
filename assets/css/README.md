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
| Component | `c-` | `object/component/` | ボタン、チャットボット、キャラクター、ヘルプの検索の欄 | 2ページ以上で使い回すか |
| Project | `p-` | `object/project/` | ページ固有のブロック（`p-top-hero`、`p-help-article` …） | 特定のページだけで意味を持つか |
| Utility | `u-` | `object/utility/` | `u-hidden` | 最後の手段。増やさない |

### 守ること

- Component は自身の外側の余白（margin）と位置を持たない。配置は親（`l-` / `p-`）が決める
- Project から Component の中身を直接上書きしない。必要なら `c-` に modifier を足す
  - ✗ `.p-hero .c-chatbot__toggle { … }`
  - ✓ `.c-chatbot__toggle--large { … }`
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
| 共有のアニメーション（`fade-in` / `fade-up`、Top の動きの形 `motion-*`） | `foundation/_animation.css` |
| **Top の動きの値**（速さ・距離・イージング・順番の間隔・切り替え中に入力を止める長さ） | `foundation/_motion.css` |
| 要素の初期化（`box-sizing`、余白の全消しなど） | `foundation/_reset.css` |
| ヘッダー（ロゴ・Top / みんなの記録のリンク・今いるページの色） | `layout/_header.css` |
| 本文の領域（`l-main`） | `layout/_main.css` |
| フッター（コピーライト） | `layout/_footer.css` |
| Top の舞台（画面の重なり・見せる／隠す・背景色が替わる仕組み・画面をまたぐ要素の層・ドットの置き場所） | `layout/_stage.css` |
| Top の出現・後退のプリセット（`data-enter` / `data-leave` / `data-order`） | `layout/_stage-motion.css` |
| 現在位置のドット（`c-step-indicator`。今の画面は `.is-active`） | `object/component/_step-indicator.css` |
| Top の各画面の位置・大きさ（Figma の座標）・背景色・文字・画面をまたぐ要素の画面ごとの位置 | `object/project/_top.css` |
| Top の背景色・基準のフレーム（1728×1117）・`--top-u` | `foundation/_variables.css` の `--color-top-*`・`--top-*` |
| 角丸・本文の最大幅の値 | `foundation/_variables.css` |
| ヘルプの検索の欄（`c-help-search`。小さい版は `--compact`） | `object/component/_help-search.css` |
| ヘルプの記事の一覧（検索結果・カテゴリ・関連する記事。`c-help-list`） | `object/component/_help-list.css` |
| パンくず（`c-breadcrumb`。ヘルプのカテゴリ・記事） | `object/component/_breadcrumb.css` |
| ヘルプの3ページ（トップの見出し・カテゴリのカード・記事の見出し・手順・補足・関連する記事） | `object/project/_help.css` |
| ヘルプの本文の幅・カテゴリのカードの最小幅 | `foundation/_variables.css` の `--reading-max-width`・`--help-category-min-width` |
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

## 4. Top の舞台（紙芝居）と動きの調整

Top は、**1回のスクロール操作（ホイール・スワイプ・↓↑ キー・ドット）で1画面ずつ切り替わる**。切り替わりのアニメーションは時間で再生する（スクロール量には連動しない）。
仕組みは `assets/js/modules/scrollStage.js` と `layout/_stage.css`。JS はアニメーションの時間を持たない。**動きの調整は CSS だけで済む。**

### 4-1. どこを触ると何が変わるか

| 変えたいこと | 触るところ |
|---|---|
| 出現の速さ・イージング | `foundation/_motion.css` の `--motion-duration-enter`・`--motion-ease-enter`（ポンッは `--motion-duration-pop`・`--motion-ease-pop`） |
| 後退の速さ | `--motion-duration-leave`（fade-up-out）・`--motion-duration-fade-out`（指定の無い要素・戻るとき） |
| 順番の間隔 | `--motion-stagger`（順番 n の遅れ＝(n − 1) × これ） |
| 動く距離・ポンッの大きさ | `--motion-distance-up`・`--motion-distance-slide`・`--motion-pop-from`・`--motion-pop-over` |
| 背景色が替わる速さ | `--motion-bg-duration`・`--motion-bg-ease` |
| キャラクター・スマホが次の位置へ移る速さ | `--motion-persist-duration`・`--motion-persist-ease` |
| 切り替え中に次の操作を受け付けない長さ | `--scene-lock`（★その画面の出現が終わるまで以上にする。画面ごとに `.p-top-○○ { --scene-lock: 2s; }` で上書きできる。`calc()` も使える） |
| hero → 02 の白い幕 | `--motion-curtain-duration`（02 の出現はこのあとに始まる）・`--motion-ease-curtain` |
| hero の雲 | `--hero-cloud-speed`（横断の時間）・`--hero-cloud-interval-min` / `-max`（出る間隔）・`--hero-cloud-max`（同時の上限）・`--hero-cloud-initial`（はじめから流れている数）・`--hero-cloud-band`（出る高さ：マスクの上からこの割合まで）。雲の大きさは `heroClouds.js` の `CLOUDS`（Figma の幅） |
| ある要素だけ距離・速さを変える | その要素の CSS で変数を上書き（例：`_top.css` の landform は `--motion-distance-slide: 1rem`） |
| 要素の順番・動きの種類 | `index.html` の属性（下の 4-2） |
| 要素の位置・大きさ | `object/project/_top.css` の `--x` / `--y` / `--w` / `--h`（Figma の座標。下の 4-3） |
| 画面の背景色 | `object/project/_top.css` の `.l-stage[data-current="…"] { --stage-bg: … }`（色の値は `_variables.css` の `--color-top-*`） |

### 4-2. 動きの種類（プリセット）と順番

HTML の属性で選ぶ（`layout/_stage-motion.css`）。

```html
<div class="p-top-at p-top-about__text" data-enter="fade-up" data-order="2" data-leave="fade-up-out">…</div>
```

| 属性 | 値 | 動き |
|---|---|---|
| `data-enter` | `fade-up` | 下から上へフェードアップ |
| | `pop` | ポンッ（小さく → 少し大きく行き過ぎて → 元の大きさ） |
| | `slide-left` / `slide-right` | 左／右の横から短くフェードスライドイン |
| | `none` | 動かさない（元からある） |
| `data-leave` | `fade-up-out` | さらに上へ動きながら消える |
| | `pop-out` | 一瞬膨らんで、小さくなって消える |
| | `none` | 消えない（次の画面の下にそのまま残る） |
| | （書かない） | 短いフェードで消える |
| `data-order` | `1`〜`8` | 出現の順番 |
| `data-leave-order` | `1`〜`8` | 後退の順番（書かなければ遅れなし） |

- ★画面の中で見える要素には、すべて `data-enter` を付ける（付けない要素は、後退のときにアニメーションせず、最後に急に消える）
- ★戻る（上へ）ときは、去る画面の要素は `data-leave` にかかわらず短いフェードで消える。戻った先は、進むときと同じ出現をする
- 動きの形（キーフレーム）は `foundation/_animation.css` の `motion-*`

### 4-3. 位置と大きさ（Figma の座標）

`.p-top-at` の要素は、Figma の基準のフレーム（**1728×1117**）の座標で置く。数字は px の値を単位なしで書く。

```css
.p-top-about__text { --x: 460; --y: 260; --w: 813; --h: 240; }
```

- 画面の大きさに合わせて、基準のフレームごと拡大縮小し、画面の中央に置く（`--top-u`＝画面に収まる 1px の大きさ）
- 文字の大きさなども `calc(28 * var(--top-u))` のように Figma の px で書ける
- 箱（`.p-top-box`。例：hero のマスク）の中の `.p-top-at` も、数字は Figma の座標のまま書く（箱の左上からの位置に直すのは CSS がする）
- 画像は `.p-top-at` の箱いっぱいに広がる。`--h` は画像の縦横比に合わせる

### 4-3-2. 画像の書き方（読み込みを最小限に）

- 形式が複数ある素材は `<picture>` の `<source type="image/avif">` → `<img>`（png）。幅違いがある素材は `srcset` に `768w`〜`5120w`、`sizes` は**その画像の表示幅**（画面幅の何割か。例：幅 1105 / 1728 ≒ `64vw`）
- `<img>` に `width` / `height`（元の画像の大きさ）を書く
- hero の画像は `fetchpriority="high"`。**hero 以外の画面の画像は `loading="lazy"`**。見えない画面は `display: none` なので読まれず、今の画面の前後の画面（`.is-preload`）だけ隠したまま描かれて、先に読まれる

### 4-4. 画面をまたぐ要素（キャラクター・howtouse のスマホ）

画面ごとに別の要素を置かず、`l-stage__persistent` の中の1つの要素を動かす。**画面ごとの位置を変数で持たせ、今の画面（`data-current`）で切り替える**と、`--motion-persist-*` の速さで移る。

```css
.l-stage[data-current="team"] .p-top-chara { --x: 671; --y: 896; --w: 387; --h: 173; --persist-opacity: 1; }
```

- 見えるかは `--persist-opacity`（1 で見える）
- 進んで来たときだけの動き（例：02 でポンッと出る、04 でポンッと消える）は `[data-direction="forward"]` で書く

### 4-4-2. 画面と画面のあいだの幕（hero → 02 の白い幕）

`l-stage__curtain` は、去る画面の上・画面をまたぐ要素の下に重なる1枚。`_top.css` で、いつ・どう動かすかを書く。hero → 02 では：

- 幕を 02 の背景色にして、下からせり上げる（`top-curtain-up`）
- hero の要素は消さずに残す（幕の下に隠れる）。舞台の背景色は幕が被さりきってから替える
- 02 の出現を幕の長さだけ遅らせる：`.p-top-about { --motion-delay-base: var(--motion-curtain-duration); }`（`--motion-delay-base` は画面全体の出現の遅れ。プリセットの遅れに足される）

### 4-5. JS が付けるもの（CSS が見るもの）

| どこに | 付くもの | 値 |
|---|---|---|
| 画面（`l-stage__scene`） | `data-state` | `before`（まだ）→ `entering`（出現中）→ `active`（表示中）→ `leaving`（後退中）→ `after`（通り過ぎた）。戻るときは去る画面が `before` に戻る |
| 画面 | `.is-preload` | 今の画面の前後。隠したまま描いて、中の画像を先に読ませる |
| 舞台（`l-stage`） | `data-current` | 今の画面の `data-scene` |
| | `data-direction` | `forward`（進む）／`back`（戻る）／`loop`（展示モードで最後 → 最初） |
| | `.is-ready` | JS が動いた（無いときは、ふつうの縦並びのページ） |
| `<html>` | `.is-stage-locked` | ページ自体をスクロールさせない |

- `entering` から `active` に変わるのは、`--scene-lock` がたってから

### 4-6. 画面の足し方

1. `index.html` の `l-stage` の中に `<section class="p-top-○○ l-stage__scene" data-scene="○○">` と `<div class="l-stage__frame">` を足す。見出し（`h1`/`h2`）の文字がドットの読み上げの名前になる
2. 中の要素に `p-top-at` と `data-enter`（必要なら `data-order` / `data-leave`）を付ける
3. `_top.css` に位置（`--x` …）と背景色（`.l-stage[data-current="○○"] { --stage-bg: … }`）を足す
4. ドットと、展示モードの自動送りの順番は自動で増える。`#○○`（`id` か `data-scene`）の URL でその画面から開ける

## 5. イベント一覧・詳細（本体に移した）

公開イベントの一覧・詳細・つまずいたことの索引は、本体の「みんなの記録」（`/explore`）に移した（指示書 05）。`pages/event-log/` 以下は、古い URL で来た人を移すだけのページで、見た目は持たない。

## 6. 展示モードのときだけの見た目

展示モード（`?kiosk=1`）の間は `<html>` に `.is-kiosk` が付く。展示中だけ変えたいものは、それを起点に書く（例：カーソルを隠す、ドットを大きくする）。

```css
.is-kiosk .c-step-indicator__dot { … }
```

## 7. 動きを減らす設定

`prefers-reduced-motion: reduce` のとき、`--duration-*` が 0 になる。`transition` / `animation` の時間は直書きせず、このトークンを使うこと（使っていれば、設定に合わせて自動で止まる）。

Top の動き（`foundation/_motion.css`）は、動きを減らす設定で**移動・拡大縮小をやめてフェードだけ**にする（距離 0・ポンッの大きさ 1・順番の間隔 0）。`--scene-lock` は 0 にしない（トラックパッドの慣性で何画面も進まないように）。

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
