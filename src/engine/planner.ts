import { join } from 'node:path';
import { readTextFile, writeTextFile } from '../util/fs-helpers.js';
import { loadOrchestratorContext } from '../context/context-loader.js';
import { buildPlannerPrompt } from '../context/prompt-builder.js';
import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ProjectConfig } from '../config/config-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';

export interface PlanResult {
  success: boolean;
  planContent: string;
  planFilePath: string;
  isRateLimit: boolean;
  error?: string;
}

export async function runPlanner(
  specPath: string,
  worktreePath: string,
  config: ProjectConfig,
  adapter: ModelAdapter,
  paths: ArtifactPaths
): Promise<PlanResult> {
  const specContent = readTextFile(specPath) ?? '';
  const context = loadOrchestratorContext(config.global);
  const prompt = buildPlannerPrompt(specContent, context);

  const result = await adapter.run({
    prompt,
    worktreePath,
    logFilePath: join(paths.logsDir, 'planner.log'),
    timeoutMs: 120_000,
  });

  if (result.isRateLimit) {
    return { success: false, planContent: '', planFilePath: '', isRateLimit: true };
  }

  if (result.exitCode !== 0) {
    return {
      success: false,
      planContent: '',
      planFilePath: '',
      isRateLimit: false,
      error: `Planner exited ${result.exitCode}: ${result.stderr.slice(0, 500)}`,
    };
  }

  // Write the plan to the worktree so it's inspectable
  const planFilePath = join(worktreePath, '.orch-plan.md');
  writeTextFile(planFilePath, result.stdout);

  return { success: true, planContent: result.stdout, planFilePath, isRateLimit: false };
}
