import { readJsonFile, writeJsonFile } from '../util/fs-helpers.js';
import { REGISTRY_PATH } from '../config/config-defaults.js';
import type { TaskRecord, RegistryIndex } from './registry-types.js';

function load(): RegistryIndex {
  const data = readJsonFile<RegistryIndex>(REGISTRY_PATH);
  if (!data) return { version: 1, tasks: {} };
  return data;
}

function save(index: RegistryIndex): void {
  writeJsonFile(REGISTRY_PATH, index);
}

export function getTask(taskId: string): TaskRecord | null {
  return load().tasks[taskId] ?? null;
}

export function setTask(record: TaskRecord): void {
  const index = load();
  index.tasks[record.task_id] = { ...record, updated_at: new Date().toISOString() };
  save(index);
}

export function listTasks(): TaskRecord[] {
  const index = load();
  return Object.values(index.tasks).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}

export function deleteTask(taskId: string): boolean {
  const index = load();
  if (!index.tasks[taskId]) return false;
  delete index.tasks[taskId];
  save(index);
  return true;
}
