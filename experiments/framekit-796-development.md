# Fusion による Framekit #796 の開発記録

## 条件と作業

2026-11-25、Framekit の `fc51a634a80c4aea363d8eb34b9c1794d371853e` から独立 worktree を作成。Copilot CLI 1.0.115 の Fusion High（イベントの `syntheticModel: hydrafusion`）を使い、外部サービスへのアクセス、他リポジトリの変更、送信、Final Cut 操作を禁止した。課題は landing hero の見出し・説明・CTA が初期表示から読めるようにすること。Issue #796 とオープン PR を実行前に確認した。

1. Fusion に本番コードを変えず回帰テストだけを作成・実行するよう依頼。Chromium で通常モーションの light / dark が初期 opacity 0 のため失敗し、reduced motion 2件は通過した。同じ結果を別途再実行して確認し、テストを Framekit commit `4908b3e4` に記録。
2. Fusion に最小修正を依頼。初回の続行はセッション上限 30 AI credits に達して停止したため、上限を 80 に変更して続行した。hero のアニメーションから opacity の変化を除き、移動アニメーションを残した。後から人側の検証で初期フレームの axe color-contrast チェックを追加し、Framekit commit `2216e85b` に記録。
3. 同じ checkout の生成済み docs で、hero の回帰テストは Chromium / Firefox / WebKit と2つのモバイル設定の計20ケースが通過。Chromium の既存 landing テストを合わせた9ケース、コンポーネントテスト3ケース、型チェックも通過。Framekit の両コミットの pre-commit では build、既存テスト、境界チェックが通過し、`pnpm run check:docs` も通過した。
4. 元の固定コミットと修正後をそれぞれビルドし、Chromium の初期アニメーションを停止した状態で light / dark、幅375 / 1440px のスクリーンショットを目視比較。元の hero は不可視、修正後は見出しと CTA が表示された。これは初期フレームの比較であり、全時間帯・全環境の視覚的保証ではない。

差分は [framekit-796.patch](framekit-796.patch)。元の固定コミットで `git apply --check` が通ることを確認した。Framekit 側に PR は作成しておらず、外部 Issue が解決・クローズされたとは主張しない。スクリーンショットの対象はローカル生成物であり、デプロイ済みサイトではない。

## 録画と利用量

- [回帰テスト作成の GIF](../presentation/media/framekit-796-red.gif) と [修正・再実行の GIF](../presentation/media/framekit-796-green.gif) は、それぞれ実際の CLI 出力を端末録画したもの。待機を短縮し2倍速で再生、最終画面を長く保持した。個人の絶対パスと再開用セッション ID を伏せた。録画をライブ操作と混同しない。
- 2つ目の GIF は上限引き上げ後の続行を示す。上限到達で一度停止した試行は表示されていないため、この記録で明示する。
- CLI 最終表示は再開を含む同一セッション累計 **48.21 AI credits**。最初の表示 10.47 を足して二重計上しない。金額や請求額は確認できていない。
- この開発は以前の読み取り専用比較とは別の試行。回答内容や消費量から Fusion 全般の速度・品質を一般化しない。

## 残る確認

Framekit #796 の全受け入れを外部 PR として評価したわけではない。図の右側や初期表示後の実時間全区間、追加環境は必要に応じて確認する。プレゼンテーション本体は録画の可読性と公開範囲を再確認し、実際の発表者が15分通しで練習する必要がある。
