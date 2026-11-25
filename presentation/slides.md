---
marp: true
theme: fusion-redesign
paginate: true
size: 16:9
---

<!-- _class: cover -->

<div class="kicker">GITHUB UNIVERSE RECAP 2026</div>

# Copilot<br>Fusion<span class="accent">.</span>

<p class="cover-sub">使い倒してわかった、<br>モデル選択の裏側と5つのヒント</p>
<div class="cover-index">ROUTING　/　AGENTS　/　EVIDENCE</div>

---

<div class="kicker">01 / ARCHITECTURE</div>

## Fusion は処理の流れを選ぶ

<div class="architecture">
  <div class="arch-input"><span>INPUT</span><b>開発タスク</b><small>プロンプトとコンテキスト</small></div>
  <div class="arch-route"><span>FUSION</span><b>モデルと方式を選択</b><small>effort ・利用可能なモデル</small></div>
  <div class="arch-outputs"><div><b>Single</b><small>1モデルが解く</small></div><div><b>Cascade</b><small>判定して必要なら強いモデルへ</small></div><div><b>Critique</b><small>批評を集めて回答を改訂</small></div></div>
</div>
<p class="takeaway">必要に応じて追加のモデル呼び出しが発生する</p>
<div class="foot">出典：GitHub Docs, About Copilot Fusion</div>

---

<div class="kicker">02 / RESEARCH</div>

## モデル選択を「能力」で考える

<div class="research">
  <div class="research-left"><p class="overline">HyDRA 論文の考え方</p><div class="axis"><b>推論</b><i style="--w:82%"></i></div><div class="axis"><b>コード生成</b><i style="--w:67%"></i></div><div class="axis"><b>デバッグ</b><i style="--w:92%"></i></div><div class="axis"><b>ツール利用</b><i style="--w:48%"></i></div><small>バーは考え方を示すイメージ</small></div>
  <div class="research-right"><p>要求される能力を予測し、<br><strong>モデルの能力との不足</strong>を比較する。</p><p class="muted">モデル一覧と予測器を分離する設計</p></div>
</div>
<div class="foot">Garg et al., HyDRA (2026) · Auto 選択の関連研究。現行 Fusion の完全な内部仕様ではない</div>

---

<div class="kicker">03 / CLI</div>

## まず、状態を見えるようにする

<div class="commands"><div><code>/model</code><p>選択できるモデルを確認</p></div><div><code>/usage</code><p>セッションの利用量を確認</p></div><div><code>/context</code><p>コンテキストの状態を確認</p></div></div>
<p class="takeaway">表示される利用量と、実際の請求額は別</p>
<div class="foot">Copilot CLI 1.0.115 の観測。起動直後の /context は情報なし</div>

---

<!-- _class: demo -->

<div class="kicker">04 / RECORDED DEMO</div>

## まず失敗するテストを作る

<div class="screen"><img src="media/framekit-796-red.gif" alt="回帰テストを作成し失敗を確認する実際のCLI録画"></div>
<div class="foot">実録画・待機短縮・2倍速。個人パスとセッションIDを伏せています</div>

---

<!-- _class: demo -->

<div class="kicker">05 / RECORDED DEMO</div>

## 修正して、もう一度テスト

<div class="screen"><img src="media/framekit-796-green.gif" alt="修正とテスト再実行の実際のCLI録画"></div>
<div class="foot">上限到達で停止後、上限を上げて再開。GIFは再開後の録画</div>

---

<div class="kicker">06 / RESULT</div>

## 最初のフレームを比べる

<div class="before-after"><div><span>BEFORE</span><img src="media/framekit-796-before.png" alt="修正前の初期フレーム"></div><div><span>AFTER</span><img src="media/framekit-796-after.png" alt="修正後の初期フレーム"></div><aside><strong>初期表示で<br>文字とボタンが<br>見えるように</strong><p>20ケースを確認<br>5つのブラウザ・モバイル設定</p></aside></div>
<div class="foot">Chromium・light・375px。初期アニメーションを停止したローカル生成物</div>

---

<div class="kicker">07 / TIP 01 · SUBAGENT</div>

## 委任の指示と、結果を確認する

<div class="subagent-grid"><div><span>指示なし</span><strong>0</strong><p>開始イベント</p></div><div><span>委任を明示</span><strong>1</strong><p>explore 開始・完了</p></div><aside><b>委任文に含めたいこと</b><p>対象、成果物、制約、根拠</p><small>AGENTS.md と --fleet でも<br>開始を観測</small></aside></div>
<div class="foot">各1試行。task権限は揃えたが、モデル・経路などは異なる。Fusionの批評工程とsubagentは別</div>

---

<div class="kicker">08 / TIP 02 · ITERATION</div>

## 見直しと停止を、依頼に書く

<div class="loop"><div class="loop-quote">「一度見直したら調査を止め、<br>確認済みと未確認を分ける」</div><div class="loop-stats"><div><b>131<span>秒</span></b><small>基本依頼</small></div><div><b>252<span>秒</span></b><small>見直し・停止を追加</small></div></div></div>
<p class="takeaway">途中の再確認と、最終報告をイベントで確認</p>
<div class="foot">各1試行・同じモデルと権限。キャッシュや負荷は異なり、時間差の原因は断定できない</div>

---

<div class="kicker">09 / TIP 03 · COST & QUALITY</div>

## effort と品質を一緒に見る

<div class="cost"><div><span>HIGH 優先</span><strong>34.426</strong><small>AI credits · 品質基準に合格</small></div><div><span>MAX 単独</span><strong>30.113</strong><small>AI credits · 図の検証を漏らした</small></div></div>
<p class="takeaway">この1例では、High 優先による節約は示せなかった</p>
<div class="foot">各1試行。テスト案の評価であり実行結果や請求額ではない。同品質の費用比較ではない</div>

---

<div class="kicker">10 / TIP 04 · VERIFICATION</div>

## もっともらしい説明も、コードで確認

<div class="claim"><div><span>回答</span><p>アニメーションの間、<br><b>ずっと不可視</b></p></div><div><span>コード</span><p>opacity は <b>0 から 1</b> へ。<br>遅延後は徐々に表示</p></div></div>
<p class="takeaway">重要な主張は、パスと元のコードに戻って確かめる</p>
<div class="foot">Maxの1回答での観測。一般的なモデル品質の評価ではない</div>

---

<div class="kicker">11 / TIP 05 · CONTEXT</div>

## 読めない要件は、プロンプトで渡す

<div class="requirements"><div><span>ISSUE 番号だけ</span><b>本文を取得できず</b><p>外部アクセスを禁止</p></div><div><span>本文を添付</span><b>対象と閾値を含む提案</b><p>図・両CTA・4.5:1</p></div></div>
<p class="takeaway">参照できた情報と、読めなかった情報を分ける</p>
<div class="foot">異なるモデル等が選択された別試行。本文追加による因果効果は未確認</div>

---

<!-- _class: closing -->

<div class="kicker">12 / TAKEAWAYS</div>

## モデル選択を任せ、<br>成果を確かめる<span class="accent">.</span>

<div class="closing-lines"><p><b>01</b> 委任する仕事と制約を明確に</p><p><b>02</b> どこで止めるかを伝える</p><p><b>03</b> 品質と利用量を一緒に見る</p><p><b>04</b> 根拠と必要な要件を確認する</p></div>
<div class="foot">探索的な少数試行。実験条件と限界を併記</div>
