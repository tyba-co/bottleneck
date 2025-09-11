"use strict";

const tslib_1 = require("tslib");
const NUM_PRIORITIES = 10;
const DEFAULT_PRIORITY = 5;
const parser = tslib_1.__importStar(require("./parser"));
const BottleneckError = require("./BottleneckError");
class Job {
  constructor(task, args, options, jobDefaults, rejectOnDrop, Events, _states, Promise) {
    this.task = task;
    this.args = args;
    this.rejectOnDrop = rejectOnDrop;
    this.Events = Events;
    this._states = _states;
    this.Promise = Promise;
    this.retryCount = 0;
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
  _sanitizePriority(priority) {
    const sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
    if (sProperty < 0) return 0;
    if (sProperty > NUM_PRIORITIES - 1) return NUM_PRIORITIES - 1;
    return sProperty;
  }
  _randomIndex() {
    return Math.random().toString(36).slice(2);
  }
  doDrop({
    error,
    message = "This job has been dropped by Bottleneck"
  } = {}) {
    if (this._states.remove(this.options.id)) {
      if (this.rejectOnDrop) {
        this._reject(error !== null && error !== void 0 ? error : new BottleneckError(message));
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
  _assertStatus(expected) {
    const status = this._states.jobStatus(this.options.id);
    if (!(status === expected || expected === "DONE" && status === null)) {
      throw new BottleneckError(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
    }
  }
  doReceive() {
    this._states.start(this.options.id);
    this.Events.trigger("received", {
      args: this.args,
      options: this.options
    });
  }
  doQueue(reachedHWM, blocked) {
    this._assertStatus("RECEIVED");
    this._states.next(this.options.id);
    this.Events.trigger("queued", {
      args: this.args,
      options: this.options,
      reachedHWM,
      blocked
    });
  }
  doRun() {
    if (this.retryCount === 0) {
      this._assertStatus("QUEUED");
      this._states.next(this.options.id);
    } else {
      this._assertStatus("EXECUTING");
    }
    this.Events.trigger("scheduled", {
      args: this.args,
      options: this.options
    });
  }
  doExecute(chained, clearGlobalState, run, free) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (this.retryCount === 0) {
        this._assertStatus("RUNNING");
        this._states.next(this.options.id);
      } else {
        this._assertStatus("EXECUTING");
      }
      const eventInfo = {
        args: this.args,
        options: this.options,
        retryCount: this.retryCount
      };
      this.Events.trigger("executing", eventInfo);
      try {
        const passed = chained != null ? yield chained.schedule(this.options, this.task, ...this.args) : yield this.task(...this.args);
        if (clearGlobalState()) {
          this.doDone(eventInfo);
          yield free(this.options, eventInfo);
          this._assertStatus("DONE");
          this._resolve(passed);
        }
      } catch (error) {
        this._onFailure(error, eventInfo, clearGlobalState, run, free);
      }
    });
  }
  doExpire(clearGlobalState, run, free) {
    if (this._states.jobStatus(this.options.id) === "RUNNING") {
      this._states.next(this.options.id);
    }
    this._assertStatus("EXECUTING");
    const eventInfo = {
      args: this.args,
      options: this.options,
      retryCount: this.retryCount
    };
    const error = new BottleneckError(`This job timed out after ${this.options.expiration} ms.`);
    this._onFailure(error, eventInfo, clearGlobalState, run, free);
  }
  _onFailure(error, eventInfo, clearGlobalState, run, free) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (clearGlobalState()) {
        const retry = yield this.Events.trigger("failed", error, eventInfo);
        if (retry != null) {
          const retryAfter = ~~retry;
          this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
          this.retryCount++;
          run(retryAfter);
        } else {
          this.doDone(eventInfo);
          yield free(this.options, eventInfo);
          this._assertStatus("DONE");
          this._reject(error);
        }
      }
    });
  }
  doDone(eventInfo) {
    this._assertStatus("EXECUTING");
    this._states.next(this.options.id);
    this.Events.trigger("done", eventInfo);
  }
}
module.exports = Job;