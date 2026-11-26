import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Cascade demonstration distinguishes the planned repair from observed phases', async () => {
  const data = JSON.parse(await read('experiments/data/fusion-runtime-study-2026-11-26.json'));
  const run = data.runs.find(r => r.group === 'high-continuation' && r.condition === 'same-prefix-changed-task').observation;
  assert.deepEqual(run.route.plan.map(p => [p.kind, p.conditional]), [['primary', false], ['judge', false], ['repair', true]]);
  assert.deepEqual(run.phases.map(p => [p.kind, p.model, p.status]), [['primary', 'gpt-6.1-sol', 'succeeded'], ['judge', 'gpt-6-luna', 'succeeded']]);
  assert.equal(run.phases[1].verdict, 'accept');
  assert.equal(run.completed.finalSourceModel, 'gpt-6.1-sol');
  const slides = await read('presentation/slides.md');
  assert.match(slides, /予定.*repair.*条件付き/s);
  assert.match(slides, /repair.*開始.*未観測/s);
  assert.match(slides, /別セッション/);
});

test('demonstration identifies Framekit red and green results', async () => {
  const slides = await read('presentation/slides.md');
  assert.match(slides, /Red.*opacity 0/s);
  assert.match(slides, /Green.*20ケース/s);
  assert.match(slides, /Framekit.*同一セッション/s);
  const notes = await read('experiments/fusion-demo-evidence.md');
  assert.match(notes, /開始.*完了/s);
  assert.match(notes, /同一セッション/);
});

test('Framekit red and resumed green cite their own recorded Fusion phases', async () => {
  const evidence = JSON.parse(await read('experiments/data/framekit-796-fusion-phases.json'));
  assert.deepEqual(evidence.turns.map(t => t.pattern), ['cascade', 'critique', 'critique']);
  assert.deepEqual(evidence.turns[0].phases.map(p => [p.kind, p.model, p.status]), [['primary', 'gpt-6.1-sol', 'succeeded'], ['judge', 'gpt-6-luna', 'succeeded']]);
  assert.deepEqual(evidence.turns[2].phases.map(p => [p.kind, p.model, p.status]), [['draft', 'claude-opus-5.5', 'succeeded'], ['critic', 'gpt-6-luna', 'succeeded'], ['revision', 'claude-opus-5.5', 'succeeded']]);
  assert.equal(evidence.turns[1].creditLimitObserved, true);
  assert.equal(evidence.turns[0].startsRecorded, false);
  const slides = await read('presentation/slides.md');
  assert.match(slides, /同一セッション/);
  assert.match(slides, /開始イベント.*記録.*ない/s);
});
