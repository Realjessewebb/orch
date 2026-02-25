export type ModelName = 'claude' | 'codex' | 'gemini';

export interface PolicyConfig {
  allowed_paths: string[];
  forbidden_paths: string[];
  max_changed_files: number;
  max_net_loc: number;
  max_retries: number;
  secret_scan_enabled: boolean;
  gitleaks_path?: string;
  rate_limit_backoff_ms: number;
}

export interface CommandsConfig {
  lint: string[];
  typecheck: string[];
  test: string[];
}

export interface ModelsConfig {
  planner: ModelName;
  implementer: ModelName;
  reviewers: ModelName[];
}

// Global config at ~/.config/orch/global.yaml
export interface GlobalConfig {
  // Where your knowledge base lives: MEMORY.md, business.md, skills/, notes/, runs/
  // Point this at a folder inside your Obsidian vault and everything is native there.
  // Default: ~/.config/orch/context
  context_dir: string;
  worktrees_dir: string;
}

// Full merged project config (all files combined)
export interface ProjectConfig {
  policy: PolicyConfig;
  commands: CommandsConfig;
  models: ModelsConfig;
  global: GlobalConfig;
  projectRoot: string;
  orchestratorDir: string;
}
