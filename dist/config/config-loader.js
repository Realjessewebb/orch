import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { DEFAULT_POLICY, DEFAULT_COMMANDS, DEFAULT_MODELS, DEFAULT_GLOBAL, GLOBAL_CONFIG_PATH, } from './config-defaults.js';
export class ConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}
function loadYaml(filePath) {
    if (!existsSync(filePath))
        return {};
    try {
        const raw = yaml.load(readFileSync(filePath, 'utf8'));
        return raw ?? {};
    }
    catch (e) {
        throw new ConfigError(`Failed to parse ${filePath}: ${String(e)}`);
    }
}
export function loadGlobalConfig() {
    const raw = loadYaml(GLOBAL_CONFIG_PATH);
    return { ...DEFAULT_GLOBAL, ...raw };
}
export function loadProjectConfig(projectRoot) {
    const orchestratorDir = join(projectRoot, '.orchestrator');
    if (!existsSync(orchestratorDir)) {
        throw new ConfigError(`No .orchestrator/ directory found in ${projectRoot}. Run 'orch init' first.`);
    }
    const policy = {
        ...DEFAULT_POLICY,
        ...loadYaml(join(orchestratorDir, 'policy.yaml')),
    };
    const commands = {
        ...DEFAULT_COMMANDS,
        ...loadYaml(join(orchestratorDir, 'commands.yaml')),
    };
    const rawModels = loadYaml(join(orchestratorDir, 'models.yaml'));
    const models = {
        ...DEFAULT_MODELS,
        ...rawModels,
    };
    const global = loadGlobalConfig();
    return { policy, commands, models, global, projectRoot, orchestratorDir };
}
//# sourceMappingURL=config-loader.js.map