export interface WorktreeInfo {
    path: string;
    branch: string;
    commit: string;
}
export declare function createWorktree(repoPath: string, worktreePath: string, branch: string): Promise<void>;
export declare function removeWorktree(repoPath: string, worktreePath: string): Promise<void>;
export declare function listWorktrees(repoPath: string): Promise<WorktreeInfo[]>;
export declare function getDiffStat(worktreePath: string): Promise<string>;
export declare function getChangedFiles(worktreePath: string): Promise<string[]>;
