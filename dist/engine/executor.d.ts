import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ProjectConfig } from '../config/config-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';
export interface ExecutorResult {
    success: boolean;
    isRateLimit: boolean;
    error?: string;
}
export declare function runExecutor(executionPlan: string, worktreePath: string, config: ProjectConfig, adapter: ModelAdapter, paths: ArtifactPaths, attemptNumber: number): Promise<ExecutorResult>;
