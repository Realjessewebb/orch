import type { ModelName } from '../config/config-types.js';
export interface AdapterOptions {
    prompt: string;
    worktreePath: string;
    logFilePath: string;
    timeoutMs?: number;
    env?: Record<string, string>;
}
export interface AdapterResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
    logFilePath: string;
    isRateLimit: boolean;
}
export interface ModelAdapter {
    readonly name: ModelName;
    readonly binaryPath: string;
    run(options: AdapterOptions): Promise<AdapterResult>;
}
export declare class AdapterNotFoundError extends Error {
    constructor(name: ModelName);
}
export declare const RATE_LIMIT_PATTERNS: RegExp[];
export declare function detectRateLimit(stdout: string, stderr: string): boolean;
