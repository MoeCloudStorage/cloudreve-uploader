import Local from "./local";
import Base from "./base";
import { LogLevel } from "../logger";

export type PolicyType = "local";

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
    default:
      throw Error("Unknown policy type!!");
  }
}
