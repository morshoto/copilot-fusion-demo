import {readFileSync} from 'node:fs';
export function analyze(data){
 const valid=data.results.filter(x=>!x.error&&['single','cascade','critique'].includes(x.pattern));
 const ids=[...new Set(data.results.map(x=>x.topic))].sort();let clusters=[],missing=[];
 for(const topic of ids){let diffs=[];for(const variant of [0,1]){let r=valid.filter(x=>x.topic===topic&&x.variant===variant);let a=r.find(x=>x.mode==='explain'),b=r.find(x=>x.mode==='design');if(a&&b)diffs.push(Number(b.pattern!=='single')-Number(a.pattern!=='single'));else missing.push(`${topic}-${variant}`)}if(diffs.length)clusters.push({topic,completePairs:diffs.length,diffs,mean:diffs.reduce((a,b)=>a+b,0)/diffs.length})}
 const vals=clusters.map(x=>x.mean),n=vals.length,observed=n?vals.reduce((a,b)=>a+b,0)/n:null;let extreme=0,total=2**n;
 if(n>20)throw Error('too many clusters for exact enumeration');if(n){for(let mask=0;mask<total;mask++){let sum=vals.reduce((a,v,i)=>a+((mask>>i)&1?1:-1)*v,0)/n;if(Math.abs(sum)+1e-12>=Math.abs(observed))extreme++}}
 let state=17654321;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32};let ci=null;
 if(n>1&&!vals.every(x=>x===vals[0])){let samples=[];for(let i=0;i<10000;i++){let sum=0;for(let j=0;j<n;j++)sum+=vals[Math.floor(random()*n)];samples.push(sum/n)}samples.sort((a,b)=>a-b);ci=[samples[249],samples[9749]]}
 const counts={};for(const mode of ['explain','design']){const r=valid.filter(x=>x.mode===mode);counts[mode]={n:r.length,multi:r.filter(x=>x.pattern!=='single').length,patterns:Object.fromEntries(['single','cascade','critique'].map(p=>[p,r.filter(x=>x.pattern===p).length]))}}
 return {protocol:data.protocol,records:data.results.length,valid:valid.length,missing,clusters,counts,meanDifference:observed,pExact:n?extreme/total:null,ci95:ci,ciMethod:'subject-cluster bootstrap percentile; null when all cluster differences identical',reportedCredits:valid.reduce((a,x)=>a+(x.reportedCredits??0),0)};
}
if(process.argv[1]?.endsWith('analyze-fusion-confirm.mjs')&&process.argv[2])console.log(JSON.stringify(analyze(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));
