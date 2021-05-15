import Local from "./local";
import Base from "./base";
import { LogLevel } from "../logger";
import OneDrive from "./onedrive";

export type PolicyType = "local" | "onedrive";

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
    default:
      throw Error("Unknown policy type!!");
  }
}
