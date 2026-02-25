import type { TaskRecord } from '../registry/registry-types.js';
import type { ProjectConfig } from '../config/config-types.js';
export declare function runTask(record: TaskRecord, config: ProjectConfig): Promise<TaskRecord>;
