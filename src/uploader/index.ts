import Local from "./local";
import Base from "./base";
import { LogLevel } from "../logger";
import OneDrive from "./onedrive";
import Remote from "./remote";

export type PolicyType = "local" | "remote" | "onedrive";

export interface Options {
  logLevel: LogLevel;
  maxFileSize: string;
  filters: {
    allowedType: string[];
  };
  path: string;
  uploadURL: string;
}

export default class CloudreveUploader {
  uploaders = new Map<number, Base>();
  uploaderId = 0;

  dispatchUploader(policyType: PolicyType, options: Options): Base {
    let uploader: Base;
    const id = ++this.uploaderId;

    switch (policyType) {
      case "local":
        uploader = new Local(id, options);
        break;
      case "onedrive":
        uploader = new OneDrive(id, options);
        break;
      case "remote":
        uploader = new Remote(id, options);
        break;
      default:
        throw Error("Unknown policy type!!");
    }

    this.uploaders.set(id, uploader);
    return uploader;
  }

  pickSingleFile(policyType: PolicyType, options: Options) {
    return new Promise((resolve) => {
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
