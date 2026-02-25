#!/usr/bin/env node
import { Command } from 'commander';
import { cmdInit } from './commands/init.js';
import { cmdRun } from './commands/run.js';
import { cmdStatus } from './commands/status.js';
import { cmdResume } from './commands/resume.js';
import { cmdKill } from './commands/kill.js';
import { cmdClean } from './commands/clean.js';

const program = new Command();

program
  .name('orch')
  .description('Deterministic AI orchestration controller')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize .orchestrator/ config in the current repo')
  .option('--repo <path>', 'path to repo (default: cwd)')
  .action((opts) => {
    cmdInit(opts.repo ?? process.cwd()).catch(die);
  });

program
  .command('run <spec>')
  .description('Run a task from a spec/task markdown file')
  .option('--repo <path>', 'path to repo (default: cwd)')
  .option('--no-tmux', 'disable tmux session spawning')
  .action((spec, opts) => {
    cmdRun(spec, {
      repoPath: opts.repo,
      useTmux: opts.tmux !== false,
    }).catch(die);
  });

program
  .command('status')
  .description('Show all task states')
  .option('--filter <status>', 'filter by status (e.g. NEEDS_HUMAN)')
  .action((opts) => {
    cmdStatus(opts.filter);
  });

program
  .command('resume')
  .description('Resume paused or rate-limited tasks')
  .action(() => {
    cmdResume().catch(die);
  });

program
  .command('kill <taskId>')
  .description('Stop a running task and mark it as FAILED')
  .action((taskId) => {
    cmdKill(taskId).catch(die);
  });

program
  .command('clean')
  .description('Remove finished task worktrees and registry entries')
  .option('--all', 'clean all tasks including in-progress')
  .action((opts) => {
    cmdClean({ all: opts.all }).catch(die);
  });

function die(err: unknown): never {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

program.parse();
