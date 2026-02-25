import type { ModelName } from '../config/config-types.js';

export interface AdapterOptions {
  prompt: string;
  worktreePath: string;
  logFilePath: string;
  timeoutMs?: number;
  // Extra env vars merged with process.env (never credentials)
  env?: Record<string, string>;
}

export interface AdapterResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  logFilePath: string;
  // True if the failure looks like a rate limit (retry without decrementing counter)
  isRateLimit: boolean;
}

export interface ModelAdapter {
  readonly name: ModelName;
  readonly binaryPath: string;
  run(options: AdapterOptions): Promise<AdapterResult>;
}

export class AdapterNotFoundError extends Error {
  constructor(name: ModelName) {
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

export function detectRateLimit(stdout: string, stderr: string): boolean {
  const combined = stdout + stderr;
  return RATE_LIMIT_PATTERNS.some((p) => p.test(combined));
}
