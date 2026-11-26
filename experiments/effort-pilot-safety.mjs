import { realpathSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

export function readPermission(request, root) {
  if (request.kind !== 'read' || request.managedApprovalRequired || request.requestSandboxBypass) return { kind: 'reject' };
  try {
    const relativePath = relative(realpathSync(root), realpathSync(request.path));
    if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) return { kind: 'reject' };
    return { kind: 'approve-once' };
  } catch { return { kind: 'reject' }; }
}

export function reportedCredits(events) {
  const checkpoint = events.filter((event) => event.type === 'session.usage_checkpoint').at(-1);
  const snapshot = checkpoint?.data?.accountingSnapshot;
  if (snapshot?.aiCreditsStatus !== 'complete' || !Number.isFinite(snapshot.totalNanoAiu) || snapshot.totalNanoAiu < 0) return null;
  return snapshot.totalNanoAiu / 1e9;
}
