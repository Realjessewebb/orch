// The entire FSM transition table in one place.
// PURE — no I/O, no side effects. Always returns a result (never throws).
export function transition(current, signal, retriesRemaining) {
    // Rate limit can fire from any state
    if (signal.type === 'RATE_LIMIT_HIT') {
        return {
            nextState: 'RATE_LIMITED',
            action: 'WAIT_RATE_LIMIT',
            reason: 'Model reported rate/usage limit — will resume after backoff',
        };
    }
    switch (current) {
        case 'PENDING':
            if (signal.type === 'START') {
                return { nextState: 'PLANNING', action: 'CONTINUE', reason: 'Task started' };
            }
            break;
        case 'PLANNING':
            if (signal.type === 'PLAN_DONE') {
                return { nextState: 'EXECUTING', action: 'CONTINUE', reason: 'Plan produced' };
            }
            if (signal.type === 'EXEC_ERROR') {
                return { nextState: 'FAILED', action: 'TERMINATE', reason: `Planning failed: ${signal.error}` };
            }
            break;
        case 'EXECUTING':
            if (signal.type === 'EXEC_DONE') {
                return { nextState: 'VERIFYING', action: 'CONTINUE', reason: 'Execution complete' };
            }
            if (signal.type === 'EXEC_ERROR') {
                if (retriesRemaining > 0) {
                    return { nextState: 'REPAIRING', action: 'RETRY', reason: `Execution error: ${signal.error}` };
                }
                return { nextState: 'NEEDS_HUMAN', action: 'ESCALATE', reason: `Execution error, retries exhausted: ${signal.error}` };
            }
            break;
        case 'VERIFYING':
            if (signal.type === 'VERIFY_PASS') {
                return { nextState: 'REVIEWING', action: 'CONTINUE', reason: 'All verification gates passed' };
            }
            if (signal.type === 'POLICY_FAIL') {
                const detail = signal.violations.map((v) => v.detail).join('; ');
                if (retriesRemaining > 0) {
                    return { nextState: 'REPAIRING', action: 'RETRY', reason: `Policy violation: ${detail}` };
                }
                return { nextState: 'NEEDS_HUMAN', action: 'ESCALATE', reason: `Policy violation, retries exhausted: ${detail}` };
            }
            if (signal.type === 'VERIFY_FAIL') {
                if (retriesRemaining > 0) {
                    return { nextState: 'REPAIRING', action: 'RETRY', reason: `Verification failed: ${signal.failureOutput.slice(0, 200)}` };
                }
                return { nextState: 'NEEDS_HUMAN', action: 'ESCALATE', reason: 'Verification failed, retries exhausted' };
            }
            break;
        case 'REPAIRING':
            if (signal.type === 'REPAIR_DONE') {
                return { nextState: 'EXECUTING', action: 'CONTINUE', reason: 'Repair attempt ready' };
            }
            if (signal.type === 'RETRIES_EXHAUSTED') {
                return { nextState: 'NEEDS_HUMAN', action: 'ESCALATE', reason: 'All retries exhausted' };
            }
            break;
        case 'REVIEWING':
            if (signal.type === 'REVIEW_DONE') {
                return { nextState: 'DONE', action: 'CONTINUE', reason: 'All reviewers passed' };
            }
            if (signal.type === 'REVIEW_NEEDS_HUMAN') {
                return { nextState: 'NEEDS_HUMAN', action: 'ESCALATE', reason: `Reviewer flagged: ${signal.reason}` };
            }
            break;
        case 'RATE_LIMITED':
            // Handled by orchestrator's resume loop — this state shouldn't receive signals directly
            break;
        case 'DONE':
        case 'FAILED':
        case 'NEEDS_HUMAN':
            // Terminal states — no transitions
            break;
    }
    // Unknown signal for current state — fail safe
    return {
        nextState: 'NEEDS_HUMAN',
        action: 'ESCALATE',
        reason: `Unexpected signal '${signal.type}' in state '${current}'`,
    };
}
//# sourceMappingURL=state-machine.js.map