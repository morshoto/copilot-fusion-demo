import {test} from 'node:test';
import assert from 'node:assert/strict';
import {grade} from './hypotheses-grader.js';
import {judgeTasks} from './hypotheses-fixtures.js';
const cases=judgeTasks[0].cases;
test('scores a correct and incorrect candidate against independently fixed cases',()=>{
 const yes=grade('```js\nfunction solve(config) { return config.timeout ?? 5000; }\n```',cases);
 const no=grade('```js\nfunction solve(config) { return config.timeout || 5000; }\n```',cases);
 assert.equal(yes.status,'scored');assert.equal(yes.passed,4);assert.equal(no.passed,3);
});
test('missing, malformed and infinite-loop code are unknown, never counted as incorrect answers',()=>{
 assert.equal(grade(undefined,cases).status,'missing');assert.equal(grade('no code',cases).status,'no_code_block');
 const x=grade('```js\nwhile (true) {}\n```',cases);assert.equal(x.status,'unrunnable');assert.equal(x.passed,null);
});


test('NaN and Infinity do not pass a test expecting null',()=>{
 const tests=judgeTasks[1].cases;const r=grade('```js\nfunction solve(n) { return n; }\n```',tests);
 assert.equal(r.status,'scored');assert.equal(r.caseResults?.at(-1),false);assert.equal(r.caseResults?.at(-2),false);
});
