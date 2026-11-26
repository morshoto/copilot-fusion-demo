# Subagent 呼び出しの追試

2026-11-26、Copilot CLI 1.0.115 / Fusion High、同じ読み取り専用の `sample.ts` 調査課題で4条件を各5回追試した。view、task のみ許可し、組み込みMCPは無効。各条件の正確なプロンプト・AGENTS.md・設定・結果は [記録](data/subagent-followup-2026-11-26.json) にある。各ラウンドでは4セッションを並行実行した。

| 条件 | subagentが1件以上開始 | 1件以上完了 | 正常終了 |
|---|---:|---:|---:|
| 指定なし | 0/5 | 0/5 | 5/5 |
| プロンプトで委任 | 5/5 | 5/5 | 5/5 |
| AGENTS.mdで委任 | 5/5 | 5/5 | 5/5 |
| --fleet | 3/5 | 3/5 | 5/5 |

指定なし・プロンプト委任は同じ課題と権限の[先行5回ずつ](subagent-study-2026-11-26.md)と合わせると、開始・完了とも各 0/10、10/10。先行試行は2セッション並行、追試は4セッション並行で、完全に同じ実行環境ではない。AGENTS.md条件は指示の読み込みを有効にし、それ以外は `--no-custom-instructions` を付けたため、指示ファイル以外に読み込み設定も異なる。`--fleet` は実行単位を数え、1試行で複数のsubagentが動いても1と数えた。全結果は成功した1件のコード修正や別タスクへの一般的な成功率を示さない。

再実行にはCopilot利用量が発生する。5ラウンド、最大20セッション、各セッションに30 AI creditsの上限を指定する。\n
```sh
node experiments/subagent-followup.mjs /path/to/copilot /tmp/subagent-followup.json
node experiments/render-subagent-chart.mjs
```
