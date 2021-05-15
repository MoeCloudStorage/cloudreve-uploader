import Base from "./base";
import { requestAPI } from "../request";
import { Uploader } from "./index";

const noop = () => {};

export default class OneDrive extends Base {
  protected async requestCredential() {
    try {
      const query: Record<string, string> = {
        path: this.options.path,
        size: this.file?.size.toString() ?? "",
        name: this.file?.name ?? "",
        type: "onedrive",
      };

      const res = await requestAPI(
        `/api/v3/file/upload/credential?${new URLSearchParams(
          query
        ).toString()}`
      );
      if (res.data.code !== 0) {
        this.logger.error("requestCredential: ", res.data, this.file);
        return;
      }

      this.logger.info(res);
    } catch (e) {
      this.logger.error("requestCredential: ", e, this.file);
    }
  }
  protected async start() {
    if (this.file?.size!! < 4 * 1024 * 1024) {
      const uploader = Uploader("local", this.options);
      uploader.file = this.file;

      await uploader.uploadFile(this.onProgress!!, this.onComplete!!);

      this.onProgress = noop;
      this.onComplete = noop;

      return;
    }

    await this.requestCredential();
  }
}
