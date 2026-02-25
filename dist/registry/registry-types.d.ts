export type TaskStatus = 'PENDING' | 'PLANNING' | 'EXECUTING' | 'VERIFYING' | 'REPAIRING' | 'REVIEWING' | 'NEEDS_HUMAN' | 'DONE' | 'FAILED' | 'RATE_LIMITED';
export interface TaskRecord {
    task_id: string;
    repo_path: string;
    worktree_path: string;
    branch: string;
    spec_path: string;
    status: TaskStatus;
    retries_remaining: number;
    retries_used: number;
    created_at: string;
    updated_at: string;
    logs_path: string;
    artifacts_path: string;
    retry_after: string | null;
    pre_rate_limit_status: TaskStatus | null;
    last_failure_summary: string | null;
    model_used: {
        planner: string;
        implementer: string;
        reviewers: string[];
    };
    tmux_session: string | null;
    exit_code: number | null;
}
export interface RegistryIndex {
    version: 1;
    tasks: Record<string, TaskRecord>;
}
