# 公開 API の応答の形

本体側の公開 API（`/api/public/events`）ができたら、その報告（応答の例・注意点）をここに貼る。

---

## 暫定（本体に送った指示書と、本体のコードから読み取った形）

本体の報告が来るまでは、これに合わせて仮データ（`assets/data/mock/`）と表示を作ってある。報告が来たら食い違いを確かめて、この節を置き換える。

### 一覧 `GET /api/public/events`

配列。並びは `dates` の最終日が新しい順、日程未設定は最後。

```json
[
  {
    "id": "イベント id",
    "title": "…",
    "headerImage": "R2 の公開 URL | null",
    "summary": "…",
    "venue": "…",
    "dates": ["2026-11-20"],
    "dateTimes": { "2026-11-20": { "start": "10:00", "end": "16:00" } },
    "status": "upcoming | archive",
    "hasKnowledge": true
  }
]
```

### 詳細 `GET /api/public/events/:id`

```json
{
  "id": "…",
  "status": "upcoming | archive",
  "basic": { "title": "…", "headerImage": null, "summary": "…", "venue": "…", "dates": [], "dateTimes": {} },
  "knowledge": [
    {
      "title": "タスク名",
      "tags": ["広報"],
      "outcome": "success | struggle | null",
      "struggle": "…",
      "solution": "…",
      "text": "…",
      "images": ["url"],
      "files": [{ "url": "…", "name": "…", "size": 0, "thumb": null }]
    }
  ]
}
```

- 存在しない・非公開・id の形が不正は、すべて 404 `{ "ok": false, "error": "not_found" }`
- `knowledge` は、ナレッジが非公開か開催前なら `null`

### サイト側の扱い

- `dates`：`YYYY-MM-DD` の配列。`dateTimes`：`{ "YYYY-MM-DD": { start?, end? } }`（本体の `public/js/modals/calendar.js` で確認。時刻は任意）
- 日付の表示は本体の `formatEventPeriodLines` と同じ考え方に、年を足したもの（`assets/js/modules/format.js`）
- 振り返りの見出し：`success` →「効いたこと」／「なぜうまくいった？」、`struggle` と `null` →「困ったこと」／「次にやるなら」
- `knowledge` が `null`：告知なら「ナレッジは開催後に公開されます。」、アーカイブなら「ナレッジは公開されていません。」。空の配列なら「公開されている振り返りはまだありません。」
- 文字はすべて `textContent` で入れる。URL は http / https とサイト内のパスだけを使う（`safeUrl`）
- id は `^[A-Za-z0-9_-]{1,64}$` だけを受け付ける（snapshot のファイル名に使うため）。本体の `server.js` の `SAFE_ITEM_ID_RE` と同じ形
