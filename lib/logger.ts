type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Production-safe logger utility
 * Suppresses debug logs in production environments
 */
class Logger {
    private isProduction: boolean;

    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    private formatMessage(level: LogLevel, message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        return [`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args];
    }

    debug(message: string, ...args: any[]) {
        // Only log debug messages in development or test
        if (!this.isProduction || process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true') {
            console.debug(...this.formatMessage('debug', message, ...args));
        }
    }

    info(message: string, ...args: any[]) {
        console.info(...this.formatMessage('info', message, ...args));
    }

    warn(message: string, ...args: any[]) {
        console.warn(...this.formatMessage('warn', message, ...args));
    }

    error(message: string, ...args: any[]) {
        console.error(...this.formatMessage('error', message, ...args));
    }
}

export const logger = new Logger();
