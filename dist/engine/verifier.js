import { join } from 'node:path';
import { shell } from '../util/exec.js';
import { writeTextFile } from '../util/fs-helpers.js';
export async function runVerification(worktreePath, commands, paths, attemptNumber) {
    const steps = [];
    const failureParts = [];
    const namedSteps = [
        { name: 'lint', cmds: commands.lint },
        { name: 'typecheck', cmds: commands.typecheck },
        { name: 'test', cmds: commands.test },
    ];
    for (const { name, cmds } of namedSteps) {
        if (cmds.length === 0)
            continue;
        for (const cmd of cmds) {
            const result = await shell(cmd, {
                cwd: worktreePath,
                timeoutMs: 120_000,
            });
            const step = {
                name,
                command: cmd,
                exitCode: result.exitCode,
                stdout: result.stdout,
                stderr: result.stderr,
                durationMs: result.durationMs,
            };
            steps.push(step);
            // Write individual step log
            const logContent = `Command: ${cmd}\nExit code: ${result.exitCode}\n\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`;
            writeTextFile(join(paths.logsDir, `verify-${name}-${attemptNumber}.log`), logContent);
            if (result.exitCode !== 0) {
                failureParts.push(`[${name.toUpperCase()} FAILED]\nCommand: ${cmd}\nExit: ${result.exitCode}\n${result.stdout}\n${result.stderr}`);
                // Stop at first failure in each category to keep repair prompt focused
                break;
            }
        }
    }
    const failureOutput = failureParts.join('\n\n---\n\n');
    return {
        passed: failureParts.length === 0,
        steps,
        failureOutput,
    };
}
//# sourceMappingURL=verifier.js.map