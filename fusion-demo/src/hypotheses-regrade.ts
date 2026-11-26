import {readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {judgeTasks} from './hypotheses-fixtures.js';
import {followup} from './hypotheses-judge-followup.js';
import {grade} from './hypotheses-grader.js';
const output=process.argv[2];if(!output)throw Error('new output path required');const root=join(process.env.HOME! ,'.copilot/session-state');
const candidates=[...judgeTasks,...followup], found=new Map<string,{status:string;passed:number|null;total:number;caseResults?:boolean[]}>();
for(const dir of await readdir(root)){const file=join(root,dir,'events.jsonl');let data:string;try{const st=await stat(file);if(st.mtimeMs<Date.parse('2026-11-26T02:26:18Z')||st.mtimeMs>Date.parse('2026-11-26T02:31:30Z'))continue;data=await readFile(file,'utf8')}catch{continue}
 const task=candidates.find(t=>data.includes(t.prompt));if(!task)continue;const events=data.split('\n').flatMap(x=>{try{return [JSON.parse(x)]}catch{return []}});const resolved=events.find(x=>x.type==='session.fusion_resolved');if(resolved?.data?.pattern!=='cascade')continue;
 const primary=events.find(x=>x.type==='assistant.fusion_phase_completed'&&x.data?.phaseKind==='primary');if(primary?.data?.content){if(found.has(task.id))throw Error('ambiguous matching logs');found.set(task.id,grade(primary.data.content,task.cases))}
}
const results=[...found].map(([id,scoring])=>({id,scoring}));await writeFile(output,JSON.stringify({method:'Regrade locally from matching synthetic prompts in durable event logs using corrected equality; content and identifiers omitted',results},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results));
