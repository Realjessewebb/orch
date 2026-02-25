import { getTask, setTask } from '../registry/registry-store.js';
import { removeWorktree } from '../worktree/worktree-manager.js';
import { killSession, sessionExists } from '../tmux/tmux-session.js';
import { log } from '../util/logger.js';

export async function cmdKill(taskId: string): Promise<void> {
  const task = getTask(taskId);
  if (!task) {
    console.error(`Task not found: ${taskId}`);
    process.exit(1);
  }

  console.log(`Killing task ${taskId} (currently ${task.status})`);

  // Kill tmux session if running
  if (task.tmux_session) {
    const alive = await sessionExists(task.tmux_session);
    if (alive) {
      await killSession(task.tmux_session);
      console.log(`  killed tmux session: ${task.tmux_session}`);
    }
  }

  // Mark as failed in registry
  setTask({
    ...task,
    status: 'FAILED',
    last_failure_summary: `Killed by user at ${new Date().toISOString()}`,
  });

  console.log(`  task marked as FAILED`);
  console.log(`  worktree preserved at: ${task.worktree_path}`);
  console.log(`  run 'orch clean' to remove worktrees`);
}
