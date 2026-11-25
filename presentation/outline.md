# Copilot Fusion — 15分の構成案

| 時間 | 内容 | 根拠・見せ方 |
| --- | --- | --- |
| 0:00–3:00 | 仕組み：Fusion、3つの経路、HyDRA 論文 | 公開資料と自分の実験を区別する |
| 3:00–6:00 | 操作記録：Framekit の hero 調査 | 実際の CLI 記録を GIF で示す。取得・公開確認は未完了 |
| 6:00–13:30 | 5つの Tips：subagent、ループ、利用量、根拠、要件 | 実験ごとの条件・限界を添える |
| 13:30–15:00 | まとめ | 独立した検証と公開前確認 |

[Marp スライドのドラフト](slides.md)を次のコマンドで表示用 HTML に変換できる。実操作 GIF は未挿入。

```sh
npx --yes @marp-team/marp-cli@4.5.1 presentation/slides.md --html --theme presentation/evidence-lab.css -o /tmp/fusion-slides.html
```

## スライド案

1. **Copilot Fusion：実験から得た5つの Tips**
2. **Fusion の3つの経路** — Single / Cascade / Critique。経路は要求ごとに変わり得る。
3. **HyDRA 論文と Fusion** — 論文は Auto 選択の研究。評価条件付きの結果であり、今回の CLI 実測とは別。
4. **実験対象と操作** — Framekit #796 の hero を読み取り専用で調査。実操作 GIF は取得・内容確認後に挿入。
5. **Tip 1：委任先に制約と成果物を渡す** — 明示した1試行で explore の開始と完了を観測。
6. **Tip 2：ループの数え方を先に決める** — 開始イベントと終了時刻を定義。2試行の速度差にはモデル・経路・権限の交絡がある。
7. **Tip 3：品質を見て effort を選ぶ** — High 5.311 / Max 27.379 AI credits は各1回の値。請求額ではない。
8. **Tip 4：回答の根拠を元のコードで確かめる** — Max の「全時間不可視」という説明をソースで訂正。
9. **Tip 5：必要な要件を渡し、未読を明示する** — 両回答が Issue 本文を読めなかったと明示。本文を渡す比較は未実施。
10. **まとめ** — 委任は観測する、品質は独立に検証する、未確認は未確認と伝える。

## 発表準備の残件

- 実際の CLI 操作を録画し、公開内容を確認した GIF を挿入する。
- スライドをレンダリングして全ページの表示を確認する。
- 原稿と GIF を通して実際に読み、15分以内になるまで調整する。時間配分は目標であり、通し確認の実績ではない。
- 参考: 2026-11-25 に日本語音声合成 Kyoko、rate 200 で本文だけを読み上げた生成音声は約10分39秒。GIF の再生、操作、実際の話者の間は含まない。15分の通し練習ではなく、内容と尺の調整が必要。

主要な根拠: [GitHub Fusion 概要](https://docs.github.com/en/copilot/concepts/models/copilot-fusion)、[HyDRA 論文](https://arxiv.org/abs/2605.17106)、[subagent 実験](../experiments/subagent-observation.md)、[effort 比較](../experiments/effort-quality-observation.md)、[追加 Tips](../experiments/tips.md)。実行ループは Issue #7 の記録を参照する。
