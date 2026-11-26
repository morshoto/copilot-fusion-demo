# Fusion 経路と CLI subagent: 証拠と残課題

## TDD 計画

- B1: 保存済みの各条件について、開始・完了した実行数とイベント数を区別して再集計する。`subagent-evidence.test.mjs` は複数イベントを含む実行と未完了を検証する。
- B2: 未保存のモデル名を推測しない。テストは `not recorded` を期待する。この集計器は以下の2つの公開済み集計データ専用で、モデル欄が保存されていないことを前提とする。
- B3: 既存の個別記録で実際に確認されたモデルと引き継ぎを比較し、公式仕様と区別する。追加観測は下記の許可と停止条件を満たしてから行う。
- 検証: `node --test experiments/subagent-evidence.test.mjs` と下の集計コマンド、`git diff --check`。

## 保存済みデータの再集計

CLI 1.0.115、Fusion High、同一の小さな timeout 課題。開始・完了は親に通知された CLI subagent イベント。各セルは「1件以上のイベントを観測した実行数 / 全実行数（イベント総数）」。モデルと委任文は公開集計に保存されておらず不明。元の条件、並行実行、制約は [先行実験](subagent-study-2026-11-26.md)、[追試](subagent-followup-2026-11-26.md) を参照。

| 実験・条件 | 開始 | 完了 | Fusion 経路 | 親・子モデル | 指示・コンテキスト |
| --- | --- | --- | --- | --- | --- |
| 先行・指定なし | 0/5 (0) | 0/5 (0) | Single 5/5 | 未記録 | 子なし |
| 先行・プロンプト | 5/5 (5) | 5/5 (5) | Single 5/5 | 未記録 | 委任文は未記録 |
| 追試・指定なし | 0/5 (0) | 0/5 (0) | Single 5/5 | 未記録 | 子なし |
| 追試・プロンプト | 5/5 (5) | 5/5 (5) | Single 5/5 | 未記録 | 委任文は未記録 |
| 追試・AGENTS.md | 5/5 (5) | 5/5 (5) | Single 5/5 | 未記録 | 委任文・子の指示継承は未記録 |
| 追試・--fleet | 3/5 (9) | 3/5 (9) | Single 5/5 | 未記録 | 委任文は未記録 |

```sh
node experiments/subagent-evidence.mjs experiments/data/subagent-study-2026-11-26.json experiments/data/subagent-followup-2026-11-26.json
```

AGENTS.md 条件のみカスタム指示の読み込みを有効化したため、ファイルだけの因果効果ではない。2つの実験の並行数も違う。小さな1課題の観測であり、他の課題や将来のバージョンにおける保証ではない。Single でも CLI subagent が開始・完了しうる。一方、Fusion の Critique はモデル協調の経路であり、CLI の `subagent.started` / `completed` は別のイベントである。

## 個別記録で確認できたこと

[Framekit の探索・追試](subagent-observation.md) は各条件1回で上の試行とは課題も異なる。

| 条件 | 開始 / 完了イベント | 経路・親モデル | 子モデル | 引き継ぎの観測 |
| --- | --- | --- | --- | --- |
| 初回・指定なし | 0 / 0 | Single / GPT-6.1 Terra | なし | 子なし |
| 初回・明示委任 | 1 / 1 | Critique / Claude Opus 5.5 solver | GPT-6 Luna | 委任文に読み取り専用、禁止事項、調査対象と成果物が現れ、回答で結果を利用 |
| 権限を揃えた追試・指定なし | 0 / 0 | Single / GPT-6.1 Terra | なし | 子なし |
| 権限を揃えた追試・明示委任 | 1 / 1 | Critique / Claude Opus 5.5 | 未記録 | explore の結果を利用。全指示の継承は未検証 |
| AGENTS.md 追加 | 1 / 1 | Single / GPT-6.1 Terra | 未記録 | 親が explore の結果を参照。子への指示ファイル継承は未検証 |
| --fleet | 2 / 2 | Single / GPT-6.1 Terra | 未記録 | 2つの explore が分担し、親が結果を利用。完全な文脈継承は未検証 |

初回2条件は task 権限が異なる。追試も経路・時刻等が異なり因果比較はできない。これらは観測可能な一部であり、子モデル選択や指示継承の一般法則を証明しない。

## 仕様と実用方法

GitHub の [CLI コマンドリファレンス](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference) は、subagent のモデル・effort の解決順と、custom agent を subagent として使う際の repository instructions の既定を説明する。[custom agent の説明](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli) は `include-custom-instructions: true` とモデル指定を説明する。これらは現行文書であり、過去の CLI 1.0.115 で全て同じ挙動だった証拠ではない。組み込み explore への継承を custom agent の既定から推測しない。

具体的な委任例: 「`sample.ts` の初期調査を explore subagent に委任し、原因、修正案、根拠の行を報告してください。ファイル変更とネットワークアクセスは禁止。結果を親の回答に取り込んでください」。親側で結果と制約を確認する。`--fleet` は [プログラマティックリファレンス](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference) にある別の起動方法であり、各試行で必ず委任される保証として解釈しない。

## 未実施の追加観測と利用量

未解決: 同じ条件下の親・子モデル、委任メッセージ内の識別可能な制約、子が独立に読んだ指示を分離する。まず2回（明示委任と AGENTS.md 委任を各1回）、独立した一時ディレクトリ、ダミーの非機密マーカー、読み取り専用の `view,task`、MCP 無効、ネットワーク禁止で試す。各回 `--max-ai-credits 30` のソフト上限、合計設定上限60 AI credits。これは過去の親のみの計測から請求額や子を含む実費を保証するものではない。実行前に現行 CLI の上限の意味・課金と権限を確認し、使用量が発生する実験は承認を得る。開始・完了、親・子モデルの観測可否、委任文と子の回答における各マーカーの有無のみを公開する。生ログ、セッション ID、個人パスは公開しない。

最初の1回で子が起動しない、必要なモデルや委任文を観測できない、権限逸脱またはエラーがあれば停止し、原因と未観測を記録する。観測可能でも各1回は予備観察であり、率や継承保証を主張しない。追加実行とレビューを経るまで #21 は未完了。
