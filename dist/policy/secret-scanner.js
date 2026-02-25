import { exec } from '../util/exec.js';
import { readTextFile } from '../util/fs-helpers.js';
// Common secret patterns as a regex fallback when gitleaks isn't available
const SECRET_PATTERNS = [
    { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API key' },
    { pattern: /sk-ant-[a-zA-Z0-9\-_]{40,}/, name: 'Anthropic API key' },
    { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS access key ID' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub personal access token' },
    { pattern: /ghs_[a-zA-Z0-9]{36}/, name: 'GitHub app token' },
    { pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/, name: 'Private key' },
    { pattern: /xox[baprs]-[a-zA-Z0-9\-]+/, name: 'Slack token' },
    { pattern: /AIza[0-9A-Za-z\-_]{35}/, name: 'Google API key' },
];
async function gitleaksAvailable(gitleaksPath) {
    const candidates = [
        gitleaksPath,
        'gitleaks',
    ].filter(Boolean);
    for (const cmd of candidates) {
        const r = await exec('which', [cmd]);
        if (r.exitCode === 0)
            return r.stdout.trim() || cmd;
    }
    return null;
}
async function scanWithGitleaks(worktreePath, gitleaksPath) {
    const result = await exec(gitleaksPath, ['detect', '--source', worktreePath, '--no-git', '--exit-code', '1'], {
        cwd: worktreePath,
        timeoutMs: 30_000,
    });
    if (result.exitCode === 0)
        return [];
    return [{
            type: 'SECRET_DETECTED',
            detail: `gitleaks found potential secrets in worktree. Run 'gitleaks detect' for details.`,
        }];
}
async function scanWithRegex(worktreePath, changedFiles) {
    const violations = [];
    for (const filePath of changedFiles) {
        // Only scan text-like files
        if (/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|otf|eot|mp4|mp3|pdf|zip|tar|gz)$/.test(filePath)) {
            continue;
        }
        const content = readTextFile(`${worktreePath}/${filePath}`);
        if (!content)
            continue;
        for (const { pattern, name } of SECRET_PATTERNS) {
            if (pattern.test(content)) {
                violations.push({
                    type: 'SECRET_DETECTED',
                    detail: `Possible ${name} found in ${filePath}`,
                });
                break; // one violation per file
            }
        }
    }
    return violations;
}
export async function checkSecrets(worktreePath, changedFiles, policy) {
    if (!policy.secret_scan_enabled)
        return [];
    const gitleaksPath = await gitleaksAvailable(policy.gitleaks_path);
    if (gitleaksPath) {
        return scanWithGitleaks(worktreePath, gitleaksPath);
    }
    // Regex fallback
    return scanWithRegex(worktreePath, changedFiles);
}
//# sourceMappingURL=secret-scanner.js.map