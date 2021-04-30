export type LogLevel = "info" | "warn" | "error" | "off"

export default class Logger {
    private static id: number = 0

    // 为每个类分配一个 id
    // 用以区分不同的上传任务
    private id = ++Logger.id

    constructor(
        private level: LogLevel = 'off'
    ) {}

    info(...args: unknown[]) {
        const allowLevel: LogLevel[] = ['info']
        if (allowLevel.includes(this.level)) {
            console.log(`Cloudreve-Uploader [info][${this.id}]: `, ...args)
        }
    }

    warn(...args: unknown[]) {
        const allowLevel: LogLevel[] = ['info','warn']
        if (allowLevel.includes(this.level)) {
            console.warn(`Cloudreve-Uploader [warn][${this.id}]: `, ...args)
        }
    }

    error(...args: unknown[]) {
        const allowLevel: LogLevel[] = ['info','warn','error']
        if (allowLevel.includes(this.level)) {
            console.warn(`Cloudreve-Uploader [error][${this.id}]: `, ...args)
        }
    }
}