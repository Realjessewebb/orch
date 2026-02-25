import { readJsonFile, writeJsonFile } from '../util/fs-helpers.js';
import { REGISTRY_PATH } from '../config/config-defaults.js';
function load() {
    const data = readJsonFile(REGISTRY_PATH);
    if (!data)
        return { version: 1, tasks: {} };
    return data;
}
function save(index) {
    writeJsonFile(REGISTRY_PATH, index);
}
export function getTask(taskId) {
    return load().tasks[taskId] ?? null;
}
export function setTask(record) {
    const index = load();
    index.tasks[record.task_id] = { ...record, updated_at: new Date().toISOString() };
    save(index);
}
export function listTasks() {
    const index = load();
    return Object.values(index.tasks).sort((a, b) => a.created_at.localeCompare(b.created_at));
}
export function deleteTask(taskId) {
    const index = load();
    if (!index.tasks[taskId])
        return false;
    delete index.tasks[taskId];
    save(index);
    return true;
}
//# sourceMappingURL=registry-store.js.map