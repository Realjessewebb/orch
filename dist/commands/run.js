import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { loadProjectConfig } from '../config/config-loader.js';
import { createTaskRecord } from '../registry/task-factory.js';
import { setTask } from '../registry/registry-store.js';
import { makeBranchName } from '../worktree/branch-namer.js';
import { createWorktree } from '../worktree/worktree-manager.js';
import { generateTaskId } from '../util/id-gen.js';
import { ensureDir } from '../util/fs-helpers.js';
import { runTask } from '../engine/orchestrator.js';
import { tmuxAvailable, createSession } from '../tmux/tmux-session.js';
import { log } from '../util/logger.js';
import { ORCH_CONFIG_DIR } from '../config/config-defaults.js';
import { join } from 'node:path';
export async function cmdRun(specPath, options = {}) {
    const repoPath = resolve(options.repoPath ?? process.cwd());
    const absSpecPath = resolve(specPath);
    if (!existsSync(absSpecPath)) {
        console.error(`Error: spec file not found: ${absSpecPath}`);
        process.exit(1);
    }
    let config;
    try {
        config = loadProjectConfig(repoPath);
    }
    catch (e) {
        console.error(`Error: ${String(e)}`);
        process.exit(1);
    }
    // Generate task ID and branch name
    const taskId = generateTaskId();
    const branch = makeBranchName(taskId);
    // Worktree lives at ~/.config/orch/worktrees/<task_id>
    ensureDir(join(ORCH_CONFIG_DIR, 'worktrees'));
    const worktreePath = join(ORCH_CONFIG_DIR, 'worktrees', taskId);
    // Create the worktree
    try {
        await createWorktree(repoPath, worktreePath, branch);
        log.info('Worktree created', { worktreePath, branch });
    }
    catch (e) {
        console.error(`Error creating worktree: ${String(e)}`);
        process.exit(1);
    }
    // Create and persist task record
    const record = createTaskRecord(absSpecPath, config, worktreePath, branch);
    // Override with our generated IDs (createTaskRecord uses its own generateTaskId)
    setTask(record);
    console.log(`\norch: task ${record.task_id}`);
    console.log(`  repo:     ${repoPath}`);
    console.log(`  branch:   ${branch}`);
    console.log(`  worktree: ${worktreePath}`);
    console.log(`  spec:     ${absSpecPath}`);
    console.log('');
    // Optionally run in tmux
    const useTmux = options.useTmux ?? (await tmuxAvailable());
    const sessionName = `orch-${record.task_id}`;
    if (useTmux) {
        const started = await createSession(sessionName, worktreePath);
        if (started) {
            setTask({ ...record, tmux_session: sessionName });
            console.log(`tmux session: ${sessionName}`);
            console.log(`  attach with: tmux attach -t ${sessionName}`);
            console.log('');
        }
    }
    // Run the task
    const finalRecord = await runTask(record, config);
    console.log(`\norch: task ${finalRecord.status}`);
    console.log(`  artifacts: ${finalRecord.artifacts_path}`);
    if (finalRecord.status === 'DONE') {
        console.log('\n  Branch is ready for review. The worktree is preserved.');
        console.log(`  Review changes: cd ${worktreePath} && git diff HEAD`);
    }
    else if (finalRecord.status === 'NEEDS_HUMAN') {
        console.log('\n  NEEDS_HUMAN: review the failure summary:');
        console.log(`  cat ${finalRecord.artifacts_path}/summary.md`);
    }
    else if (finalRecord.status === 'RATE_LIMITED') {
        console.log('\n  Rate limited. Run `orch resume` when tokens refresh.');
    }
    console.log('');
}
//# sourceMappingURL=run.js.map