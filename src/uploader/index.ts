import Local from "./local";
import Base from "./base";
import { LogLevel } from "../logger";
import OneDrive from "./onedrive";
import Remote from "./remote";

export const uploaders = new Map<number, Base>();

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

export function Uploader(policyType: PolicyType, options: Options): Base {
  switch (policyType) {
    case "local":
      return new Local(options);
    case "onedrive":
      return new OneDrive(options);
    case "remote":
      return new Remote(options);
    default:
      throw Error("Unknown policy type!!");
  }
}

export function pickSingleFile(policyType: PolicyType, options: Options) {
  return new Promise((resolve) => {
    document.getElementById("upload-button")?.remove();

    const element = document.createElement("input");
    element.id = "upload-button";
    element.type = "file";
    element.hidden = true;
    element.onchange = (event) => {
      const files = (event?.target as HTMLInputElement).files;
      const uploader = Uploader(policyType, options);
      if (files != null && files.length > 0) {
        uploader.file = files.item(0)!!;
      }

      resolve(uploader);
    };

    document.body.appendChild(element);

    document.getElementById("upload-button")?.click();
  });
}
