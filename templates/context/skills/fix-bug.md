# Skill: Fix Bug

When planning a bug fix, produce an execution plan that includes:

1. **Root cause** — identify the exact line(s) or logic causing the bug
2. **Files to change** — list exact paths
3. **The fix** — describe the change in plain terms (the agent will implement it)
4. **Test to add** — a regression test that would have caught this bug
5. **Scope limit** — explicitly state what NOT to change (avoid scope creep)

Keep the repair minimal. Fix the bug; don't refactor surrounding code.
