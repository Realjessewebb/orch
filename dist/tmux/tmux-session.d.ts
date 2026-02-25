export declare function tmuxAvailable(): Promise<boolean>;
export declare function createSession(sessionName: string, cwd: string): Promise<boolean>;
export declare function sendKeys(sessionName: string, keys: string): Promise<boolean>;
export declare function killSession(sessionName: string): Promise<void>;
export declare function sessionExists(sessionName: string): Promise<boolean>;
export declare function listOrchSessions(): Promise<string[]>;
