---
marp: true
paginate: true
size: 16:9
---

<div class="eyebrow">GitHub Universe Recap</div>

# Copilot Fusion
## 実験から得た5つの Tips

モデル選択・実行の観測・結果の検証

<div class="mini-note">探索的な少数試行：2026年11月</div>

---

## Fusion の3つの経路

<div class="layout--three">
<div class="axis-card"><h3>Single</h3><p>1つのモデルが取り組む</p></div>
<div class="axis-card axis-card--teal"><h3>Cascade</h3><p>草案を判定し、必要に応じて次の工程へ</p></div>
<div class="axis-card axis-card--amber"><h3>Critique</h3><p>別のモデルが批評し、草案を改訂</p></div>
</div>

<div class="callout">経路はリクエストごとに変わり得る</div>
<div class="source">出典: https://docs.github.com/en/copilot/concepts/models/copilot-fusion</div>

---

## 関連論文 HyDRA

<div class="layout--split">
<div class="card"><h3>4つの能力軸</h3><p>推論・コード生成・デバッグ・ツール使用の要求を予測する</p></div>
<div class="card"><h3>モデル選択</h3><p>能力プロファイルとの不足を比較し、選択する</p></div>
</div>

<div class="callout--warning callout">論文は Auto 選択の研究。報告されたコスト削減率は今回の CLI 実測ではない</div>
<div class="source">Garg et al., HyDRA (2026): https://arxiv.org/abs/2605.17106</div>

---

## 実験対象と操作

<div class="layout--split">
<div><h3>Framekit #796</h3><p>初期表示の文字と CTA の可読性を調査</p><p>固定コミット / 読み取り専用</p><p>Issue 本文の取得とブラウザ検証は行っていない</p></div>
<div class="card"><h3>実操作 GIF</h3><p>録画・公開内容の確認待ち</p><p class="mini-note">このスライドは未完成</p></div>
</div>

---

## 1. 委任先に制約と成果物を渡す

<div class="layout--split">
<div class="card"><h3>委任指定なし</h3><p>subagent 開始イベント 0 件</p></div>
<div class="card"><h3>委任を明示</h3><p>explore の開始・完了を1件確認</p></div>
</div>

<div class="callout">読み取り専用・対象・根拠・成果物を委任文に含める</div>
<div class="source">各1試行。モデル・経路・権限も異なるため因果関係は未確認。</div>

---

## 2. ループの数え方を先に決める

<div class="metric-strip">
<div class="metric"><b>開始 → 結果</b><small>セッションの経過時間</small></div>
<div class="metric"><b>model.call_start</b><small>観測されたモデル呼び出し</small></div>
<div class="metric"><b>tool.execution_start</b><small>観測されたツール開始</small></div>
</div>

<div class="callout--warning callout">約93秒と約67秒の差は、委任指示の効果とは断定できない</div>
<div class="source">各1試行。モデル・経路・権限・キャッシュなどが異なる。</div>

---

## 3. 品質を確認して effort を選ぶ

<div class="layout--split">
<div class="card"><h3>High / Single</h3><div class="stat">5.311<small>報告された AI credits</small></div></div>
<div class="card"><h3>Max / Cascade</h3><div class="stat stat--amber">27.379<small>報告された AI credits</small></div></div>
</div>

<div class="callout">両方が主要ファイルを特定。提案したテストは未実行</div>
<div class="source">同じ課題の各1回。請求額ではない。一般的な品質・コスト比較はできない。</div>

---

## 4. 回答の根拠を元のコードで確かめる

<div class="layout--split">
<div class="card"><h3>Max の回答</h3><p>アニメーションの間、ずっと不可視</p></div>
<div class="card"><h3>ソースの確認</h3><p>opacity は 0 から 1 へ変化。遅延後は徐々に表示</p></div>
</div>

<div class="callout">パスと行、確認した事実、未実行のテストを分ける</div>
<div class="source">1回答の観測。実ブラウザでのコントラストは未測定。</div>

---

## 5. 予定と実行済みを分ける

<div class="layout--three">
<div class="axis-card"><h3>Solver</h3><p>開始・完了</p></div>
<div class="axis-card axis-card--teal"><h3>Judge</h3><p>開始・完了</p></div>
<div class="axis-card axis-card--amber"><h3>Repair</h3><p>条件付きで予定。開始イベントなし</p></div>
</div>

<div class="callout">Fusion の critic と CLI の subagent も別のイベントとして扱う</div>
<div class="source">Max 試行の記録。見えない内部工程は推測しない。</div>

---

## まとめ

<div class="fact-list">
<p><strong>委任</strong> — 対象・制約・成果物を明示</p>
<p><strong>測定</strong> — 時間とイベントの定義を記録</p>
<p><strong>品質</strong> — 利用量と別に、根拠を独立に確認</p>
<p><strong>説明</strong> — 観測、仮説、未確認を分ける</p>
</div>

<div class="callout--warning callout">少数試行。一般化には条件を揃えた反復と実際の検証が必要</div>
