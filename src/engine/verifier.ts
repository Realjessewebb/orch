import { join } from 'node:path';
import { shell } from '../util/exec.js';
import { writeTextFile } from '../util/fs-helpers.js';
import type { CommandsConfig } from '../config/config-types.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';

export interface VerificationStep {
  name: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface VerificationResult {
  passed: boolean;
  steps: VerificationStep[];
  // Concatenated failure output for the repair prompt
  failureOutput: string;
}

export async function runVerification(
  worktreePath: string,
  commands: CommandsConfig,
  paths: ArtifactPaths,
  attemptNumber: number
): Promise<VerificationResult> {
  const steps: VerificationStep[] = [];
  const failureParts: string[] = [];

  const namedSteps: Array<{ name: string; cmds: string[] }> = [
    { name: 'lint',       cmds: commands.lint },
    { name: 'typecheck',  cmds: commands.typecheck },
    { name: 'test',       cmds: commands.test },
  ];

  for (const { name, cmds } of namedSteps) {
    if (cmds.length === 0) continue;

    for (const cmd of cmds) {
      const result = await shell(cmd, {
        cwd: worktreePath,
        timeoutMs: 120_000,
      });

      const step: VerificationStep = {
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
        failureParts.push(
          `[${name.toUpperCase()} FAILED]\nCommand: ${cmd}\nExit: ${result.exitCode}\n${result.stdout}\n${result.stderr}`
        );
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
