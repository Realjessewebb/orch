import type { PolicyConfig } from '../config/config-types.js';
import type { PolicyResult, DiffStats } from './policy-types.js';
export interface PolicyRunResult extends PolicyResult {
    stats: DiffStats;
    diffStatOutput: string;
}
export declare function runPolicyChecks(worktreePath: string, policy: PolicyConfig): Promise<PolicyRunResult>;
