import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function summarize(runs) {
  const groups = new Map();
  for (const run of runs) {
    const group = groups.get(run.condition) ?? { condition: run.condition, runs: 0, startedRuns: 0, completedRuns: 0, startedEvents: 0, completedEvents: 0, patterns: {}, models: 'not recorded' };
    group.runs++;
    group.startedRuns += Number(run.subagentStarted > 0);
    group.completedRuns += Number(run.subagentCompleted > 0);
    group.startedEvents += run.subagentStarted;
    group.completedEvents += run.subagentCompleted;
    const pattern = run.pattern ?? 'not recorded';
    group.patterns[pattern] = (group.patterns[pattern] ?? 0) + 1;
    groups.set(run.condition, group);
  }
  return [...groups.values()].sort((a, b) => a.condition.localeCompare(b.condition));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const path of process.argv.slice(2)) {
    const data = JSON.parse(await readFile(path, 'utf8'));
    console.log(path, JSON.stringify(summarize(data.runs), null, 2));
  }
}
