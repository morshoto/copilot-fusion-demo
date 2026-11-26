export const cacheFollowups=[
 {id:'inventory', sentence:(i:number)=>`Inventory item ${i}: reserve only available units; release a hold when its deadline expires; never decrement stock twice for a repeated request.`},
 {id:'shipping', sentence:(i:number)=>`Shipment route ${i}: keep the previous delivery state, retry transient carrier errors, and reconcile a delayed acknowledgement before marking it delivered.`},
 {id:'deployment', sentence:(i:number)=>`Service deployment ${i}: verify health after rollout, stop on a failed check, and restore the previous stable revision when rollback is requested.`},
] as const;
export const cacheFollowupPrefix=(topic:typeof cacheFollowups[number])=>Array.from({length:110},(_,i)=>topic.sentence(i+1)).join('\n');
export const cacheFollowupBase=(topic:typeof cacheFollowups[number])=>`${cacheFollowupPrefix(topic)}\nSummarize entries 1 and 110 in one short sentence.`;
export const cacheFollowupChanged=(topic:typeof cacheFollowups[number])=>`${cacheFollowupPrefix(topic)}\nDescribe two failure risks and a mitigation for each, in two short sentences.`;
