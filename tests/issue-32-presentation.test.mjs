import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const slides = readFileSync(new URL('../presentation/slides.md', import.meta.url), 'utf8')
  .split(/^---\s*$/m).slice(2);
const script = readFileSync(new URL('../presentation/script.md', import.meta.url), 'utf8');

test('the Issue criterion and PR evidence for the diagram are shown together', () => {
  const example = slides.find(slide => /Issue/.test(slide) && /PR/.test(slide) && /図/.test(slide));
  assert.ok(example, 'one slide must connect the diagram criterion with PR evidence');
  assert.match(example, /初期表示/, 'show the initial-display criterion');
  assert.match(example, /結果|検証|スクリーンショット/, 'show the evidence or its result');
});

test('the last slide invites the audience to try an issue with a criterion', () => {
  const last = slides.at(-1);
  assert.match(last, /Issue/);
  assert.match(last, /合格条件/);
  assert.match(last, /Fusion/);
});

test('the script covers the same example and audience action', () => {
  assert.ok(/Issue/.test(script) && /PR/.test(script) && /図/.test(script), 'explain the Issue and PR example');
  assert.match(script, /自分.{0,100}Issue.{0,100}合格条件.{0,100}Fusion/s);
});
