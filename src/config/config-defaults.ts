import { homedir } from 'node:os';
import { join } from 'node:path';
import type { PolicyConfig, CommandsConfig, ModelsConfig, GlobalConfig } from './config-types.js';

export const DEFAULT_POLICY: PolicyConfig = {
  allowed_paths: [],
  forbidden_paths: [
    '.env',
    '.env.*',
    '*.pem',
    '*.key',
    '*.p12',
    '.ssh/**',
    '**/secrets/**',
  ],
  max_changed_files: 20,
  max_net_loc: 500,
  max_retries: 3,
  secret_scan_enabled: true,
  rate_limit_backoff_ms: 5 * 60 * 1000, // 5 minutes
};

export const DEFAULT_COMMANDS: CommandsConfig = {
  lint: [],
  typecheck: [],
  test: [],
};

export const DEFAULT_MODELS: ModelsConfig = {
  planner: 'claude',
  implementer: 'codex',
  reviewers: ['codex', 'gemini', 'claude'],
};

export const DEFAULT_GLOBAL: GlobalConfig = {
  context_dir: join(homedir(), '.config', 'orch', 'context'),
  worktrees_dir: join(homedir(), '.config', 'orch', 'worktrees'),
};

export const ORCH_CONFIG_DIR = join(homedir(), '.config', 'orch');
export const REGISTRY_PATH = join(ORCH_CONFIG_DIR, 'registry.json');
export const GLOBAL_CONFIG_PATH = join(ORCH_CONFIG_DIR, 'global.yaml');
