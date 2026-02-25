import { join } from 'node:path';
import { exec } from '../util/exec.js';
import { readTextFile } from '../util/fs-helpers.js';
import { buildReviewerPrompt } from '../context/prompt-builder.js';
import { writeReview } from '../artifacts/artifact-writer.js';
import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ArtifactPaths } from '../artifacts/artifact-writer.js';
import type { ModelName } from '../config/config-types.js';

export interface ReviewResult {
  modelName: ModelName;
  output: string;
  needsHuman: boolean;
  needsHumanReason: string | null;
  isRateLimit: boolean;
}

export interface ReviewerRunResult {
  allPassed: boolean;
  needsHuman: boolean;
  needsHumanReason: string | null;
  reviews: Record<string, string>;
  isRateLimit: boolean;
}

async function runSingleReview(
  modelName: ModelName,
  adapter: ModelAdapter,
  specContent: string,
  worktreePath: string,
  paths: ArtifactPaths,
  diffstat: string
): Promise<ReviewResult> {
  // Get full diff for the reviewer
  const diffResult = await exec('git', ['diff', 'HEAD'], { cwd: worktreePath });
  const diffContent = diffResult.stdout;

  const prompt = buildReviewerPrompt(
    diffstat,
    diffContent,
    specContent,
    modelName as 'codex' | 'gemini' | 'claude'
  );

  const result = await adapter.run({
    prompt,
    worktreePath,
    logFilePath: join(paths.logsDir, `review-${modelName}.log`),
    timeoutMs: 120_000,
  });

  if (result.isRateLimit) {
    return { modelName, output: '', needsHuman: false, needsHumanReason: null, isRateLimit: true };
  }

  const output = result.stdout.trim();
  const needsHuman = output.includes('NEEDS_HUMAN:');
  const needsHumanReason = needsHuman
    ? output.split('NEEDS_HUMAN:')[1]?.split('\n')[0]?.trim() ?? 'Reviewer flagged issue'
    : null;

  return { modelName, output, needsHuman, needsHumanReason, isRateLimit: false };
}

// Runs all reviewers in sequence: codex → gemini → claude
// Stops early if any reviewer flags NEEDS_HUMAN
export async function runReviewers(
  reviewerAdapters: Array<{ name: ModelName; adapter: ModelAdapter }>,
  specPath: string,
  worktreePath: string,
  paths: ArtifactPaths,
  diffstat: string
): Promise<ReviewerRunResult> {
  const specContent = readTextFile(specPath) ?? '';
  const reviews: Record<string, string> = {};

  for (const { name, adapter } of reviewerAdapters) {
    const result = await runSingleReview(name, adapter, specContent, worktreePath, paths, diffstat);

    if (result.isRateLimit) {
      return { allPassed: false, needsHuman: false, needsHumanReason: null, reviews, isRateLimit: true };
    }

    writeReview(paths, name, result.output);
    reviews[name] = result.output;

    if (result.needsHuman) {
      return {
        allPassed: false,
        needsHuman: true,
        needsHumanReason: result.needsHumanReason,
        reviews,
        isRateLimit: false,
      };
    }
  }

  return {
    allPassed: true,
    needsHuman: false,
    needsHumanReason: null,
    reviews,
    isRateLimit: false,
  };
}
