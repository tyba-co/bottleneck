import DLList = require("./DLList");

interface SyncTask<T> {
  task: (...args: any[]) => Promise<T>;
  args: any[];
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class Sync {
  private _running: number = 0;
  private _queue: DLList<SyncTask<any>>;

  constructor(private name: string, private Promise: PromiseConstructor) {
    this._queue = new DLList<SyncTask<any>>();
  }

  isEmpty(): boolean {
    return this._queue.length === 0;
  }

  private async _tryToRun(): Promise<void> {
    if (this._running < 1 && this._queue.length > 0) {
      this._running++;
      const { task, args, resolve, reject } = this._queue.shift()!;
      let cb: () => void;
      try {
        const returned = await task(...args);
        cb = () => resolve(returned);
      } catch (error) {
        cb = () => reject(error);
      }
      this._running--;
      this._tryToRun();
      cb();
    }
  }

  schedule = <T>(task: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
    let resolve: (value: T) => void;
    let reject: (error: any) => void;
    const promise = new this.Promise<T>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    this._queue.push({ task, args, resolve: resolve!, reject: reject! });
    this._tryToRun();
    return promise;
  };
}

export = Sync;
