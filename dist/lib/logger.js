var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { config } from './config';
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
var Logger = /** @class */ (function () {
    function Logger() {
        this.logLevel = this.parseLogLevel(config.logging.level);
    }
    Logger.getInstance = function () {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    };
    Logger.prototype.parseLogLevel = function (level) {
        switch (level.toLowerCase()) {
            case LogLevel.ERROR:
                return LogLevel.ERROR;
            case LogLevel.WARN:
                return LogLevel.WARN;
            case LogLevel.INFO:
                return LogLevel.INFO;
            case LogLevel.DEBUG:
                return LogLevel.DEBUG;
            default:
                return LogLevel.INFO;
        }
    };
    Logger.prototype.shouldLog = function (level) {
        var levels = Object.values(LogLevel);
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    };
    Logger.prototype.formatLog = function (entry) {
        var base = {
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
        };
        if (entry.metadata) {
            Object.assign(base, { metadata: entry.metadata });
        }
        if (entry.error) {
            Object.assign(base, {
                error: {
                    name: entry.error.name,
                    message: entry.error.message,
                    stack: entry.error.stack,
                },
            });
        }
        return config.logging.format === 'json'
            ? JSON.stringify(base)
            : this.formatPlainText(base);
    };
    Logger.prototype.formatPlainText = function (entry) {
        var parts = [
            "[".concat(entry.timestamp, "]"),
            "[".concat(entry.level.toUpperCase(), "]"),
            entry.message,
        ];
        if (entry.metadata) {
            parts.push(JSON.stringify(entry.metadata));
        }
        if (entry.error) {
            parts.push("\nError: ".concat(entry.error.message));
            if (entry.error.stack) {
                parts.push("\nStack: ".concat(entry.error.stack));
            }
        }
        return parts.join(' ');
    };
    Logger.prototype.createLogEntry = function (level, message, metadata, error) {
        return {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            metadata: metadata,
            error: error,
        };
    };
    Logger.prototype.error = function (message, metadata, error) {
        if (this.shouldLog(LogLevel.ERROR)) {
            var entry = this.createLogEntry(LogLevel.ERROR, message, metadata, error);
            console.error(this.formatLog(entry));
        }
    };
    Logger.prototype.warn = function (message, metadata) {
        if (this.shouldLog(LogLevel.WARN)) {
            var entry = this.createLogEntry(LogLevel.WARN, message, metadata);
            console.warn(this.formatLog(entry));
        }
    };
    Logger.prototype.info = function (message, metadata) {
        if (this.shouldLog(LogLevel.INFO)) {
            var entry = this.createLogEntry(LogLevel.INFO, message, metadata);
            console.info(this.formatLog(entry));
        }
    };
    Logger.prototype.debug = function (message, metadata) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            var entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
            console.debug(this.formatLog(entry));
        }
    };
    Logger.prototype.request = function (req, metadata) {
        if (this.shouldLog(LogLevel.INFO)) {
            var requestMetadata = __assign({ method: req.method, url: req.url, headers: Object.fromEntries(req.headers) }, metadata);
            var entry = this.createLogEntry(LogLevel.INFO, 'Incoming request', requestMetadata);
            console.info(this.formatLog(entry));
        }
    };
    Logger.prototype.response = function (status, duration, metadata) {
        if (this.shouldLog(LogLevel.INFO)) {
            var responseMetadata = __assign({ status: status, duration: "".concat(duration, "ms") }, metadata);
            var entry = this.createLogEntry(LogLevel.INFO, 'Outgoing response', responseMetadata);
            console.info(this.formatLog(entry));
        }
    };
    return Logger;
}());
// Export singleton instance
export var logger = Logger.getInstance();
