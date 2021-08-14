import Local from "./local";
import OneDrive from "./onedrive";
import Remote from "./remote";
import { TaskQueue } from "../utils/taskqueue";
// 单页面可共用同一 CloudreveUploader
export default class CloudreveUploader {
    constructor() {
        // 所有通过同一 CloudreveUploader 创建的 Uploader 都会存放在此 Map
        // 键为 Base.id
        this.uploaders = new Map();
        this.uploaderId = 0;
    }
    /* 分配 Uploader
     * push 是否将此 Uploader 放进 Map
     */
    dispatchUploader(policyType, options, push = true) {
        let uploader;
        const id = ++this.uploaderId;
        switch (policyType) {
            case "local":
                uploader = new Local(id, this, options);
                break;
            case "onedrive":
                uploader = new OneDrive(id, this, options);
                break;
            case "remote":
                uploader = new Remote(id, this, options);
                break;
            default:
                throw Error("Unknown policy type!!");
        }
        if (push)
            this.uploaders.set(id, uploader);
        return uploader;
    }
    // 选择单个文件
    // 上传 Base.upload()
    pickSingleFile(policyType, options) {
        return new Promise((resolve) => {
            document.getElementById("upload-button")?.remove();
            const element = document.createElement("input");
            element.id = "upload-button";
            element.type = "file";
            element.hidden = true;
            element.onchange = (event) => {
                const files = event?.target.files;
                const uploader = this.dispatchUploader(policyType, options);
                if (files != null && files.length > 0) {
                    uploader.file = files.item(0);
                }
                resolve(uploader);
            };
            document.body.appendChild(element);
            document.getElementById("upload-button")?.click();
        });
    }
    batchUpload(onProgress, onComplete) {
        const taskQueue = new TaskQueue((uploader) => uploader.upload(onProgress, onComplete), 5);
        const uploads = [];
        this.uploaders.forEach((uploader) => uploads.push(taskQueue.enqueue(uploader)));
        return Promise.all(uploads);
    }
}
//# sourceMappingURL=index.js.map