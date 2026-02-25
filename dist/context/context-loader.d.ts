import type { GlobalConfig } from '../config/config-types.js';
export interface OrchestratorContext {
    memory: string;
    business: string;
    skills: Record<string, string>;
    notes: string;
}
export declare function loadOrchestratorContext(global: GlobalConfig): OrchestratorContext;
export declare function loadAgentsMd(orchestratorDir: string): string;
