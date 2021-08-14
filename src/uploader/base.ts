import CloudreveUploader, { Options, PolicyType } from "./index";
import Logger from "../logger";
import { check } from "./checker";

export interface Progress {
  // 总 byte 数
  total: number;
  // 已上传的 byte 数
  loaded: number;
  // 上传进度百分比
  percent?: number;
  // 上传速度 byte/s
  speed?: number;
  // 上次更新进度的时间戳
  lastTime?: number;
  // 上次更新进度的已上传 byte 数
  lastLoaded?: number;
}

// 更新进度
export type OnProgress = (progress: Progress, uploaderId: number) => void;

// 完成
export type OnComplete = (uploaderId: number) => void;

// 上传凭证
export interface CredentialRes {
  code: number;
  data: CredentialData;
  msg: string;
}

export interface CredentialData {
  token: string;
  policy: PolicyType;
  path: string;
  ak: string;
}

// 所有 Uploader 的基类
export default abstract class Base {
  /*
    本类所有公开的方法均返回 Promise<Base>
    可进行 Promise.then 链式操作
    e.g. base.check().then(b => b.setPath("/")).then(b => b.upload()).catch(e => console.error(e))
     */

  // 选择的文件
  // 注: (TODO) 多文件上传是创建多个 Uploader
  public file?: File;
  public status: "stop" | "running" | "done" = "stop";
  protected options: Options;
  protected logger: Logger;
  protected progress: Progress = {
    loaded: 0,
    total: 0,
    percent: 0,
    speed: 0,
    lastLoaded: 0,
    lastTime: new Date().getTime(),
  };
  protected onProgress?: OnProgress;
  protected onComplete?: OnComplete;

  constructor(
    public id: number,
    protected uploader: CloudreveUploader,
    options: Options
  ) {
    this.options = options;

    this.logger = new Logger(options.logLevel, id);

    this.logger.info("options: ", options);
  }

  // 取消上传任务
  public abstract cancel(): void;

  // 设置上传路径
  async setPath(path: string): Promise<Base> {
    this.options.path = path;
    return this;
  }

  async check(): Promise<Base> {
    try {
      check(this.file ?? null, this.options);
    } catch (e) {
      this.status = "stop";
      throw e;
    }
    return this;
  }

  upload = async (onProgress: OnProgress, onComplete: OnComplete) => {
    this.onProgress = onProgress;
    this.onComplete = onComplete;

    this.status = "running";
    try {
      await this.check();
      this.logger.info("Upload start", this.file);
      await this.start();
      this.logger.info("Upload complete", this.file);
      this.status = "done";
      this.onComplete(this.id);
    } catch (err) {
      this.logger.error(err);
      this.status = "stop";
      throw err;
    }
  };

  protected abstract start(): Promise<void>;

  protected calcSpeed() {
    // 用这次时间戳减上次时间戳 除以 1000 得到间隔秒数
    const nowTime = new Date().getTime();
    const lastTime = this.progress.lastTime!!;
    const elapsed = (nowTime - lastTime) / 1000;

    // 上次字节数减这次字节数 得到间隔字节数
    const uploadedBytes = this.progress.loaded!! - this.progress.lastLoaded!!;

    // 当间隔秒数/上传字节数为 0 时 继续返回上次速度
    this.progress.speed =
      elapsed && uploadedBytes ? uploadedBytes / elapsed : this.progress.speed;
    this.progress.lastTime = nowTime;
    this.progress.lastLoaded = this.progress.loaded;
  }
}
