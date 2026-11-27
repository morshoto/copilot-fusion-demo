# Copilot Fusion — 15分の構成

1. タイトル
2. Copilot Fusion の概要
3. Fusion のアーキテクチャ：3方式の実測と未確認の分岐
4. キャッシュ読み取りの実測と限界
5. HyDRA 論文のオリジナル図と4軸の意味
6. 同じ修正課題20試行の実際のCascade工程
7. 基本コマンド `/model` `/usage` `/context`
8. `/fleet` `/env` `/rubber-duck` の使いどころ
9. Fusion High の実録デモ
10. CLIの出力とSDKで観測できる範囲
11. Framekitの修正前後の初期フレーム
12–13. subagent の具体的な依頼と呼び出し方別の追試
14. 見直し指示と応答時間の実測分布（各10回）
15. 実験プロンプトと測定範囲
16. 生成コードと実行したテスト
17. High / Max の成果物と利用量の比較
18. まとめ（発表者が後から記入する空白ページ）

15分の目安は仕組み・コマンド20%、デモ20%、実験・Tips 50%、まとめ10%。実際の通し練習は未実施。

VS CodeのMarpプレビュー、または以下で表示用HTMLを生成する。

```sh
npx --yes @marp-team/marp-cli@4.5.1 presentation/slides.md --html --allow-local-files --theme presentation/fusion-universe.css -o presentation/fusion-slides.html
```

録画は実際のCLI実行で、待ち時間を短縮した。応答時間の実験はツール無効の短い課題であり、ツールを使うエージェントループの回数や内部推論を測定していない。元の記録と再現方法は [実験記録](../experiments/prompt-study-2026-11-26.md)、アーキテクチャ資料は [調査記録](../research/fusion-runtime-architecture.md) を参照。
