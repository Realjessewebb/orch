import { minimatch } from 'minimatch';
import type { PolicyViolation } from './policy-types.js';
import type { PolicyConfig } from '../config/config-types.js';

export function checkForbiddenPaths(
  changedFilePaths: string[],
  policy: PolicyConfig
): PolicyViolation[] {
  if (policy.forbidden_paths.length === 0) return [];

  const violations: PolicyViolation[] = [];

  for (const filePath of changedFilePaths) {
    for (const pattern of policy.forbidden_paths) {
      if (minimatch(filePath, pattern, { matchBase: true })) {
        violations.push({
          type: 'FORBIDDEN_PATH',
          detail: `File '${filePath}' matches forbidden pattern '${pattern}'`,
        });
        break; // one violation per file is enough
      }
    }
  }

  return violations;
}

export function checkAllowedPaths(
  changedFilePaths: string[],
  policy: PolicyConfig
): PolicyViolation[] {
  // If allowed_paths is empty, all paths are allowed
  if (policy.allowed_paths.length === 0) return [];

  const violations: PolicyViolation[] = [];

  for (const filePath of changedFilePaths) {
    const allowed = policy.allowed_paths.some((pattern) =>
      minimatch(filePath, pattern, { matchBase: true })
    );
    if (!allowed) {
      violations.push({
        type: 'FORBIDDEN_PATH',
        detail: `File '${filePath}' is not in the allowed_paths list`,
      });
    }
  }

  return violations;
}
