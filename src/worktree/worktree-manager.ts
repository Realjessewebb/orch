import { join } from 'node:path';
import { exec } from '../util/exec.js';
import { ensureDir, fileExists } from '../util/fs-helpers.js';

export interface WorktreeInfo {
  path: string;
  branch: string;
  commit: string;
}

export async function createWorktree(
  repoPath: string,
  worktreePath: string,
  branch: string
): Promise<void> {
  ensureDir(join(worktreePath, '..'));

  // Try to base off origin/main; fall back to HEAD if remote isn't set up
  const baseBranches = ['origin/main', 'origin/master', 'HEAD'];
  let created = false;

  for (const base of baseBranches) {
    const result = await exec(
      'git',
      ['worktree', 'add', worktreePath, '-b', branch, base],
      { cwd: repoPath }
    );
    if (result.exitCode === 0) {
      created = true;
      break;
    }
  }

  if (!created) {
    // Last resort: no base branch specified
    const result = await exec(
      'git',
      ['worktree', 'add', worktreePath, '-b', branch],
      { cwd: repoPath }
    );
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create worktree at ${worktreePath}: ${result.stderr}`);
    }
  }
}

export async function removeWorktree(
  repoPath: string,
  worktreePath: string
): Promise<void> {
  if (!fileExists(worktreePath)) return;

  await exec('git', ['worktree', 'remove', '--force', worktreePath], {
    cwd: repoPath,
  });
}

export async function listWorktrees(repoPath: string): Promise<WorktreeInfo[]> {
  const result = await exec('git', ['worktree', 'list', '--porcelain'], {
    cwd: repoPath,
  });

  const worktrees: WorktreeInfo[] = [];
  const blocks = result.stdout.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    const pathLine = lines.find((l) => l.startsWith('worktree '));
    const branchLine = lines.find((l) => l.startsWith('branch '));
    const commitLine = lines.find((l) => l.startsWith('HEAD '));

    if (pathLine) {
      worktrees.push({
        path: pathLine.replace('worktree ', ''),
        branch: branchLine?.replace('branch refs/heads/', '') ?? '(detached)',
        commit: commitLine?.replace('HEAD ', '') ?? '',
      });
    }
  }

  return worktrees;
}

// Returns the diff stats for everything changed in the worktree vs its base
export async function getDiffStat(worktreePath: string): Promise<string> {
  const result = await exec('git', ['diff', '--stat', 'HEAD'], {
    cwd: worktreePath,
  });
  return result.stdout;
}

// Returns list of changed file paths
export async function getChangedFiles(worktreePath: string): Promise<string[]> {
  const result = await exec(
    'git',
    ['diff', '--name-only', 'HEAD'],
    { cwd: worktreePath }
  );
  return result.stdout
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
