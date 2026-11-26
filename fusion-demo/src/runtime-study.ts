import { CopilotClient } from '@microsoft/copilot-sdk';
import { writeFile } from 'node:fs/promises';
import { newObservation, observe, type Observation } from './fusion-observation.js';

// Synthetic, deterministic material; no source files or tools are made available.
const prefix=Array.from({length:220},(_,i)=>`Rule ${i+1}: A worker must record delivery ${i+1} before acknowledging it; retry safely with a stable idempotency key. Example state: queued -> active -> complete.`).join('\n');
const p1=`${prefix}\n\nSummarize rules 1, 110 and 220 in three short bullet points.`;
const p2=`${prefix}\n\nSummarize rules 1, 110 and 220 in three short bullet points.`;
const p3=`${prefix}\n\nIdentify two failure modes for a distributed worker and one mitigation each.`;
const complex=`Act as an adversarial reviewer. Analyze a distributed payment design: clients retry POST after timeout; workers process at least once; two regions may accept the same key; network partitions and stale leases occur; database commits can succeed after timeout. Specify consistency assumptions, race timelines, state transitions, idempotency and reconciliation, and a minimal fault-injection test matrix. Identify two flaws in your own proposal. No tools.`;
const simple='指数バックオフとは何ですか？日本語で2文以内で説明してください。';
const output=process.argv[2]; if (!output) throw Error('New output filename required');
const createdAt=new Date().toISOString();
const runs: unknown[]=[];
await writeFile(output,JSON.stringify({createdAt,protocol:'experiments/fusion-runtime-protocol.md',runs},null,2)+'\n',{flag:'wx'});
const client=new CopilotClient({mode:'coding-agent',observability:{logLevel:'error'}});
function sanitize(o:Observation) {
 const ids=new Map<string,string>(); const pid=(v:string|null|undefined)=>{if(v==null)return null; if(!ids.has(v))ids.set(v,`p${ids.size+1}`);return ids.get(v)};
 const route=o.route?{primaryModel:o.route.primaryModel,routeSource:o.route.routeSource??null,routingLatencyMs:o.route.routingLatencyMs??null,followUp:o.route.followUp??null,judgeModel:o.route.judgeModel??null,repairModel:o.route.repairModel??null,fallbackModel:o.route.fallbackModel??null,plan:o.route.plan??null}:null;
 return { pattern:o.pattern??null, route, routeFailure:o.routeFailure??null,
  phases:o.phases.map(p=>({id:pid(p.id),kind:p.kind,role:p.role,model:p.model,status:p.status,durationMs:p.durationMs??null,verdict:p.verdict??null,usage:p.usage??null,reason:p.reason??null,degradedToPhaseId:pid(p.degradedToPhaseId),conversationScope:p.conversationScope??null})),
  usage:o.usage.map(u=>({model:u.model,inputTokens:u.inputTokens??null,outputTokens:u.outputTokens??null,pattern:u.pattern??null,phaseId:pid(u.phaseId),phaseKind:u.phaseKind??null,role:u.role??null,sourceModel:u.sourceModel??null,cacheReadTokens:u.cacheReadTokens??null,cacheWriteTokens:u.cacheWriteTokens??null})),
  completed:o.completed?{...o.completed,finalSourcePhaseId:pid(o.completed.finalSourcePhaseId)}:null, handoffs:(o.handoffs??[]).map(h=>({sourcePhaseId:pid(h.sourcePhaseId),targetPhaseId:pid(h.targetPhaseId),targetModel:h.targetModel??null})), eventTypes:o.eventTypes??[] };
}
async function save(){await writeFile(output,JSON.stringify({createdAt,protocol:'experiments/fusion-runtime-protocol.md',sdkVersion:'2.0.1',prefixLines:220,prefixDescription:'synthetic repeated worker idempotency rules',runs},null,2)+'\n')}
await client.start();
try {
 if(!(await client.getAuthStatus()).isAuthenticated)throw Error('Copilot not authenticated');
 for(const group of [
  {name:'high-continuation',tier:'high' as const,jobs:[['same-prefix-first',p1],['same-prefix-repeat',p2],['same-prefix-changed-task',p3]]},
  {name:'high-fresh',tier:'high' as const,jobs:[['same-prefix-fresh-session',p1]]},
  {name:'high-simple',tier:'high' as const,jobs:[['short-simple',simple]]},
  {name:'max-review',tier:'max' as const,jobs:[['complex-review',complex]]},
  {name:'high-review',tier:'high' as const,jobs:[['complex-review-high',complex]]},
 ]) {
  if (process.env.RUNTIME_STUDY_FILTER && !process.env.RUNTIME_STUDY_FILTER.split(',').includes(group.name)) continue;
  const session=await client.createSession({model:'fusion',github:{capi:{fusionTier:group.tier}},events:{streaming:true},tools:{availableTools:[]},git:{enableHostGitOperations:false},permissions:{onRequest:()=>({kind:'denied-interactively-by-user'})}});
  let observation=newObservation(); session.on(e=>observe(observation,e));
  try { for(const [condition,prompt] of group.jobs){
   observation=newObservation();const startedAt=new Date().toISOString(),start=performance.now(); let error:string|null=null;
   try {const result=await session.sendAndWait(prompt,300_000);if(!result?.data.content)error='no_final_answer'} catch(e){error=e instanceof Error?e.name:'unknown_error'}
   const record={group:group.name,tier:group.tier,condition,startedAt,elapsedMs:Math.round(performance.now()-start),error,observation:sanitize(observation)};
   runs.push(record);await save();console.log(`${condition}: ${record.observation.pattern??'unknown'} ${record.elapsedMs}ms error=${error??'none'}`);
   if(error)break;
  }} finally {await session.disconnect()}
 }
} finally {await client.stop()}
