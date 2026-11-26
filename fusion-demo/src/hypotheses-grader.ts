import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {Case} from './hypotheses-fixtures.js';
const worker=`const vm=require('node:vm'),fs=require('node:fs');const p=JSON.parse(fs.readFileSync(0,'utf8'));const c=vm.createContext(Object.create(null));try{vm.runInContext(p.code+'\\n;globalThis.__solve = typeof solve === "function" ? solve : undefined;',c,{timeout:300});if(typeof c.__solve!=='function')throw Error('no function');const eq=(a,b)=>Array.isArray(b)?Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>eq(v,b[i])):Object.is(a,b);let results=[];for(const t of p.cases){c.__args=t.args.map(x=>x==='__NaN__'?NaN:x==='__Infinity__'?Infinity:x);try{let value=vm.runInContext('__solve(...__args)',c,{timeout:200});results.push(eq(value,t.expected));}catch{results.push(false)}}process.stdout.write(JSON.stringify({status:'scored',results}));}catch{process.stdout.write(JSON.stringify({status:'unrunnable'}))}`;
export function grade(content:string|undefined,cases:Case[]){
 if(!content)return {status:'missing',passed:null,total:cases.length};const match=content.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/i);if(!match)return {status:'no_code_block',passed:null,total:cases.length};
 const profile='(version 1)(allow default)(deny network*)(deny file-write*)(deny process-fork)(deny file-read-data (subpath "/Users"))';
 const dir=mkdtempSync(join(tmpdir(),'fusion-grader-'));
 let result: {stdout: string; error?: Error};
 try {
  const node=join(dir,'node'); copyFileSync(process.execPath,node);
  result=spawnSync('/usr/bin/sandbox-exec',['-p',profile,node,'-e',worker],{cwd:'/tmp',input:JSON.stringify({code:match[1],cases}),encoding:'utf8',timeout:4000,maxBuffer:65536,env:{PATH:'/usr/bin:/bin',HOME:'/nonexistent'}});
 } finally { rmSync(dir,{recursive:true,force:true}); }
 try{const x=JSON.parse(result.stdout);return x.status==='scored'?{status:'scored',passed:x.results.filter(Boolean).length,total:cases.length,caseResults:x.results}: {status:'unrunnable',passed:null,total:cases.length}}catch{return {status:result.error?'sandbox_error':'unrunnable',passed:null,total:cases.length}}
}
