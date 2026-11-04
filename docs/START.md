# START — 新しいセッションで最初にやること

## 読む順番

1. `CLAUDE.md`（規約・決定事項）
2. `docs/HANDOFF.md` の**いちばん新しい記録**（前回どこまで進んだか・次にやること）
3. ユーザーから渡された指示書（`docs/instructions/` の該当ファイル）
4. イベントのデータを扱うなら `docs/api-contract.md`

## ローカルで動かす

```
node scripts/serve.mjs          # http://localhost:5173
node scripts/serve.mjs --kiosk  # 展示モードで開く URL を表示
```

ES Modules と fetch を使うので、HTML をファイルとして直接開かない（必ずローカルサーバー経由）。

## 確認コマンド

```
node --check <編集した JS>
node scripts/check-faq.mjs       # チャットボットの正答率（02 以降）
```

## 指示書の一覧と状態

| 番号 | 内容 | 状態 |
|---|---|---|
| 01 | 開発環境・ページの骨組み・スクロールの舞台・展示モード・イベント一覧/詳細（仮データ） | 完了（2026-11-04。main にマージ済み） |
| 02 | チャットボット（自作 FAQ エンジン・パネル UI・正答率チェック） | 未着手 |
| — | 本体側：公開 API（別の Claude Code が担当） | 未着手 |

状態は作業のたびにこの表を更新すること。

## 作業の終わりに

1. `docs/HANDOFF.md` に記録を追加（テンプレートはファイル内）
2. `CLAUDE.md` に新しい決まり・機能を追記
3. この表の状態を更新
4. commit → `git push origin HEAD`
