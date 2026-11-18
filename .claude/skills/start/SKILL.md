---
name: start
description: イベクリ外部サイトの作業を始める。CLAUDE.md・docs/START.md・docs/HANDOFF.md の最新の記録と git の状態を読み、今の状態と次にやることを日本語で報告する
argument-hint: "[指示書のファイル名や今日やること（省略可）]"
disable-model-invocation: true
---

# /start — 作業の始め方

返答はすべて日本語で書く。

## 1. 読む（この順番。並べて読んでよい）

1. `CLAUDE.md`（規約・決定事項）。会話のはじめに読み込まれていれば読み直さない
2. `docs/START.md`（動かし方・確認コマンド・指示書の一覧と状態）
3. `docs/HANDOFF.md` の**いちばん上の記録だけ**（`## YYYY-MM-DD — …` の最初の1件。テンプレートの次）。長いので全部は読まない
4. 引数（$ARGUMENTS）で指示書や依頼が渡されたら、それも読む（`docs/instructions/` の該当ファイルなど）

## 2. 状態を確かめる（Bash）

```
git branch --show-current
git status --short
git log --oneline -8
git log --oneline main..HEAD   # feature ブランチにいるとき：まだ main に入っていない commit
```

- commit していない変更があれば、`git diff --stat` で何のファイルかを見る。**ユーザーが編集中のもの**（`_top.css` など）は勝手に戻したり commit したりしない
- `docs/evecre-web.pdf`・`docs/05_move-archive.md` は commit しないファイル（いつも未追跡で残っている）

## 3. 報告する（短く）

次の形で報告する。作業は始めない（ユーザーの指示を待つ）。

```
## 今の状態
- ブランチ：…（main に入っていない commit：…件）
- 編集中のファイル：…（無ければ「なし」）
- 前回の記録（YYYY-MM-DD「題」）：やったことを1〜2行

## 残っていること・次にやること
- HANDOFF の「残っていること」「ユーザーに確認したいこと」「本体側に頼むこと」から

## 今日の依頼について
- 引数があれば、関係するファイルと進め方の案を1〜3行。無ければこの節は書かない
```
