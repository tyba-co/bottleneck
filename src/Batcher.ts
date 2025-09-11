import * as parser from "./parser";
import Events = require("./Events");

interface BatcherOptions {
  maxTime?: number | null;
  maxSize?: number | null;
  Promise?: PromiseConstructor;
}

interface BatcherDefaults {
  maxTime: number | null;
  maxSize: number | null;
  Promise: PromiseConstructor;
}

class Batcher {
  private defaults: BatcherDefaults = {
    maxTime: null,
    maxSize: null,
    Promise: Promise
  };

  public Events: Events;
  public maxTime!: number | null;
  public maxSize!: number | null;
  public Promise!: PromiseConstructor;
  private _arr: any[] = [];
  private _promise!: Promise<void>;
  private _resolve!: () => void;
  private _lastFlush: number;
  private _timeout?: NodeJS.Timeout;

  constructor(public options: BatcherOptions = {}) {
    parser.load(this.options, this.defaults, this);
    this.Events = new Events(this);
    this._resetPromise();
    this._lastFlush = Date.now();
  }

  private _resetPromise(): void {
    this._promise = new this.Promise<void>((res) => {
      this._resolve = res;
    });
  }

  private _flush(): void {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._lastFlush = Date.now();
    this._resolve();
    this.Events.trigger("batch", this._arr);
    this._arr = [];
    this._resetPromise();
  }

  add(data: any): Promise<void> {
    this._arr.push(data);
    const ret = this._promise;
    if (this._arr.length === this.maxSize) {
      this._flush();
    } else if (this.maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(() => {
        this._flush();
      }, this.maxTime);
    }
    return ret;
  }
}

export = Batcher;
