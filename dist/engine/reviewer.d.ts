import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';
import type { ModelName } from '../config/config-types.js';
export interface ReviewResult {
    modelName: ModelName;
    output: string;
    needsHuman: boolean;
    needsHumanReason: string | null;
    isRateLimit: boolean;
}
export interface ReviewerRunResult {
    allPassed: boolean;
    needsHuman: boolean;
    needsHumanReason: string | null;
    reviews: Record<string, string>;
    isRateLimit: boolean;
}
export declare function runReviewers(reviewerAdapters: Array<{
    name: ModelName;
    adapter: ModelAdapter;
}>, specPath: string, worktreePath: string, paths: ArtifactPaths, diffstat: string): Promise<ReviewerRunResult>;
