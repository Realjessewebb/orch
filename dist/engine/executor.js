import { join } from 'node:path';
import { loadAgentsMd } from '../context/context-loader.js';
import { buildExecutorPrompt } from '../context/prompt-builder.js';
export async function runExecutor(executionPlan, worktreePath, config, adapter, paths, attemptNumber) {
    const agentsMd = loadAgentsMd(config.orchestratorDir);
    const prompt = buildExecutorPrompt(executionPlan, agentsMd);
    const result = await adapter.run({
        prompt,
        worktreePath,
        logFilePath: join(paths.logsDir, `executor-${attemptNumber}.log`),
        timeoutMs: 300_000, // 5 min — agent may need time to implement
    });
    if (result.isRateLimit) {
        return { success: false, isRateLimit: true };
    }
    if (result.exitCode !== 0) {
        return {
            success: false,
            isRateLimit: false,
            error: `Executor exited ${result.exitCode}: ${(result.stdout + result.stderr).slice(0, 1000)}`,
        };
    }
    return { success: true, isRateLimit: false };
}
//# sourceMappingURL=executor.js.map