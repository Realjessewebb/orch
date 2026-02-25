import type { CommandsConfig } from '../config/config-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';
export interface VerificationStep {
    name: string;
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}
export interface VerificationResult {
    passed: boolean;
    steps: VerificationStep[];
    failureOutput: string;
}
export declare function runVerification(worktreePath: string, commands: CommandsConfig, paths: ArtifactPaths, attemptNumber: number): Promise<VerificationResult>;
