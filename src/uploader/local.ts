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

    const response = await request<Res>("/api/v3/file/upload", {
      method: "POST",
      headers,
      body: this.file ?? null,
    });

    this.logger.info(response);

    if (response.code === 0) {
    } else {
      throw new Error(response.msg);
    }
  }
}
