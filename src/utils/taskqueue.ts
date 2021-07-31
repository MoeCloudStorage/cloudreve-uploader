// 任务
export type Task<T> = (arg: T) => Promise<void>;

export interface QueueItem<T> {
  task: T;
  resolve: () => void;
  reject: (reason?: any) => void;
}

// 任务队列
export class TaskQueue<T> {
  // 未执行任务
  queue: Array<QueueItem<T>> = [];
  // 正在执行任务
  processing: Array<QueueItem<T>> = [];

  constructor(
    // 任务函数
    private task: Task<T>,
    // 队列单次运行任务数量
    private limit: number
  ) {}

  /* 任务进队
   * 当本任务执行完毕会 resolve
   */
  enqueue(task: T) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
      });
      this.check();
    });
  }

  /*
   * 检查任务是否可以执行
   * 如果可以就执行
   */
  check() {
    // 正在执行任务数量
    const processingNum = this.processing.length;
    // 可执行任务数量
    const availableNum = this.limit - processingNum;
    // 选中前 availableNum 个任务执行
    this.queue.slice(0, availableNum).forEach((item) => this.run(item));
  }

  // 执行任务
  run(task: QueueItem<T>) {
    // 任务出队
    this.queue = this.queue.filter((v) => v !== task);
    // 进执行中任务队
    this.processing.push(task);
    // 执行任务
    this.task(task.task)
      .then(() => {
        // 出执行中任务队
        this.processing = this.processing.filter((v) => v !== task);
        // resolve 本任务
        task.resolve();
        // 任务运行完毕 进行下一个任务
        this.check();
      })
      // 如果任务失败则 reject 本任务
      .catch((err) => task.reject(err));
  }
}
