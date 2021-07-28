import Base, { CredentialRes } from "./base";
import {
  CancelToken,
  CancelTokenSource,
  request,
  requestAPI,
} from "../request";
import { Uploader } from "./index";
import { MB, sliceFileChunks } from "../utils/file";

const noop = () => {};

const chunkSize = 100 * MB;

export default class OneDrive extends Base {
  private chunks: Blob[] = [];
  private response: any = {};
  private loadedChunksCount: number = 0;
  private cancelToken: CancelTokenSource = CancelToken.source();
  private aborted: boolean = false;
  private req?: XMLHttpRequest;

  protected async requestCredential() {
    const query: Record<string, string> = {
      path: this.options.path,
      size: this.file?.size.toString() ?? "",
      name: this.file?.name ?? "",
      type: "onedrive",
    };

    const res = await requestAPI<CredentialRes>(
      `/api/v3/file/upload/credential?${new URLSearchParams(query).toString()}`,
      {
        cancelToken: this.cancelToken.token,
      }
    );
    if (res.data.code !== 0) {
      throw new Error("requestCredential error: " + res.data);
    }

    return res.data;
  }

  protected async start() {
    //    OneDrive 文件大小小于 4MB 时中转上传
    if (this.file?.size!! < 4 * MB) {
      const uploader = Uploader("local", this.options);
      uploader.file = this.file;

      await uploader.uploadFile(this.onProgress!!, this.onComplete!!);

      this.onProgress = noop;
      this.onComplete = noop;

      return;
    }

    const credential = await this.requestCredential();
    this.logger.info(credential);

    const chunks = sliceFileChunks(this.file!!, chunkSize);
    this.chunks = chunks;
    this.logger.info(chunks, chunkSize);

    this.cancelToken.token.promise.then(() => {
      if (this.aborted) return;

      this.aborted = true;
      this.req?.abort();
    });

    for (let i = 0; i < chunks.length; i++) {
      if (this.aborted) return;
      await this.uploadChunk(i, chunks[i], credential.data.policy);
    }

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

  private async uploadChunk(index: number, chunk: Blob, uploadURL: string) {
    const headers: Array<[string, string]> = [];

    // 最后一个 chunk
    if (index === this.chunks.length - 1) {
      headers.push([
        "Content-Range",
        `bytes ${index * chunkSize}-${this.file?.size!! - 1}/${
          this.file?.size
        }`,
      ]);
    } else {
      headers.push([
        "Content-Range",
        `bytes ${index * chunkSize}-${(index + 1) * chunkSize - 1}/${
          this.file?.size
        }`,
      ]);
    }

    const xhr = (await request(uploadURL, {
      method: "PUT",
      headers,
      body: chunk ?? null,
      onProgress: this.updateProgress,
      returnXHR: true,
    })) as XMLHttpRequest;

    this.req = xhr;

    if (xhr.status === 201 || xhr.status === 202) {
      if (xhr.responseText) this.response = JSON.parse(xhr.responseText);
      return;
    } else {
      throw new Error("upload error: " + xhr.status + " " + xhr.responseText);
    }
  }

  private updateProgress = (
    event: ProgressEvent<XMLHttpRequestEventTarget>
  ) => {
    if (event.lengthComputable && this.onProgress) {
      const total = this.file?.size!! + 1;
      const loaded = this.loadedChunksCount * chunkSize + event.loaded;
      const percent = (loaded / total) * 100;
      this.progress = {
        ...this.progress,
        total,
        loaded,
        percent,
      };

      this.calcSpeed();
      if (event.total == event.loaded) {
        this.loadedChunksCount += 1;
      }
      this.onProgress(this.progress);
    }
  };

  private complete() {
    this.progress = {
      ...this.progress,
      total: this.file?.size!!,
      loaded: this.file?.size!!,
      percent: 100,
    };
    if (this.onProgress) this.onProgress(this.progress);
    return;
  }

  cancel(): void {
    this.cancelToken.cancel();
  }
}
