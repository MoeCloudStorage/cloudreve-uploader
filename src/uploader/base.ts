import { Options } from "./index";
import Logger from "../logger";

export interface Progress {
  total: number;
  loaded: number;
  percent?: number;
}

export type OnProgress = (progress: Progress) => void;

export type OnComplete = () => void;

export default abstract class Base {
  public file?: File;
  protected options: Options;
  protected logger: Logger;
  protected progress?: Progress;
  protected onProgress?: OnProgress;
  protected onComplete?: OnComplete;
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

  uploadFile = async (onProgress: OnProgress, onComplete: OnComplete) => {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    try {
      this.check();
      this.logger.info("Upload start", this.file);
      await this.start();
      this.logger.info("Upload complete", this.file);
      this.onComplete();
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

        this.logger.info("file", this.file);
        resolve(this);
      };

      document.body.appendChild(element);

      document.getElementById("upload-button")?.click();
    });
  };
}
