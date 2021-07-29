import { Options, PolicyType } from "./index";
import Logger from "../logger";
import { check } from "./checker";

export interface Progress {
  total: number;
  loaded: number;
  percent?: number;
  speed?: number;
  lastTime?: number;
  lastLoaded?: number;
}

export type OnProgress = (progress: Progress) => void;

export type OnComplete = () => void;

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

export default abstract class Base {
  public file?: File;
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
  protected abstract start(): Promise<void>;
  public abstract cancel(): void;

  constructor(public id: number, options: Options) {
    this.options = options;

    this.logger = new Logger(options.logLevel, id);

    this.logger.info("options: ", options);
  }

  async setPath(path: string) {
    this.options.path = path;
    return this;
  }

  check() {
    check(this.file ?? null, this.options);
  }

  upload = async (onProgress: OnProgress, onComplete: OnComplete) => {
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

  protected calcSpeed() {
    const nowTime = new Date().getTime();
    const lastTime = this.progress.lastTime!!;
    const elapsed = (nowTime - lastTime) / 1000;

    const uploadedBytes = this.progress.loaded!! - this.progress.lastLoaded!!;

    this.progress.speed = elapsed ? uploadedBytes / elapsed : 0;
    this.progress.lastTime = nowTime;
    this.progress.lastLoaded = this.progress.loaded;
  }
}
