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

test('demonstration separates Framekit red and green from model-level observations', async () => {
  const slides = await read('presentation/slides.md');
  assert.match(slides, /Red.*opacity 0/s);
  assert.match(slides, /Green.*20ケース/s);
  assert.match(slides, /Framekit.*モデル.*フェーズ.*不明/s);
  const notes = await read('experiments/fusion-demo-evidence.md');
  assert.match(notes, /開始.*完了/s);
  assert.match(notes, /別セッション/);
});
