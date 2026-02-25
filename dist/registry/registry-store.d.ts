import type { TaskRecord } from './registry-types.js';
export declare function getTask(taskId: string): TaskRecord | null;
export declare function setTask(record: TaskRecord): void;
export declare function listTasks(): TaskRecord[];
export declare function deleteTask(taskId: string): boolean;
