import { spawn } from 'node:child_process';

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  // When true, streams output to process.stdout/stderr in addition to capturing it
  stream?: boolean;
}

export class ExecTimeoutError extends Error {
  constructor(cmd: string, timeoutMs: number) {
    super(`Command timed out after ${timeoutMs}ms: ${cmd}`);
    this.name = 'ExecTimeoutError';
  }
}

export async function exec(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const { cwd, env, timeoutMs = 120_000, stream = false } = options;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
      reject(new ExecTimeoutError([command, ...args].join(' '), timeoutMs));
    }, timeoutMs);

    proc.stdout.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      stdout += s;
      if (stream) process.stdout.write(s);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      stderr += s;
      if (stream) process.stderr.write(s);
    });

    proc.on('close', (code) => {
      if (killed) return;
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - start,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Shell convenience: runs a full shell command string (uses /bin/sh -c)
export async function shell(
  cmd: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  return exec('/bin/sh', ['-c', cmd], options);
}
