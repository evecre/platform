# 本体への依頼：「みんなの記録」（/explore）のヘッダーを紹介サイトの Top に揃える

> 送り先：イベクリ本体を開発している Claude Code
> 作成：2026-11-23（紹介サイト側。本体は `public/js/views/explore.js` の `_headerHtml()` と `public/css/object/project/_explore.css` の `.p-explore__head` / `.p-explore__nav-*` を読んで確認した）
> 変えるのは見た目（CSS）だけ。HTML の形・リンク先・展示モードの扱いは今のままでよい

---

## 0. 背景

紹介サイト（evecre.pages.dev）のヘッダー「TOP / みんなの記録 / ヘルプ」は、Top・ヘルプとも**同じ位置・同じ大きさ**にそろえた（紹介サイトの `assets/css/layout/_header.css`）。

「みんなの記録」のヘッダーは、紹介サイトの**以前の**ヘルプのヘッダー（12px の文字・`--space-*` の余白）に合わせて作られている。そのため、Top →「みんなの記録」→ヘルプと移ると、リンクの位置と大きさがみんなの記録でだけ変わる。

## 1. 揃える値

大きさは、画面の大きさに合わせて伸び縮みする単位 **u** で書く（紹介サイトの `--top-u` と同じ式）。

| | 横長の画面 | 縦長の画面（`max-aspect-ratio: 4/5`） |
|---|---|---|
| u | `min(100vw / 1728, 100svh / 1117)` | `min(100vw / 390, 100svh / 700)` |
| ヘッダーの余白（上・右・下・左） | `64u 120u 24u 0` | `18u 20u 12u 0` |
| リンクの間 | `44u` | `18u` |
| 文字の大きさ | `24u` | `14u` |

そのほか（両方で共通）：

- 右寄せ（今のまま）。ロゴは置かない（今のまま）
- 文字の太さ 500・行の高さ 1.7・字間なし
- 文字の色 `#484545`、今のページ（`aria-current="page"`）は `#22AC38`（今のまま）
- 背景 `#FDFBF8`（紹介サイトの `--color-bg`）。ページの上に貼りつく（`position: sticky; top: 0`。今のまま）

参考：1440×900 で文字 約19.3px・ヘッダーの高さ 約104px、390×664 で文字 約13.3px・高さ 約56px。

## 2. 書き方の案

本体の FLOCSS の決まりに従って、値はトークンに名前を付けてから使う。

```css
/* foundation/_variables.css などに。紹介サイトの Top の基準のフレームと同じ式 */
:root {
  --intro-header-u: min(calc(100vw / 1728), calc(100svh / 1117));
}

@media (max-aspect-ratio: 4/5) {
  :root {
    --intro-header-u: min(calc(100vw / 390), calc(100svh / 700));
  }
}
```

```css
/* object/project/_explore.css */
.p-explore__head {
  /* position / z-index / display / 揃え / 背景は今のまま */
  padding: calc(64 * var(--intro-header-u) + env(safe-area-inset-top)) calc(120 * var(--intro-header-u)) calc(24 * var(--intro-header-u)) 0;
}

.p-explore__nav-list {
  gap: var(--space-1) calc(44 * var(--intro-header-u));
}

.p-explore__nav-link {
  font-size: calc(24 * var(--intro-header-u));
  line-height: 1.7;
}

@media (max-aspect-ratio: 4/5) {
  .p-explore__head {
    padding: calc(18 * var(--intro-header-u) + env(safe-area-inset-top)) calc(20 * var(--intro-header-u)) calc(12 * var(--intro-header-u)) 0;
  }

  .p-explore__nav-list {
    gap: var(--space-1) calc(18 * var(--intro-header-u));
  }

  .p-explore__nav-link {
    font-size: calc(14 * var(--intro-header-u));
  }
}
```

- `env(safe-area-inset-top)` は今のまま足しておく（iPhone のホーム画面から開いたとき用）
- 数字（1728・1117・390・700・64・120 …）を直書きせずトークンにしたいときは、名前は本体の決まりで付けてよい。**値は紹介サイトと同じにする**

## 3. 気をつけること

- **本体だけのリンク**（「アプリに戻る」「イベクリをはじめる」。`<button>`）も、TOP などと同じ大きさ・太さ・色・行の高さにする。ボタンの既定の余白・枠・背景が残らないように確かめる。4つ並んでも 390px の幅で1行に収まるはず（`flex-wrap: wrap` は残してよい）
- ヘッダーの高さが変わるので、**背景の山（`js-mountain-sticky` / `syncMountainBackdrop`）の上端がヘッダーの下に合ったままか**確かめる
- ヘッダーの下の本文（一覧・ナレッジページ）が、高くなったヘッダーに隠れないか確かめる（sticky なので通常は大丈夫）
- 展示モード（55インチ・1920×1080 / 4K）でも u で伸びるので、文字が大きくなる。紹介サイトの Top と同じ見え方になる

## 4. 文字の書体（できれば）

紹介サイトの文字は**りょうゴシック PlusN**（Adobe Fonts の kit `jtx8lwo`。JS で読む kit）。本体はシステムの書体なので、値を揃えても字の形が少し違って見える。

- 揃えるなら、kit のドメインに本体の公開 URL（onrender.com のもの）を足す必要がある。**これは Usami が Adobe Fonts の画面で行う**（本体の Claude Code はできない）
- 書体を足すかは Usami の判断。今回の依頼は §1〜§3（位置と大きさ）だけでよい

## 5. 確かめ方

1. 紹介サイトの Top（https://evecre.pages.dev/）と「みんなの記録」（/explore）を同じ窓の大きさで開き、ヘッダーを切り替えて見比べる。TOP・みんなの記録・ヘルプの位置が動かなければよい
2. 1440×900・390×664（縦長）・1920×1080 で見る
3. ログインしているとき（「アプリに戻る」）・していないとき（「イベクリをはじめる」）・展示モード（`?kiosk=1`。本体だけのリンクは出ない）の3つで見る
