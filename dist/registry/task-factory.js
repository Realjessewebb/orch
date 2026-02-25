import { join } from 'node:path';
import { generateTaskId } from '../util/id-gen.js';
export function createTaskRecord(specPath, config, worktreePath, branch) {
    const taskId = generateTaskId();
    const now = new Date().toISOString();
    const artifactsPath = join(config.projectRoot, 'artifacts', taskId);
    return {
        task_id: taskId,
        repo_path: config.projectRoot,
        worktree_path: worktreePath,
        branch,
        spec_path: specPath,
        status: 'PENDING',
        retries_remaining: config.policy.max_retries,
        retries_used: 0,
        created_at: now,
        updated_at: now,
        logs_path: join(artifactsPath, 'logs'),
        artifacts_path: artifactsPath,
        retry_after: null,
        pre_rate_limit_status: null,
        last_failure_summary: null,
        model_used: {
            planner: config.models.planner,
            implementer: config.models.implementer,
            reviewers: config.models.reviewers,
        },
        tmux_session: null,
        exit_code: null,
    };
}
//# sourceMappingURL=task-factory.js.map