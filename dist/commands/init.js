import { join } from 'node:path';
import { existsSync, appendFileSync } from 'node:fs';
import { writeTextFile, ensureDir } from '../util/fs-helpers.js';
import { DEFAULT_POLICY, DEFAULT_COMMANDS, DEFAULT_MODELS } from '../config/config-defaults.js';
import yaml from 'js-yaml';
const AGENTS_MD_TEMPLATE = `# AGENTS.md — Repo conventions for AI coding agents

This file is the ONLY context coding agents receive about this repo.
Keep it accurate. Update it as the codebase evolves.

## Project Overview
<!-- Describe what this project does in 2-3 sentences -->

## Tech Stack
<!-- e.g., TypeScript, Node.js, React, PostgreSQL -->

## File Structure
<!-- Key directories and what they contain -->

## Code Style
<!-- Formatting, naming conventions, patterns to follow -->

## Testing
<!-- How to run tests, where tests live, what to test -->

## Important Constraints
<!-- Things the agent must NOT do in this repo -->
`;
export async function cmdInit(repoPath) {
    const orchDir = join(repoPath, '.orchestrator');
    ensureDir(orchDir);
    const files = [
        { name: 'policy.yaml', content: yaml.dump(DEFAULT_POLICY) },
        { name: 'commands.yaml', content: yaml.dump(DEFAULT_COMMANDS) },
        { name: 'models.yaml', content: yaml.dump(DEFAULT_MODELS) },
        { name: 'AGENTS.md', content: AGENTS_MD_TEMPLATE },
    ];
    for (const { name, content } of files) {
        const filePath = join(orchDir, name);
        if (existsSync(filePath)) {
            console.log(`  skip  ${name} (already exists)`);
        }
        else {
            writeTextFile(filePath, content);
            console.log(`  create  .orchestrator/${name}`);
        }
    }
    // Gitignore the artifacts directory
    const gitignorePath = join(repoPath, '.gitignore');
    const gitignoreEntry = '\n# orch artifacts\nartifacts/\n';
    if (existsSync(gitignorePath)) {
        const content = (await import('node:fs')).readFileSync(gitignorePath, 'utf8');
        if (!content.includes('artifacts/')) {
            appendFileSync(gitignorePath, gitignoreEntry);
            console.log('  update  .gitignore (added artifacts/)');
        }
    }
    else {
        writeTextFile(gitignorePath, gitignoreEntry.trim() + '\n');
        console.log('  create  .gitignore');
    }
    console.log('\norch initialized. Next steps:');
    console.log('  1. Edit .orchestrator/AGENTS.md — describe your repo for coding agents');
    console.log('  2. Edit .orchestrator/commands.yaml — add your lint/typecheck/test commands');
    console.log('  3. Edit .orchestrator/models.yaml — choose which models to use');
    console.log('  4. Run: orch run <task.md>');
}
//# sourceMappingURL=init.js.map