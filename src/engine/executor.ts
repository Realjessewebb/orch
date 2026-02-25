import { join } from 'node:path';
import { loadAgentsMd } from '../context/context-loader.js';
import { buildExecutorPrompt } from '../context/prompt-builder.js';
import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ProjectConfig } from '../config/config-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';

export interface ExecutorResult {
  success: boolean;
  isRateLimit: boolean;
  error?: string;
}

export async function runExecutor(
  executionPlan: string,
  worktreePath: string,
  config: ProjectConfig,
  adapter: ModelAdapter,
  paths: ArtifactPaths,
  attemptNumber: number
): Promise<ExecutorResult> {
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
