import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ProjectConfig } from '../config/config-types.js';
import type { PolicyViolation } from '../policy/policy-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';
export interface RepairResult {
    success: boolean;
    isRateLimit: boolean;
    error?: string;
}
export declare function runRepairer(executionPlan: string, failureOutput: string, violations: PolicyViolation[], worktreePath: string, config: ProjectConfig, adapter: ModelAdapter, paths: ArtifactPaths, attemptNumber: number, retriesRemaining: number): Promise<RepairResult>;
