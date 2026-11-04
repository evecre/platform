# 指示書 02：チャットボット（自作 FAQ エンジン）

> 前提：01 の Phase 2（共通レイアウト）まで終わっていること。
> **Phase ごとに止まって報告し、確認を待つ。**

## 方針（決定済み）

- 外部サービス・LLM・API キーを使わない。**ブラウザ内だけで完結**。無料・回数無制限・オフラインでも動く
- 質問の言い回しはさまざまなので、「用意した回答のどれに近いか」を点数で判定して選ぶ
  1. 文字の重なり：日本語を**2文字ずつ**に区切って比べる（表記ゆれ・打ち間違いに強い）
  2. 回答ごとに**想定される言い回しを多数登録**＋**類義語辞書**
  3. 自信がないときは「もしかして」で候補を出し、ユーザーに選ばせる
- 将来、精度が足りなければ意味検索（Transformers.js ＋ 多言語の埋め込みモデル）を**後から足せる作り**にしておく（判定部分を差し替え可能にする）
- 答える範囲：イベクリの**操作**／**できること**／**使い方**／**進め方**

---

## Phase 1：データの形

### `assets/data/faq.json`

```json
{
  "version": 1,
  "categories": [
    { "id": "operation", "label": "操作について" },
    { "id": "features",  "label": "できること" },
    { "id": "howto",     "label": "使い方" },
    { "id": "process",   "label": "イベントの進め方" }
  ],
  "items": [
    {
      "id": "task-create",
      "category": "operation",
      "question": "タスクはどうやって作りますか？",
      "patterns": [
        "タスクの作り方",
        "やることを増やしたい",
        "やることを追加するには",
        "新しいタスクを登録したい"
      ],
      "keywords": ["タスク", "作成"],
      "answer": "（TODO：回答本文。2〜4文。改行可）",
      "links": [{ "label": "使い方を Top で見る", "href": "/#howto" }],
      "related": ["task-assign"],
      "featured": true
    }
  ]
}
```

- `question`：選択式で表示する文。`patterns`：言い回し（1件につき 10〜20 個を目標）
- `featured: true` のものを、カテゴリを選んだときの候補に出す
- `answer` は**プレーンテキスト**（HTML を入れない。改行は `\n`）

### `assets/data/synonyms.json`

```json
{
  "タスク": ["やること", "ミッション", "todo", "作業", "仕事"],
  "メンバー": ["仲間", "チーム", "参加者", "部員"],
  "振り返り": ["反省", "ふりかえり", "レビュー"]
}
```

- 左（代表の語）に寄せてから比べる

### `assets/data/faq-tests.json`

```json
[
  { "q": "やること増やすには？", "expect": "task-create" },
  { "q": "天気を教えて", "expect": null }
]
```

- `expect: null` は「答えるべきでない（カテゴリ選択に戻す）」質問

### 中身（初期データ）

- この段階では、構造が分かるように**各カテゴリ 3 件ずつ、計 12 件**の仮データを作る。回答本文は `TODO`
- 本番の Q&A は別作業で作る（イベクリ本体の機能一覧から作る予定）。**イベクリの機能を推測で書かない**

**報告して止まる。**

---

## Phase 2：判定エンジン

`assets/js/modules/chatbot/` に置く。**DOM に依存しない純粋な ES Module** にして、ブラウザと Node（チェック用スクリプト）の両方から使う。

- `normalize.js`
  - NFKC 正規化、英字を小文字に、ひらがな → カタカナに統一、記号・空白を除去
  - 類義語を代表の語に置き換え（長い語から順に）
  - よくある言い回しの語尾・つなぎを除去（例：「ですか」「ますか」「には」「したい」「どうやって」「教えて」「方法」）。リストは定数で1か所に
- `matcher.js`
  - 2文字ずつに区切った集合で、Dice 係数（`2|A∩B| / (|A|+|B|)`）
  - 1件の FAQ の点数＝`question` と `patterns` のうち最大の値 ＋ `keywords` が含まれていたら加点（加点の重みは定数）
  - 事前計算：読み込み時に全 patterns を正規化・2文字ずつに区切っておく
  - `match(query) → [{ id, score }]`（上位 3 件）
  - **差し替え可能に**：`createMatcher(faq, { scorer })` の形にし、将来、意味検索の scorer を足して点数を合わせられるようにする
- `engine.js`
  - `ask(query)` の結果：
    - 1位の点数 ≥ `THRESHOLD_ANSWER` → `{ type: 'answer', item }`
    - `THRESHOLD_SUGGEST` ≤ 1位 < `THRESHOLD_ANSWER` → `{ type: 'suggest', items: 上位3件 }`（もしかして）
    - それ未満 → `{ type: 'fallback' }`（カテゴリ選択に戻す）
  - 1位と2位の差が小さいとき（定数）も `suggest` にする
  - しきい値の初期値：ANSWER 0.55 / SUGGEST 0.30（Phase 4 のチェックで調整）
- 答えられなかった質問は、メモリ上に記録して、開発中だけ `console.info` で出す（外部には送らない）

**報告して止まる。**

---

## Phase 3：パネル UI（`c-chatbot`）

- 右下の丸いボタン（`c-chatbot__toggle`）→ パネル（`c-chatbot__panel`）を重ねて開く。**別ページにしない**
- 全ページで同じ部品を使う（`common.js` から起動）。Top だけに出すかどうかは `config.js` のフラグで切り替えられるようにする（初期値：全ページ）
- パネルの流れ：
  1. あいさつ ＋ カテゴリのボタン（4つ）
  2. カテゴリを選ぶ → `featured` の質問ボタン
  3. 質問ボタン or 自由入力 → 回答
  4. 回答の下に `links` と `related` の質問ボタン、「ほかの質問をする」（カテゴリに戻る）
  5. `suggest` のときは「もしかして：」＋ 候補ボタン 3 つ ＋「どれでもない」（→ カテゴリへ）
  6. `fallback` のときは「うまく答えられませんでした。こちらから選んでください」＋ カテゴリ
- 回答は `textContent` で差し込む（改行は CSS の `white-space: pre-line`）
- 開閉時に `document` へ `chatbot:open` / `chatbot:close` を発火（展示モードの自動送りを止めるため）
- スマホ（〜600px）ではパネルを全画面にする
- 展示モードで 3 分操作が無ければ、パネルを閉じて最初の状態に戻す
- アクセシビリティ：トグルに `aria-expanded`、メッセージ一覧に `aria-live="polite"`、Esc で閉じる、開いたら入力欄にフォーカス
- CSS は `object/component/_chatbot.css`。見た目は最小限（ユーザーが作り込む）

**報告して止まる。**

---

## Phase 4：正答率のチェック

- `scripts/check-faq.mjs`（Node。エンジンをそのまま import する）
  - `faq-tests.json` を全部 `ask()` にかけ、正答率、`answer` / `suggest` / `fallback` の割合、間違えた質問の一覧（期待 → 実際、点数）を表示
  - `--tune` で、しきい値を 0.05 刻みで動かしたときの正答率の表を出す
  - faq.json の検査も行う：id の重複、存在しない `related`、`patterns` が 5 個未満の項目、カテゴリの誤り
- 初期データで `faq-tests.json` を 30 件程度作り、結果を報告する

---

## 完了条件

- `node --check` がすべて通る
- `node scripts/check-faq.mjs` が動き、結果を報告
- 375px と 1920×1080 でパネルの表示を確認
- 展示モードで、パネルを開くと Top の自動送りが止まり、閉じると再開する
- `CLAUDE.md`（チャットボットの節：データの足し方・しきい値の意味）、`assets/css/README.md`、`docs/START.md`、`docs/HANDOFF.md` を更新
- commit → `git push origin HEAD`
