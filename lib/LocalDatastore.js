"use strict";

var BottleneckError, LocalDatastore, parser;
parser = require("./parser");
BottleneckError = require("./BottleneckError");
LocalDatastore = class LocalDatastore {
  constructor(instance, storeOptions, storeInstanceOptions) {
    this.instance = instance;
    this.storeOptions = storeOptions;
    this.clientId = this.instance._randomIndex();
    parser.load(storeInstanceOptions, storeInstanceOptions, this);
    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    this._running = 0;
    this._done = 0;
    this._unblockTime = 0;
    this.ready = this.Promise.resolve();
    this.clients = {};
    this._startHeartbeat();
  }
  _startHeartbeat() {
    var base;
    if (this.heartbeat == null && (this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null || this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null)) {
      return typeof (base = this.heartbeat = setInterval(() => {
        var amount, incr, maximum, now, reservoir;
        now = Date.now();
        if (this.storeOptions.reservoirRefreshInterval != null && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
          this._lastReservoirRefresh = now;
          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
          this.instance._drainAll(this.computeCapacity());
        }
        if (this.storeOptions.reservoirIncreaseInterval != null && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
          ({
            reservoirIncreaseAmount: amount,
            reservoirIncreaseMaximum: maximum,
            reservoir
          } = this.storeOptions);
          this._lastReservoirIncrease = now;
          incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
          if (incr > 0) {
            this.storeOptions.reservoir += incr;
            return this.instance._drainAll(this.computeCapacity());
          }
        }
      }, this.heartbeatInterval)).unref === "function" ? base.unref() : void 0;
    } else {
      return clearInterval(this.heartbeat);
    }
  }
  async __publish__(message) {
    await this.yieldLoop();
    return this.instance.Events.trigger("message", message.toString());
  }
  async __disconnect__(flush) {
    await this.yieldLoop();
    clearInterval(this.heartbeat);
    return this.Promise.resolve();
  }
  yieldLoop(t = 0) {
    return new this.Promise(function (resolve, reject) {
      return setTimeout(resolve, t);
    });
  }
  computePenalty() {
    var ref;
    return (ref = this.storeOptions.penalty) != null ? ref : 15 * this.storeOptions.minTime || 5000;
  }
  async __updateSettings__(options) {
    await this.yieldLoop();
    parser.overwrite(options, options, this.storeOptions);
    this._startHeartbeat();
    this.instance._drainAll(this.computeCapacity());
    return true;
  }
  async __running__() {
    await this.yieldLoop();
    return this._running;
  }
  async __queued__() {
    await this.yieldLoop();
    return this.instance.queued();
  }
  async __done__() {
    await this.yieldLoop();
    return this._done;
  }
  async __groupCheck__(time) {
    await this.yieldLoop();
    return this._nextRequest + this.timeout < time;
  }
  computeCapacity() {
    var maxConcurrent, reservoir;
    ({
      maxConcurrent,
      reservoir
    } = this.storeOptions);
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
    var capacity;
    capacity = this.computeCapacity();
    return capacity == null || weight <= capacity;
  }
  async __incrementReservoir__(incr) {
    var reservoir;
    await this.yieldLoop();
    reservoir = this.storeOptions.reservoir += incr;
    this.instance._drainAll(this.computeCapacity());
    return reservoir;
  }
  async __currentReservoir__() {
    await this.yieldLoop();
    return this.storeOptions.reservoir;
  }
  isBlocked(now) {
    return this._unblockTime >= now;
  }
  check(weight, now) {
    return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
  }
  async __check__(weight) {
    var now;
    await this.yieldLoop();
    now = Date.now();
    return this.check(weight, now);
  }
  async __register__(index, weight, expiration) {
    var now, wait;
    await this.yieldLoop();
    now = Date.now();
    if (this.conditionsCheck(weight)) {
      this._running += weight;
      if (this.storeOptions.reservoir != null) {
        this.storeOptions.reservoir -= weight;
      }
      wait = Math.max(this._nextRequest - now, 0);
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
  }
  strategyIsBlock() {
    return this.storeOptions.strategy === 3;
  }
  async __submit__(queueLength, weight) {
    var blocked, now, reachedHWM;
    await this.yieldLoop();
    if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
      throw new BottleneckError(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
    }
    now = Date.now();
    reachedHWM = this.storeOptions.highWater != null && queueLength === this.storeOptions.highWater && !this.check(weight, now);
    blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
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
  }
  async __free__(index, weight) {
    await this.yieldLoop();
    this._running -= weight;
    this._done += weight;
    this.instance._drainAll(this.computeCapacity());
    return {
      running: this._running
    };
  }
};
module.exports = LocalDatastore;