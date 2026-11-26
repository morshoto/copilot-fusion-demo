import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { summarize } from './subagent-evidence.mjs';

test('summarizes runs and preserves missing model evidence', () => {
  const result = summarize([
    { condition: 'fleet', pattern: 'single', subagentStarted: 2, subagentCompleted: 2 },
    { condition: 'fleet', pattern: 'single', subagentStarted: 0, subagentCompleted: 0 },
    { condition: 'delegate', pattern: 'critique', subagentStarted: 1, subagentCompleted: 0 },
  ]);
  assert.deepEqual(result, [
    { condition: 'delegate', runs: 1, startedRuns: 1, completedRuns: 0, startedEvents: 1, completedEvents: 0, patterns: { critique: 1 }, models: 'not recorded' },
    { condition: 'fleet', runs: 2, startedRuns: 1, completedRuns: 1, startedEvents: 2, completedEvents: 2, patterns: { single: 2 }, models: 'not recorded' },
  ]);
});
