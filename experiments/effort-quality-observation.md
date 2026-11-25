# Fusion High と Max の利用量・回答の比較

2026-11-25、[subagent 試行 A](subagent-observation.md) の High と、同じプロンプトを使った Max の各1回を比較した。目的はコスト最適化を断定することではなく、品質確認と利用量を一緒に見るための探索。実行時刻やサーバ負荷、別 worktree による絶対パス、キャッシュとルーティングは統制されていない。

## 条件と確認方法

- Copilot CLI 1.0.115、macOS、Framekit `fc51a634a80c4aea363d8eb34b9c1794d371853e`。各試行は同 SHA の独立 checkout、通常の repo instructions を使用し、外部アクセス・変更・コミットを禁止。
- 共通プロンプト: 「Framekit issue 796 の landing hero 実装を特定し、初期文字と CTA の可読性の具体的なテストを2つ提案。ファイル変更・コミット・送信・外部アクセスは禁止。根拠パスを報告」。両方に同じ読み取り系ツール許可、`--max-ai-credits 30`、MCP 無効を指定。High は `hydrafusion`、Max は `--model auto --auto-tier hydrafusion-max` で記録された。
- 独立確認は固定 checkout の `EnglishOverview.tsx`、`EnglishOverview.module.scss`、`playwright.config.mjs` を検索し、(1) hero の場所、(2) 通常モーション時の opacity 0、(3) 初期テキストと CTA のテスト提案を確認する。回答から実際にテストが動いたと推定しない。
- 使用量は終了時の `--usage-output-file` と完了イベントを使用。AI credits は `totalNanoAiu / 10^9`、`totalPremiumRequestCost` は CLI が報告した値。どちらも実際の請求額ではない。

## 結果

| | High | Max |
| --- | --- | --- |
| 実行経路 | Single、GPT-6.1 Terra | Cascade、Claude Opus 5.5 と判定工程 |
| セッション開始〜結果 | 92.7 秒 | 74.4 秒 |
| 完了イベントの requests | 7 | 13 |
| AI credits | 5.311 | 27.379 |
| premium request cost | 1 | 19 |
| hero と opacity 0 | パスと原因を報告、独立確認と一致 | パスと原因を報告、独立確認と一致 |
| 2つのテスト案 | 初期テキストと両 CTA を light/dark・幅別に確認する案 | 初期 opacity と、アニメーション後の両 CTA・テーマ・サイズを確認する案 |

両者とも外部アクセスが禁止され Issue の本文を読めなかったことを回答に明示した。テスト案は提案であり、実行結果ではない。Max の「600ms と遅延の間ずっと不可視」という表現は正確ではない。ソースは opacity 0 から 1 へアニメーションするため、遅延後は徐々に表示される。また Max の2つ目の案はアニメーション後の色確認であり、初期フレームのコントラスト検証を単独では満たさない。High の案もテストコードを実行していないため、実際の検出力は未確認。

## Tips と限界

今回の小さな調査では両回答が主要ファイルと初期 opacity の問題を特定した。まず必要な品質条件と独立した検証手段を決め、十分な結果が得られたかを見てから、より高い effort を追加検討するのが実用的な仮説。今回の1ペアだけで High が Max より安い・速い・同品質だと一般化できず、Max が速かったという観測も条件差の影響を含む。実際の請求額、コード修正品質、再現性は未確認。高い利用量と引き換えに役立つ差があるかは、より代表的な複数課題と反復で評価する。
