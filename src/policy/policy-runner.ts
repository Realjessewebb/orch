import { getDiffStat, getChangedFiles } from '../worktree/worktree-manager.js';
import { parseDiffStat, checkDiffLimits } from './diff-checker.js';
import { checkForbiddenPaths, checkAllowedPaths } from './path-checker.js';
import { checkSecrets } from './secret-scanner.js';
import type { PolicyConfig } from '../config/config-types.js';
import type { PolicyResult, DiffStats } from './policy-types.js';

export interface PolicyRunResult extends PolicyResult {
  stats: DiffStats;
  diffStatOutput: string;
}

export async function runPolicyChecks(
  worktreePath: string,
  policy: PolicyConfig
): Promise<PolicyRunResult> {
  const [diffStatOutput, changedFilePaths] = await Promise.all([
    getDiffStat(worktreePath),
    getChangedFiles(worktreePath),
  ]);

  const stats = parseDiffStat(diffStatOutput, changedFilePaths);

  // Run sync checks first (fast), then async secret scan
  const syncViolations = [
    ...checkDiffLimits(stats, policy),
    ...checkForbiddenPaths(changedFilePaths, policy),
    ...checkAllowedPaths(changedFilePaths, policy),
  ];

  const secretViolations = await checkSecrets(worktreePath, changedFilePaths, policy);

  const violations = [...syncViolations, ...secretViolations];

  return {
    passed: violations.length === 0,
    violations,
    stats,
    diffStatOutput,
  };
}
