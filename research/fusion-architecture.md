# Copilot Fusion: 仕組みと確認した CLI コマンド

調査日: 2026-11-25。以下は公開資料、今回の観測、未確認事項を分けた発表候補であり、モデル選択を保証する仕様ではない。

## 公開資料

- [GitHub の現行 Fusion 概要](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)では、要求に応じて Single（1モデル）、Cascade（草案を判定し必要なら強いモデルへ）、Critique（複数モデルが並列に批評し草案側が改訂）のパターンを選ぶと説明する。パターンはプロンプトごとに変わり得る。内部の草案は最終結果と区別される。
- [HydraFusion の研究プレビュー記事](https://github.blog/ai-and-ml/project-hydrafusion-frontier-quality-via-multi-model-orchestration/)は、当時の批評を別モデル系統の独立した1人の critic と説明している。現行ドキュメントは複数 critic なので、時点を明示し、古いプレビューの詳細を現在の実装と同一視しない。同記事の TerminalBench 2.1 での推定コスト 67% 減・品質 4.9 ポイント増は、特定のモデル、設定、価格前提とオフライン評価に限定した GitHub の報告で、今回の実測ではない。
- [Fusion の一般提供発表](https://github.blog/changelog/2026-10-28-route-and-orchestrate-models-with-github-copilot-fusion/)は、HydraFusion のオーケストレーションと Auto のモデル選択を統合したと説明する。モデルプール、実装や価格は変わり得る。

## 関連論文: HyDRA

[Garg ら、HyDRA: Hybrid Dynamic Routing Architecture for Heterogeneous LLM Pools](https://arxiv.org/abs/2605.17106) は Copilot の Auto 選択に使われたルーティング研究で、HydraFusion そのものの実装論文ではない。論文では推論・コード生成・デバッグ・ツール使用の4軸について要求を予測し、モデルの能力プロファイルとの不足を比較して選択する。モデル一覧を予測器から分離する設計が説明上の要点。

論文の SWE-bench Verified の同品質点での推定コスト削減 54.1% は、論文中のモデル群、閾値、ベースラインと価格に依存する。Fusion High の今回の使用料削減率や、CLI が現在も論文と全く同じ経路で動く証拠ではない。GitHub の発表と論文の測定対象も混同しない。

## 実機で確認したコマンド

macOS、GitHub Copilot CLI 1.0.115、2026-11-25。`npx --yes @github/copilot --version` と `copilot help commands` を確認し、対話画面で以下を実行した。起動時のステータスには `Copilot Fusion · High` が表示された。これだけでは推論やモデル切り替えの実行を証明しない。

| コマンド | 確認結果 | 発表での使い道・限界 |
| --- | --- | --- |
| `/model` | モデル選択画面が開いた。画面はセッション単位の選択で、履歴を維持する旨を表示 | 選択可能な候補はアカウント・組織ポリシーで変わる。今回は選択変更を確定していない |
| `/usage` | 実行前のセッション使用量とアカウント利用状況を表示 | 利用量の確認に使える。表示値は請求額そのものではない。録画時はアカウント情報を隠す |
| `/context` | メッセージ送信前は「コンテキスト情報はまだ利用できない」と表示 | 送信後に確認が必要。開始直後に値が出ると断定しない |

`copilot help commands` は `/fleet`、`/tasks`、`/diff` も説明するが、これらの実行結果は今回未確認。コマンド一覧は CLI のヘルプであり、実際の課題を実行した観測ではない。

## 発表に向けた仮説と未確認事項

- 仮説: 複雑なレビュー課題では Critique が選ばれやすい。ルーティング条件は非公開であり、実験しても少数例では一般化できない。
- 今回は実際のプロンプトを送っていない。Fusion の選択結果、内部工程、実行時間、品質、費用を測定したとは言えない。Issue #4・#7・#8 の実験で別途確認する。
- `/context` の送信後の表示、`/fleet` の subagent 呼び出し、各 effort の利用可否は未確認。組織のポリシーと CLI バージョンも記録する。
