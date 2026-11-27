import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, sep } from 'node:path';

export function readPermission(request, root) {
  if (request.kind !== 'read' || request.managedApprovalRequired || request.requestSandboxBypass) return { kind: 'reject' };
  try {
    if (!isAbsolute(request.path) || request.path.split(sep).includes('..')) return { kind: 'reject' };
    let ancestor = request.path;
    while (true) {
      try { ancestor = realpathSync(ancestor); break; } catch (error) {
        if (error.code !== 'ENOENT' || dirname(ancestor) === ancestor) return { kind: 'reject' };
        ancestor = dirname(ancestor);
      }
    }
    const relativePath = relative(realpathSync(root), ancestor);
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
