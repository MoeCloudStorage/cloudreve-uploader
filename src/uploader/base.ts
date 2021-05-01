import { Options } from "./index";
import Logger from "../logger";

export default abstract class Base {
  protected options: Options;
  protected logger: Logger;
  protected file?: File;
  protected abort = false;
  protected abstract start(): Promise<void>;

  constructor(options: Options) {
    this.options = options;
    this.logger = new Logger(options.logLevel);

    this.logger.info("options: ", options);
  }

  check = () => {
    if (this.options.filters.allowedType.length !== 0) {
      const ext = this.file?.name.split(".").pop();
      if (ext === null || !ext) throw new Error("您当前的用户组不可上传此文件");
      if (!this.options.filters.allowedType.includes(ext))
        throw new Error("您当前的用户组不可上传此文件");
    }

    if (this.options.maxFileSize !== "0.00mb") {
      const maxFileSize = parseFloat(
        this.options.maxFileSize.replace("mb", "")
      );

      const fileSize = this.file?.size!! / (1024 * 1024);

      if (fileSize > maxFileSize)
        throw new Error(
          `文件过大，您当前用户组最多可上传 ${maxFileSize} mb的文件`
        );
    }
  };

  uploadFile = async () => {
    this.abort = false;
    try {
      this.check();
      this.logger.info("Upload start", this.file);
      const result = await this.start();

      this.logger.info(result);
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  };

  pickFile = (): Promise<Base> => {
    return new Promise((resolve) => {
      document.getElementById("upload-button")?.remove();

      const element = document.createElement("input");
      element.id = "upload-button";
      element.type = "file";
      element.hidden = true;
      element.onchange = (event) => {
        const files = (event?.target as HTMLInputElement).files;
        if (files != null && files.length > 0) {
          this.file = files.item(0)!!;
        }

        resolve(this);
      };

      document.body.appendChild(element);

      document.getElementById("upload-button")?.click();
    });
  };
}
