import type { PolicyConfig } from '../config/config-types.js';
import type { PolicyViolation } from './policy-types.js';
export declare function checkSecrets(worktreePath: string, changedFiles: string[], policy: PolicyConfig): Promise<PolicyViolation[]>;
