import { join } from 'node:path';
import { exec } from '../util/exec.js';
import { readTextFile } from '../util/fs-helpers.js';
import { buildReviewerPrompt } from '../context/prompt-builder.js';
import { writeReview } from '../artifacts/artifact-writer.js';
async function runSingleReview(modelName, adapter, specContent, worktreePath, paths, diffstat) {
    // Get full diff for the reviewer
    const diffResult = await exec('git', ['diff', 'HEAD'], { cwd: worktreePath });
    const diffContent = diffResult.stdout;
    const prompt = buildReviewerPrompt(diffstat, diffContent, specContent, modelName);
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
export async function runReviewers(reviewerAdapters, specPath, worktreePath, paths, diffstat) {
    const specContent = readTextFile(specPath) ?? '';
    const reviews = {};
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
//# sourceMappingURL=reviewer.js.map