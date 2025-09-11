const NUM_PRIORITIES = 10;
const DEFAULT_PRIORITY = 5;

import * as parser from "./parser";
import BottleneckError = require("./BottleneckError");
import Events = require("./Events");
import States = require("./States");

interface JobOptions {
  priority: number;
  weight: number;
  expiration: number | null;
  id: string;
}

interface EventInfo {
  args: any[];
  options: JobOptions;
  retryCount: number;
}

class Job {
  public options: JobOptions;
  public promise: Promise<any>;
  public retryCount: number = 0;
  public _resolve!: (value: any) => void;
  public _reject!: (error: any) => void;

  constructor(
    public task: (...args: any[]) => any,
    public args: any[],
    options: Partial<JobOptions>,
    jobDefaults: JobOptions,
    public rejectOnDrop: boolean,
    public Events: Events,
    public _states: States,
    public Promise: PromiseConstructor
  ) {
    this.options = parser.load(options, jobDefaults);
    this.options.priority = this._sanitizePriority(this.options.priority);
    if (this.options.id === jobDefaults.id) {
      this.options.id = `${this.options.id}-${this._randomIndex()}`;
    }
    this.promise = new this.Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  private _sanitizePriority(priority: number): number {
    const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
    if (sProperty < 0) return 0;
    if (sProperty > NUM_PRIORITIES - 1) return NUM_PRIORITIES - 1;
    return sProperty;
  }

  private _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }

  doDrop({ error, message = "This job has been dropped by Bottleneck" }: { error?: any; message?: string } = {}): boolean {
    if (this._states.remove(this.options.id)) {
      if (this.rejectOnDrop) {
        this._reject(error ?? new BottleneckError(message));
      }
      this.Events.trigger("dropped", { 
        args: this.args, 
        options: this.options, 
        task: this.task, 
        promise: this.promise 
      });
      return true;
    } else {
      return false;
    }
  }

  private _assertStatus(expected: string): void {
    const status = this._states.jobStatus(this.options.id);
    if (!(status === expected || (expected === "DONE" && status === null))) {
      throw new BottleneckError(
        `Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`
      );
    }
  }

  doReceive(): void {
    this._states.start(this.options.id);
    this.Events.trigger("received", { args: this.args, options: this.options });
  }

  doQueue(reachedHWM: boolean, blocked: boolean): void {
    this._assertStatus("RECEIVED");
    this._states.next(this.options.id);
    this.Events.trigger("queued", { args: this.args, options: this.options, reachedHWM, blocked });
  }

  doRun(): void {
    if (this.retryCount === 0) {
      this._assertStatus("QUEUED");
      this._states.next(this.options.id);
    } else {
      this._assertStatus("EXECUTING");
    }
    this.Events.trigger("scheduled", { args: this.args, options: this.options });
  }

  async doExecute(
    chained: any,
    clearGlobalState: () => boolean,
    run: (retryAfter: number) => void,
    free: (options: JobOptions, eventInfo: EventInfo) => Promise<void>
  ): Promise<void> {
    if (this.retryCount === 0) {
      this._assertStatus("RUNNING");
      this._states.next(this.options.id);
    } else {
      this._assertStatus("EXECUTING");
    }
    const eventInfo: EventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
    this.Events.trigger("executing", eventInfo);

    try {
      const passed = chained != null
        ? await chained.schedule(this.options, this.task, ...this.args)
        : await this.task(...this.args);

      if (clearGlobalState()) {
        this.doDone(eventInfo);
        await free(this.options, eventInfo);
        this._assertStatus("DONE");
        this._resolve(passed);
      }
    } catch (error) {
      this._onFailure(error, eventInfo, clearGlobalState, run, free);
    }
  }

  doExpire(
    clearGlobalState: () => boolean,
    run: (retryAfter: number) => void,
    free: (options: JobOptions, eventInfo: EventInfo) => Promise<void>
  ): void {
    if (this._states.jobStatus(this.options.id) === "RUNNING") {
      this._states.next(this.options.id);
    }
    this._assertStatus("EXECUTING");
    const eventInfo: EventInfo = { args: this.args, options: this.options, retryCount: this.retryCount };
    const error = new BottleneckError(`This job timed out after ${this.options.expiration} ms.`);
    this._onFailure(error, eventInfo, clearGlobalState, run, free);
  }

  private async _onFailure(
    error: any,
    eventInfo: EventInfo,
    clearGlobalState: () => boolean,
    run: (retryAfter: number) => void,
    free: (options: JobOptions, eventInfo: EventInfo) => Promise<void>
  ): Promise<void> {
    if (clearGlobalState()) {
      const retry = await this.Events.trigger("failed", error, eventInfo);
      if (retry != null) {
        const retryAfter = ~~retry;
        this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
        this.retryCount++;
        run(retryAfter);
      } else {
        this.doDone(eventInfo);
        await free(this.options, eventInfo);
        this._assertStatus("DONE");
        this._reject(error);
      }
    }
  }

  doDone(eventInfo: EventInfo): void {
    this._assertStatus("EXECUTING");
    this._states.next(this.options.id);
    this.Events.trigger("done", eventInfo);
  }
}

export = Job;
