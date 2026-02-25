export type TaskStatus =
  | 'PENDING'
  | 'PLANNING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'REPAIRING'
  | 'REVIEWING'
  | 'NEEDS_HUMAN'
  | 'DONE'
  | 'FAILED'
  | 'RATE_LIMITED';

export interface TaskRecord {
  task_id: string;
  repo_path: string;
  worktree_path: string;
  branch: string;
  spec_path: string;
  status: TaskStatus;
  retries_remaining: number;
  retries_used: number;
  // ISO 8601 timestamps
  created_at: string;
  updated_at: string;
  // Filesystem paths
  logs_path: string;
  artifacts_path: string;
  // Set when task hits RATE_LIMITED; orch resume checks this
  retry_after: string | null;
  // State to resume from after rate-limit backoff clears
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

// Top-level shape of ~/.config/orch/registry.json
export interface RegistryIndex {
  version: 1;
  tasks: Record<string, TaskRecord>;
}
