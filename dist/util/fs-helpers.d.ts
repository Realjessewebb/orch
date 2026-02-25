export declare function ensureDir(dirPath: string): void;
export declare function readJsonFile<T>(filePath: string): T | null;
export declare function writeJsonFile(filePath: string, data: unknown): void;
export declare function readTextFile(filePath: string): string | null;
export declare function writeTextFile(filePath: string, content: string): void;
export declare function fileExists(filePath: string): boolean;
