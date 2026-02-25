import type { TaskRecord } from './registry-types.js';
import type { ProjectConfig } from '../config/config-types.js';
export declare function createTaskRecord(specPath: string, config: ProjectConfig, worktreePath: string, branch: string): TaskRecord;
