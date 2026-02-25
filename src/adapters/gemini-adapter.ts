import { homedir } from 'node:os';
import { join } from 'node:path';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { ensureDir } from '../util/fs-helpers.js';
import { exec } from '../util/exec.js';
import {
  type AdapterOptions,
  type AdapterResult,
  type ModelAdapter,
  AdapterNotFoundError,
  detectRateLimit,
} from './adapter-interface.js';

async function resolveBinary(): Promise<string> {
  const candidates = [
    process.env['ORCH_GEMINI_BIN'],
    join(homedir(), '.local', 'bin', 'gemini'),
    '/usr/local/bin/gemini',
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const r = await exec('test', ['-x', candidate]);
    if (r.exitCode === 0) return candidate;
  }

  const which = await exec('which', ['gemini']);
  if (which.exitCode === 0 && which.stdout.trim()) return which.stdout.trim();

  throw new AdapterNotFoundError('gemini');
}

export class GeminiAdapter implements ModelAdapter {
  readonly name = 'gemini' as const;
  readonly binaryPath: string;

  private constructor(binaryPath: string) {
    this.binaryPath = binaryPath;
  }

  static async create(): Promise<GeminiAdapter> {
    return new GeminiAdapter(await resolveBinary());
  }

  async run(options: AdapterOptions): Promise<AdapterResult> {
    const { prompt, worktreePath, logFilePath, timeoutMs = 300_000, env } = options;
    ensureDir(join(logFilePath, '..'));

    const start = Date.now();
    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      // gemini CLI: `gemini -p "<prompt>"` — adjust if the flag differs
      const args = ['-p', prompt];

      const proc = spawn(this.binaryPath, args, {
        cwd: worktreePath,
        env: { ...process.env, ...env },
      });

      const logStream = createWriteStream(logFilePath, { flags: 'a' });

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
        logStream.write(chunk);
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
        logStream.write(chunk);
      });

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        logStream.end();
        reject(new Error(`gemini adapter timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      proc.on('close', (code) => {
        clearTimeout(timer);
        logStream.end();
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
          durationMs: Date.now() - start,
          logFilePath,
          isRateLimit: detectRateLimit(stdout, stderr),
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        logStream.end();
        reject(err);
      });
    });
  }
}
