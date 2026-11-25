import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { CopilotClient, type CopilotSession } from "@microsoft/copilot-sdk";
import { newObservation, observe, renderComparison, renderRun, type DemoRecord, type DemoRun } from "./fusion-observation.js";

const scenarios = {
  simple: "指数バックオフとは何ですか？日本語で2文以内で説明してください。",
  complex: `あなたは決済システムの設計レビュー担当です。次の要件を満たす API リトライ処理を TypeScript で設計してください。
注文作成 POST はタイムアウト時に決済が完了済みか不明です。クライアントが再起動しても二重決済を避ける必要があります。429 の Retry-After、ネットワーク障害、5xx、期限、キャンセル、指数バックオフとジッターを扱ってください。
クライアントとサーバーの責務、冪等キーの競合、失敗時の状態遷移、障害注入テスト、残るトレードオフを簡潔に示してください。コードは不要です。`,
} as const;
type Tier = "standard" | "high" | "max";
type Scenario = keyof typeof scenarios;

function help() {
  console.log(`Copilot Fusion デモ
  pnpm demo [--scenario simple|complex] [--tier standard|high|max] [--prompt "課題"]
  pnpm demo --compare tiers|scenarios [--scenario simple|complex] [--tier high|max]
  pnpm demo ... --save <新規ファイル.json>
  pnpm demo --replay <ファイル.json>

既定: complex / high。tiers は同じ課題で High と Max を比較し、scenarios は同じ tier で簡単な課題と複雑な課題を比較します。
比較は2回のリクエストを行い、利用枠・料金が発生します。--save には課題と回答が含まれます。`);
}

async function run(client: CopilotClient, tier: Tier, scenario: string, prompt: string): Promise<DemoRun> {
  const started = performance.now();
  const observation = newObservation();
  let session: CopilotSession | undefined;
  let lastActivityLog = 0;
  console.log(`\n━━━ Fusion ${tier} / ${scenario} ━━━\n課題:\n${prompt}\n\n実行中（Fusion が方式を選択します）...`);
  try {
    session = await client.createSession({
      model: "fusion", github: { capi: { fusionTier: tier } }, events: { streaming: true },
      tools: { availableTools: [] }, git: { enableHostGitOperations: false },
      permissions: { onRequest: () => ({ kind: "denied-interactively-by-user" }) },
    });
    session.on((event) => {
      const progress = observe(observation, event);
      if (progress) console.log(`  • ${progress}`);
      if (event.type === "assistant.fusion_phase_activity" && event.data.activity === "model_output" && Date.now() - lastActivityLog > 10_000) {
        lastActivityLog = Date.now();
        console.log(`  • ${event.data.phaseKind} の応答を処理中（内容は非公開）`);
      }
    });
    const response = await session.sendAndWait(prompt, 300_000);
    const answer = response?.data.content;
    if (!answer) throw new Error("最終回答を取得できませんでした。");
    const elapsedMs = performance.now() - started;
    let currentModel: unknown;
    try { currentModel = await session.rpc.model.getCurrent(); } catch { /* Snapshot is optional. */ }
    const result = { tier, scenario, prompt, answer, elapsedMs, currentModel, observation };
    console.log(`\n${renderRun(result)}\n\n最終回答:\n${answer}`);
    return result;
  } finally {
    if (session) await session.disconnect();
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    tier: { type: "string", default: "high" }, scenario: { type: "string", default: "complex" },
    prompt: { type: "string" }, compare: { type: "string" }, save: { type: "string" },
    replay: { type: "string" }, help: { type: "boolean", short: "h" },
  } });
  if (values.help) return help();
  if (values.replay) {
    if (values.compare || values.prompt || values.save) throw new Error("--replay は --compare、--prompt、--save と併用できません。");
    const record: unknown = JSON.parse(await readFile(values.replay, "utf8"));
    if (!record || typeof record !== "object" || !("version" in record) || record.version !== 1 || !("runs" in record) || !Array.isArray(record.runs) || !record.runs.every((r: unknown) => typeof r === "object" && r !== null && "observation" in r && "answer" in r && "prompt" in r)) throw new Error("対応するデモ記録ではありません。");
    const saved = record as DemoRecord;
    console.log(`保存済み実行の再表示: ${saved.createdAt}（新たなリクエストは行いません）`);
    for (const r of saved.runs) console.log(`\n課題:\n${r.prompt}\n\n${renderRun(r)}\n\n最終回答:\n${r.answer}`);
    if (saved.runs.length > 1) console.log(`\n${renderComparison(saved.runs)}`);
    return;
  }
  if (values.tier !== "standard" && values.tier !== "high" && values.tier !== "max") throw new Error("--tier は standard、high、max のいずれかを指定してください。");
  if (values.scenario !== "simple" && values.scenario !== "complex") throw new Error("--scenario は simple または complex を指定してください。");
  if (values.compare && values.compare !== "tiers" && values.compare !== "scenarios") throw new Error("--compare は tiers または scenarios を指定してください。");
  if (values.compare === "scenarios" && values.prompt !== undefined) throw new Error("--compare scenarios と --prompt は併用できません。");
  if (values.prompt !== undefined && !values.prompt.trim()) throw new Error("プロンプトは空にできません。");
  const tier = values.tier as Tier;
  const scenario = values.scenario as Scenario;
  const jobs: { tier: Tier; scenario: string; prompt: string }[] = values.compare === "tiers"
    ? (["high", "max"] as const).map((t) => ({ tier: t, scenario: values.prompt === undefined ? scenario : "custom", prompt: values.prompt ?? scenarios[scenario] }))
    : values.compare === "scenarios"
      ? (["simple", "complex"] as const).map((s) => ({ tier, scenario: s, prompt: scenarios[s] }))
      : [{ tier, scenario: values.prompt === undefined ? scenario : "custom", prompt: values.prompt ?? scenarios[scenario] }];
  const createdAt = new Date().toISOString();
  if (values.save) {
    // Reserve a valid recording before spending usage, never overwrite an existing file.
    await writeFile(values.save, JSON.stringify({ version: 1, createdAt, runs: [] } satisfies DemoRecord, null, 2) + "\n", { flag: "wx" });
  }
  const client = new CopilotClient({ mode: "coding-agent", observability: { logLevel: "error" } });
  const runs: DemoRun[] = [];
  try {
    await client.start();
    const auth = await client.getAuthStatus();
    if (!auth.isAuthenticated) throw new Error("Copilot に認証されていません。README の認証手順を確認してください。");
    for (const job of jobs) {
      runs.push(await run(client, job.tier, job.scenario, job.prompt));
      if (values.save) await writeFile(values.save, JSON.stringify({ version: 1, createdAt, runs } satisfies DemoRecord, null, 2) + "\n");
    }
    if (runs.length > 1) console.log(`\n${renderComparison(runs)}`);
    if (values.save) console.log(`\n実行記録を保存しました: ${values.save}`);
  } finally {
    await client.stop();
  }
}

main().catch((error: unknown) => {
  console.error("Fusion デモを実行できませんでした:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
