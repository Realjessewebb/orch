import { homedir } from 'node:os';
import { join } from 'node:path';
import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { ensureDir } from '../util/fs-helpers.js';
import { exec } from '../util/exec.js';
import { AdapterNotFoundError, detectRateLimit, } from './adapter-interface.js';
async function resolveBinary() {
    const candidates = [
        process.env['ORCH_CLAUDE_BIN'],
        join(homedir(), '.local', 'bin', 'claude'),
    ].filter(Boolean);
    for (const candidate of candidates) {
        const r = await exec('test', ['-x', candidate]);
        if (r.exitCode === 0)
            return candidate;
    }
    const which = await exec('which', ['claude']);
    if (which.exitCode === 0 && which.stdout.trim())
        return which.stdout.trim();
    throw new AdapterNotFoundError('claude');
}
export class ClaudeAdapter {
    name = 'claude';
    binaryPath;
    constructor(binaryPath) {
        this.binaryPath = binaryPath;
    }
    static async create() {
        return new ClaudeAdapter(await resolveBinary());
    }
    async run(options) {
        const { prompt, worktreePath, logFilePath, timeoutMs = 300_000, env } = options;
        ensureDir(join(logFilePath, '..'));
        const start = Date.now();
        let stdout = '';
        let stderr = '';
        return new Promise((resolve, reject) => {
            const args = [
                '--model', 'claude-sonnet-4-6',
                '--dangerously-skip-permissions',
                '-p', prompt,
            ];
            const proc = spawn(this.binaryPath, args, {
                cwd: worktreePath,
                env: { ...process.env, ...env },
            });
            const logStream = createWriteStream(logFilePath, { flags: 'a' });
            proc.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
                logStream.write(chunk);
            });
            proc.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
                logStream.write(chunk);
            });
            const timer = setTimeout(() => {
                proc.kill('SIGTERM');
                logStream.end();
                reject(new Error(`claude adapter timed out after ${timeoutMs}ms`));
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
//# sourceMappingURL=claude-adapter.js.map