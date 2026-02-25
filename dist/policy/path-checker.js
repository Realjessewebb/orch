import { minimatch } from 'minimatch';
export function checkForbiddenPaths(changedFilePaths, policy) {
    if (policy.forbidden_paths.length === 0)
        return [];
    const violations = [];
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
export function checkAllowedPaths(changedFilePaths, policy) {
    // If allowed_paths is empty, all paths are allowed
    if (policy.allowed_paths.length === 0)
        return [];
    const violations = [];
    for (const filePath of changedFilePaths) {
        const allowed = policy.allowed_paths.some((pattern) => minimatch(filePath, pattern, { matchBase: true }));
        if (!allowed) {
            violations.push({
                type: 'FORBIDDEN_PATH',
                detail: `File '${filePath}' is not in the allowed_paths list`,
            });
        }
    }
    return violations;
}
//# sourceMappingURL=path-checker.js.map