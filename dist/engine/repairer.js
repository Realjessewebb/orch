import { join } from 'node:path';
import { loadAgentsMd } from '../context/context-loader.js';
import { buildRepairPrompt } from '../context/prompt-builder.js';
import { getChangedFiles } from '../worktree/worktree-manager.js';
export async function runRepairer(executionPlan, failureOutput, violations, worktreePath, config, adapter, paths, attemptNumber, retriesRemaining) {
    const agentsMd = loadAgentsMd(config.orchestratorDir);
    // On repair, restrict scope to only files already touched (tighter budget each retry)
    const alreadyTouched = await getChangedFiles(worktreePath);
    const prompt = buildRepairPrompt(executionPlan, agentsMd, failureOutput, violations, retriesRemaining, alreadyTouched.length > 0 ? alreadyTouched : null);
    const result = await adapter.run({
        prompt,
        worktreePath,
        logFilePath: join(paths.logsDir, `repair-${attemptNumber}.log`),
        timeoutMs: 300_000,
    });
    if (result.isRateLimit) {
        return { success: false, isRateLimit: true };
    }
    if (result.exitCode !== 0) {
        return {
            success: false,
            isRateLimit: false,
            error: `Repair agent exited ${result.exitCode}: ${(result.stdout + result.stderr).slice(0, 500)}`,
        };
    }
    return { success: true, isRateLimit: false };
}
//# sourceMappingURL=repairer.js.map