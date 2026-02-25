import { listTasks } from '../registry/registry-store.js';
import type { TaskRecord } from '../registry/registry-types.js';

const STATUS_COLORS: Record<string, string> = {
  PENDING:      '\x1b[90m',   // gray
  PLANNING:     '\x1b[36m',   // cyan
  EXECUTING:    '\x1b[34m',   // blue
  VERIFYING:    '\x1b[35m',   // magenta
  REPAIRING:    '\x1b[33m',   // yellow
  REVIEWING:    '\x1b[36m',   // cyan
  DONE:         '\x1b[32m',   // green
  FAILED:       '\x1b[31m',   // red
  NEEDS_HUMAN:  '\x1b[31m',   // red
  RATE_LIMITED: '\x1b[33m',   // yellow
};
const RESET = '\x1b[0m';

function colorStatus(status: string): string {
  const color = STATUS_COLORS[status] ?? '';
  return `${color}${status}${RESET}`;
}

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

export function cmdStatus(filter?: string): void {
  let tasks = listTasks();

  if (filter) {
    tasks = tasks.filter((t) => t.status === filter.toUpperCase());
  }

  if (tasks.length === 0) {
    console.log(filter ? `No tasks with status ${filter}.` : 'No tasks found. Run `orch run <spec>` in a repo.');
    return;
  }

  console.log('');
  console.log(`  ${'TASK ID'.padEnd(22)}  ${'STATUS'.padEnd(14)}  ${'RETRIES'.padEnd(8)}  REPO`);
  console.log(`  ${'─'.repeat(22)}  ${'─'.repeat(14)}  ${'─'.repeat(8)}  ${'─'.repeat(40)}`);

  for (const task of tasks) {
    const id = pad(task.task_id, 22);
    const status = pad(task.status, 14);
    const retries = `${task.retries_used}/${task.retries_used + task.retries_remaining}`;
    const repo = task.repo_path.replace(process.env['HOME'] ?? '', '~');

    console.log(`  ${id}  ${colorStatus(status)}  ${pad(retries, 8)}  ${repo}`);

    if (task.status === 'NEEDS_HUMAN' && task.last_failure_summary) {
      console.log(`    → ${task.last_failure_summary.split('\n')[0]}`);
    }
    if (task.status === 'RATE_LIMITED' && task.retry_after) {
      const waitMs = new Date(task.retry_after).getTime() - Date.now();
      const waitMin = Math.ceil(waitMs / 60_000);
      console.log(`    → Rate limited. Resume in ~${waitMin} min. Run: orch resume`);
    }
  }

  console.log('');
  const counts = tasks.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const summary = Object.entries(counts)
    .map(([s, n]) => `${n} ${s}`)
    .join('  ·  ');
  console.log(`  ${summary}`);
  console.log('');
}
