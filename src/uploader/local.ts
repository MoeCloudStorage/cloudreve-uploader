import Base from "./base";
import { request } from "../request";

interface Res {
  code: number;
  msg: string;
}

export default class Local extends Base {
  // 存放上传 XHR
  private xhr?: XMLHttpRequest;

  cancel() {
    this.status = "stop";
    // 终止上传
    this.xhr?.abort();
  }

  protected async start(): Promise<void> {
    // 上传必须设置的 header
    const headers: Array<[string, string]> = [
      ["content-type", "application/octet-stream"],
      ["x-filename", this.file?.name!!],
      ["x-path", encodeURIComponent(this.options.path)],
    ];

    const response = await request<Res>("/api/v3/file/upload", {
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
    } else {
      throw new Error(response.msg);
    }
  }

  private updateProgress = (
    event: ProgressEvent<XMLHttpRequestEventTarget>
  ) => {
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

  private complete() {
    this.progress = {
      total: this.file?.size!!,
      loaded: this.file?.size!!,
      percent: 100,
    };
    if (this.onProgress) this.onProgress(this.progress, this.id);
    return;
  }
}
