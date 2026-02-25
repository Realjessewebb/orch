import { type AdapterOptions, type AdapterResult, type ModelAdapter } from './adapter-interface.js';
export declare class ClaudeAdapter implements ModelAdapter {
    readonly name: "claude";
    readonly binaryPath: string;
    private constructor();
    static create(): Promise<ClaudeAdapter>;
    run(options: AdapterOptions): Promise<AdapterResult>;
}
