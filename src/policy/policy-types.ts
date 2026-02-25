export type ViolationType =
  | 'TOO_MANY_FILES'
  | 'TOO_MANY_LOC'
  | 'FORBIDDEN_PATH'
  | 'SECRET_DETECTED';

export interface PolicyViolation {
  type: ViolationType;
  detail: string;
}

export interface PolicyResult {
  passed: boolean;
  violations: PolicyViolation[];
}

export interface DiffStats {
  changedFiles: number;
  insertions: number;
  deletions: number;
  netLoc: number;
  changedFilePaths: string[];
}
