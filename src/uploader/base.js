import Logger from "../logger";
import { check } from "./checker";
// 所有 Uploader 的基类
export default class Base {
    constructor(id, uploader, options) {
        this.id = id;
        this.uploader = uploader;
        this.progress = {
            loaded: 0,
            total: 0,
            percent: 0,
            speed: 0,
            lastLoaded: 0,
            lastTime: new Date().getTime(),
        };
        this.upload = async (onProgress, onComplete) => {
            this.onProgress = onProgress;
            this.onComplete = onComplete;
            try {
                await this.check();
                this.logger.info("Upload start", this.file);
                await this.start();
                this.logger.info("Upload complete", this.file);
                this.onComplete(this.id);
            }
            catch (err) {
                this.logger.error(err);
                throw err;
            }
        };
        this.options = options;
        this.logger = new Logger(options.logLevel, id);
        this.logger.info("options: ", options);
    }
    // 设置上传路径
    async setPath(path) {
        this.options.path = path;
        return this;
    }
    async check() {
        check(this.file ?? null, this.options);
        return this;
    }
    calcSpeed() {
        // 用这次时间戳减上次时间戳 除以 1000 得到间隔秒数
        const nowTime = new Date().getTime();
        const lastTime = this.progress.lastTime;
        const elapsed = (nowTime - lastTime) / 1000;
        // 上次字节数减这次字节数 得到间隔字节数
        const uploadedBytes = this.progress.loaded - this.progress.lastLoaded;
        // 当间隔秒数/上传字节数为 0 时 继续返回上次速度
        this.progress.speed =
            elapsed && uploadedBytes ? uploadedBytes / elapsed : this.progress.speed;
        this.progress.lastTime = nowTime;
        this.progress.lastLoaded = this.progress.loaded;
    }
}
//# sourceMappingURL=base.js.map