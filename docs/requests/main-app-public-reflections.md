# 本体への依頼：公開 API に「振り返りをまとめて返す」エンドポイントを足す

> 送り先：イベクリ本体を開発している Claude Code
> 作成：2026-11-08（外部サイト側 `22f0df7` 時点。本体のコードは `lib/publicData.js` と `server.js` の公開 API を読んで確認した）
> 着手の目安：**ナレッジのある公開イベント（一覧の `hasKnowledge === true`）が 10 件を超えたら**。それまでは急がない

---

## 0. 背景

外部サイトに「つまずいたことの索引」（`/pages/event-log/struggles/`）がある。公開されている全イベントの振り返りから、つまずいた記録（`outcome` が `success` 以外で `solution` があるもの）を集めて、タグで絞って読めるページ。

今の公開 API では、一覧（`GET /api/public/events`）に `knowledge` が入っていない。そのため外部サイトは、**ナレッジのあるイベントの詳細を1件ずつ**取っている。

- 1回開くと「一覧1回＋詳細 N 回」。公開 API の回数制限は **同じ IP から 1分 60 回**（`publicLimiter`）
- 同じ回線（学内の Wi-Fi・展示会場）から何人かが開くと、すぐに 429 になる
- 詳細を順に取るので、件数に比例して表示が遅くなる
- 外部サイト側は、新しい 20 件までしか取らないようにしている。20 件を超えると、古いイベントの振り返りが索引に出なくなる

**1回の問い合わせで、全公開イベントの振り返りを返すエンドポイント**があれば、この3つがまとめて解ける。

---

## 1. 作るもの

```
GET /api/public/reflections
```

- `/api/public` の下に置く。CORS（`PUBLIC_SITE_ORIGINS`）・GET 以外は 405・`publicLimiter`（60回/分/IP）は、今のミドルウェアがそのまま効く
- 成功は `Cache-Control: public, max-age=300`（`PUBLIC_CACHE`）。エラーは `no-store`
- 認証なし・Cookie なし（ほかの公開 API と同じ）

### 応答の形

```json
{
  "ok": true,
  "items": [
    {
      "event": {
        "id": "1787536757139",
        "title": "テスト公開",
        "dates": ["2026-08-31"],
        "eventType": null
      },
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

| 項目 | 中身 |
|---|---|
| `items[]` | 公開してよい振り返り1件。**詳細（`GET /api/public/events/:id`）の `knowledge[]` の1件と同じもの**から、下の項目だけを取り出す |
| `items[].event` | 出どころのイベント。`id`、`title`・`dates`・`eventType` は詳細の `basic` と同じ値 |
| `title` / `tags` / `outcome` / `struggle` / `solution` | 詳細の `knowledge[]` と同じ値・同じ形 |
| `truncated` | 上限（§2）で切ったときだけ `true` |

- **`text`・`images`・`files` は入れない。** 索引には要らないし、応答が重くなる。本文が読みたい人は、`event.id` から詳細へ移る
- `outcome` で絞らず、**うまくいったものも含めて全部**返す。どれを出すかは外部サイトが決める（あとで「うまくいったこと」の索引も作れるように）

### 並び

1. イベントは、一覧（`GET /api/public/events`）と同じ並び（`_publicListOrder`。開催の最終日が新しい順、日程未設定は最後）
2. 同じイベントの中は、詳細の `knowledge[]` と同じ並び

---

## 2. 守ること

### ★値は必ず `buildPublicEvent()` から作る

- `items` は、**各イベントの `buildPublicEvent(flat, subs).knowledge` を、そのまま並べて項目を絞ったもの**にする。events / submissions から別の道で振り返りを読まない
  - そうすれば、公開してよいかの判定（`publicBasicInfo`・`publicKnowledge`・開催後か・`shareable`・`solution` が空でない・非公開テキストの除去・名前や userId を出さない）が、詳細と**必ず一致する**
- `event` の値も `buildPublicEvent().basic` から取る。`basic` が `null`（基礎情報が非公開）のイベントは、`knowledge` があっても**出さない**（一覧・詳細に出ないイベントの振り返りが、ここから漏れないように）
- メンバー名・userId・アバター・提出者・団体名・提出時刻は出さない（今の公開 API と同じ）

### 重さ

- 提出物は、一覧と同じく `submissionStore.getSubmissionsForProjects()` で**1回にまとめて**読む。イベントごとに読まない
- 上限：`items` は **1000 件まで**。超えたら新しい順に 1000 件で切り、`truncated: true`。ページ分けは今は作らない

### 今ある API を変えない

- `GET /api/public/events` と `GET /api/public/events/:id` の形・値は変えない（外部サイトはそのまま使い続ける）

---

## 3. 確かめること

`scripts/checkPublicApi.mjs`（`npm run check:public`）に足す。

- 形：`ok: true`、`items` が配列、`truncated` が真偽値
- **一致**：公開イベントごとに、`items` のうち `event.id` がそのイベントのものを並べると、詳細の `knowledge[]` から `title / tags / outcome / struggle / solution` を取り出したものと**順番も含めて同じ**になる
- 詳細が 404 のイベント（基礎情報が非公開）の振り返りが、`items` に1件も無い
- 開催前・`publicKnowledge` が false・`shareable` の無い提出物・`solution` が空の振り返りが入らない
- 応答を文字列として探して、メンバー名・userId・提出者・団体名・提出時刻が無い（今の確認と同じやり方）
- `Cache-Control`（成功は `public, max-age=300`、エラーは `no-store`）、CORS（登録した Origin にだけ許可）、POST が 405
- `text` / `images` / `files` が入っていない

---

## 4. 報告してほしいこと

- 入れたコミット・main へのマージ・Render へのデプロイが済んだか
- 外部サイトの `docs/api-contract.md` に貼れる形の取り決め（エンドポイント・応答の例・項目の表・注意点）。前回の公開 API の報告と同じ形で
- 応答の大きさの目安（公開イベント・振り返りが何件で何 KB くらいか）
- `npm run check:public` の結果

---

## 5. 参考：外部サイト側で、このあと変えること（本体側は作業不要）

- `assets/js/pages/event-struggles.js`：`/api/public/reflections` を1回だけ取って索引を作る。404（まだ無い）なら今の「詳細を1件ずつ」に戻す
- 20 件の上限と「新しい20件から集めています」の表示は、このエンドポイントでは要らなくなる（`truncated` のときだけ知らせる）
- `scripts/fetch-snapshot.mjs`：展示用に `reflections.json` も保存する
