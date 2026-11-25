import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('CI validates the demo package and its workflow contract', () => {
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /node --test tests\/workflow-contract\.test\.mjs/);
  assert.match(ci, /working-directory: fusion-demo/);
  assert.match(ci, /pnpm (?:run )?test/);
  assert.match(ci, /pnpm (?:run )?typecheck/);
  assert.doesNotMatch(ci, /framekit|swift|consumer-runtime|scripts\/ci/i);
});

test('security checks scan TypeScript and validate the actual demo', () => {
  const codeql = read('.github/workflows/codeql.yml');
  const security = read('.github/workflows/security.yml');
  assert.match(codeql, /languages: javascript-typescript/);
  assert.doesNotMatch(codeql, /languages:\s*swift|typecheck-swift/i);
  assert.match(security, /working-directory: fusion-demo/);
  assert.match(security, /pnpm (?:run )?test/);
  assert.match(security, /pnpm (?:run )?typecheck/);
  assert.doesNotMatch(security, /consumer-runtime|profile_swift/);
});

test('assignment automation has a pinned package manager and milestone helper', () => {
  const assign = read('.github/workflows/assign.yml');
  assert.match(assign, /pnpm\/action-setup@[\da-f]+[^\n]*\n\s+with:\n\s+version:/);
  assert.ok(read('scripts/sync-pr-milestone.mjs').includes('syncPullRequestMilestone'));
});

test('label synchronization uses supported pnpm dlx options', () => {
  const assign = read('.github/workflows/assign.yml');
  assert.doesNotMatch(assign, /pnpm dlx --yes/);
  assert.match(assign, /pnpm dlx @azu\/github-label-setup/);
});
