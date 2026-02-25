import { join } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { readTextFile } from '../util/fs-helpers.js';
// Loads the orchestrator's knowledge base from ~/.config/orch/context/
// This is ZOE's brain — business context, memory, skills
export function loadOrchestratorContext(global) {
    const dir = global.context_dir;
    const memory = readTextFile(join(dir, 'MEMORY.md')) ?? '';
    const business = readTextFile(join(dir, 'business.md')) ?? '';
    const skills = {};
    const skillsDir = join(dir, 'skills');
    if (existsSync(skillsDir)) {
        for (const file of readdirSync(skillsDir)) {
            if (file.endsWith('.md')) {
                const name = file.replace('.md', '');
                skills[name] = readTextFile(join(skillsDir, file)) ?? '';
            }
        }
    }
    // Load notes/ directory (daily notes, meeting summaries)
    let notes = '';
    const notesDir = join(dir, 'notes');
    if (existsSync(notesDir)) {
        const noteFiles = readdirSync(notesDir)
            .filter((f) => f.endsWith('.md'))
            .sort()
            .slice(-7); // last 7 notes (avoid context overload)
        for (const file of noteFiles) {
            const content = readTextFile(join(notesDir, file));
            if (content)
                notes += `\n## ${file}\n${content}\n`;
        }
    }
    return { memory, business, skills, notes };
}
// Loads the AGENTS.md from a repo — the only context coding agents receive about the repo
export function loadAgentsMd(orchestratorDir) {
    return readTextFile(join(orchestratorDir, 'AGENTS.md')) ?? '';
}
//# sourceMappingURL=context-loader.js.map