import type { DiffStats, PolicyViolation } from './policy-types.js';
import type { PolicyConfig } from '../config/config-types.js';
export declare function parseDiffStat(diffStatOutput: string, changedFilePaths: string[]): DiffStats;
export declare function checkDiffLimits(stats: DiffStats, policy: PolicyConfig): PolicyViolation[];
