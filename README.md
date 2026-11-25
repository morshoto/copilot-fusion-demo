# Copilot Fusion 登壇デモ

GitHub Copilot Fusion（旧 Project HydraFusion）の実行を観察するための登壇用プロジェクトです。Qwen Meetup 2 で使った「スライド・発表原稿・実験コード」という構成を参考にしています。Qwen の実験データや結果は含みません。

- [デモの準備と実行](fusion-demo/README.md)
- [スライド構成案](presentation/outline.md)
- [発表原稿の下書き](presentation/script.md)
- `presentation/evidence-lab.css`: Qwen Meetup 2 のスライドスタイル。Marp のスライド作成時に再利用できます。

## クイックスタート

Node.js 20.19 以降または 22.12 以降、pnpm、GitHub Copilot を利用できる認証済みアカウントが必要です。

```sh
cd fusion-demo
pnpm install --frozen-lockfile
pnpm demo
```

Fusion High に決済 API の設計レビューを依頼し、SDK が通知する処理方式、実際のフェーズ、モデル、使用量、回答を表示します。実行方法は Fusion が選ぶため、毎回複数モデルが使われるわけではありません。利用には Copilot の利用枠や料金が発生します。詳細は [GitHub の公式案内](https://docs.github.com/en/copilot/concepts/models/copilot-fusion) を確認してください。
