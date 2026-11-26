import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {performance} from 'node:perf_hooks';
const [cli,output]=process.argv.slice(2);
if (!cli || !output) throw Error('Usage: node subagent-followup.mjs /path/to/copilot output.json');
const root=await mkdtemp(join(tmpdir(),'fusion-subagent-followup-'));
const dirs={};
for(const c of ['baseline','delegate','agents','fleet']) { dirs[c]=join(root,c); await mkdir(dirs[c]); await writeFile(join(dirs[c],'sample.ts'),'export function timeoutMs(value: number | null | undefined): number {\n  return value || 5000;\n}\n'); }
const instructions='When investigating sample.ts, delegate the initial file investigation to the explore subagent and use its findings. Do not modify files or access the network.\n';
await writeFile(join(dirs.agents,'AGENTS.md'),instructions);
const base='sample.ts を読み、timeoutMs のバグと修正案を報告してください。変更や外部アクセスはしないでください。';
const prompts={baseline:base,delegate:base+'subagentにファイルの調査を委任してください。',agents:base,fleet:base};
const jobs=Array.from({length:5},(_,i)=>['baseline','delegate','agents','fleet'].map((condition,j)=>({index:i+1,condition,sort:(j+i)%4})).sort((a,b)=>a.sort-b.sort)).flat();
const runs=[];
async function run(job) {
 const start=performance.now();let text='',stderr='';
 const args=['--no-auto-update','--model','auto','--auto-tier','hydrafusion','--disable-builtin-mcps',...(job.condition==='agents'?[]:['--no-custom-instructions']),...(job.condition==='fleet'?['--fleet']:[]),'--no-ask-user','--trust-folder','--available-tools','view,task','--allow-tool','view','--allow-tool','task','--max-ai-credits','30','--output-format','json','-p',prompts[job.condition]];
 const proc=spawn(cli,args,{cwd:dirs[job.condition],stdio:['ignore','pipe','pipe']});proc.stdout.on('data',b=>text+=b);proc.stderr.on('data',b=>stderr+=b);
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;proc.kill('SIGTERM')},180000);
 const exitCode=await new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',resolve)});clearTimeout(timer);
 const events=text.split('\n').flatMap(line=>{try{return[JSON.parse(line)]}catch{return[]}});const count=type=>events.filter(x=>x.type===type).length;const done=events.findLast(x=>x.type==='session.fusion_completed')?.data;
 const record={index:job.index,condition:job.condition,elapsedMs:Math.round(performance.now()-start),exitCode,timedOut,subagentStarted:count('subagent.started'),subagentCompleted:count('subagent.completed'),toolStarts:count('tool.execution_start'),pattern:done?.pattern??null,reportedParentAiCredits:typeof done?.totalNanoAiu==='number'?done.totalNanoAiu/1e9:null,outcome:done?.outcome??null,resultReceived:count('result')>0};
 if(exitCode!==0)console.error(`${job.condition} ${job.index} failed: ${stderr.slice(0,200)}`);console.log(`${job.condition} ${job.index}/5 start=${record.subagentStarted} complete=${record.subagentCompleted} ${record.elapsedMs}ms`);return record;
}
for(let i=0;i<jobs.length;i+=4){runs.push(...await Promise.all(jobs.slice(i,i+4).map(run)));await writeFile(output,JSON.stringify({createdAt:new Date().toISOString(),fixture:'timeoutMs(value) returns value || 5000; zero is a valid value',cliVersion:'1.0.115',tier:'hydrafusion',prompts,agentsInstructions:instructions,settings:'four parallel sessions per round; view and task allowed; isolated read-only fixture; no custom instructions except agents condition; built-in MCPs disabled',runs},null,2)+'\n');}
