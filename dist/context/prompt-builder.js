// Builds the prompt for the PLANNER model.
// Injects orchestrator context (business, memory, skills) — the "why".
// The planner's output becomes the executor's task instruction.
export function buildPlannerPrompt(specContent, context, skillName) {
    const parts = [];
    if (context.memory.trim()) {
        parts.push(`[MEMORY]\n${context.memory.trim()}`);
    }
    if (context.business.trim()) {
        parts.push(`[BUSINESS CONTEXT]\n${context.business.trim()}`);
    }
    if (context.notes.trim()) {
        parts.push(`[RECENT NOTES]\n${context.notes.trim()}`);
    }
    parts.push(`[TASK SPEC]\n${specContent.trim()}`);
    if (skillName && context.skills[skillName]) {
        parts.push(`[SKILL: ${skillName}]\n${context.skills[skillName].trim()}`);
    }
    parts.push(`[INSTRUCTION]
Generate a precise execution plan for a coding agent.
The coding agent has NO business context — give it exact file-level instructions only.
Specify: which files to create/modify/delete, what logic to implement, what tests to write.
Do NOT include rationale or business reasoning in the plan (the agent doesn't need it).
Output the plan as a structured markdown document.`);
    return parts.join('\n\n---\n\n');
}
// Builds the prompt for the IMPLEMENTER (executor) model.
// Contains ONLY: repo conventions (AGENTS.md) + task plan. No business context.
export function buildExecutorPrompt(executionPlan, agentsMd) {
    const parts = [];
    if (agentsMd.trim()) {
        parts.push(`[REPO CONVENTIONS]\n${agentsMd.trim()}`);
    }
    parts.push(`[TASK]\n${executionPlan.trim()}`);
    parts.push(`[INSTRUCTION]
Implement exactly what is described in [TASK].
Follow all conventions in [REPO CONVENTIONS].
Do not invent requirements. Do not change files outside the scope listed.
Write code changes only. Commit nothing — the controller handles git.`);
    return parts.join('\n\n---\n\n');
}
// Builds the repair prompt when a previous execution failed.
// Adds failure context on top of the executor prompt.
export function buildRepairPrompt(executionPlan, agentsMd, failureOutput, violations, retriesRemaining, allowedFiles) {
    const parts = [];
    if (agentsMd.trim()) {
        parts.push(`[REPO CONVENTIONS]\n${agentsMd.trim()}`);
    }
    parts.push(`[TASK]\n${executionPlan.trim()}`);
    const failureLines = [
        '[PREVIOUS FAILURE]',
        failureOutput.slice(0, 4000), // trim to avoid context overload
    ];
    if (violations.length > 0) {
        failureLines.push('', 'POLICY VIOLATIONS:');
        for (const v of violations) {
            failureLines.push(`  - ${v.type}: ${v.detail}`);
        }
    }
    failureLines.push('', `Remaining retries after this attempt: ${retriesRemaining}`);
    parts.push(failureLines.join('\n'));
    if (allowedFiles && allowedFiles.length > 0) {
        parts.push(`[SCOPE RESTRICTION]\nYou may only edit these files (controller is enforcing this):\n${allowedFiles.map((f) => `  - ${f}`).join('\n')}`);
    }
    parts.push(`[INSTRUCTION]
Fix the failure described above.
Do not change files outside the allowed scope.
Do not repeat the same approach that just failed.`);
    return parts.join('\n\n---\n\n');
}
// Builds the reviewer prompt. Gets the diff + original task to review.
export function buildReviewerPrompt(diffstat, diffContent, originalSpec, modelRole) {
    const focus = {
        codex: 'Focus on: logic errors, edge cases, missing error handling, race conditions.',
        gemini: 'Focus on: security vulnerabilities, scalability issues, and suggest specific fixes.',
        claude: 'Focus on: correctness validation, type safety, and any critical issues only.',
    };
    return `[ORIGINAL TASK SPEC]
${originalSpec.trim()}

---

[DIFF STAT]
${diffstat.trim()}

---

[DIFF]
${diffContent.slice(0, 8000)}

---

[INSTRUCTION]
Review this code change. ${focus[modelRole] ?? ''}
If you find a critical issue that blocks merging, respond with "NEEDS_HUMAN: <reason>".
Otherwise provide a concise review with specific line references where applicable.`;
}
//# sourceMappingURL=prompt-builder.js.map