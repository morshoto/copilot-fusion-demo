# Fusion デモ：実行経路とテスト先行の証拠

## 表示の意図と境界

スライドの経路図と Framekit の Red → Green は**別セッション**。両者は Fusion High の使い方を補い合う例だが、Framekit の各作業を特定モデルや judge の実行に対応付けるログは公開記録にない。対応関係は未観測であり、図をその証拠として扱わない。これを直接対応付けるには同一試行のフェーズイベントとテスト結果を記録する追加実験が必要で、今回は実施していない。

## 経路：SDK の1ターン

[公開用イベント集計](data/fusion-runtime-study-2026-11-26.json) の `high-continuation` / `same-prefix-changed-task`。SDK 2.0.1、High、2026-11-26。`session.fusion_resolved` は Cascade、primary `gpt-6.1-sol`、judge `gpt-6-luna`、条件付き repair `claude-opus-5.5` を予定した。開始と完了イベントが primary、judge の順に各1組あり、両フェーズは succeeded、judge は accept。`session.fusion_completed` は2 requests、最終ソース primary を報告した。repair の開始は記録されていない。イベントの不在は内部で一切処理がなかった証明ではなく、経路選択理由や判定基準も分からない。条件や他試行は[実行経路の調査](../research/fusion-runtime-architecture.md)を参照。

## Red → Green：Framekit #796

[開発記録](framekit-796-development.md)と [Red 録画](../presentation/media/framekit-796-red.gif)・[Green 録画](../presentation/media/framekit-796-green.gif)を使用。Red は本番コードを変更せず回帰テストを作成し、通常モーションの light / dark で初期 opacity 0 による失敗を観測。Green は opacity のアニメーションを除き、後の人側の検証で5設定・20ケースが通過した。上限到達で一度停止し、上限引き上げ後に再開した点は録画だけでは見えない。各録画は待機短縮・2倍速であり、別々の GIF に分かれる。前後比較はスライドのローカル初期フレーム画像に限定する。

録画の可読性: 両 GIF は 987×700 で端末全体を縮小表示するため、スライド上では細部の文字が読みにくい。スライドには結果と出典を大きな文字で再構成し、録画は詳細確認用として残す。追加録画・課金を伴うモデル呼び出しは行っていない。スライド全体の統合と最終評価は #25 の範囲。
