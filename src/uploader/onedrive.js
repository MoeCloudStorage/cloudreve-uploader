import Base from "./base";
import { CancelToken, request, requestAPI, } from "../request";
import { MB, sliceFileChunks } from "../utils/file";
// 空函数
const noop = () => { };
// OneDrive 单个分片上传完毕等待时间较久 故单分片大小为100MB
const chunkSize = 100 * MB;
export default class OneDrive extends Base {
    constructor() {
        super(...arguments);
        // 分片列表
        this.chunks = [];
        /* 最后一个分片上传完毕后的 Response
            最后会回调给后端
           */
        this.response = {};
        // 已上传分片总数
        this.loadedChunksCount = 0;
        // 用于取消请求
        this.cancelToken = CancelToken.source();
        this.updateProgress = (event) => {
            if (event.lengthComputable && this.onProgress) {
                // 这里 event 里是一个分片的上传进度
                const total = this.file?.size + 1;
                // 之前上传的总分片部分+该分片上传部分
                const loaded = this.loadedChunksCount * chunkSize + event.loaded;
                const percent = (loaded / total) * 100;
                this.progress = {
                    // 其他数据继续保留
                    ...this.progress,
                    total,
                    loaded,
                    percent,
                };
                this.calcSpeed();
                // 分片上传完毕 loadedChunksCount +1
                if (event.total == event.loaded) {
                    this.loadedChunksCount += 1;
                }
                this.onProgress(this.progress, this.id);
            }
        };
    }
    cancel() {
        if (this.file?.size < 4 * MB) {
            // 小于 4MB 调用中转上传的 cancel
            this.localUploader?.cancel();
            return;
        }
        this.cancelToken.cancel();
    }
    async requestCredential() {
        const query = {
            path: this.options.path,
            size: this.file?.size.toString() ?? "",
            name: this.file?.name ?? "",
            type: "onedrive",
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
        //    OneDrive 文件大小小于 4MB 时中转上传
        if (this.file?.size < 4 * MB) {
            this.localUploader = this.uploader.dispatchUploader("local", this.options, false);
            this.localUploader.file = this.file;
            await this.localUploader.upload((progress, _) => this.onProgress(progress, this.id), (_) => this.onComplete(this.id));
            this.onProgress = noop;
            this.onComplete = noop;
            return;
        }
        const credential = await this.requestCredential();
        this.logger.info(credential);
        const chunks = sliceFileChunks(this.file, chunkSize);
        this.chunks = chunks;
        this.logger.info(chunks, chunkSize);
        this.cancelToken.token.promise.then(() => {
            // throw 阻断程序运行
            throw new Error("aborted!!");
        });
        for (let i = 0; i < chunks.length; i++) {
            await this.uploadChunk(i, chunks[i], credential.data.policy);
        }
        // 上传完毕 回调后端
        const callbackRes = await requestAPI(credential.data.token, {
            method: "POST",
            data: this.response,
            cancelToken: this.cancelToken.token,
        });
        if (callbackRes.data.code !== 0) {
            throw new Error("callback error: " + callbackRes.data.msg);
        }
        this.complete();
    }
    // index 从 0 开始
    async uploadChunk(index, chunk, uploadURL) {
        const headers = [];
        /*
         * OneDrive 分片上传需要提供 "Content-Range" Header
         * 其格式为 bytes 分片起始字节数-分片最后字节数/文件总字节数
         */
        // 最后一个 chunk
        if (index === this.chunks.length - 1) {
            headers.push([
                "Content-Range",
                `bytes ${index * chunkSize}-${this.file?.size - 1}/${this.file?.size}`,
            ]);
        }
        else {
            headers.push([
                "Content-Range",
                `bytes ${index * chunkSize}-${(index + 1) * chunkSize - 1}/${this.file?.size}`,
            ]);
        }
        const xhr = await request(uploadURL, {
            method: "PUT",
            headers,
            body: chunk ?? null,
            onProgress: this.updateProgress,
        });
        const req = xhr.xhr;
        this.cancelToken.token.promise.then(() => {
            // 终止请求
            req.abort();
            throw new Error("aborted!!");
        });
        if (req.status === 201 || req.status === 202) {
            if (req.responseText)
                this.response = JSON.parse(req.responseText);
            return;
        }
        else {
            throw new Error("upload error: " + req.status + " " + req.responseText);
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
//# sourceMappingURL=onedrive.js.map