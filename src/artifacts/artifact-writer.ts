import { join } from 'node:path';
import { ensureDir, writeTextFile } from '../util/fs-helpers.js';
import type { TaskRecord } from '../registry/registry-types.js';

export interface ArtifactPaths {
  root: string;
  logsDir: string;
  failuresDir: string;
  reviewsDir: string;
  summaryFile: string;
  diffstatFile: string;
}

export function getArtifactPaths(record: TaskRecord): ArtifactPaths {
  const root = record.artifacts_path;
  return {
    root,
    logsDir: join(root, 'logs'),
    failuresDir: join(root, 'failures'),
    reviewsDir: join(root, 'reviews'),
    summaryFile: join(root, 'summary.md'),
    diffstatFile: join(root, 'diffstat.txt'),
  };
}

export function ensureArtifactDirs(paths: ArtifactPaths): void {
  ensureDir(paths.logsDir);
  ensureDir(paths.failuresDir);
  ensureDir(paths.reviewsDir);
}

export function writeFailure(
  paths: ArtifactPaths,
  attemptNumber: number,
  content: string
): void {
  writeTextFile(join(paths.failuresDir, `${attemptNumber}.txt`), content);
}

export function writeReview(
  paths: ArtifactPaths,
  modelName: string,
  content: string
): void {
  writeTextFile(join(paths.reviewsDir, `${modelName}.md`), content);
}

export function writeDiffstat(paths: ArtifactPaths, diffstat: string): void {
  writeTextFile(paths.diffstatFile, diffstat);
}

export function writeSummary(
  paths: ArtifactPaths,
  record: TaskRecord,
  reviewOutputs: Record<string, string>
): void {
  const lines: string[] = [
    `# Task Summary: ${record.task_id}`,
    '',
    `**Status:** ${record.status}`,
    `**Repo:** ${record.repo_path}`,
    `**Branch:** ${record.branch}`,
    `**Worktree:** ${record.worktree_path}`,
    `**Spec:** ${record.spec_path}`,
    '',
    '## Timeline',
    `- Created: ${record.created_at}`,
    `- Updated: ${record.updated_at}`,
    '',
    '## Models Used',
    `- Planner: ${record.model_used.planner}`,
    `- Implementer: ${record.model_used.implementer}`,
    `- Reviewers: ${record.model_used.reviewers.join(', ')}`,
    '',
    `## Retries`,
    `- Used: ${record.retries_used}`,
    `- Remaining: ${record.retries_remaining}`,
    '',
  ];

  if (record.last_failure_summary) {
    lines.push('## Last Failure', '', record.last_failure_summary, '');
  }

  if (Object.keys(reviewOutputs).length > 0) {
    lines.push('## Reviews', '');
    for (const [model, output] of Object.entries(reviewOutputs)) {
      lines.push(`### ${model}`, '', output, '');
    }
  }

  writeTextFile(paths.summaryFile, lines.join('\n'));
}

// Also write summary to Obsidian vault if configured
export function writeSummaryToObsidian(
  obsidianVault: string | null,
  taskId: string,
  summaryContent: string
): void {
  if (!obsidianVault) return;
  const dest = join(obsidianVault, 'orch', 'runs', taskId, 'summary.md');
  writeTextFile(dest, summaryContent);
}
