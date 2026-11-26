import {CopilotClient} from '@microsoft/copilot-sdk';
import {writeFile} from 'node:fs/promises';
import {confirmTopics,confirmPrompt} from './hypotheses-confirm-fixtures.js';
import {newObservation,observe} from './fusion-observation.js';
const out=process.argv[2];if(!out)throw Error('new output path required');let state=17654321;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32};
const pairs=confirmTopics.flatMap(([topic,description])=>[0,1].map(variant=>({topic,description,variant,order:rand()<.5?(['explain','design'] as const):(['design','explain'] as const)})));
for(let i=pairs.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[pairs[i],pairs[j]]=[pairs[j],pairs[i]]}
const createdAt=new Date().toISOString(),results:unknown[]=[];await writeFile(out,JSON.stringify({createdAt,seed:17654321,protocol:'experiments/fusion-hypotheses-confirm-protocol.md',results},null,2)+'\n',{flag:'wx'});
let save=Promise.resolve();const checkpoint=()=>save=save.then(()=>writeFile(out,JSON.stringify({createdAt,seed:17654321,protocol:'experiments/fusion-hypotheses-confirm-protocol.md',results},null,2)+'\n'));
const client=new CopilotClient({mode:'coding-agent',observability:{logLevel:'error'}});await client.start();try{if(!(await client.getAuthStatus()).isAuthenticated)throw Error('auth required');let next=0;
 async function work(){for(;;){let index=next++;if(index>=pairs.length)return;let pair=pairs[index];for(const mode of pair.order){let session;const startedAt=new Date().toISOString(),start=performance.now();let error:string|null=null;const observation=newObservation();
 try{session=await client.createSession({model:'fusion',github:{capi:{fusionTier:'high'}},events:{streaming:true},tools:{availableTools:[]},git:{enableHostGitOperations:false},permissions:{onRequest:()=>({kind:'denied-interactively-by-user'})}});session.on(e=>observe(observation,e));const result=await session.sendAndWait(confirmPrompt(pair.description,mode,pair.variant),180_000);if(!result?.data.content)error='empty'}catch(e){error=e instanceof Error?e.name:'unknown'}finally{await session?.disconnect().catch(()=>{})}
 const c=observation.completed;results.push({pairIndex:index,topic:pair.topic,variant:pair.variant,order:pair.order,mode,startedAt,elapsedMs:Math.round(performance.now()-start),error,promptChars:confirmPrompt(pair.description,mode,pair.variant).length,pattern:observation.pattern??null,primaryModel:observation.route?.primaryModel??null,scores:observation.route?.scores??null,routeSource:observation.route?.routeSource??null,reportedCredits:c?c.totalNanoAiu===undefined?null:c.totalNanoAiu/1e9:null});await checkpoint();console.log(`${index+1}/${pairs.length} ${pair.topic}-${pair.variant} ${mode} ${observation.pattern??'?'} ${error??''}`);
 }} }
 await Promise.all([work(),work(),work()]);await save;
}finally{await client.stop()}
