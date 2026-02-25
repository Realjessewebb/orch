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
export declare function runPlanner(specPath: string, worktreePath: string, config: ProjectConfig, adapter: ModelAdapter, paths: ArtifactPaths): Promise<PlanResult>;
