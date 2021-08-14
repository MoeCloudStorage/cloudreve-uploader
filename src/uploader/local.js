import Base from "./base";
import { request } from "../request";
export default class Local extends Base {
    constructor() {
        super(...arguments);
        this.updateProgress = (event) => {
            if (event.lengthComputable && this.onProgress) {
                this.progress = {
                    // +1 为了避免没有完毕就 100%
                    total: event.total + 1,
                    loaded: event.loaded,
                    percent: ((event.loaded + 1) / event.total) * 100,
                };
                this.onProgress(this.progress, this.id);
            }
        };
    }
    cancel() {
        // 终止上传
        this.xhr?.abort();
    }
    async start() {
        // 上传必须设置的 header
        const headers = [
            ["content-type", "application/octet-stream"],
            ["x-filename", this.file?.name],
            ["x-path", encodeURIComponent(this.options.path)],
        ];
        const response = await request("/api/v3/file/upload", {
            method: "POST",
            headers,
            body: this.file ?? null,
            onProgress: this.updateProgress,
        });
        this.logger.info("response", response, this.file);
        this.xhr = response.xhr;
        if (response.code === 0) {
            // 完成上传
            this.complete();
        }
        else {
            throw new Error(response.msg);
        }
    }
    complete() {
        this.progress = {
            total: this.file?.size,
            loaded: this.file?.size,
            percent: 100,
        };
        if (this.onProgress)
            this.onProgress(this.progress, this.id);
        return;
    }
}
//# sourceMappingURL=local.js.map