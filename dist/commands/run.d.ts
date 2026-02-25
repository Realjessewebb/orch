export interface RunOptions {
    repoPath?: string;
    useTmux?: boolean;
}
export declare function cmdRun(specPath: string, options?: RunOptions): Promise<void>;
