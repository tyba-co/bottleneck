"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const BottleneckError = require("./BottleneckError");
class LocalDatastore {
  constructor(instance, storeOptions, storeInstanceOptions) {
    this.instance = instance;
    this.storeOptions = storeOptions;
    this.clients = {};
    this._running = 0;
    this._done = 0;
    this._unblockTime = 0;
    this.clientId = this.instance._randomIndex();
    parser.load(storeInstanceOptions, storeInstanceOptions, this);
    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    this.ready = this.Promise.resolve();
    this._startHeartbeat();
  }
  _startHeartbeat() {
    if (!this.heartbeat && (this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null || this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null)) {
      this.heartbeat = setInterval(() => {
        const now = Date.now();
        if (this.storeOptions.reservoirRefreshInterval != null && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
          this._lastReservoirRefresh = now;
          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
          this.instance._drainAll(this.computeCapacity());
        }
        if (this.storeOptions.reservoirIncreaseInterval != null && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
          const {
            reservoirIncreaseAmount: amount,
            reservoirIncreaseMaximum: maximum,
            reservoir
          } = this.storeOptions;
          this._lastReservoirIncrease = now;
          const incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
          if (incr > 0) {
            this.storeOptions.reservoir += incr;
            this.instance._drainAll(this.computeCapacity());
          }
        }
      }, this.heartbeatInterval);
      if (this.heartbeat.unref) {
        this.heartbeat.unref();
      }
    } else if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
  }
  __publish__(message) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      this.instance.Events.trigger("message", message.toString());
    });
  }
  __disconnect__(flush) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      if (this.heartbeat) {
        clearInterval(this.heartbeat);
      }
      return this.Promise.resolve();
    });
  }
  yieldLoop(t = 0) {
    return new this.Promise(resolve => setTimeout(resolve, t));
  }
  computePenalty() {
    var _a;
    return (_a = this.storeOptions.penalty) !== null && _a !== void 0 ? _a : 15 * this.storeOptions.minTime || 5000;
  }
  __updateSettings__(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      parser.overwrite(options, options, this.storeOptions);
      this._startHeartbeat();
      this.instance._drainAll(this.computeCapacity());
      return true;
    });
  }
  __running__() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      return this._running;
    });
  }
  __queued__() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      return this.instance.queued();
    });
  }
  __done__() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      return this._done;
    });
  }
  __groupCheck__(time) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      return this._nextRequest + this.timeout < time;
    });
  }
  computeCapacity() {
    const {
      maxConcurrent,
      reservoir
    } = this.storeOptions;
    if (maxConcurrent != null && reservoir != null) {
      return Math.min(maxConcurrent - this._running, reservoir);
    } else if (maxConcurrent != null) {
      return maxConcurrent - this._running;
    } else if (reservoir != null) {
      return reservoir;
    } else {
      return null;
    }
  }
  conditionsCheck(weight) {
    const capacity = this.computeCapacity();
    return capacity == null || weight <= capacity;
  }
  __incrementReservoir__(incr) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      const reservoir = this.storeOptions.reservoir += incr;
      this.instance._drainAll(this.computeCapacity());
      return reservoir;
    });
  }
  __currentReservoir__() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      return this.storeOptions.reservoir;
    });
  }
  isBlocked(now) {
    return this._unblockTime >= now;
  }
  check(weight, now) {
    return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
  }
  __check__(weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      const now = Date.now();
      return this.check(weight, now);
    });
  }
  __register__(index, weight, expiration) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      const now = Date.now();
      if (this.conditionsCheck(weight)) {
        this._running += weight;
        if (this.storeOptions.reservoir != null) {
          this.storeOptions.reservoir -= weight;
        }
        const wait = Math.max(this._nextRequest - now, 0);
        this._nextRequest = now + wait + this.storeOptions.minTime;
        return {
          success: true,
          wait,
          reservoir: this.storeOptions.reservoir
        };
      } else {
        return {
          success: false
        };
      }
    });
  }
  strategyIsBlock() {
    return this.storeOptions.strategy === 3;
  }
  __submit__(queueLength, weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
        throw new BottleneckError(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
      }
      const now = Date.now();
      const reachedHWM = this.storeOptions.highWater != null && queueLength === this.storeOptions.highWater && !this.check(weight, now);
      const blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
      if (blocked) {
        this._unblockTime = now + this.computePenalty();
        this._nextRequest = this._unblockTime + this.storeOptions.minTime;
        this.instance._dropAllQueued();
      }
      return {
        reachedHWM,
        blocked,
        strategy: this.storeOptions.strategy
      };
    });
  }
  __free__(index, weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.yieldLoop();
      this._running -= weight;
      this._done += weight;
      this.instance._drainAll(this.computeCapacity());
      return {
        running: this._running
      };
    });
  }
}
module.exports = LocalDatastore;