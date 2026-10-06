const NUM_PRIORITIES = 10;
const DEFAULT_PRIORITY = 5;

import * as parser from "./parser";
import Queues = require("./Queues");
import Job = require("./Job");
import LocalDatastore = require("./LocalDatastore");
import RedisDatastore = require("./RedisDatastore");
import Events = require("./Events");
import States = require("./States");
import Sync = require("./Sync");

interface JobDefaults {
  priority: number;
  weight: number;
  expiration: number | null;
  id: string;
}

interface StoreDefaults {
  maxConcurrent: number | null;
  minTime: number;
  highWater: number | null;
  strategy: number;
  penalty: number | null;
  reservoir: number | null;
  reservoirRefreshInterval: number | null;
  reservoirRefreshAmount: number | null;
  reservoirIncreaseInterval: number | null;
  reservoirIncreaseAmount: number | null;
  reservoirIncreaseMaximum: number | null;
  defaultExpiration: number | null;
}

interface StoreOptions {
  maxConcurrent?: number | null;
  minTime: number;
  highWater?: number | null;
  strategy: number;
  penalty?: number | null;
  reservoir?: number | null;
  reservoirRefreshInterval?: number | null;
  reservoirRefreshAmount?: number | null;
  reservoirIncreaseInterval?: number | null;
  reservoirIncreaseAmount?: number | null;
  reservoirIncreaseMaximum?: number | null;
  defaultExpiration?: number | null;
}

interface LocalStoreDefaults {
  Promise: PromiseConstructor;
  timeout: number | null;
  heartbeatInterval: number;
}

interface RedisStoreDefaults {
  Promise: PromiseConstructor;
  timeout: number | null;
  heartbeatInterval: number;
  clientTimeout: number;
  Redis: any;
  Glide: any;
  clientOptions: any;
  clusterNodes: any;
  clearDatastore: boolean;
  connection: any;
}

interface InstanceDefaults {
  datastore: string;
  connection: any;
  id: string;
  rejectOnDrop: boolean;
  trackDoneStatus: boolean;
  Promise: PromiseConstructor;
}

interface StopDefaults {
  enqueueErrorMessage: string;
  dropWaitingJobs: boolean;
  dropErrorMessage: string;
}

class Bottleneck {
  // Static properties
  static default = Bottleneck;
  static Events = Events;
  static version: string;
  static strategy = { LEAK: 1, OVERFLOW: 2, OVERFLOW_PRIORITY: 4, BLOCK: 3 };
  static BottleneckError = require("./BottleneckError");
  static Group = require("./Group");
  static RedisConnection = require("./RedisConnection");
  static GlideConnection = require("./GlideConnection");
  static Batcher = require("./Batcher");

  // Instance properties
  public version: string;
  public strategy = Bottleneck.strategy;
  public BottleneckError = Bottleneck.BottleneckError;
  
  private jobDefaults: JobDefaults = {
    priority: DEFAULT_PRIORITY,
    weight: 1,
    expiration: null,
    id: "<no-id>"
  };

  private storeDefaults: StoreDefaults = {
    maxConcurrent: null,
    minTime: 0,
    highWater: null,
    strategy: Bottleneck.strategy.LEAK,
    penalty: null,
    reservoir: null,
    reservoirRefreshInterval: null,
    reservoirRefreshAmount: null,
    reservoirIncreaseInterval: null,
    reservoirIncreaseAmount: null,
    reservoirIncreaseMaximum: null,
    defaultExpiration: null
  };

  private localStoreDefaults: LocalStoreDefaults = {
    Promise: Promise,
    timeout: null,
    heartbeatInterval: 250
  };

  private redisStoreDefaults: RedisStoreDefaults = {
    Promise: Promise,
    timeout: null,
    heartbeatInterval: 5000,
    clientTimeout: 10000,
    Redis: null,
    Glide: null,
    clientOptions: {},
    clusterNodes: null,
    clearDatastore: false,
    connection: null
  };

  private instanceDefaults: InstanceDefaults = {
    datastore: "local",
    connection: null,
    id: "<no-id>",
    rejectOnDrop: true,
    trackDoneStatus: false,
    Promise: Promise
  };

  private stopDefaults: StopDefaults = {
    enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
    dropWaitingJobs: true,
    dropErrorMessage: "This limiter has been stopped."
  };

  // Instance properties loaded from options
  public datastore!: string;
  public connection: any;
  public id!: string;
  public rejectOnDrop!: boolean;
  public trackDoneStatus!: boolean;
  public Promise!: PromiseConstructor;

  // Internal state
  private _queues: Queues;
  private _scheduled: { [index: string]: any } = {};
  private _states: States;
  private _limiter: any = null;
  public Events: any;
  private _submitLock: Sync;
  private _registerLock: Sync;
  private _store: LocalDatastore | RedisDatastore;

  constructor(options: any = {}, ...invalid: any[]) {
    this.version = Bottleneck.version;

    this._validateOptions(options, invalid);
    parser.load(options, this.instanceDefaults, this);
    this._queues = new Queues(NUM_PRIORITIES);
    this._states = new States(
      ["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(
        this.trackDoneStatus ? ["DONE"] : []
      )
    );
    this.Events = new Events(this);
    this._submitLock = new Sync("submit", this.Promise);
    this._registerLock = new Sync("register", this.Promise);
    const storeOptions = parser.load(options, this.storeDefaults, {});

    if (this.datastore === "ioredis") {
      throw new Bottleneck.BottleneckError(
        'The "ioredis" datastore was removed in 3.0.0. Use datastore "redis" with node-redis v4, and "clusterNodes" for Redis Cluster.'
      );
    }

    this._store = 
      this.datastore === "redis" || this.datastore === "valkey-glide" || this.connection != null
        ? (() => {
            const storeInstanceOptions = parser.load(options, this.redisStoreDefaults, {});
            return new RedisDatastore(this, storeOptions, storeInstanceOptions);
          })()
        : this.datastore === "local"
          ? (() => {
              const storeInstanceOptions = parser.load(options, this.localStoreDefaults, {});
              return new LocalDatastore(this, storeOptions, storeInstanceOptions);
            })()
          : (() => {
              throw new Bottleneck.BottleneckError(`Invalid datastore type: ${this.datastore}`);
            })();

    this._queues.on("leftzero", () => this._store.heartbeat?.ref?.());
    this._queues.on("zero", () => this._store.heartbeat?.unref?.());
  }

  private _validateOptions(options: any, invalid: any[]): void {
    if (options == null || typeof options !== "object" || invalid.length !== 0) {
      throw new Bottleneck.BottleneckError(
        "Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1."
      );
    }
  }

  ready(): Promise<any> {
    return this._store.ready;
  }

  clients(): any {
    return this._store.clients;
  }

  channel(): string {
    return `b_${this.id}`;
  }

  channel_client(): string {
    return `b_${this.id}_${this._store.clientId}`;
  }

  publish(message: any): void {
    this._store.__publish__(message);
  }

  disconnect(flush: boolean = true): Promise<void> {
    return this._store.__disconnect__(flush);
  }

  chain(limiter: any): this {
    this._limiter = limiter;
    return this;
  }

  queued(priority?: number): number {
    return this._queues.queued(priority);
  }

  clusterQueued(): Promise<number> {
    return this._store.__queued__();
  }

  empty(): boolean {
    return this.queued() === 0 && this._submitLock.isEmpty();
  }

  running(): Promise<number> {
    return this._store.__running__();
  }

  done(): Promise<number> {
    return this._store.__done__();
  }

  jobStatus(id: string): string | null {
    return this._states.jobStatus(id);
  }

  jobs(status?: string): string[] {
    return this._states.statusJobs(status);
  }

  counts(): { [status: string]: number } {
    return this._states.statusCounts();
  }

  _randomIndex(): string {
    return Math.random().toString(36).slice(2);
  }

  check(weight: number = 1): Promise<boolean> {
    return this._store.__check__(weight);
  }

  private _clearGlobalState(index: string): boolean {
    if (this._scheduled[index] != null) {
      clearTimeout(this._scheduled[index].expiration);
      delete this._scheduled[index];
      return true;
    } else {
      return false;
    }
  }

  private async _free(index: string, job: Job, options: any, eventInfo: any): Promise<void> {
    try {
      const { running } = await this._store.__free__(index, options.weight);
      this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
      if (running === 0 && this.empty()) {
        this.Events.trigger("idle");
      }
    } catch (e) {
      this.Events.trigger("error", e);
    }
  }

  private _run(index: string, job: Job, wait: number): void {
    job.doRun();
    const clearGlobalState = this._clearGlobalState.bind(this, index);
    const run = this._run.bind(this, index, job);
    const free = this._free.bind(this, index, job);

    this._scheduled[index] = {
      timeout: setTimeout(() => {
        job.doExecute(this._limiter, clearGlobalState, run, free);
      }, wait),
      expiration: job.options.expiration != null ? setTimeout(() => {
        job.doExpire(clearGlobalState, run, free);
      }, wait + job.options.expiration) : undefined,
      job: job
    };
  }

  private _drainOne(capacity?: number | null): Promise<number | null> {
    return this._registerLock.schedule(async () => {
      if (this.queued() === 0) {
        return null;
      }
      const queue = this._queues.getFirst();
      const next = queue.first();
      if (next == null) {
        return null;
      }
      const { options, args } = next;
      if (capacity != null && options.weight > capacity) {
        return null;
      }
      this.Events.trigger("debug", `Draining ${options.id}`, { args, options });
      const index = this._randomIndex();
      const { success, wait, reservoir } = await this._store.__register__(
        index,
        options.weight,
        options.expiration
      );
      this.Events.trigger("debug", `Drained ${options.id}`, { success, args, options });
      if (success) {
        queue.shift();
        const empty = this.empty();
        if (empty) {
          this.Events.trigger("empty");
        }
        if (reservoir === 0) {
          this.Events.trigger("depleted", empty);
        }
        this._run(index, next, wait);
        return options.weight;
      } else {
        return null;
      }
    });
  }

  async _drainAll(capacity?: number | null, total: number = 0): Promise<number> {
    try {
      const drained = await this._drainOne(capacity);
      if (drained != null) {
        const newCapacity = capacity != null ? capacity - drained : capacity;
        return this._drainAll(newCapacity, total + drained);
      } else {
        return total;
      }
    } catch (e) {
      this.Events.trigger("error", e);
      return total;
    }
  }

  _dropAllQueued(message?: string): void {
    this._queues.shiftAll((job: Job) => job.doDrop({ message }));
  }

  stop(options: any = {}): Promise<void> {
    options = parser.load(options, this.stopDefaults);
    const waitForExecuting = (at: number): Promise<void> => {
      const finished = (): boolean => {
        const counts = this._states.counts;
        return counts[0] + counts[1] + counts[2] + counts[3] === at;
      };
      return new this.Promise<void>((resolve) => {
        if (finished()) {
          resolve();
        } else {
          const handler = () => {
            if (finished()) {
              this.Events.instance.removeAllListeners("done");
              resolve();
            }
          };
          this.Events.instance.on("done", handler);
        }
      });
    };

    const done = options.dropWaitingJobs
      ? (() => {
          this._run = (index: string, next: Job) => next.doDrop({ message: options.dropErrorMessage });
          this._drainOne = () => this.Promise.resolve(null);
          return this._registerLock.schedule(() => this._submitLock.schedule(() => {
            for (const [k, v] of Object.entries(this._scheduled)) {
              if (this.jobStatus(v.job.options.id) === "RUNNING") {
                clearTimeout(v.timeout);
                clearTimeout(v.expiration);
                v.job.doDrop({ message: options.dropErrorMessage });
              }
            }
            this._dropAllQueued(options.dropErrorMessage);
            return waitForExecuting(0);
          }));
        })()
      : this.schedule({ priority: NUM_PRIORITIES - 1, weight: 0 }, () => waitForExecuting(1));

    this._receive = (job: Job) => {
      job._reject(new Bottleneck.BottleneckError(options.enqueueErrorMessage));
      return Promise.resolve();
    };
    this.stop = () => this.Promise.reject(new Bottleneck.BottleneckError("stop() has already been called"));
    return done;
  }

  private _addToQueue = async (job: Job): Promise<boolean> => {
    const { args, options } = job;
    let reachedHWM: boolean, blocked: boolean, strategy: number;
    
    try {
      const result = await this._store.__submit__(this.queued(), options.weight);
      reachedHWM = result.reachedHWM;
      blocked = result.blocked;
      strategy = result.strategy;
    } catch (error) {
      this.Events.trigger("debug", `Could not queue ${options.id}`, { args, options, error });
      job.doDrop({ error });
      return false;
    }
    
    if (blocked) {
      job.doDrop();
      return true;
    } else if (reachedHWM) {
      let shifted: Job | undefined;
      if (strategy === Bottleneck.strategy.LEAK) {
        shifted = this._queues.shiftLastFrom(options.priority);
      } else if (strategy === Bottleneck.strategy.OVERFLOW_PRIORITY) {
        shifted = this._queues.shiftLastFrom(options.priority + 1);
      } else if (strategy === Bottleneck.strategy.OVERFLOW) {
        shifted = job;
      }
      if (shifted != null) {
        shifted.doDrop();
      }
      if (shifted == null || strategy === Bottleneck.strategy.OVERFLOW) {
        if (shifted == null) {
          job.doDrop();
        }
        return reachedHWM;
      }
    }

    job.doQueue(reachedHWM, blocked);
    this._queues.push(job);
    await this._drainAll();
    return reachedHWM;
  };

  private _receive(job: Job): Promise<any> {
    if (this._states.jobStatus(job.options.id) != null) {
      job._reject(new Bottleneck.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
      return Promise.resolve(false);
    } else {
      job.doReceive();
      return this._submitLock.schedule(this._addToQueue, job);
    }
  }

  private _getJobDefaults(): JobDefaults {
    return { ...this.jobDefaults, expiration: this._store.storeOptions.defaultExpiration ?? this.jobDefaults.expiration };
  }

  submit(...args: any[]): Promise<any> {
    let fn: (...args: any[]) => any, options: any, cb: (...args: any[]) => any;
    const jobDefaults = this._getJobDefaults();
    
    if (typeof args[0] === "function") {
      [fn, ...args] = args;
      cb = args.pop();
      options = parser.load({}, jobDefaults);
    } else {
      [options, fn, ...args] = args;
      cb = args.pop();
      options = parser.load(options, jobDefaults);
    }

    const task = (...taskArgs: any[]) => {
      return new this.Promise((resolve, reject) => {
        fn(...taskArgs, (...cbArgs: any[]) => {
          if (cbArgs[0] != null) {
            reject(cbArgs);
          } else {
            resolve(cbArgs);
          }
        });
      });
    };

    const job = new Job(task, args, options, jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    job.promise
      .then((args: any) => cb?.(...args))
      .catch((args: any) => {
        if (Array.isArray(args)) {
          cb?.(...args);
        } else {
          cb?.(args);
        }
      });
    return this._receive(job);
  }

  schedule(...args: any[]): Promise<any> {
    let task: (...args: any[]) => any, options: any;
    
    if (typeof args[0] === "function") {
      [task, ...args] = args;
      options = {};
    } else {
      [options, task, ...args] = args;
    }
    
    const job = new Job(task, args, options, this._getJobDefaults(), this.rejectOnDrop, this.Events, this._states, this.Promise as any);
    this._receive(job);
    return job.promise;
  }

  wrap(fn: (...args: any[]) => any): any {
    const schedule = this.schedule.bind(this);
    const wrapped = function(...args: any[]) { return schedule(fn.bind(this), ...args); };
    wrapped.withOptions = (options: any, ...args: any[]) => schedule(options, fn, ...args);
    return wrapped;
  }

  async updateSettings(options: any = {}): Promise<this> {
    await this._store.__updateSettings__(parser.overwrite(options, this.storeDefaults));
    parser.overwrite(options, this.instanceDefaults, this);
    return this;
  }

  currentReservoir(): Promise<number> {
    return this._store.__currentReservoir__();
  }

  incrementReservoir(incr: number = 0): Promise<number> {
    return this._store.__incrementReservoir__(incr);
  }
}

Bottleneck.version = Bottleneck.prototype.version = require("./version.json").version;

export = Bottleneck;
