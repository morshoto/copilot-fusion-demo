import test from 'node:test';
import assert from 'node:assert/strict';
import { extractIssueReferences, resolvePullRequestMilestone } from '../scripts/sync-pr-milestone.mjs';

test('extracts unique issue references and ignores malformed references', () => {
  assert.deepEqual(extractIssueReferences('Closes #1, #1 and #9; x#2'), [1, 9]);
});

test('updates to the earliest linked milestone and preserves existing milestone when none is linked', () => {
  assert.deepEqual(resolvePullRequestMilestone([{ milestone: { number: 5 } }, { milestone: { number: 2 } }], null), { action: 'update', milestone: { number: 2 } });
  assert.deepEqual(resolvePullRequestMilestone([{ milestone: null }], { number: 3 }), { action: 'skip', reason: 'no-linked-milestone' });
});
