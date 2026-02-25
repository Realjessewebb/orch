import type { TaskRecord } from '../registry/registry-types.js';
export interface ArtifactPaths {
    root: string;
    logsDir: string;
    failuresDir: string;
    reviewsDir: string;
    summaryFile: string;
    diffstatFile: string;
}
export declare function getArtifactPaths(record: TaskRecord): ArtifactPaths;
export declare function ensureArtifactDirs(paths: ArtifactPaths): void;
export declare function writeFailure(paths: ArtifactPaths, attemptNumber: number, content: string): void;
export declare function writeReview(paths: ArtifactPaths, modelName: string, content: string): void;
export declare function writeDiffstat(paths: ArtifactPaths, diffstat: string): void;
export declare function writeSummary(paths: ArtifactPaths, record: TaskRecord, reviewOutputs: Record<string, string>): void;
export declare function writeSummaryToContextDir(contextDir: string, taskId: string, summaryContent: string): void;
