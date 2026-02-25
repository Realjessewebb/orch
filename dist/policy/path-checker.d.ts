import type { PolicyViolation } from './policy-types.js';
import type { PolicyConfig } from '../config/config-types.js';
export declare function checkForbiddenPaths(changedFilePaths: string[], policy: PolicyConfig): PolicyViolation[];
export declare function checkAllowedPaths(changedFilePaths: string[], policy: PolicyConfig): PolicyViolation[];
