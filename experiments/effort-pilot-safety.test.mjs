import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPermission, reportedCredits } from './effort-pilot-safety.mjs';

test('only permits scoped reads within the trial directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'pilot-test-'));
  try {
    mkdirSync(join(root, 'inside'));
    symlinkSync(tmpdir(), join(root, 'escape'));
    symlinkSync(join(tmpdir(), 'nonexistent-pilot-target'), join(root, 'dangling'));
    assert.deepEqual(readPermission({ kind: 'read', path: join(root, 'inside') }, root), { kind: 'approve-once' });
    assert.deepEqual(readPermission({ kind: 'read', path: join(root, 'inside', 'missing') }, root), { kind: 'approve-once' });
    for (const request of [{ kind: 'write', path: root }, { kind: 'read', path: join(root, 'dangling') }, { kind: 'read', path: join(root, 'escape') }, { kind: 'read', path: root, managedApprovalRequired: true }, { kind: 'read', path: join(root, 'escape', 'missing') }]) {
      assert.deepEqual(readPermission(request, root), { kind: 'reject' });
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('accepts only complete session accounting, including zero', () => {
  assert.equal(reportedCredits([{ type: 'session.usage_checkpoint', data: { accountingSnapshot: { totalNanoAiu: 47780950, aiCreditsStatus: 'complete' } } }]), 0.04778095);
  assert.equal(reportedCredits([{ type: 'session.usage_checkpoint', data: { accountingSnapshot: { totalNanoAiu: 0, aiCreditsStatus: 'complete' } } }]), 0);
  assert.equal(reportedCredits([{ type: 'session.usage_checkpoint', data: { accountingSnapshot: { totalNanoAiu: 5, aiCreditsStatus: 'incomplete' } } }]), null);
  assert.equal(reportedCredits([]), null);
});
