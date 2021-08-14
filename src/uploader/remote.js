import Base from "./base";
import { CancelToken, request, requestAPI } from "../request";
export default class Remote extends Base {
    constructor() {
        super(...arguments);
        // 用于取消请求
        this.cancelToken = CancelToken.source();
        this.updateProgress = (event) => {
            if (event.lengthComputable && this.onProgress) {
                const total = event.total + 1;
                const loaded = event.loaded;
                const percent = (total / loaded) * 100;
                this.progress = {
                    ...this.progress,
                    total,
                    loaded,
                    percent,
                };
                this.calcSpeed();
                this.onProgress(this.progress, this.id);
            }
        };
    }
    cancel() {
        this.cancelToken.cancel();
    }
    // 从机上传前须请求后端获得上传令牌
    async requestCredential() {
        const query = {
            path: this.options.path,
            size: this.file?.size.toString() ?? "",
            name: this.file?.name ?? "",
            type: "remote",
        };
        const res = await requestAPI(`/api/v3/file/upload/credential?${new URLSearchParams(query).toString()}`, {
            cancelToken: this.cancelToken.token,
        });
        if (res.data.code !== 0) {
            throw new Error("requestCredential error: " + res.data);
        }
        return res.data;
    }
    async start() {
        const credential = await this.requestCredential();
        this.logger.info(credential);
        // 上传必须设置的 header
        const headers = [
            ["content-type", "application/octet-stream"],
            ["authorization", credential.data.token],
            ["x-filename", this.file?.name],
            ["x-overwrite", "false"],
            ["x-policy", credential.data.policy],
        ];
        this.cancelToken.token.promise.then(() => {
            // 取消当前上传
            this.xhr?.abort();
            // throw 阻断后面运行
            throw new Error("aborted!!");
        });
        const response = await request(this.options.uploadURL, {
            method: "POST",
            headers,
            body: this.file ?? null,
            onProgress: this.updateProgress,
        });
        this.xhr = response.xhr;
        this.logger.info("response", response, this.file);
        if (response.code === 0) {
            this.complete();
        }
        else {
            throw new Error(response.msg);
        }
    }
    complete() {
        this.progress = {
            ...this.progress,
            total: this.file?.size,
            loaded: this.file?.size,
            percent: 100,
        };
        if (this.onProgress)
            this.onProgress(this.progress, this.id);
        return;
    }
}
//# sourceMappingURL=remote.js.map