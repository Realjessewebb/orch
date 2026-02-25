import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { PolicyConfig, CommandsConfig, ModelsConfig, GlobalConfig, ProjectConfig } from './config-types.js';
import {
  DEFAULT_POLICY,
  DEFAULT_COMMANDS,
  DEFAULT_MODELS,
  DEFAULT_GLOBAL,
  GLOBAL_CONFIG_PATH,
} from './config-defaults.js';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function loadYaml<T>(filePath: string): Partial<T> {
  if (!existsSync(filePath)) return {};
  try {
    const raw = yaml.load(readFileSync(filePath, 'utf8'));
    return (raw as Partial<T>) ?? {};
  } catch (e) {
    throw new ConfigError(`Failed to parse ${filePath}: ${String(e)}`);
  }
}

export function loadGlobalConfig(): GlobalConfig {
  const raw = loadYaml<GlobalConfig>(GLOBAL_CONFIG_PATH);
  return { ...DEFAULT_GLOBAL, ...raw };
}

export function loadProjectConfig(projectRoot: string): ProjectConfig {
  const orchestratorDir = join(projectRoot, '.orchestrator');

  if (!existsSync(orchestratorDir)) {
    throw new ConfigError(
      `No .orchestrator/ directory found in ${projectRoot}. Run 'orch init' first.`
    );
  }

  const policy: PolicyConfig = {
    ...DEFAULT_POLICY,
    ...loadYaml<PolicyConfig>(join(orchestratorDir, 'policy.yaml')),
  };

  const commands: CommandsConfig = {
    ...DEFAULT_COMMANDS,
    ...loadYaml<CommandsConfig>(join(orchestratorDir, 'commands.yaml')),
  };

  const rawModels = loadYaml<ModelsConfig>(join(orchestratorDir, 'models.yaml'));
  const models: ModelsConfig = {
    ...DEFAULT_MODELS,
    ...rawModels,
  };

  const global = loadGlobalConfig();

  return { policy, commands, models, global, projectRoot, orchestratorDir };
}
