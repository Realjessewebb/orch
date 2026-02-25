import { listTasks, deleteTask } from '../registry/registry-store.js';
import { removeWorktree } from '../worktree/worktree-manager.js';
import { killSession, sessionExists } from '../tmux/tmux-session.js';
import { fileExists } from '../util/fs-helpers.js';
export async function cmdClean(options = {}) {
    const tasks = listTasks();
    const toClean = options.all
        ? tasks
        : tasks.filter((t) => ['DONE', 'FAILED', 'NEEDS_HUMAN'].includes(t.status));
    if (toClean.length === 0) {
        console.log('Nothing to clean.');
        return;
    }
    console.log(`Cleaning ${toClean.length} task(s)...\n`);
    for (const task of toClean) {
        process.stdout.write(`  ${task.task_id} (${task.status}) ... `);
        // Kill tmux session if still alive
        if (task.tmux_session) {
            const alive = await sessionExists(task.tmux_session);
            if (alive)
                await killSession(task.tmux_session);
        }
        // Remove worktree
        if (fileExists(task.worktree_path)) {
            try {
                await removeWorktree(task.repo_path, task.worktree_path);
                process.stdout.write('worktree removed, ');
            }
            catch {
                process.stdout.write('worktree removal failed (manual cleanup needed), ');
            }
        }
        deleteTask(task.task_id);
        console.log('registry cleaned');
    }
    console.log('\nDone.');
}
//# sourceMappingURL=clean.js.map