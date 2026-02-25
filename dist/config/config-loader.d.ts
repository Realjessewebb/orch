import type { GlobalConfig, ProjectConfig } from './config-types.js';
export declare class ConfigError extends Error {
    constructor(message: string);
}
export declare function loadGlobalConfig(): GlobalConfig;
export declare function loadProjectConfig(projectRoot: string): ProjectConfig;
