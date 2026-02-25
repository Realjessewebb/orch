export class AdapterNotFoundError extends Error {
    constructor(name) {
        super(`Model adapter '${name}' could not find its binary. Set ORCH_${name.toUpperCase()}_BIN env var or ensure the CLI is on PATH.`);
        this.name = 'AdapterNotFoundError';
    }
}
// Patterns that indicate a rate/quota limit rather than a real failure
export const RATE_LIMIT_PATTERNS = [
    /rate.?limit/i,
    /quota.?exceeded/i,
    /too.?many.?requests/i,
    /429/,
    /usage.?limit/i,
    /out of credits/i,
    /monthly.?limit/i,
];
export function detectRateLimit(stdout, stderr) {
    const combined = stdout + stderr;
    return RATE_LIMIT_PATTERNS.some((p) => p.test(combined));
}
//# sourceMappingURL=adapter-interface.js.map