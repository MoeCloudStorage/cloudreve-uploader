import Local from "./local";
import Base from "./base";
import { LogLevel } from "../logger";
import OneDrive from "./onedrive";
import Remote from "./remote";

// 目前支持的策略类型
export type PolicyType = "local" | "remote" | "onedrive";

// 上传选项
// 大部分配置可从
// GET /user/me 或 /site/config 得到
export interface Options {
  logLevel: LogLevel;
  // 0.00mb
  maxFileSize: string;
  filters: {
    // 例如 jpg,png,mp4,zip,rar
    allowedType: string[];
  };
  // 上传的路径
  path: string;
  // 部分策略需要
  uploadURL: string;
}

// 单页面可共用同一 CloudreveUploader
export default class CloudreveUploader {
  // 所有通过同一 CloudreveUploader 创建的 Uploader 都会存放在此 Map
  // 键为 Base.id
  uploaders = new Map<number, Base>();
  uploaderId = 0;

  // 分配 Uploader
  dispatchUploader(policyType: PolicyType, options: Options): Base {
    let uploader: Base;
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

    this.uploaders.set(id, uploader);
    return uploader;
  }

  // 选择单个文件
  // 上传 Base.upload()
  pickSingleFile(policyType: PolicyType, options: Options): Promise<Base> {
    return new Promise<Base>((resolve) => {
      document.getElementById("upload-button")?.remove();

      const element = document.createElement("input");
      element.id = "upload-button";
      element.type = "file";
      element.hidden = true;
      element.onchange = (event) => {
        const files = (event?.target as HTMLInputElement).files;
        const uploader = this.dispatchUploader(policyType, options);
        if (files != null && files.length > 0) {
          uploader.file = files.item(0)!!;
        }

        resolve(uploader);
      };

      document.body.appendChild(element);

      document.getElementById("upload-button")?.click();
    });
  }
}
