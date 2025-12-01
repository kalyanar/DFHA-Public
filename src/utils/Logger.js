// utils/Logger.js
// Simple console logger for POC

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

class Logger {
    constructor() {
        this.level = process.env.LOG_LEVEL || 'INFO';
    }

    debug(...args) {
        if (LOG_LEVELS[this.level] <= LOG_LEVELS.DEBUG) {
            console.log('[DEBUG]', new Date().toISOString(), ...args);
        }
    }

    info(...args) {
        if (LOG_LEVELS[this.level] <= LOG_LEVELS.INFO) {
            console.log('[INFO]', new Date().toISOString(), ...args);
        }
    }

    warn(...args) {
        if (LOG_LEVELS[this.level] <= LOG_LEVELS.WARN) {
            console.warn('[WARN]', new Date().toISOString(), ...args);
        }
    }

    error(...args) {
        if (LOG_LEVELS[this.level] <= LOG_LEVELS.ERROR) {
            console.error('[ERROR]', new Date().toISOString(), ...args);
        }
    }
}

// Export singleton instance
module.exports = new Logger();
