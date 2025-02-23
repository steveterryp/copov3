import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

/**
 * Logger utility
 */
class Logger {
  private level: LogLevel;
  private format: 'json' | 'text';

  constructor() {
    this.level = config.logging.level as LogLevel;
    this.format = config.logging.format as 'json' | 'text';
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('debug')) {
      this.log('debug', message, metadata);
    }
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('info')) {
      this.log('info', message, metadata);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('warn')) {
      this.log('warn', message, metadata);
    }
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: LogMetadata) {
    if (this.shouldLog('error')) {
      this.log('error', message, metadata);
    }
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.level);
    const targetLevel = levels.indexOf(level);
    return targetLevel >= currentLevel;
  }

  /**
   * Format log entry
   */
  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const data = {
      timestamp,
      level,
      message,
      ...metadata,
    };

    if (this.format === 'json') {
      return JSON.stringify(data);
    }

    let text = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (metadata) {
      text += ` ${JSON.stringify(metadata)}`;
    }
    return text;
  }

  /**
   * Write log entry
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const formattedLog = this.formatLog(level, message, metadata);

    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }
}

export const logger = new Logger();
