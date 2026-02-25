import { type AdapterOptions, type AdapterResult, type ModelAdapter } from './adapter-interface.js';
export declare class CodexAdapter implements ModelAdapter {
    readonly name: "codex";
    readonly binaryPath: string;
    private constructor();
    static create(): Promise<CodexAdapter>;
    run(options: AdapterOptions): Promise<AdapterResult>;
}
