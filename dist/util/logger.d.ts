export declare class Logger {
    private readonly logFilePath;
    private readonly prefix;
    constructor(logFilePath?: string | null, prefix?: string);
    private write;
    debug(msg: string, data?: unknown): void;
    info(msg: string, data?: unknown): void;
    warn(msg: string, data?: unknown): void;
    error(msg: string, data?: unknown): void;
}
export declare const log: Logger;
