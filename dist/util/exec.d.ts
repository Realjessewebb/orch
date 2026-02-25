export interface ExecResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}
export interface ExecOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
    stream?: boolean;
}
export declare class ExecTimeoutError extends Error {
    constructor(cmd: string, timeoutMs: number);
}
export declare function exec(command: string, args: string[], options?: ExecOptions): Promise<ExecResult>;
export declare function shell(cmd: string, options?: ExecOptions): Promise<ExecResult>;
