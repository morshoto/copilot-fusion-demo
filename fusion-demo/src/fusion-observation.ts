import type { SessionEvent } from "@microsoft/copilot-sdk";

export type Phase = { id: string; kind: string; role: string; model: string; status: string; durationMs?: number };
export type Usage = { id: string; model: string; inputTokens?: number; outputTokens?: number; pattern?: string; phaseId?: string; phaseKind?: string; role?: string; sourceModel?: string };
export type Observation = {
  pattern?: string;
  route?: { primaryModel: string; hint?: string; plan?: { kind: string; role: string; conditional: boolean }[] };
  routeFailure?: { reason: string; fallbackModel: string };
  phases: Phase[];
  usage: Usage[];
  completed?: { pattern: string; inputTokens: number; outputTokens: number; durationMs: number; requestCount: number; phaseCount: number; finalSourceModel: string | null; outcome: string; degradedReason: string | null };
};
export type DemoRun = { tier: string; scenario: string; prompt: string; answer: string; elapsedMs: number; currentModel?: unknown; observation: Observation };
export type DemoRecord = { version: 1; createdAt: string; runs: DemoRun[] };

export function newObservation(): Observation { return { phases: [], usage: [] }; }

export function observe(o: Observation, event: SessionEvent): string | undefined {
  switch (event.type) {
    case "session.fusion_route_started":
      return "ルーティングを開始";
    case "session.fusion_resolved": {
      const d = event.data;
      o.pattern = d.pattern;
      o.route = { primaryModel: d.primaryModel, hint: d.hint, plan: d.phasePlan?.map(({ kind, role, conditional }) => ({ kind, role, conditional })) };
      return `実行方式を選択: ${d.pattern}（主モデル: ${d.primaryModel}）`;
    }
    case "session.fusion_route_failed":
      o.routeFailure = { reason: event.data.reason, fallbackModel: event.data.fallbackModel };
      return `ルーティング失敗: ${event.data.reason}（代替: ${event.data.fallbackModel}）`;
    case "assistant.fusion_phase_started":
    case "assistant.fusion_phase_completed":
    case "assistant.fusion_phase_failed": {
      const d = event.data;
      const status = event.type === "assistant.fusion_phase_started" ? "開始" : event.type === "assistant.fusion_phase_failed" ? "失敗" : "status" in d ? d.status : "不明";
      const phase = { id: d.phaseId, kind: d.phaseKind, role: d.role, model: d.model, status, ...("durationMs" in d ? { durationMs: d.durationMs } : {}) };
      const index = o.phases.findIndex((p) => p.id === d.phaseId);
      if (index < 0) o.phases.push(phase); else o.phases[index] = phase;
      if ("pattern" in d) o.pattern ??= d.pattern;
      return `${phase.kind} / ${phase.role} / ${phase.model}: ${status}`;
    }
    case "assistant.usage": {
      if (o.usage.some((u) => u.id === event.id)) return;
      const d = event.data;
      o.usage.push({ id: event.id, model: d.model, inputTokens: d.inputTokens, outputTokens: d.outputTokens, pattern: d.fusion?.pattern, phaseId: d.fusion?.phaseId, phaseKind: d.fusion?.phaseKind, role: d.fusion?.role, sourceModel: d.fusion?.sourceModel });
      o.pattern ??= d.fusion?.pattern;
      return;
    }
    case "session.fusion_completed": {
      const d = event.data;
      o.pattern = d.pattern;
      o.completed = { pattern: d.pattern, inputTokens: d.inputTokens, outputTokens: d.outputTokens, durationMs: d.durationMs, requestCount: d.requestCount, phaseCount: d.phaseCount, finalSourceModel: d.finalSourceModel, outcome: d.outcome, degradedReason: d.degradedReason };
      return `Fusion 完了: ${d.outcome}`;
    }
  }
}

function tokens(o: Observation): string {
  if (o.completed) return `入力 ${o.completed.inputTokens} / 出力 ${o.completed.outputTokens}（Fusion 完了イベントの合計）`;
  if (!o.usage.length) return "取得できませんでした";
  const inputs = o.usage.map((u) => u.inputTokens);
  const outputs = o.usage.map((u) => u.outputTokens);
  const sum = (values: (number | undefined)[]) => values.every((n) => n !== undefined) ? String(values.reduce<number>((a, b) => a + (b ?? 0), 0)) : "一部不明";
  return `入力 ${sum(inputs)} / 出力 ${sum(outputs)}（受信した使用状況イベントの合計。全呼び出し分とは限りません）`;
}

const patternLabels: Record<string, string> = { single: "単一モデル", cascade: "下書きと判定・必要に応じて修正", critique: "下書き・レビュー・修正" };
const phaseLabels: Record<string, string> = { primary: "主回答", judge: "判定", repair: "修正", draft: "下書き", critic: "レビュー", revision: "改訂", follow_up: "続き" };
const phaseLabel = (kind: string) => phaseLabels[kind] ? `${phaseLabels[kind]} (${kind})` : kind;

export function renderRun(run: DemoRun): string {
  const o = run.observation;
  const lines = [`Fusion ${run.tier} / 課題: ${run.scenario}`, `実行方式: ${o.pattern ? `${o.pattern}${patternLabels[o.pattern] ? `（${patternLabels[o.pattern]}）` : ""}` : "取得できませんでした"}`];
  if (o.routeFailure) lines.push(`ルーティング失敗: ${o.routeFailure.reason} / 代替 ${o.routeFailure.fallbackModel}`);
  if (o.route?.plan?.length) lines.push(`実行予定（条件付きの工程は実行されるとは限りません）: ${o.route.plan.map((p) => `${phaseLabel(p.kind)}${p.conditional ? " [条件付き]" : ""}`).join(" → ")}`);
  if (o.phases.length) {
    lines.push("確認できたフェーズ（イベント受信順。並列実行を順序で表すものではありません）:");
    for (const p of o.phases) lines.push(`  ${phaseLabel(p.kind)} / ${p.role} / ${p.model} / ${p.status}${p.durationMs === undefined ? "" : ` / ${(p.durationMs / 1000).toFixed(1)}秒`}`);
  } else if (o.usage.some((u) => u.phaseId || u.sourceModel)) {
    lines.push("使用状況から確認できたモデル呼び出し（フェーズの完了状況は不明）:");
    for (const u of o.usage) lines.push(`  ${u.phaseKind ? phaseLabel(u.phaseKind) : "工程不明"} / ${u.role ?? "役割不明"} / ${u.sourceModel ?? u.model}`);
  } else {
    lines.push("フェーズの詳細: 取得できませんでした");
    if (o.usage.length) lines.push(`使用状況に報告されたモデル: ${[...new Set(o.usage.map((u) => u.model))].join(", ")}`);
  }
  if (o.completed) lines.push(`完了結果: ${o.completed.outcome} / 報告されたフェーズ ${o.completed.phaseCount} / リクエスト ${o.completed.requestCount}${o.completed.degradedReason ? ` / 縮退: ${o.completed.degradedReason}` : ""}`);
  lines.push(`所要時間: ${(run.elapsedMs / 1000).toFixed(1)}秒（セッション作成・応答を含む）`, `使用量: ${tokens(o)}`, "課金額: この表示からは確定できません");
  return lines.join("\n");
}

export function renderComparison(runs: DemoRun[]): string {
  return ["比較（各1回の観測であり、品質や速度の優劣を示すものではありません）", ...runs.map((r, i) => `${i + 1}. ${r.scenario} / ${r.tier}: ${r.observation.pattern ?? "方式不明"} / ${(r.elapsedMs / 1000).toFixed(1)}秒 / ${tokens(r.observation)}`)].join("\n");
}
