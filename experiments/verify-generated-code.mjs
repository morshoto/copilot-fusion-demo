import {readFile,writeFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const data=JSON.parse(await readFile(new URL('./data/prompt-study-2026-11-26.json',import.meta.url),'utf8'));
const expectedCode='function timeoutMs(config) {\n  return config.timeout ?? 5000;\n}';
const tests=[{name:'timeout: 0',input:{timeout:0},expected:0},{name:'timeout: undefined',input:{timeout:undefined},expected:5000},{name:'timeout: null',input:{timeout:null},expected:5000},{name:'timeout: 2500',input:{timeout:2500},expected:2500}];
if(data.runs.length!==20) throw Error('Expected 20 complete trials');
for(const run of data.runs){
  const code=run.answer.match(/```(?:javascript|js|typescript|ts)?\s*\n([\s\S]*?)```/i)?.[1].trim();
  // Run only the exact previously inspected, expected function. Reject all other model output.
  assert.equal(code,expectedCode,`unexpected generated code: ${run.condition} ${run.index}`);
  const fn=runInNewContext(`${code}\ntimeoutMs`,Object.create(null),{timeout:100});
  for(const t of tests)assert.equal(fn(t.input),t.expected,`${run.condition} ${run.index}: ${t.name}`);
}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const original=data.task.match(/function timeoutMs\(config\) \{[^\n]+\}/)?.[0];
assert.ok(original);
const before=escape(original).replace('||','<mark class="bad">||</mark>');
const after=escape(expectedCode).replace('??','<mark class="good">??</mark>');
const rows=tests.map(t=>`<tr><td>${escape(t.name)}</td><td>${t.expected}</td><td class="pass">PASS</td></tr>`).join('');
const html=`<!doctype html><html lang="ja"><meta charset="UTF-8"><style>*{box-sizing:border-box}body{margin:0;background:white;color:#191919;font:24px -apple-system,'Hiragino Sans',sans-serif;padding:30px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:26px}h2{font-size:27px;margin:0 0 12px}.code{background:#20242d;color:#eef1f6;padding:23px;border-radius:5px;min-height:145px;font:24px/1.8 Menlo,monospace;white-space:pre-wrap}mark{padding:3px 5px;border-radius:4px;font-weight:bold}.bad{background:#d73a49;color:white}.good{background:#3aa86c;color:white}table{width:100%;border-collapse:collapse;margin-top:25px;font-size:22px}td,th{padding:11px 16px;border-bottom:1px solid #ddd;text-align:left}th{background:#f1f1f1}.pass{color:#178442;font-weight:bold}.note{margin-top:18px;color:#555;font-size:17px}</style><div class="cols"><div><h2>入力：0も既定値に変わる</h2><div class="code">${before}</div></div><div><h2>実際の生成コード</h2><div class="code">${after}</div></div></div><table><tr><th>入力</th><th>期待値</th><th>検証</th></tr>${rows}</table><div class="note">全20回答は同一の修正コード。各回答 × 4ケース = 80件を実行。CLIの内部思考の検証ではない。</div></html>`;
await writeFile('/tmp/fusion-generated-code-evidence.html',html);
console.log(JSON.stringify({runs:data.runs.length,checks:data.runs.length*tests.length,passed:true,code:expectedCode}));
