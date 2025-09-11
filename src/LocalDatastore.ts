import * as parser from "./parser";
import BottleneckError = require("./BottleneckError");

interface StoreOptions {
  maxConcurrent?: number;
  minTime: number;
  highWater?: number;
  strategy: number;
  penalty?: number;
  reservoir?: number;
  reservoirRefreshInterval?: number;
  reservoirRefreshAmount?: number;
  reservoirIncreaseInterval?: number;
  reservoirIncreaseAmount?: number;
  reservoirIncreaseMaximum?: number;
}

interface StoreInstanceOptions {
  Promise: PromiseConstructor;
  timeout?: number;
  heartbeatInterval: number;
}

interface Instance {
  _randomIndex(): string;
  _drainAll(capacity?: number | null): Promise<number>;
  queued(): number;
  _dropAllQueued(): void;
  Events: {
    trigger(event: string, ...args: any[]): void;
  };
}

class LocalDatastore {
  public clientId: string;
  public Promise!: PromiseConstructor;
  public timeout?: number;
  public heartbeatInterval!: number;
  public ready: Promise<void>;
  public clients: any = {};
  public heartbeat?: NodeJS.Timeout;
  private _nextRequest: number;
  private _lastReservoirRefresh: number;
  private _lastReservoirIncrease: number;
  private _running: number = 0;
  private _done: number = 0;
  private _unblockTime: number = 0;

  constructor(
    public instance: Instance,
    public storeOptions: StoreOptions,
    storeInstanceOptions: StoreInstanceOptions
  ) {
    this.clientId = this.instance._randomIndex();
    parser.load(storeInstanceOptions, storeInstanceOptions, this);
    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    this.ready = this.Promise.resolve();
    this._startHeartbeat();
  }

  private _startHeartbeat(): void {
    if (
      !this.heartbeat &&
      ((this.storeOptions.reservoirRefreshInterval != null && this.storeOptions.reservoirRefreshAmount != null) ||
        (this.storeOptions.reservoirIncreaseInterval != null && this.storeOptions.reservoirIncreaseAmount != null))
    ) {
      this.heartbeat = setInterval(() => {
        const now = Date.now();

        if (
          this.storeOptions.reservoirRefreshInterval != null &&
          now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval
        ) {
          this._lastReservoirRefresh = now;
          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
          this.instance._drainAll(this.computeCapacity());
        }

        if (
          this.storeOptions.reservoirIncreaseInterval != null &&
          now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval
        ) {
          const { reservoirIncreaseAmount: amount, reservoirIncreaseMaximum: maximum, reservoir } = this.storeOptions;
          this._lastReservoirIncrease = now;
          const incr = maximum != null ? Math.min(amount!, maximum - reservoir!) : amount!;
          if (incr > 0) {
            this.storeOptions.reservoir! += incr;
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

  async __publish__(message: any): Promise<void> {
    await this.yieldLoop();
    this.instance.Events.trigger("message", message.toString());
  }

  async __disconnect__(flush: boolean): Promise<void> {
    await this.yieldLoop();
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    return this.Promise.resolve();
  }

  yieldLoop(t: number = 0): Promise<void> {
    return new this.Promise<void>((resolve) => setTimeout(resolve, t));
  }

  computePenalty(): number {
    return this.storeOptions.penalty ?? (15 * this.storeOptions.minTime || 5000);
  }

  async __updateSettings__(options: Partial<StoreOptions>): Promise<boolean> {
    await this.yieldLoop();
    parser.overwrite(options, options, this.storeOptions);
    this._startHeartbeat();
    this.instance._drainAll(this.computeCapacity());
    return true;
  }

  async __running__(): Promise<number> {
    await this.yieldLoop();
    return this._running;
  }

  async __queued__(): Promise<number> {
    await this.yieldLoop();
    return this.instance.queued();
  }

  async __done__(): Promise<number> {
    await this.yieldLoop();
    return this._done;
  }

  async __groupCheck__(time: number): Promise<boolean> {
    await this.yieldLoop();
    return (this._nextRequest + this.timeout!) < time;
  }

  computeCapacity(): number | null {
    const { maxConcurrent, reservoir } = this.storeOptions;
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

  conditionsCheck(weight: number): boolean {
    const capacity = this.computeCapacity();
    return capacity == null || weight <= capacity;
  }

  async __incrementReservoir__(incr: number): Promise<number> {
    await this.yieldLoop();
    const reservoir = (this.storeOptions.reservoir! += incr);
    this.instance._drainAll(this.computeCapacity());
    return reservoir;
  }

  async __currentReservoir__(): Promise<number | undefined> {
    await this.yieldLoop();
    return this.storeOptions.reservoir;
  }

  isBlocked(now: number): boolean {
    return this._unblockTime >= now;
  }

  check(weight: number, now: number): boolean {
    return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
  }

  async __check__(weight: number): Promise<boolean> {
    await this.yieldLoop();
    const now = Date.now();
    return this.check(weight, now);
  }

  async __register__(
    index: string,
    weight: number,
    expiration: number | null
  ): Promise<{ success: boolean; wait?: number; reservoir?: number }> {
    await this.yieldLoop();
    const now = Date.now();
    if (this.conditionsCheck(weight)) {
      this._running += weight;
      if (this.storeOptions.reservoir != null) {
        this.storeOptions.reservoir -= weight;
      }
      const wait = Math.max(this._nextRequest - now, 0);
      this._nextRequest = now + wait + this.storeOptions.minTime;
      return { success: true, wait, reservoir: this.storeOptions.reservoir };
    } else {
      return { success: false };
    }
  }

  strategyIsBlock(): boolean {
    return this.storeOptions.strategy === 3;
  }

  async __submit__(
    queueLength: number,
    weight: number
  ): Promise<{ reachedHWM: boolean; blocked: boolean; strategy: number }> {
    await this.yieldLoop();
    if (this.storeOptions.maxConcurrent != null && weight > this.storeOptions.maxConcurrent) {
      throw new BottleneckError(
        `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`
      );
    }
    const now = Date.now();
    const reachedHWM =
      this.storeOptions.highWater != null &&
      queueLength === this.storeOptions.highWater &&
      !this.check(weight, now);
    const blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
    if (blocked) {
      this._unblockTime = now + this.computePenalty();
      this._nextRequest = this._unblockTime + this.storeOptions.minTime;
      this.instance._dropAllQueued();
    }
    return { reachedHWM, blocked, strategy: this.storeOptions.strategy };
  }

  async __free__(index: string, weight: number): Promise<{ running: number }> {
    await this.yieldLoop();
    this._running -= weight;
    this._done += weight;
    this.instance._drainAll(this.computeCapacity());
    return { running: this._running };
  }
}

export = LocalDatastore;
