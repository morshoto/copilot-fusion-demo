import { CopilotClient } from '@microsoft/copilot-sdk';
import { writeFile } from 'node:fs/promises';
import { newObservation, observe } from './fusion-observation.js';

// A reproducible model-only study; this does not measure tool-using agent loops.
const base = `次の JavaScript 関数はゼロも有効な設定値として扱う必要があります。バグを指摘し、修正済みの関数を返してください。
function timeoutMs(config) { return config.timeout || 5000; }
例: timeoutMs({timeout: 0}) は 0 を返します。`;
const prompts = {
  basic: base,
  review: `${base}\n回答前に、0・undefined・null の3ケースを1回見直してから結論を返してください。`,
};
const destination = process.argv[2];
if (!destination) throw new Error('Output path required');
const client = new CopilotClient({ mode: 'coding-agent', observability: { logLevel: 'error' } });
const runs: unknown[] = [];
await client.start();
try {
  if (!(await client.getAuthStatus()).isAuthenticated) throw new Error('Copilot authentication is required');
  for (let index = 0; index < 10; index++) {
    const order: (keyof typeof prompts)[] = index % 2 ? ['review','basic'] : ['basic','review'];
    for (const condition of order) {
      const startedAt = new Date().toISOString();
      const start = performance.now();
      const observation = newObservation();
      const session = await client.createSession({model:'fusion',github:{capi:{fusionTier:'high'}},events:{streaming:true},tools:{availableTools:[]},git:{enableHostGitOperations:false},permissions:{onRequest:()=>({kind:'denied-interactively-by-user'})}});
      session.on(event => observe(observation,event));
      try {
        const answer = (await session.sendAndWait(prompts[condition],300_000))?.data.content ?? '';
        const record = {index:index+1,condition,startedAt,elapsedMs:Math.round(performance.now()-start),answer,observation};
        runs.push(record);
        await writeFile(destination,JSON.stringify({createdAt:new Date().toISOString(),tier:'high',task:base,prompts,runs},null,2));
        console.log(`${condition} ${index+1}/10 ${record.elapsedMs}ms`);
      } finally { await session.disconnect(); }
    }
  }
} finally { await client.stop(); }
