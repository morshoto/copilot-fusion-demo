import { CopilotClient } from '@microsoft/copilot-sdk';
import { writeFile } from 'node:fs/promises';
import { grade } from './hypotheses-grader.js';
import { newObservation, observe, type Observation } from './fusion-observation.js';
import {topics,modes,routePrompt,judgeTasks,cacheBase,cacheChanged,type Case} from './hypotheses-fixtures.js';
import {followup} from './hypotheses-judge-followup.js';
import {cacheFollowups,cacheFollowupBase,cacheFollowupChanged} from './hypotheses-cache-followup.js';

type Job={kind:'route'|'cache'|'judge'; id:string; condition:string; prompts:string[]; topic?:string; mode?:string; paraphrase?:number; cases?:Case[]};
const filename=process.argv[2]; if(!filename)throw Error('new output file required');
const seed=20261126; let state=seed;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32};
const jobs:Job[]=[];
for(const topic of topics)for(const mode of modes)for(let paraphrase=0;paraphrase<2;paraphrase++)jobs.push({kind:'route',id:`${topic.id}-${mode}-${paraphrase}`,topic:topic.id,mode,paraphrase,condition:mode,prompts:[routePrompt(topic,mode,paraphrase)]});
for(const topic of topics){let id=topic.id;for(const condition of ['repeat','changed','fresh'])jobs.push({kind:'cache',id:`${id}-${condition}`,topic:id,condition,prompts:condition==='fresh'?[cacheBase(id)]:[cacheBase(id),condition==='repeat'?cacheBase(id):cacheChanged(id)]});}
if(process.env.HYPOTHESES_CACHE_FOLLOWUP==='1'){jobs.splice(0,jobs.length);for(const topic of cacheFollowups)for(const condition of ['repeat','changed','fresh'])jobs.push({kind:'cache',id:`${topic.id}-${condition}`,topic:topic.id,condition,prompts:condition==='fresh'?[cacheFollowupBase(topic)]:[cacheFollowupBase(topic),condition==='repeat'?cacheFollowupBase(topic):cacheFollowupChanged(topic)]});}
if(process.env.HYPOTHESES_CACHE_FOLLOWUP!=='1')for(const task of (process.env.HYPOTHESES_FOLLOWUP==='1'?followup:judgeTasks))jobs.push({kind:'judge',id:task.id,condition:task.id,prompts:[task.prompt],cases:task.cases});
if(process.env.HYPOTHESES_FILTER){const selected=jobs.filter(j=>j.kind===process.env.HYPOTHESES_FILTER);jobs.splice(0,jobs.length,...selected)}
for(let i=jobs.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[jobs[i],jobs[j]]=[jobs[j],jobs[i]]}
const results:unknown[]=[]; const startedAt=new Date().toISOString();
await writeFile(filename,JSON.stringify({startedAt,seed,jobCount:jobs.length,results},null,2)+'\n',{flag:'wx'});
const client=new CopilotClient({mode:'coding-agent',observability:{logLevel:'error'}});
function clean(o:Observation) {
 const ids=new Map<string,string>();const pid=(x:string|null|undefined)=>{if(x==null)return null;if(!ids.has(x))ids.set(x,`p${ids.size+1}`);return ids.get(x)};
 return {pattern:o.pattern??null,route:o.route?{primaryModel:o.route.primaryModel,scores:o.route.scores??null,routeSource:o.route.routeSource??null,plan:o.route.plan??null}:null,routeFailure:o.routeFailure??null,
 phases:o.phases.map(p=>({id:pid(p.id),kind:p.kind,model:p.model,status:p.status,role:p.role,verdict:p.verdict??null,usage:p.usage??null})),
 completed:o.completed?{...o.completed,finalSourcePhaseId:pid(o.completed.finalSourcePhaseId)}:null,handoffs:(o.handoffs??[]).map(h=>({sourcePhaseId:pid(h.sourcePhaseId),targetPhaseId:pid(h.targetPhaseId),targetModel:h.targetModel??null}))};
}

let save=Promise.resolve();function checkpoint(){save=save.then(()=>writeFile(filename,JSON.stringify({startedAt,seed,jobCount:jobs.length,recordsWritten:results.length,results},null,2)+'\n'));return save}
await client.start();try{
 if(!(await client.getAuthStatus()).isAuthenticated)throw Error('Copilot authentication required');let next=0;
 async function work(){for(;;){const k=next++;if(k>=jobs.length)return;const job=jobs[k];let session;
 try{session=await client.createSession({model:'fusion',github:{capi:{fusionTier:'high'}},events:{streaming:true},tools:{availableTools:[]},git:{enableHostGitOperations:false},permissions:{onRequest:()=>({kind:'denied-interactively-by-user'})}});
 let current=newObservation(),draft:string|undefined;session.on(e=>{observe(current,e);if(e.type==='assistant.fusion_phase_completed' && e.data.phaseKind==='primary')draft=e.data.content});
 for(let turn=0;turn<job.prompts.length;turn++){current=newObservation();draft=undefined;const turnStartedAt=new Date().toISOString(),start=performance.now();let error:string|null=null;try{const response=await session.sendAndWait(job.prompts[turn],180_000);if(!response?.data.content)error='empty'}catch(e){error=e instanceof Error?e.name:'unknown'}
 const observation=clean(current);const scoring=job.kind==='judge'&&observation.pattern==='cascade'?grade(draft,job.cases!):null;
 const record={order:k,kind:job.kind,id:job.id,condition:job.condition,topic:job.topic??null,mode:job.mode??null,paraphrase:job.paraphrase??null,turn:turn+1,promptChars:job.prompts[turn].length,turnStartedAt,elapsedMs:Math.round(performance.now()-start),error,observation,scoring};results.push(record);await checkpoint();console.log(`${job.kind} ${job.id} t${turn+1} ${observation.pattern??'?'} ${scoring?.status??''}`);if(error)break;
 }}catch(e){results.push({order:k,kind:job.kind,id:job.id,error:e instanceof Error?e.name:'unknown'});await checkpoint();console.log(`${job.kind} ${job.id} session_error`)}finally{await session?.disconnect().catch(()=>{})}
 }}
 await Promise.all([work(),work(),work()]);await save;
}finally{await client.stop()}
