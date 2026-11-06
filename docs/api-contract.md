# 公開 API の取り決め（イベクリ本体 d7ed899）

本体側 Claude Code の報告（2026-11-05）をそのまま記録したもの。サイト側の扱いは末尾の「サイト側の対応」を参照。

## エンドポイント

認証は不要。Cookie も使わない。

| Method | Path | 内容 |
|---|---|---|
| GET | `/api/public/events` | 公開しているイベントの一覧 |
| GET | `/api/public/events/:id` | 1件の詳細 |

- 一覧：「宣伝用に公開」（`publicBasicInfo === true`）にしたイベントだけ。本文（knowledge）は含まない
- 詳細：基礎情報が非公開なら 404。存在しない id、非公開、形の不正な id は、すべて同じ 404 `{"ok":false,"error":"not_found"}`

## 応答の例（ダミー）

一覧全体：`{"ok":true,"events":[…]}`

一覧の1件：

```json
{"id":"pubtest_archive","title":"ダミー展示会","headerImage":"https://pub-….r2.dev/submissions/pubtest_archive/img_0123456789abcdef.webp","summary":"学生の作品30点を展示する2日間の展示会","venue":"3号館ホール","dates":["2026-10-01","2026-10-02"],"dateTimes":{"2026-10-01":{"start":"10:00","end":"17:00"},"2026-10-02":{"start":"10:00","end":""}},"status":"archive","hasKnowledge":true}
```

詳細（開催後・ナレッジあり）：

```json
{"ok":true,"id":"pubtest_archive","status":"archive","basic":{"title":"ダミー展示会","headerImage":"https://…/img_0123456789abcdef.webp","summary":"学生の作品30点を展示する2日間の展示会","venue":"3号館ホール","dates":["2026-10-01","2026-10-02"],"dateTimes":{"2026-10-01":{"start":"10:00","end":"17:00"},"2026-10-02":{"start":"10:00","end":""}}},"knowledge":[{"title":"ポスターを作る","tags":["制作"],"outcome":"success","struggle":"","solution":"3案を並べてメンバーで投票した","text":"初稿を共有","images":["https://…/img_fedcba9876543210.webp"],"files":[]}]}
```

- 詳細（開催前）：`"knowledge": null`
- 非公開のイベント：404、`Cache-Control: no-store`、`{"ok":false,"error":"not_found"}`
- 応答に、メンバー名・userId・アバター・提出者・団体名・提出時刻は含まれない

## 項目の形

| 項目 | 形 |
|---|---|
| `dates` | `"YYYY-MM-DD"` の配列。昇順。日程未定なら `[]` |
| `dateTimes` | `{ "YYYY-MM-DD": { "start": "HH:MM" または "", "end": "HH:MM" または "" } }`。キーは dates にある日付だけ。開始も終了も空の日は出ない。時刻の無いイベントは `{}`。日本時間 |
| `status` | 開催の最終日を過ぎていれば `"archive"`。それ以外（開催当日と日程未定を含む）は `"upcoming"`。サーバーの日本時間で判定 |
| `hasKnowledge` | 詳細の knowledge が1件以上あるときだけ `true`（正確な判定）。true なら詳細は空にならない |
| `headerImage` | R2 の公開 URL（https）か `null` |
| `summary` / `venue` | 文字列。空のこともある |
| `knowledge` | 配列か `null`。null は開催前、またはナレッジ非公開 |
| `knowledge[].outcome` | `"success"`（うまくいった）、`"struggle"`（つまずいた）、`null` |
| `knowledge[].struggle` | つまずいたときは「困ったこと」。success では普通は空 |
| `knowledge[].solution` | つまずいたときは「次にやるなら」、うまくいったときは「何をしたら、うまくいった？」。必ず空でない |
| `knowledge[].text` | 本文。改行を含む平文。太字や画像の位置の印は外してある |
| `knowledge[].images` | 画像 URL の配列。本文中の位置は持たないので、本文の後ろにまとめて並べる |
| `knowledge[].files` | `[{ url, name, size, thumb }]`。PDF。size はバイト数、thumb は1ページ目の画像 URL か null |
| `knowledge[].tags` | ラベル名の配列。「企画」「運営」「制作」「広報」のほか、団体が自由に作ったラベル名も入る |

## 注意点（本体側から）

- **画像と PDF**：`https://pub-….r2.dev/…` の公開 URL。`<img src>` やリンクでそのまま読める。別ドメインなので `<a download>` は効かない → リンクを開く形にする
- **文字列はすべてエスケープして描画**（summary・text・title などは利用者の文章）
- **日付は文字列のまま扱う**：`new Date("2026-10-01")` は UTC 解釈で日本時間の前日にずれる。年月日に分けて扱う
- **一覧の並び**：開催の最終日が新しい順、日程未定は最後。ページ分けなし
- **キャッシュ**：成功は `Cache-Control: public, max-age=300`（反映まで最大5分）。エラーは `no-store`
- **CORS**：`PUBLIC_SITE_ORIGINS` に登録した Origin にだけ許可。ローカルは Origin がちょうど `http://localhost:5173` でないと読めない（`127.0.0.1` や別ポートは不可）。GET 以外は 405。credentials を付けない
- **回数制限**：同じ IP から 1分 60 回まで。超えると 429 `{"ok":false,"error":"rate_limited"}`。展示会場で複数端末が同じ回線なら、サイト側でもキャッシュする
- **id**：数字だけの文字列（例 `"1792979092586"`）。文字列のまま渡す

---

## サイト側の対応（暫定の形との違い）

暫定で作った形と、実際の API の違い。`docs/instructions/03_api-connect.md` の Phase 1 で直した（2026-11-06）。

| 項目 | 暫定（今のサイト） | 実際の API |
|---|---|---|
| 一覧の形 | 配列そのもの | `{ "ok": true, "events": [...] }` |
| 詳細の形 | `{ id, status, basic, knowledge }` | 同じものに `"ok": true` が付く |
| success の solution の見出し | 「なぜうまくいった？」 | 「何をしたら、うまくいった？」 |
| success の struggle | 「効いたこと」として表示 | 普通は空。空なら項目ごと出さない |
| 429 | 想定なし | `rate_limited` を返す |
