# Fusion ターミナルデモ

Copilot SDK の `model: "fusion"` と `github.capi.fusionTier` を使い、実際に通知された経路とフェーズを観察します。Fusion High は研究プレビュー時の HydraFusion に対応します。コードは [既存の Copilot SDK 実験](https://github.com/GH-Copilot-LAB/copilot-sdk/tree/main/ch09-experiments) と同系統のデモを元にしています。

## 準備

- Node.js 20.19 以降または 22.12 以降、pnpm
- Copilot を使える GitHub アカウントと認証済み GitHub CLI または Copilot CLI
- SDK は対応ランタイムを同梱するため、独立した `copilot` コマンドは不要
- 組織ポリシー・契約や利用可能なモデルにより利用できない場合があります

```sh
cd fusion-demo
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm demo
```

既定では決済 API のリトライ設計を Fusion High に依頼します。シナリオと tier の変更、保存や比較もできます。

```sh
pnpm demo --scenario simple --tier high
pnpm demo --scenario complex --tier max
pnpm demo --compare tiers --scenario complex
pnpm demo --tier high --prompt 'POST を含む全リクエストを待機なしで5回再送する設計をレビューして'
pnpm demo --help
```

1回の実行ごとに利用量が発生します。比較は2回実行します。表示されるトークンから請求額は確定できません。

## 記録と本番での再生

```sh
mkdir -p recordings
pnpm demo --scenario complex --tier high --save recordings/live.json
pnpm demo --replay recordings/live.json
```

`--save` は既存ファイルを上書きしません。課題、回答、実行情報を保存します。機密情報を含めないでください。`recordings/` は Git 管理対象外です。再生は保存済みの結果であり、新たな呼び出しは行いません。

「実行予定」は経路選択の結果で、条件付き工程が動いた証拠ではありません。「確認できたフェーズ」は受信したイベントに基づきます。内部の推論や未通知のモデルは推測しません。`single`、`cascade`、`critique` のどれが選ばれるかは保証されません。実行ごとに結果が変わるため、少数の実行から品質や速度を比較しないでください。ツールは無効で、プロジェクトのファイルは読みません。SDK のセッション履歴は Copilot のローカルセッション領域に保存されます。
