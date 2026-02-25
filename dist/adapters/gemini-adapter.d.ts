import { type AdapterOptions, type AdapterResult, type ModelAdapter } from './adapter-interface.js';
export declare class GeminiAdapter implements ModelAdapter {
    readonly name: "gemini";
    readonly binaryPath: string;
    private constructor();
    static create(): Promise<GeminiAdapter>;
    run(options: AdapterOptions): Promise<AdapterResult>;
}
