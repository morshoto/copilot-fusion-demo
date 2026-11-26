export const topics=[
 {id:'timeout', description:'JavaScript のタイムアウト設定。0 は有効な値で、null と undefined だけは既定の 5000 にする。'},
 {id:'clamp', description:'JavaScript の上限設定。負数は 0、100 を超える値は 100 に丸め、0〜100 はそのまま返す。'},
] as const;
export const modes=['explain','implement','debug','design'] as const;
export const words={
 explain:['仕様の考え方を短く説明し、境界値の意義を述べてください。','仕様を簡潔に解説し、境界の値が重要な理由を書いてください。'],
 implement:['仕様どおりの関数を実装し、境界値の扱いを示してください。','要件に合う関数を書き、境界の値をどう扱うか示してください。'],
 debug:['誤実装が起こす不具合を特定し、修正する方法を示してください。','不正な実装によるバグを見つけ、直し方を説明してください。'],
 design:['並行利用や障害を考慮した設計と、検証方法を提案してください。','複数利用者と故障を考えた設計、および検証手順を提案してください。'],
} as const;
export const routePrompt=(topic:typeof topics[number],mode:typeof modes[number],paraphrase:number)=>`次の課題を読み、指定された処理を行ってください。\n題材: ${topic.description}\n依頼: ${words[mode][paraphrase]}\n回答は日本語で120文字程度。外部ツールは使わないでください。`;
export type Case={name:string;args:unknown[];expected:unknown};
export const judgeTasks:{id:string; prompt:string; cases:Case[]}[]=[
 {id:'timeout',prompt:'JavaScriptで function solve(config) を実装してください。config.timeout が null または undefined なら5000を返し、それ以外は0を含めそのまま返す。コードを ```javascript のコードブロック1つに入れる。説明は短く。',cases:[{name:'normal',args:[{timeout:180}],expected:180},{name:'zero',args:[{timeout:0}],expected:0},{name:'missing',args:[{}],expected:5000},{name:'null',args:[{timeout:null}],expected:5000}]},
 {id:'clamp',prompt:'JavaScriptで function solve(n) を実装してください。有限の数 n を 0以上100以下に丸めて返し、NaN と Infinity と -Infinity は null を返す。コードを ```javascript のコードブロック1つに入れる。説明は短く。',cases:[{name:'normal',args:[12],expected:12},{name:'low',args:[-5],expected:0},{name:'zero',args:[0],expected:0},{name:'high',args:[101],expected:100},{name:'nan',args:['__NaN__'],expected:null},{name:'infinity',args:['__Infinity__'],expected:null}]},
 {id:'retry',prompt:'JavaScriptで function solve(attempt, cap) を実装してください。attempt が0以上の整数で cap が正の整数なら min(100 * 2 ** attempt, cap) を返す。そうでなければ null を返す。コードを ```javascript のコードブロック1つに入れる。説明は短く。',cases:[{name:'normal',args:[2,1000],expected:400},{name:'zero',args:[0,1000],expected:100},{name:'capped',args:[9,300],expected:300},{name:'negative',args:[-1,500],expected:null},{name:'fraction',args:[1.5,500],expected:null},{name:'badcap',args:[2,0],expected:null}]},
];
export const cachePrefix=(id:string)=>Array.from({length:120},(_,i)=>`Synthetic record ${id}-${i+1}: a worker records each delivery before acknowledging; retries use stable request keys and failures retain their prior state.`).join('\n');
export const cacheBase=(id:string)=>`${cachePrefix(id)}\nSummarize records 1 and 120 in one sentence.`;
export const cacheChanged=(id:string)=>`${cachePrefix(id)}\nList two failure risks and one mitigation for each in two sentences.`;
