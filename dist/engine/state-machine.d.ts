import type { TaskStatus } from '../registry/registry-types.js';
import type { PolicyViolation } from '../policy/policy-types.js';
export type FSMSignal = {
    type: 'START';
} | {
    type: 'PLAN_DONE';
} | {
    type: 'EXEC_DONE';
} | {
    type: 'EXEC_ERROR';
    error: string;
} | {
    type: 'POLICY_PASS';
} | {
    type: 'POLICY_FAIL';
    violations: PolicyViolation[];
} | {
    type: 'VERIFY_PASS';
} | {
    type: 'VERIFY_FAIL';
    failureOutput: string;
} | {
    type: 'REPAIR_DONE';
} | {
    type: 'REVIEW_DONE';
} | {
    type: 'REVIEW_NEEDS_HUMAN';
    reason: string;
} | {
    type: 'RETRIES_EXHAUSTED';
} | {
    type: 'RATE_LIMIT_HIT';
};
export interface TransitionResult {
    nextState: TaskStatus;
    action: 'CONTINUE' | 'RETRY' | 'ESCALATE' | 'WAIT_RATE_LIMIT' | 'TERMINATE';
    reason: string;
}
export declare function transition(current: TaskStatus, signal: FSMSignal, retriesRemaining: number): TransitionResult;
