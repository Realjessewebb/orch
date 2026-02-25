import { exec } from '../util/exec.js';
import { log } from '../util/logger.js';

export async function tmuxAvailable(): Promise<boolean> {
  const result = await exec('which', ['tmux']);
  return result.exitCode === 0;
}

export async function createSession(
  sessionName: string,
  cwd: string
): Promise<boolean> {
  const result = await exec('tmux', [
    'new-session', '-d', '-s', sessionName, '-c', cwd,
  ]);
  if (result.exitCode !== 0) {
    log.warn(`Failed to create tmux session '${sessionName}': ${result.stderr}`);
    return false;
  }
  return true;
}

export async function sendKeys(
  sessionName: string,
  keys: string
): Promise<boolean> {
  const result = await exec('tmux', [
    'send-keys', '-t', sessionName, keys, 'Enter',
  ]);
  return result.exitCode === 0;
}

export async function killSession(sessionName: string): Promise<void> {
  await exec('tmux', ['kill-session', '-t', sessionName]);
}

export async function sessionExists(sessionName: string): Promise<boolean> {
  const result = await exec('tmux', ['has-session', '-t', sessionName]);
  return result.exitCode === 0;
}

export async function listOrchSessions(): Promise<string[]> {
  const result = await exec('tmux', ['ls', '-F', '#{session_name}']);
  if (result.exitCode !== 0) return [];
  return result.stdout
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('orch-'));
}
