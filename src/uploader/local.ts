import Base from "./base";
import { request } from "../request";

interface Res {
  code: number;
  msg: string;
}

export default class Local extends Base {
  protected async start(): Promise<void> {
    const headers: Array<[string, string]> = [
      ["content-type", "application/octet-stream"],
      ["x-filename", this.file?.name!!],
      ["x-path", encodeURIComponent(this.options.path)],
    ];

    const response = (await request<Res>("/api/v3/file/upload", {
      method: "POST",
      headers,
      body: this.file ?? null,
      onProgress: this.updateProgress,
    })) as Res;

    this.logger.info("response", response, this.file);

    if (response.code === 0) {
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
        total: event.total + 1,
        loaded: event.loaded,
        percent: ((event.loaded + 1) / event.total) * 100,
      };
      this.onProgress(this.progress);
    }
  };

  private complete() {
    this.progress = {
      total: this.file?.size!!,
      loaded: this.file?.size!!,
      percent: 100,
    };
    if (this.onProgress) this.onProgress(this.progress);
    return;
  }
}
