import { listTasks, getTask } from '../registry/registry-store.js';
import { loadProjectConfig } from '../config/config-loader.js';
import { runTask } from '../engine/orchestrator.js';
import { log } from '../util/logger.js';

export async function cmdResume(): Promise<void> {
  const tasks = listTasks();

  // Find all resumable tasks
  const resumable = tasks.filter((t) => {
    if (t.status === 'RATE_LIMITED') {
      const retryAfter = t.retry_after ? new Date(t.retry_after).getTime() : 0;
      return Date.now() >= retryAfter;
    }
    return ['PENDING', 'PLANNING', 'EXECUTING', 'VERIFYING', 'REPAIRING', 'REVIEWING'].includes(t.status);
  });

  if (resumable.length === 0) {
    console.log('No resumable tasks found.');

    const rateLimited = tasks.filter((t) => t.status === 'RATE_LIMITED');
    if (rateLimited.length > 0) {
      const times = rateLimited
        .map((t) => new Date(t.retry_after ?? 0).getTime())
        .sort();
      const next = times[0] ?? Date.now();
      const waitMin = Math.ceil((next - Date.now()) / 60_000);
      console.log(`  ${rateLimited.length} task(s) rate limited — ready in ~${waitMin} min.`);
    }
    return;
  }

  console.log(`Resuming ${resumable.length} task(s)...\n`);

  for (const task of resumable) {
    console.log(`  → ${task.task_id} (${task.status})`);

    let config;
    try {
      config = loadProjectConfig(task.repo_path);
    } catch (e) {
      log.error(`Cannot load config for task ${task.task_id}: ${String(e)}`);
      continue;
    }

    // Restore pre-rate-limit state if applicable
    const resumeRecord = task.status === 'RATE_LIMITED'
      ? { ...task, status: task.pre_rate_limit_status ?? 'EXECUTING', retry_after: null, pre_rate_limit_status: null }
      : task;

    await runTask(resumeRecord, config);
  }

  console.log('\nResume complete. Run `orch status` to see updated state.');
}
