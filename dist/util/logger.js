import { appendFileSync } from 'node:fs';
import { ensureDir } from './fs-helpers.js';
import { dirname } from 'node:path';
const LEVEL_COLOR = {
    DEBUG: '\x1b[90m', // gray
    INFO: '\x1b[36m', // cyan
    WARN: '\x1b[33m', // yellow
    ERROR: '\x1b[31m', // red
};
const RESET = '\x1b[0m';
export class Logger {
    logFilePath;
    prefix;
    constructor(logFilePath = null, prefix = '') {
        this.logFilePath = logFilePath;
        this.prefix = prefix;
    }
    write(level, message, data) {
        const ts = new Date().toISOString();
        const tag = this.prefix ? `[${this.prefix}] ` : '';
        const line = `${ts} ${level} ${tag}${message}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`;
        // Stderr: colorized human-readable
        const color = LEVEL_COLOR[level];
        process.stderr.write(`${color}${line}${RESET}\n`);
        // Log file: plain JSON line
        if (this.logFilePath) {
            try {
                ensureDir(dirname(this.logFilePath));
                appendFileSync(this.logFilePath, line + '\n', 'utf8');
            }
            catch {
                // Log file write failure should never crash the controller
            }
        }
    }
    debug(msg, data) { this.write('DEBUG', msg, data); }
    info(msg, data) { this.write('INFO', msg, data); }
    warn(msg, data) { this.write('WARN', msg, data); }
    error(msg, data) { this.write('ERROR', msg, data); }
}
// Global default logger (no file)
export const log = new Logger();
//# sourceMappingURL=logger.js.map