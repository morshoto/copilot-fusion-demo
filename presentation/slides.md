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

## CLI で選択と利用量を確認

<div class="layout--three">
<div class="axis-card"><h3>/model</h3><p>セッションのモデル選択を開く</p></div>
<div class="axis-card axis-card--teal"><h3>/usage</h3><p>セッションとアカウントの利用状況を表示</p></div>
<div class="axis-card axis-card--amber"><h3>/context</h3><p>コンテキストの情報を確認</p></div>
</div>

<div class="callout--warning callout">開始直後の /context は情報なし。/usage の表示値は請求額そのものではない</div>
<div class="source">Copilot CLI 1.0.115 の対話画面で確認。候補はプランや組織ポリシーに依存。</div>

---

## 実操作：回帰テストを先に作る

<img src="media/framekit-796-red.gif" alt="Fusion が Framekit の回帰テストを作成し、通常モーションで失敗した実録画" style="display:block; margin:auto; height:505px; width:auto;">

<div class="source">実際の CLI 出力。待機短縮・2倍速、個人パスとセッション ID を伏せた録画。</div>

---

## 実操作：修正とテスト再実行

<img src="media/framekit-796-green.gif" alt="Fusion が初期表示を修正し、ブラウザテストを再実行した実録画" style="display:block; margin:auto; height:505px; width:auto;">

<div class="source">上限到達後に再開した録画。待機短縮・2倍速。追加の独立検証は実験記録を参照。</div>

---

## 修正前後の初期フレーム

<div class="layout--split">
<div class="card"><h3>修正前</h3><img src="media/framekit-796-before.png" alt="修正前、hero が見えない初期表示" style="width:300px; height:400px; object-fit:cover; object-position:top; display:block; margin:auto;"></div>
<div class="card"><h3>修正後</h3><img src="media/framekit-796-after.png" alt="修正後、hero の見出しとボタンが見える初期表示" style="width:300px; height:400px; object-fit:cover; object-position:top; display:block; margin:auto;"></div>
</div>

<div class="source">Chromium / light / 375px。初期アニメーションを停止して比較。ローカル生成物。</div>

---

## 1. 委任先に制約と成果物を渡す

<div class="layout--split">
<div class="card"><h3>委任指定なし</h3><p>subagent 開始イベント 0 件</p></div>
<div class="card"><h3>委任を明示</h3><p>explore の開始・完了を1件確認</p></div>
</div>

<div class="callout">読み取り専用・対象・根拠・成果物を委任文に含める</div>
<div class="source">追試は両方 task を許可。各1試行でモデル・経路なども異なる。</div>

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
<div class="card"><h3>High / Single</h3><div class="stat">34.426<small>報告された AI credits</small></div></div>
<div class="card"><h3>Max / Single</h3><div class="stat stat--amber">30.113<small>報告された AI credits</small></div></div>
</div>

<div class="callout">品質条件を満たした High 優先でも Max 単独より利用量が多い例を観測</div>
<div class="source">追試各1回。Max は図の測定対象を漏らし、同品質ではない。請求額ではない。</div>

---

## 4. 回答の根拠を元のコードで確かめる

<div class="layout--split">
<div class="card"><h3>Max の回答</h3><p>アニメーションの間、ずっと不可視</p></div>
<div class="card"><h3>ソースの確認</h3><p>opacity は 0 から 1 へ変化。遅延後は徐々に表示</p></div>
</div>

<div class="callout">パスと行、確認した事実、未実行のテストを分ける</div>
<div class="source">1回答の観測。実ブラウザでのコントラストは未測定。</div>

---

## 5. 必要な要件を渡し、未読を明示する

<div class="layout--split">
<div class="card"><h3>先行：番号のみ</h3><p>外部アクセスを禁止し、Issue 番号だけを指定</p></div>
<div class="card"><h3>追試：本文を提供</h3><p>本文を与えた追試では図や 4.5:1 を含む2案を提示</p></div>
</div>

<div class="callout">公開可能な要件を渡し、読めなかった資料を確認する</div>
<div class="source">本文なしとの試行ではモデル等が異なり、因果関係は未確認。</div>

---

## まとめ

<div class="fact-list">
<p><strong>委任</strong> — 対象・制約・成果物を明示</p>
<p><strong>測定</strong> — 時間とイベントの定義を記録</p>
<p><strong>品質</strong> — 利用量と別に、根拠を独立に確認</p>
<p><strong>説明</strong> — 観測、仮説、未確認を分ける</p>
</div>

<div class="callout--warning callout">少数試行。一般化には条件を揃えた反復と実際の検証が必要</div>
