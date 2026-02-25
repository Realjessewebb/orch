import type { DiffStats, PolicyViolation } from './policy-types.js';
import type { PolicyConfig } from '../config/config-types.js';

// Parses `git diff --stat HEAD` output into structured numbers
export function parseDiffStat(
  diffStatOutput: string,
  changedFilePaths: string[]
): DiffStats {
  // Summary line format: "X files changed, Y insertions(+), Z deletions(-)"
  const lines = diffStatOutput.split('\n');
  const summary = lines.slice().reverse().find((l: string) => l.includes('changed'));
  let insertions = 0;
  let deletions = 0;

  if (summary) {
    const insMatch = summary.match(/(\d+) insertion/);
    const delMatch = summary.match(/(\d+) deletion/);
    insertions = insMatch ? parseInt(insMatch[1] ?? '0') : 0;
    deletions = delMatch ? parseInt(delMatch[1] ?? '0') : 0;
  }

  return {
    changedFiles: changedFilePaths.length,
    insertions,
    deletions,
    netLoc: insertions + deletions,
    changedFilePaths,
  };
}

export function checkDiffLimits(
  stats: DiffStats,
  policy: PolicyConfig
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  if (stats.changedFiles > policy.max_changed_files) {
    violations.push({
      type: 'TOO_MANY_FILES',
      detail: `${stats.changedFiles} files changed, limit is ${policy.max_changed_files}`,
    });
  }

  if (stats.netLoc > policy.max_net_loc) {
    violations.push({
      type: 'TOO_MANY_LOC',
      detail: `${stats.netLoc} net LOC changed (${stats.insertions}+/${stats.deletions}-), limit is ${policy.max_net_loc}`,
    });
  }

  return violations;
}
