# orch — AI Orchestration Controller

A deterministic, repo-agnostic AI orchestration controller. Plug it into any repo, write a task spec, and let it coordinate your AI agents (Claude, Codex, Gemini) through a policy-enforced execution pipeline.

Inspired by the OpenClaw/Zoe architecture. The controller is the product. LLMs are replaceable workers.

---

## Install

```bash
git clone https://github.com/Realjessewebb/orch ~/orchestrator
cd ~/orchestrator
./install.sh
```

This builds the project, links `orch` globally, and scaffolds `~/.config/orch/` with starter context files.

---

## Quick Start

```bash
# In any git repo:
orch init           # creates .orchestrator/ with config files

# Edit these files:
#   .orchestrator/AGENTS.md     — describe your repo for coding agents
#   .orchestrator/commands.yaml — add your lint/typecheck/test commands

# Write a task:
echo "# Task: Add input validation to the signup form" > task.md

# Run it:
orch run task.md

# Check status:
orch status

# Watch agent work live:
tmux attach -t orch-<task-id>
```

---

## Commands

| Command | What it does |
|---|---|
| `orch init` | Set up `.orchestrator/` in current repo |
| `orch run <spec.md>` | Run a task: spawn agent, enforce policy, verify, review |
| `orch status` | Show all tasks and their states |
| `orch resume` | Continue paused or rate-limited tasks |
| `orch kill <task-id>` | Stop a running task |
| `orch clean` | Remove finished worktrees and registry entries |

---

## How It Works

```
You (task spec)
      ↓
  Planner (claude) — has your business context + memory
      ↓
  Execution Plan
      ↓
  Implementer (codex) — has repo conventions + task only
      ↓
  Policy Check — controller enforces: max files, forbidden paths, secret scan
      ↓
  Verification — lint → typecheck → tests (all run by controller, not trusted from model)
      ↓
  Reviewers × 3 — codex (logic), gemini (security), claude (validation)
      ↓
  DONE — branch ready for your review
```

If anything fails: retry with tighter scope. If retries exhausted: `NEEDS_HUMAN`.
If rate limited: pause, auto-resume when tokens refresh.

---

## The Two-Tier Context Split

This is the key design insight. The planner and coding agents have **different context windows** on purpose:

| Planner (your "Zoe") | Coding Agent |
|---|---|
| Business context, customer priorities | Repo conventions (AGENTS.md) |
| Memory of past decisions | Engineering docs, file structure |
| Skills (prompt templates) | The task prompt only |
| Knows the *why* | Knows the *how* |

Mixing these contexts degrades both agents. Keep them separate.

**Your business brain lives at:** `~/.config/orch/context/`
- `MEMORY.md` — decisions, patterns, lessons learned
- `business.md` — customers, priorities, constraints
- `skills/` — reusable prompt templates
- `notes/` — meeting notes (symlink your Obsidian daily notes here)

---

## Per-Repo Config (`.orchestrator/`)

Created by `orch init`. These files are committed to your repo.

### `AGENTS.md` — What coding agents know about your repo
```markdown
# Repo conventions for AI coding agents
## Tech Stack
TypeScript, Node.js, Postgres

## File Structure
src/api/    — Express routes
src/db/     — Database queries
src/types/  — Shared type definitions
...
```

### `policy.yaml` — Guardrails
```yaml
max_changed_files: 20      # stop if agent touches more than this
max_net_loc: 500           # stop if too many lines changed
max_retries: 3             # retry failed verifications N times
secret_scan_enabled: true  # scan for leaked API keys/tokens
forbidden_paths:
  - .env
  - .env.*
  - "*.pem"
  - "*.key"
```

### `commands.yaml` — Verification gates
```yaml
lint:       ["npm run lint"]
typecheck:  ["npm run typecheck"]
test:       ["npm run test"]
```

### `models.yaml` — Which AI to use for each role
```yaml
planner:     claude       # understands the why, writes the plan
implementer: codex        # writes the code
reviewers:
  - codex                 # catches logic errors, edge cases
  - gemini                # catches security issues
  - claude                # validates correctness
```

---

## Obsidian Integration

All context files and run summaries are plain `.md` files. The cleanest setup is to make `context_dir` a folder inside your vault — then everything lives there natively, no syncing needed.

```bash
# Create the orch folder inside your vault
mkdir -p "/path/to/your/vault/orch"

# Symlink ~/.config/orch/context → vault/orch
ln -sf "/path/to/your/vault/orch" ~/.config/orch/context
```

That's it. Now in Obsidian you'll see:
```
vault/
└── orch/
    ├── MEMORY.md         ← your persistent brain
    ├── business.md       ← business context
    ├── skills/           ← reusable prompt templates
    ├── notes/            ← meeting notes (or symlink daily notes here)
    └── runs/             ← every task summary, auto-created after each run
        └── <task-id>/
            └── summary.md
```

Drop your meeting notes into `orch/notes/` and the planner will read the 7 most recent automatically.

---

## tmux — Watching Agents Work

Each `orch run` spawns a named tmux session. tmux lets agent sessions run in the background even if you close your terminal.

```bash
# See all running agent sessions
tmux ls

# Watch an agent work live
tmux attach -t orch-<task-id>

# Detach without killing (agent keeps running)
Ctrl+B, then D

# Send a mid-task correction
tmux send-keys -t orch-<task-id> "Stop. Focus on the API layer only." Enter

# Kill a session
tmux kill-session -t orch-<task-id>
```

---

## Task States

```
PENDING → PLANNING → EXECUTING → VERIFYING → REVIEWING → DONE
                                           ↓
                                       REPAIRING → (retry loop)
                                           ↓ (retries exhausted)
                                       NEEDS_HUMAN

(any state) → RATE_LIMITED → (auto-resume after backoff)
```

- **NEEDS_HUMAN**: Controller stopped. Check `artifacts/<task-id>/summary.md` for what happened.
- **RATE_LIMITED**: Hit your $20/mo plan limit. Run `orch resume` when tokens refresh (default: retry after 5 min).

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `ORCH_CLAUDE_BIN` | Override claude binary path |
| `ORCH_CODEX_BIN` | Override codex binary path |
| `ORCH_GEMINI_BIN` | Override gemini binary path |

---

## Cron (Auto-Resume Loop)

To replicate the article's "cron every 10 minutes" babysitter:

```bash
# Add to crontab: crontab -e
*/10 * * * * /usr/local/bin/orch resume >> ~/.config/orch/cron.log 2>&1
```

---

## Artifacts

Every run produces a structured packet at `<repo>/artifacts/<task-id>/`:

```
summary.md       — human-readable summary of what happened
diffstat.txt     — git diff --stat output
failures/        — one file per failed attempt
  0.txt
  1.txt
logs/            — raw agent output
  planner.log
  executor-0.log
  verify-lint-0.log
reviews/         — all three reviewer outputs
  codex.md
  gemini.md
  claude.md
```

---

## Safety

- Workers never receive raw credentials (env vars flow through, never via prompt)
- Forbidden path violations stop execution immediately
- Secret scanning runs after every agent write
- Unknown FSM signals → NEEDS_HUMAN (fail safe)
- Registry writes are atomic (no corruption on kill)

---

## Glossary

**Git Worktree** — A second checkout of your repo on disk. The AI works here; your main branch is untouched until you decide to merge.

**FSM** — Finite State Machine. A flowchart with strict rules. Tasks move between states (EXECUTING, VERIFYING, etc.) only when a real signal fires (exit code, diff check), never from model claims.

**Policy / Gates** — Rules the controller checks automatically: too many files changed? Forbidden paths touched? Secrets detected? Any violation stops the agent.

**Adapter** — Thin wrapper that makes claude, codex, and gemini look identical to the controller. Swap models by changing one config line.

**Registry** — The controller's notebook at `~/.config/orch/registry.json`. Tracks every task ever run.

**tmux** — Terminal multiplexer. Lets sessions run after you close the terminal, and lets you watch agents work live.
