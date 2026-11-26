import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// The caller supplies the Copilot CLI path; all local files are read-only fixtures.
const cli=process.argv[2]; const output=process.argv[3];
if(!cli || !output) throw Error('Usage: node subagent-study.mjs /path/to/copilot output.json');
const dir=await import('node:fs/promises').then(fs=>fs.mkdtemp(join(tmpdir(),'fusion-subagent-study-')));
await writeFile(join(dir,'sample.ts'),'export function timeoutMs(value: number | null | undefined): number {\n  return value || 5000;\n}\n');
const base='sample.ts を読み、timeoutMs のバグと修正案を報告してください。変更や外部アクセスはしないでください。';
const prompts={baseline:base,delegate:base+'subagentにファイルの調査を委任してください。'};
const jobs=Array.from({length:5},(_,i)=>i%2?[{index:i+1,condition:'delegate'},{index:i+1,condition:'baseline'}]:[{index:i+1,condition:'baseline'},{index:i+1,condition:'delegate'}]).flat();
const runs=[];
async function run(job){
  const start=performance.now(); let text=''; let stderr='';
  const args=['--no-auto-update','--model','auto','--auto-tier','hydrafusion','--disable-builtin-mcps','--no-custom-instructions','--no-ask-user','--trust-folder','--available-tools','view,task','--allow-tool','view','--allow-tool','task','--max-ai-credits','30','--output-format','json','-p',prompts[job.condition]];
  const proc=spawn(cli,args,{cwd:dir,stdio:['ignore','pipe','pipe']});
  proc.stdout.on('data',b=>text+=b); proc.stderr.on('data',b=>stderr+=b);
  let timedOut=false; const timeout=setTimeout(()=>{timedOut=true;proc.kill('SIGTERM')},180000);
  const exitCode=await new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',resolve)}); clearTimeout(timeout);
  const events=text.split('\n').flatMap(line=>{try{return [JSON.parse(line)]}catch{return []}});
  const count=name=>events.filter(e=>e.type===name).length;
  const done=events.findLast(e=>e.type==='session.fusion_completed')?.data;
  const record={...job,elapsedMs:Math.round(performance.now()-start),exitCode,timedOut,subagentStarted:count('subagent.started'),subagentCompleted:count('subagent.completed'),toolStarts:count('tool.execution_start'),pattern:done?.pattern??null,aiCredits:typeof done?.totalNanoAiu==='number'?done.totalNanoAiu/1e9:null,outcome:done?.outcome??null,resultReceived:count('result')>0};
  if(exitCode!==0) console.error(`Failure ${job.condition} ${job.index}: ${stderr.slice(0,200)}`);
  console.log(`${job.condition} ${job.index}/5: ${record.subagentStarted}/${record.subagentCompleted}, ${record.elapsedMs}ms`);
  return record;
}
// Two simultaneous calls avoid changing permissions within the comparison.
for(let i=0;i<jobs.length;i+=2){runs.push(...await Promise.all(jobs.slice(i,i+2).map(run)));await writeFile(output,JSON.stringify({createdAt:new Date().toISOString(),fixture:'timeoutMs(value) returns value || 5000; zero is a valid value',cliVersion:'1.0.115',tier:'hydrafusion',prompts,settings:'view and task allowed, no custom instructions, built-in MCPs disabled, read-only fixture, two concurrent sessions',runs},null,2)+'\n');}
