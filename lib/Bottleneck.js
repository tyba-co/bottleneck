"use strict";

const tslib_1 = require("tslib");
const NUM_PRIORITIES = 10;
const DEFAULT_PRIORITY = 5;
const parser = tslib_1.__importStar(require("./parser"));
const Queues = require("./Queues");
const Job = require("./Job");
const LocalDatastore = require("./LocalDatastore");
const RedisDatastore = require("./RedisDatastore");
const Events = require("./Events");
const States = require("./States");
const Sync = require("./Sync");
class Bottleneck {
  constructor(options = {}, ...invalid) {
    this.strategy = Bottleneck.strategy;
    this.BottleneckError = Bottleneck.BottleneckError;
    this.jobDefaults = {
      priority: DEFAULT_PRIORITY,
      weight: 1,
      expiration: null,
      id: "<no-id>"
    };
    this.storeDefaults = {
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
      reservoirIncreaseMaximum: null
    };
    this.localStoreDefaults = {
      Promise: Promise,
      timeout: null,
      heartbeatInterval: 250
    };
    this.redisStoreDefaults = {
      Promise: Promise,
      timeout: null,
      heartbeatInterval: 5000,
      clientTimeout: 10000,
      Redis: null,
      clientOptions: {},
      clusterNodes: null,
      clearDatastore: false,
      connection: null
    };
    this.instanceDefaults = {
      datastore: "local",
      connection: null,
      id: "<no-id>",
      rejectOnDrop: true,
      trackDoneStatus: false,
      Promise: Promise
    };
    this.stopDefaults = {
      enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
      dropWaitingJobs: true,
      dropErrorMessage: "This limiter has been stopped."
    };
    this._scheduled = {};
    this._limiter = null;
    this._addToQueue = job => tslib_1.__awaiter(this, void 0, void 0, function* () {
      const {
        args,
        options
      } = job;
      let reachedHWM, blocked, strategy;
      try {
        const result = yield this._store.__submit__(this.queued(), options.weight);
        reachedHWM = result.reachedHWM;
        blocked = result.blocked;
        strategy = result.strategy;
      } catch (error) {
        this.Events.trigger("debug", `Could not queue ${options.id}`, {
          args,
          options,
          error
        });
        job.doDrop({
          error
        });
        return false;
      }
      if (blocked) {
        job.doDrop();
        return true;
      } else if (reachedHWM) {
        let shifted;
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
      yield this._drainAll();
      return reachedHWM;
    });
    // Initialize static version if not set
    if (!Bottleneck.version) {
      Bottleneck.version = require("./version.json").version;
    }
    this.version = Bottleneck.version;
    this._validateOptions(options, invalid);
    parser.load(options, this.instanceDefaults, this);
    this._queues = new Queues(NUM_PRIORITIES);
    this._states = new States(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
    this.Events = new Events(this);
    this._submitLock = new Sync("submit", this.Promise);
    this._registerLock = new Sync("register", this.Promise);
    const storeOptions = parser.load(options, this.storeDefaults, {});
    this._store = this.datastore === "redis" || this.datastore === "ioredis" || this.connection != null ? (() => {
      const storeInstanceOptions = parser.load(options, this.redisStoreDefaults, {});
      return new RedisDatastore(this, storeOptions, storeInstanceOptions);
    })() : this.datastore === "local" ? (() => {
      const storeInstanceOptions = parser.load(options, this.localStoreDefaults, {});
      return new LocalDatastore(this, storeOptions, storeInstanceOptions);
    })() : (() => {
      throw new Bottleneck.BottleneckError(`Invalid datastore type: ${this.datastore}`);
    })();
    this._queues.on("leftzero", () => {
      var _a, _b;
      return (_b = (_a = this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
    this._queues.on("zero", () => {
      var _a, _b;
      return (_b = (_a = this._store.heartbeat) === null || _a === void 0 ? void 0 : _a.unref) === null || _b === void 0 ? void 0 : _b.call(_a);
    });
  }
  _validateOptions(options, invalid) {
    if (options == null || typeof options !== "object" || invalid.length !== 0) {
      throw new Bottleneck.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
    }
  }
  ready() {
    return this._store.ready;
  }
  clients() {
    return this._store.clients;
  }
  channel() {
    return `b_${this.id}`;
  }
  channel_client() {
    return `b_${this.id}_${this._store.clientId}`;
  }
  publish(message) {
    this._store.__publish__(message);
  }
  disconnect(flush = true) {
    return this._store.__disconnect__(flush);
  }
  chain(limiter) {
    this._limiter = limiter;
    return this;
  }
  queued(priority) {
    return this._queues.queued(priority);
  }
  clusterQueued() {
    return this._store.__queued__();
  }
  empty() {
    return this.queued() === 0 && this._submitLock.isEmpty();
  }
  running() {
    return this._store.__running__();
  }
  done() {
    return this._store.__done__();
  }
  jobStatus(id) {
    return this._states.jobStatus(id);
  }
  jobs(status) {
    return this._states.statusJobs(status);
  }
  counts() {
    return this._states.statusCounts();
  }
  _randomIndex() {
    return Math.random().toString(36).slice(2);
  }
  check(weight = 1) {
    return this._store.__check__(weight);
  }
  _clearGlobalState(index) {
    if (this._scheduled[index] != null) {
      clearTimeout(this._scheduled[index].expiration);
      delete this._scheduled[index];
      return true;
    } else {
      return false;
    }
  }
  _free(index, job, options, eventInfo) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      try {
        const {
          running
        } = yield this._store.__free__(index, options.weight);
        this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
        if (running === 0 && this.empty()) {
          this.Events.trigger("idle");
        }
      } catch (e) {
        this.Events.trigger("error", e);
      }
    });
  }
  _run(index, job, wait) {
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
  _drainOne(capacity) {
    return this._registerLock.schedule(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (this.queued() === 0) {
        return null;
      }
      const queue = this._queues.getFirst();
      const next = queue.first();
      if (next == null) {
        return null;
      }
      const {
        options,
        args
      } = next;
      if (capacity != null && options.weight > capacity) {
        return null;
      }
      this.Events.trigger("debug", `Draining ${options.id}`, {
        args,
        options
      });
      const index = this._randomIndex();
      const {
        success,
        wait,
        reservoir
      } = yield this._store.__register__(index, options.weight, options.expiration);
      this.Events.trigger("debug", `Drained ${options.id}`, {
        success,
        args,
        options
      });
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
    }));
  }
  _drainAll(capacity, total = 0) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      try {
        const drained = yield this._drainOne(capacity);
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
    });
  }
  _dropAllQueued(message) {
    this._queues.shiftAll(job => job.doDrop({
      message
    }));
  }
  stop(options = {}) {
    options = parser.load(options, this.stopDefaults);
    const waitForExecuting = at => {
      const finished = () => {
        const counts = this._states.counts;
        return counts[0] + counts[1] + counts[2] + counts[3] === at;
      };
      return new this.Promise(resolve => {
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
    const done = options.dropWaitingJobs ? (() => {
      this._run = (index, next) => next.doDrop({
        message: options.dropErrorMessage
      });
      this._drainOne = () => this.Promise.resolve(null);
      return this._registerLock.schedule(() => this._submitLock.schedule(() => {
        for (const [k, v] of Object.entries(this._scheduled)) {
          if (this.jobStatus(v.job.options.id) === "RUNNING") {
            clearTimeout(v.timeout);
            clearTimeout(v.expiration);
            v.job.doDrop({
              message: options.dropErrorMessage
            });
          }
        }
        this._dropAllQueued(options.dropErrorMessage);
        return waitForExecuting(0);
      }));
    })() : this.schedule({
      priority: NUM_PRIORITIES - 1,
      weight: 0
    }, () => waitForExecuting(1));
    this._receive = job => {
      job._reject(new Bottleneck.BottleneckError(options.enqueueErrorMessage));
      return Promise.resolve();
    };
    this.stop = () => this.Promise.reject(new Bottleneck.BottleneckError("stop() has already been called"));
    return done;
  }
  _receive(job) {
    if (this._states.jobStatus(job.options.id) != null) {
      job._reject(new Bottleneck.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
      return Promise.resolve(false);
    } else {
      job.doReceive();
      return this._submitLock.schedule(this._addToQueue, job);
    }
  }
  submit(...args) {
    let fn, options, cb;
    if (typeof args[0] === "function") {
      [fn, ...args] = args;
      cb = args.pop();
      options = parser.load({}, this.jobDefaults);
    } else {
      [options, fn, ...args] = args;
      cb = args.pop();
      options = parser.load(options, this.jobDefaults);
    }
    const task = (...taskArgs) => {
      return new this.Promise((resolve, reject) => {
        fn(...taskArgs, (...cbArgs) => {
          if (cbArgs[0] != null) {
            reject(cbArgs);
          } else {
            resolve(cbArgs);
          }
        });
      });
    };
    const job = new Job(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    job.promise.then(args => cb === null || cb === void 0 ? void 0 : cb(...args)).catch(args => {
      if (Array.isArray(args)) {
        cb === null || cb === void 0 ? void 0 : cb(...args);
      } else {
        cb === null || cb === void 0 ? void 0 : cb(args);
      }
    });
    return this._receive(job);
  }
  schedule(...args) {
    let task, options;
    if (typeof args[0] === "function") {
      [task, ...args] = args;
      options = {};
    } else {
      [options, task, ...args] = args;
    }
    const job = new Job(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    this._receive(job);
    return job.promise;
  }
  wrap(fn) {
    const schedule = this.schedule.bind(this);
    const wrapped = function (...args) {
      return schedule(fn.bind(this), ...args);
    };
    wrapped.withOptions = (options, ...args) => schedule(options, fn, ...args);
    return wrapped;
  }
  updateSettings(options = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this._store.__updateSettings__(parser.overwrite(options, this.storeDefaults));
      parser.overwrite(options, this.instanceDefaults, this);
      return this;
    });
  }
  currentReservoir() {
    return this._store.__currentReservoir__();
  }
  incrementReservoir(incr = 0) {
    return this._store.__incrementReservoir__(incr);
  }
}
// Static properties
Bottleneck.default = Bottleneck;
Bottleneck.Events = Events;
Bottleneck.strategy = {
  LEAK: 1,
  OVERFLOW: 2,
  OVERFLOW_PRIORITY: 4,
  BLOCK: 3
};
Bottleneck.BottleneckError = require("./BottleneckError");
Bottleneck.Group = require("./Group");
Bottleneck.RedisConnection = require("./RedisConnection");
Bottleneck.IORedisConnection = require("./IORedisConnection");
Bottleneck.Batcher = require("./Batcher");
// Set static version
try {
  Bottleneck.version = Bottleneck.prototype.version = require("./version.json").version;
} catch (e) {
  // Fallback if version.json doesn't exist
  Bottleneck.version = Bottleneck.prototype.version = "2.19.6";
}
module.exports = Bottleneck;