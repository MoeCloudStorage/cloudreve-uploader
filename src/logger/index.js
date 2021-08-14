export default class Logger {
    constructor(level = "off", id = ++Logger.id) {
        this.level = level;
        this.id = id;
    }
    info(...args) {
        const allowLevel = ["info"];
        if (allowLevel.includes(this.level)) {
            console.log(`Cloudreve-Uploader [info][${this.id}]: `, ...args);
        }
    }
    warn(...args) {
        const allowLevel = ["info", "warn"];
        if (allowLevel.includes(this.level)) {
            console.warn(`Cloudreve-Uploader [warn][${this.id}]: `, ...args);
        }
    }
    error(...args) {
        const allowLevel = ["info", "warn", "error"];
        if (allowLevel.includes(this.level)) {
            console.warn(`Cloudreve-Uploader [error][${this.id}]: `, ...args);
        }
    }
}
Logger.id = 0;
//# sourceMappingURL=index.js.map