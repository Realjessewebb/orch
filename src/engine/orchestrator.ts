import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { setTask } from '../registry/registry-store.js';
import { transition } from './state-machine.js';
import { runPlanner } from './planner.js';
import { runExecutor } from './executor.js';
import { runVerification } from './verifier.js';
import { runRepairer } from './repairer.js';
import { runReviewers } from './reviewer.js';
import { runPolicyChecks } from '../policy/policy-runner.js';
import { getDiffStat } from '../worktree/worktree-manager.js';
import {
  getArtifactPaths,
  ensureArtifactDirs,
  writeFailure,
  writeDiffstat,
  writeSummary,
  writeSummaryToContextDir,
} from '../artifacts/artifact-writer.js';
import { ClaudeAdapter } from '../adapters/claude-adapter.js';
import { CodexAdapter } from '../adapters/codex-adapter.js';
import { GeminiAdapter } from '../adapters/gemini-adapter.js';
import { Logger } from '../util/logger.js';
import type { TaskRecord } from '../registry/registry-types.js';
import type { ProjectConfig } from '../config/config-types.js';
import type { ModelAdapter } from '../adapters/adapter-interface.js';
import type { ModelName } from '../config/config-types.js';

async function getAdapter(name: ModelName): Promise<ModelAdapter> {
  switch (name) {
    case 'claude': return ClaudeAdapter.create();
    case 'codex':  return CodexAdapter.create();
    case 'gemini': return GeminiAdapter.create();
  }
}

function saveState(record: TaskRecord, patch: Partial<TaskRecord>): TaskRecord {
  const updated = { ...record, ...patch };
  setTask(updated);
  return updated;
}

// The main execution loop. Drives the FSM deterministically.
// All state changes go through transition() then setTask().
export async function runTask(
  record: TaskRecord,
  config: ProjectConfig
): Promise<TaskRecord> {
  const log = new Logger(join(record.logs_path, 'orchestrator.log'), record.task_id);
  const paths = getArtifactPaths(record);
  ensureArtifactDirs(paths);

  // --- PENDING → PLANNING ---
  let current = saveState(record, { status: 'PLANNING' });
  log.info('State → PLANNING');

  const plannerAdapter = await getAdapter(config.models.planner);
  const planResult = await runPlanner(
    record.spec_path,
    record.worktree_path,
    config,
    plannerAdapter,
    paths
  );

  if (planResult.isRateLimit) {
    const t = transition(current.status, { type: 'RATE_LIMIT_HIT' }, current.retries_remaining);
    current = saveState(current, {
      status: t.nextState,
      pre_rate_limit_status: 'PLANNING',
      retry_after: new Date(Date.now() + config.policy.rate_limit_backoff_ms).toISOString(),
    });
    log.warn(`Rate limited in PLANNING. Will resume at ${current.retry_after}`);
    return current;
  }

  if (!planResult.success) {
    const t = transition(current.status, { type: 'EXEC_ERROR', error: planResult.error ?? 'Unknown' }, current.retries_remaining);
    current = saveState(current, { status: t.nextState, last_failure_summary: planResult.error ?? null });
    log.error('Planning failed', { reason: t.reason });
    return current;
  }

  const executionPlan = planResult.planContent;
  const t1 = transition(current.status, { type: 'PLAN_DONE' }, current.retries_remaining);
  current = saveState(current, { status: t1.nextState });
  log.info('State → EXECUTING', { plan_length: executionPlan.length });

  // --- Retry loop: EXECUTING → VERIFYING → (REPAIRING → EXECUTING)* ---
  let failureOutput = '';
  let violations: import('../policy/policy-types.js').PolicyViolation[] = [];
  let attemptNumber = 0;

  while (current.status === 'EXECUTING' || current.status === 'REPAIRING') {
    // REPAIRING → run repair agent, then flip to EXECUTING
    if (current.status === 'REPAIRING') {
      log.info(`State: REPAIRING (attempt ${attemptNumber})`);
      const implementerAdapter = await getAdapter(config.models.implementer);
      const repairResult = await runRepairer(
        executionPlan,
        failureOutput,
        violations,
        record.worktree_path,
        config,
        implementerAdapter,
        paths,
        attemptNumber,
        current.retries_remaining
      );

      if (repairResult.isRateLimit) {
        const t = transition(current.status, { type: 'RATE_LIMIT_HIT' }, current.retries_remaining);
        current = saveState(current, {
          status: t.nextState,
          pre_rate_limit_status: 'REPAIRING',
          retry_after: new Date(Date.now() + config.policy.rate_limit_backoff_ms).toISOString(),
        });
        log.warn(`Rate limited in REPAIRING. Will resume at ${current.retry_after}`);
        return current;
      }

      if (!repairResult.success) {
        writeFailure(paths, attemptNumber, repairResult.error ?? 'Repair agent failed');
        // Still proceed to EXECUTING; verifier will catch it
      }

      const tr = transition(current.status, { type: 'REPAIR_DONE' }, current.retries_remaining);
      current = saveState(current, { status: tr.nextState });
      log.info('State → EXECUTING (after repair)');
    }

    // EXECUTING — run implementer
    if (current.status === 'EXECUTING') {
      log.info(`State: EXECUTING (attempt ${attemptNumber})`);
      const implementerAdapter = await getAdapter(config.models.implementer);
      const execResult = await runExecutor(
        executionPlan,
        record.worktree_path,
        config,
        implementerAdapter,
        paths,
        attemptNumber
      );

      if (execResult.isRateLimit) {
        const t = transition(current.status, { type: 'RATE_LIMIT_HIT' }, current.retries_remaining);
        current = saveState(current, {
          status: t.nextState,
          pre_rate_limit_status: 'EXECUTING',
          retry_after: new Date(Date.now() + config.policy.rate_limit_backoff_ms).toISOString(),
        });
        log.warn(`Rate limited in EXECUTING. Will resume at ${current.retry_after}`);
        return current;
      }

      if (!execResult.success) {
        failureOutput = execResult.error ?? 'Executor failed';
        writeFailure(paths, attemptNumber, failureOutput);
        const te = transition(current.status, { type: 'EXEC_ERROR', error: failureOutput }, current.retries_remaining);
        current = saveState(current, {
          status: te.nextState,
          retries_remaining: current.retries_remaining - 1,
          retries_used: current.retries_used + 1,
          last_failure_summary: failureOutput.slice(0, 500),
        });
        log.warn('Executor failed', { action: te.action, retries_remaining: current.retries_remaining });
        attemptNumber++;
        if (te.action === 'ESCALATE') return current;
        continue;
      }

      // Executor succeeded — move to VERIFYING
      const tv = transition(current.status, { type: 'EXEC_DONE' }, current.retries_remaining);
      current = saveState(current, { status: tv.nextState });
      log.info('State → VERIFYING');
    }

    // VERIFYING — policy + verification gates
    if (current.status === 'VERIFYING') {
      // Policy check first
      const policyResult = await runPolicyChecks(record.worktree_path, config.policy);
      const diffstatOutput = policyResult.diffStatOutput;
      writeDiffstat(paths, diffstatOutput);

      if (!policyResult.passed) {
        violations = policyResult.violations;
        failureOutput = violations.map((v) => `${v.type}: ${v.detail}`).join('\n');
        writeFailure(paths, attemptNumber, `POLICY VIOLATIONS:\n${failureOutput}`);

        const tp = transition(current.status, { type: 'POLICY_FAIL', violations }, current.retries_remaining);
        current = saveState(current, {
          status: tp.nextState,
          retries_remaining: current.retries_remaining - 1,
          retries_used: current.retries_used + 1,
          last_failure_summary: failureOutput.slice(0, 500),
        });
        log.warn('Policy violated', { violations: violations.map((v) => v.type) });
        attemptNumber++;
        if (tp.action === 'ESCALATE') return current;
        continue;
      }

      // Verification gates
      const verifyResult = await runVerification(
        record.worktree_path,
        config.commands,
        paths,
        attemptNumber
      );

      if (!verifyResult.passed) {
        failureOutput = verifyResult.failureOutput;
        violations = [];
        writeFailure(paths, attemptNumber, failureOutput);

        const tvf = transition(current.status, { type: 'VERIFY_FAIL', failureOutput }, current.retries_remaining);
        current = saveState(current, {
          status: tvf.nextState,
          retries_remaining: current.retries_remaining - 1,
          retries_used: current.retries_used + 1,
          last_failure_summary: failureOutput.slice(0, 500),
        });
        log.warn('Verification failed', { action: tvf.action });
        attemptNumber++;
        if (tvf.action === 'ESCALATE') return current;
        continue;
      }

      // All gates passed
      const tvp = transition(current.status, { type: 'VERIFY_PASS' }, current.retries_remaining);
      current = saveState(current, { status: tvp.nextState });
      log.info('State → REVIEWING');
      break; // exit retry loop
    }

    // Safety: if we somehow end up in a non-retry state, break
    if (!['EXECUTING', 'REPAIRING', 'VERIFYING'].includes(current.status)) break;
  }

  // --- REVIEWING ---
  if (current.status === 'REVIEWING') {
    const diffstat = await getDiffStat(record.worktree_path);

    const reviewerAdapters = await Promise.all(
      config.models.reviewers.map(async (name) => ({
        name,
        adapter: await getAdapter(name),
      }))
    );

    const reviewResult = await runReviewers(
      reviewerAdapters,
      record.spec_path,
      record.worktree_path,
      paths,
      diffstat
    );

    if (reviewResult.isRateLimit) {
      const t = transition(current.status, { type: 'RATE_LIMIT_HIT' }, current.retries_remaining);
      current = saveState(current, {
        status: t.nextState,
        pre_rate_limit_status: 'REVIEWING',
        retry_after: new Date(Date.now() + config.policy.rate_limit_backoff_ms).toISOString(),
      });
      log.warn(`Rate limited in REVIEWING. Will resume at ${current.retry_after}`);
      return current;
    }

    if (reviewResult.needsHuman) {
      const t = transition(current.status, {
        type: 'REVIEW_NEEDS_HUMAN',
        reason: reviewResult.needsHumanReason ?? 'Reviewer flagged issue',
      }, current.retries_remaining);
      current = saveState(current, {
        status: t.nextState,
        last_failure_summary: reviewResult.needsHumanReason,
      });
      log.warn('Reviewer flagged NEEDS_HUMAN', { reason: reviewResult.needsHumanReason });
    } else {
      const t = transition(current.status, { type: 'REVIEW_DONE' }, current.retries_remaining);
      current = saveState(current, { status: t.nextState });
      log.info('State → DONE');
    }

    // Write summary (always, regardless of terminal state)
    writeSummary(paths, current, reviewResult.reviews);
    writeSummaryToContextDir(config.global.context_dir, current.task_id, readFileSync(paths.summaryFile, 'utf8'));
  }

  // Write summary even if we ended without reviewing
  if (!['DONE', 'REVIEWING'].includes(record.status)) {
    writeSummary(paths, current, {});
    writeSummaryToContextDir(config.global.context_dir, current.task_id, readFileSync(paths.summaryFile, 'utf8'));
  }

  log.info('Task finished', { status: current.status });
  return current;
}
