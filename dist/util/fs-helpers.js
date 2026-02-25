import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
export function ensureDir(dirPath) {
    mkdirSync(dirPath, { recursive: true });
}
export function readJsonFile(filePath) {
    if (!existsSync(filePath))
        return null;
    try {
        return JSON.parse(readFileSync(filePath, 'utf8'));
    }
    catch {
        return null;
    }
}
// Atomic write: write to .tmp then rename so a killed process never corrupts the file
export function writeJsonFile(filePath, data) {
    ensureDir(dirname(filePath));
    const tmp = `${filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    renameSync(tmp, filePath);
}
export function readTextFile(filePath) {
    if (!existsSync(filePath))
        return null;
    return readFileSync(filePath, 'utf8');
}
export function writeTextFile(filePath, content) {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, 'utf8');
}
export function fileExists(filePath) {
    return existsSync(filePath);
}
//# sourceMappingURL=fs-helpers.js.map