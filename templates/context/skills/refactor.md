# Skill: Refactor

When planning a refactor, produce an execution plan that includes:

1. **What's being changed** — the specific pattern, module, or structure to refactor
2. **Why** — the invariant being improved (performance, maintainability, correctness)
3. **Files affected** — complete list of files to touch
4. **Migration steps** — ordered, each step must leave the codebase in a working state
5. **Tests to update** — which tests need to change and how
6. **Verification** — what does "done" look like? (tests pass, types check, behavior unchanged)

Refactors must be behavior-preserving unless explicitly noted otherwise.
