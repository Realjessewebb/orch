import { spawn } from 'node:child_process';
export class ExecTimeoutError extends Error {
    constructor(cmd, timeoutMs) {
        super(`Command timed out after ${timeoutMs}ms: ${cmd}`);
        this.name = 'ExecTimeoutError';
    }
}
export async function exec(command, args, options = {}) {
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
        proc.stdout.on('data', (chunk) => {
            const s = chunk.toString();
            stdout += s;
            if (stream)
                process.stdout.write(s);
        });
        proc.stderr.on('data', (chunk) => {
            const s = chunk.toString();
            stderr += s;
            if (stream)
                process.stderr.write(s);
        });
        proc.on('close', (code) => {
            if (killed)
                return;
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
export async function shell(cmd, options = {}) {
    return exec('/bin/sh', ['-c', cmd], options);
}
//# sourceMappingURL=exec.js.map