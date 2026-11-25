import { test } from "node:test";
import assert from "node:assert/strict";
import type { SessionEvent } from "@microsoft/copilot-sdk";
import { newObservation, observe, renderComparison, renderRun, type DemoRun } from "./fusion-observation.js";

const event = (type: string, data: object, id = type) => ({ type, data, id } as unknown as SessionEvent);
const run = (): DemoRun => ({ tier: "high", scenario: "complex", prompt: "課題", answer: "回答", elapsedMs: 1000, observation: newObservation() });

test("予定と実行済みの工程を区別し、条件付き工程を実行済みにしない", () => {
  const r = run();
  observe(r.observation, event("session.fusion_resolved", { pattern: "cascade", primaryModel: "a", phasePlan: [{ kind: "primary", role: "solver", conditional: false }, { kind: "repair", role: "solver", conditional: true }] }));
  observe(r.observation, event("assistant.fusion_phase_started", { phaseId: "p1", phaseKind: "primary", role: "solver", model: "a", pattern: "cascade" }));
  observe(r.observation, event("assistant.fusion_phase_completed", { phaseId: "p1", phaseKind: "primary", role: "solver", model: "a", status: "succeeded", durationMs: 500 }));
  const output = renderRun(r);
  assert.match(output, /repair\) \[条件付き\]/);
  assert.match(output, /primary\) \/ solver \/ a \/ succeeded/);
  assert.doesNotMatch(output, /repair \/ solver/);
  assert.equal(r.observation.phases.length, 1);
});

test("使用量の重複を除き、不明な値をゼロ扱いしない", () => {
  const r = run();
  const usage = event("assistant.usage", { model: "a", inputTokens: 10, fusion: { pattern: "single", sourceModel: "a", phaseKind: "primary", phaseId: "p" } }, "u1");
  observe(r.observation, usage); observe(r.observation, usage);
  assert.equal(r.observation.usage.length, 1);
  assert.match(renderRun(r), /入力 10 \/ 出力 一部不明/);
  assert.match(renderRun(r), /完了状況は不明/);
});

test("完了イベントの集計を使用し、フェーズの使用量と二重計上しない", () => {
  const r = run();
  observe(r.observation, event("assistant.usage", { model: "a", inputTokens: 10, outputTokens: 2 }));
  observe(r.observation, event("session.fusion_completed", { pattern: "critique", inputTokens: 20, outputTokens: 4, durationMs: 900, phaseCount: 3, requestCount: 3, finalSourceModel: "a", outcome: "completed", degradedReason: null }));
  assert.match(renderRun(r), /入力 20 \/ 出力 4（Fusion 完了イベントの合計）/);
  assert.match(renderRun(r), /フェーズの詳細: 取得できませんでした/);
  assert.match(renderComparison([r, r]), /優劣を示すものではありません/);
});

test("経路決定失敗とフェーズ失敗を隠さない", () => {
  const r = run();
  observe(r.observation, event("session.fusion_route_failed", { reason: "unavailable", fallbackModel: "b" }));
  observe(r.observation, event("assistant.fusion_phase_failed", { phaseId: "p", phaseKind: "critic", role: "critic", model: "a", status: "failed", durationMs: 200 }));
  assert.match(renderRun(r), /ルーティング失敗: unavailable/);
  assert.match(renderRun(r), /critic\) \/ critic \/ a \/ 失敗/);
});

test("複数のレビューが同じモデルでも別フェーズとして表示される", () => {
  const r = run();
  for (const [id, kind, model] of [["draft", "draft", "a"], ["critic1", "critic", "b"], ["critic2", "critic", "b"], ["revision", "revision", "a"]]) {
    observe(r.observation, event("assistant.fusion_phase_started", { phaseId: id, phaseKind: kind, role: kind, model, pattern: "critique" }));
    observe(r.observation, event("assistant.fusion_phase_completed", { phaseId: id, phaseKind: kind, role: kind, model, status: "succeeded", durationMs: 100 }));
  }
  const output = renderRun(r);
  assert.match(output, /critique（下書き・レビュー・修正）/);
  assert.equal(r.observation.phases.length, 4);
  assert.equal((output.match(/レビュー \(critic\) \/ critic \/ b/g) ?? []).length, 2);
});
