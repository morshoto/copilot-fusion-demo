# Copilot CLI の subagent 呼び出し観測

2026-11-25 の探索的な2試行。候補課題は Framekit #796 の landing hero 調査であり、実装や Issue のクローズは行っていない。Framekit `fc51a634a80c4aea363d8eb34b9c1794d371853e` を独立した detached worktree に固定し、どちらも同じ checkout で読み取り専用に実行した。終了後の `git status --short` は空だった。

## 方法

macOS / Copilot CLI 1.0.115、通常の repository instructions を読み込み、`--no-auto-update --disable-builtin-mcps --disable-mcp-server unityMCP --trust-folder --no-ask-user` を指定。Fusion の `autoTier` は両方 `hydrafusion` と記録された。シェルの `rg`・`cat` と `view` を許可し、書き込み、コミット、メッセージ送信、外部アクセスを指示で禁止。B はさらに `task` を許可した。セッション上限は 30 AI credits（CLI の最小値、ソフト上限）。実行ログはローカルに置き、機密や内部の推論を公開しない。

- A: 「Framekit issue 796 の landing hero 実装を特定し、初期文字と CTA の可読性を確かめる具体的なテストを2つ提案。ファイル変更・コミット・送信・外部アクセスは禁止。根拠のパスを示す」。
- B: 同じ課題と制約に「subagent に調査を委任して結果を取り込む」を追加。

イベント JSONL の `subagent.started` / `subagent.completed` を呼び出し確認に使い、Fusion の `session.fusion_resolved` と `session.fusion_completed` は別に記録した。時間は `session.start` と最終 `result` のタイムスタンプ差で、起動準備や非同期処理を含み得る。回数は JSONL に観測されたイベントの件数であり、内部推論回数の推定ではない。

## 結果

| 試行 | 観測された Fusion パターン | subagent | 経過時間 | model.call_start / tool.execution_start | 使用量ファイルの値 |
| --- | --- | --- | ---: | --- | --- |
| A: 委任指定なし | Single、GPT-6.1 Terra | 開始イベント 0 件 | 92.7 秒 | 7 / 26 | 5.311 AI credits、premium request cost 1 |
| B: 明示的に委任 | Critique、Claude Opus 5.5 が solver | `explore` 1件が開始・完了、GPT-6 Luna | 67.3 秒 | 11 / 18 | 19.546 AI credits、premium request cost 31 |

使用量は CLI が出力した `totalNanoAiu` を 10^9 で割った値と `totalPremiumRequestCost` で、請求額ではない。A の `session.fusion_completed` は 7 requests、B は 12 requests を報告した。B の `model.call_start` と一致しないため、定義の違いを解明せず同一視しない。subagent の実行は Fusion の critic 工程と別のイベントとして扱う。

B の委任メッセージには、読み取り専用、変更・コミット・ネットワーク禁止、hero と既存テストの場所、具体的なテスト2件、根拠パスの要求が含まれていた。完了イベントでは subagent のツール呼び出し13件を記録。最終回答も hero、スタイル、テストファイルを挙げた。これは今回の指示の一部が委任文と回答に現れた証拠であり、すべての指示や `AGENTS.md` の継承を検証したものではない。両試行とも外部アクセスを禁止したため Issue 本文の取得はできず、結果はコード調査として扱う。

## 使いどころと限界

今回、明示的な委任指示で実際に `explore` subagent が動いた。委任先には成果物、制約、根拠の形式を具体的に渡し、親の回答を独立に確認するとよい。A は subagent を観測しなかったが、委任指定がない場合に決して呼ばれないことは示さない。

2試行ではプロンプトだけでなく `task` の許可が違い、Fusion のパターン・モデルも変わった。速度・品質・コストの因果比較や一般化はできない。1件ずつの測定であり、キャッシュ、モデル、サーバ負荷も統制していない。結果の正しさやブラウザでのコントラストは別途検証が必要。

[GitHub の custom agent ドキュメント](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli)は、custom agent を subagent として実行する場合、既定では repository instructions を含めず、`include-custom-instructions: true` で含められると説明する。これは公開仕様であり、この2試行でその設定の有無を比較した結果ではない。[`/fleet` の公式説明](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/speed-up-task-completion)には並列実行方法があるが、今回は fleet を使用していない。

## レビュー後の権限を揃えた追試

元の A/B は `task` 許可が異なり、プロンプトの効果を分離できなかった。2026-11-25 に同じ固定 SHA を履歴の浅い独立 checkout に取り直し、両方で `task`、`view`、同じ読み取り用シェル規則を許可、書き込みを拒否した。両者の文面は元の A/B と同じで、B のみ末尾に subagent への委任と取り込みを追加した。CLI 1.0.115、Fusion High、30 AI credits のソフト上限、MCP 無効。外部アクセスは指示で禁止し、Issue 本文は渡していない。実行時間は `session.start` の開始時刻から `session.fusion_completed` の時刻まで。親セッションのイベントを数え、別ファイルの子セッションは合算していない。試行は他の検証と時間が重なり、経路、モデル、キャッシュ、負荷は統制していない。

| 条件 | Fusion 経路 / 主モデル | subagent 開始・完了 | 親ツール開始 | 時間 | AI credits |
| --- | --- | --- | ---: | ---: | ---: |
| A: 委任を指定しない | Single / GPT-6.1 Terra | 0 / 0 | 35 | 約131.4秒 | 5.826 |
| B: 委任と取り込みを指定 | Critique / Claude Opus 5.5 | 1 / 1 | 13 | 約51.4秒 | 13.126 |

B は explore の結果を取り込んだが、提案の「300ms 以内にアニメーション完了」は固定ソースの 600ms と整合しない。A、B とも Issue 本文は読めなかったと明記した。各1回であり、明示指示による一般的な呼び出し率・速度差・品質差は断定できない。なお追試の準備中、共有 Git 履歴から後の修正ブランチを読める別の実行があり、その汚染された実行はこの表に含めていない。独立 checkout は初期 SHA の浅い履歴のみを持つ。
