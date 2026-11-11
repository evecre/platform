# 外部サイトへの連絡：公開 API に eventType / lastUpdated / blocks / reflections を足しました

> 送り先：イベクリの外部サイトを開発している Claude Code
> 送り元：イベクリ本体（main。2026-11-10 時点でデプロイ済み）

## 0. まとめ

公開 API に、下の4つを足しました（または、以前からの依頼ぶんを実装しました）。**今ある項目の形・値は変えていません。**

| # | 追加した場所 | 項目 |
|---|---|---|
| 1 | `GET /api/public/events/:id`（詳細）の `basic` | `eventType` |
| 2 | `GET /api/public/events/:id`（詳細）の `basic` | `lastUpdated` |
| 3 | `GET /api/public/events/:id`（詳細）の `knowledge[]` | `blocks` |
| 4 | **新しいエンドポイント** `GET /api/public/reflections` | 全公開イベントの振り返りを1回で返す |

**★外部サイト側で、これらを読む処理がまだ無ければ、実装してください。** 以前の依頼（`GET /api/public/reflections`）が外部サイトの api-contract / 消費コードにまだ反映されていない場合も同じく、反映・実装をお願いします。

---

## 1. eventType（詳細の `basic`）

```json
"basic": {
  "title": "…",
  "summary": "…",
  "eventType": "exhibit",
  "lastUpdated": "2026-11-08"
}
```

- 型：`string | null`
- 値は次の6つの id のどれか、または `null`（未設定・不明な値）：

| id | 意味 |
|---|---|
| `exhibit` | 作品展示会・展覧会 |
| `festival_market` | フェス・マーケット |
| `live_performance` | ライブ・公演 |
| `contest` | 大会・コンテスト |
| `social` | 交流会・パーティー |
| `other` | その他 |

- **ラベル（日本語）は本体から返しません。** 外部サイト側で id → 表示名の対応表を持ってください（上の表のとおり）。
- 一覧（`GET /api/public/events`）にも `eventType` を入れています（`GET /api/public/reflections` の `items[].event.eventType` も同じ値）。

## 2. lastUpdated（詳細の `basic`）

- 型：`string | null`（`"YYYY-MM-DD"`）
- そのイベントの**最終更新日**。基礎情報（名前・概要・場所・ヘッダー画像・期間・柱）の更新時刻と、公開されている提出物の更新時刻のうち、いちばん新しいものです。
- **公開フラグのオン/オフでは動きません**（内容が変わったときだけ動く）。
- 使いどころ：一覧や詳細に「最終更新 2026-11-08」を出す、新しい順の補助に使う、など。

## 3. blocks（詳細の `knowledge[]` の各件）

`knowledge[]` の1件に `blocks` を足しました。本文の構造（見出し・本文・箇条書き）を、外部サイトで印の仕様を知らなくても組み立てられる形にしたものです。

```json
"knowledge": [
  {
    "title": "展示作品の配置図を描く",
    "tags": ["制作"],
    "outcome": "success",
    "struggle": "",
    "solution": "…",
    "text": "会場の図を描いた\n入口に受付を置いた",
    "blocks": [
      { "type": "heading", "text": "やったこと" },
      { "type": "text",    "text": "会場の図を描いた\n入口に受付を置いた" },
      { "type": "item",    "text": "受付は入口に置く" }
    ],
    "images": ["https://…"],
    "files":  [{ "url": "https://…", "name": "配置図.pdf", "size": 12345, "thumb": "https://…" }]
  }
]
```

- `blocks[].type`：`"heading"`（見出し）／`"text"`（本文の段落。中の改行は `\n`）／`"item"`（箇条書きの1項目）のどれか
- `blocks[].text`：表示する文字。**太字・斜体・非公開・画像・PDF の印はすべて外してあります**（そのまま表示してよい）
- 画像だけの古い形式の提出物は `blocks: []`
- `text`（印を外した平文）は**後方互換のため残しています**。新しく作る表示は `blocks` を使うのがおすすめです（段落・見出し・箇条書きが再現できる）。
- 非公開（`{{p}}…{{p}}`）の部分は、本体が**中身ごと消してから** `blocks` / `text` を作っています。外部サイトに非公開テキストは届きません。

## 4. GET /api/public/reflections（新しいエンドポイント）

以前の依頼（`docs/main-app-public-reflections.md`）のとおり実装しました。全公開イベントの振り返りを**1回で**返します（詳細を1件ずつ取らなくてよい）。

```
GET /api/public/reflections
```

```json
{
  "ok": true,
  "items": [
    {
      "event": { "id": "1787536757139", "title": "テスト公開", "dates": ["2026-08-31"], "eventType": null },
      "title": "展示作品の配置図を描く",
      "tags": ["制作"],
      "outcome": "success",
      "struggle": "",
      "solution": "パネルは検証実験をメインに…"
    }
  ],
  "truncated": false
}
```

- `items[]` … 公開してよい振り返り1件。**詳細の `knowledge[]` の1件と同じ値**から、`event` ＋ `title` / `tags` / `outcome` / `struggle` / `solution` だけを取り出したもの
- **`text` / `blocks` / `images` / `files` は入れません**（索引用に軽くするため。本文は `event.id` から詳細へ）
- `outcome` で絞らず、**うまくいったものも含めて全部**返します。どれを出すかは外部サイトが決める
- 並び：イベントは一覧と同じ（開催最終日が新しい順・日程未設定は最後）、同じイベントの中は詳細の `knowledge[]` と同じ
- `truncated` … 上限（1000件）で切ったときだけ `true`
- CORS（`PUBLIC_SITE_ORIGINS`）・GET 以外は 405・レート制限（60回/分/IP）・`Cache-Control: public, max-age=300` は、ほかの公開 API と同じ

## 5. 外部サイトでお願いしたいこと

1. api-contract に、上の4つを反映してください。
2. **読む処理がまだ無ければ実装してください**：
   - `eventType` → id を表示名に変換して出す（§1 の対応表）
   - `lastUpdated` → 一覧・詳細に「最終更新」を出す（任意）
   - `blocks` → 本文を段落・見出し・箇条書きで描く（`text` 一本の表示から切り替え）
   - `GET /api/public/reflections` → 「つまずいたことの索引」を、詳細の1件ずつ取得から、このエンドポイント1回に切り替える
3. 項目が無い（古い snapshot など）ときは `null` / `[]` と同じに扱ってください。

## 6. 確認

- 本体の `npm run check:public`：グリーン（eventType・lastUpdated・blocks・reflections の条件を含む）
- 本番で中身が出るのは、Render に `PUBLIC_SITE_ORIGINS` が入っていて、かつ記録を公開しているイベントがあるときです。
