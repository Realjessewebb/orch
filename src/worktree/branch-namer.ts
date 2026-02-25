// Generates a deterministic, safe branch name from a task ID
export function makeBranchName(taskId: string): string {
  return `orch/${taskId}`;
}
