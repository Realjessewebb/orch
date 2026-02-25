import type { OrchestratorContext } from './context-loader.js';
import type { PolicyViolation } from '../policy/policy-types.js';
export declare function buildPlannerPrompt(specContent: string, context: OrchestratorContext, skillName?: string): string;
export declare function buildExecutorPrompt(executionPlan: string, agentsMd: string): string;
export declare function buildRepairPrompt(executionPlan: string, agentsMd: string, failureOutput: string, violations: PolicyViolation[], retriesRemaining: number, allowedFiles: string[] | null): string;
export declare function buildReviewerPrompt(diffstat: string, diffContent: string, originalSpec: string, modelRole: 'codex' | 'gemini' | 'claude'): string;
