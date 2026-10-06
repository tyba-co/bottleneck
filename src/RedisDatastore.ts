import * as parser from "./parser";
import BottleneckError = require("./BottleneckError");
import RedisConnection = require("./RedisConnection");
import GlideConnection = require("./GlideConnection");

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
  defaultExpiration?: number;
}

interface StoreInstanceOptions {
  Redis?: any;
  Glide?: any;
  clientOptions?: any;
  clusterNodes?: any;
  Promise: PromiseConstructor;
  timeout?: number;
  heartbeatInterval: number;
  clientTimeout: number;
  clearDatastore?: boolean;
  connection?: any;
}

interface Instance {
  id: string;
  _randomIndex(): string;
  datastore: string;
  connection: any;
  version: string;
  queued(): number;
  _drainAll(capacity?: number | null): Promise<number>;
  _dropAllQueued(): void;
  channel(): string;
  Events: {
    trigger(event: string, ...args: any[]): void;
  };
}

class RedisDatastore {
  public originalId: string;
  public clientId: string;
  public clients: any;
  public Redis?: any;
  public Glide?: any;
  public clientOptions?: any;
  public clusterNodes?: any;
  public Promise!: PromiseConstructor;
  public timeout?: number;
  public heartbeatInterval!: number;
  public clientTimeout!: number;
  public clearDatastore?: boolean;
  public connection!: RedisConnection | GlideConnection;
  public ready: Promise<any>;
  public heartbeat?: NodeJS.Timeout;
  private capacityPriorityCounters: { [counter: string]: NodeJS.Timeout } = {};
  private sharedConnection: boolean;

  constructor(
    public instance: Instance,
    public storeOptions: StoreOptions,
    storeInstanceOptions: StoreInstanceOptions
  ) {
    this.originalId = this.instance.id;
    this.clientId = this.instance._randomIndex();
    parser.load(storeInstanceOptions, storeInstanceOptions, this);
    this.clients = {};
    this.sharedConnection = storeInstanceOptions.connection != null;

    const connectionOptions = {
      clientOptions: this.clientOptions,
      clusterNodes: this.clusterNodes,
      Promise: this.Promise,
      Events: this.instance.Events as any
    };
    this.connection = storeInstanceOptions.connection ?? (
      this.instance.datastore === "valkey-glide"
        ? new GlideConnection({ ...connectionOptions, Glide: this.Glide })
        : new RedisConnection({ ...connectionOptions, Redis: this.Redis })
    );

    this.instance.connection = this.connection;
    this.instance.datastore = this.connection.datastore;

    this.ready = this.connection.ready
      .then((clients: any) => {
        this.clients = clients;
        return this.runScript("init", this.prepareInitSettings(this.clearDatastore));
      })
      .then(() => this.connection.__addLimiter__(this.instance))
      .then(() => this.runScript("register_client", [this.instance.queued()]))
      .then(() => {
        this.heartbeat = setInterval(() => {
          this.runScript("heartbeat", [])
            .catch((e: any) => this.instance.Events.trigger("error", e));
        }, this.heartbeatInterval);
        
        if (this.heartbeat.unref) {
          this.heartbeat.unref();
        }
        
        return this.clients;
      });
    // Whoever awaits ready still gets the rejection; a limiter disconnected before it is ready must not crash the process
    this.ready.catch(() => {});
  }

  async __publish__(message: any): Promise<void> {
    await this.ready;
    await this.connection.__publish__(this.instance.channel(), `message:${message.toString()}`);
  }

  async onMessage(channel: string, message: string): Promise<void> {
    try {
      const pos = message.indexOf(":");
      const [type, data] = [message.slice(0, pos), message.slice(pos + 1)];
      
      if (type === "capacity") {
        await this.instance._drainAll(data.length > 0 ? ~~data : undefined);
      } else if (type === "capacity-priority") {
        const [rawCapacity, priorityClient, counter] = data.split(":");
        const capacity = rawCapacity.length > 0 ? ~~rawCapacity : undefined;
        
        if (priorityClient === this.clientId) {
          const drained = await this.instance._drainAll(capacity);
          const newCapacity = capacity != null ? capacity - (drained || 0) : "";
          await this.connection.__publish__(
            this.instance.channel(),
            `capacity-priority:${newCapacity}::${counter}`
          );
        } else if (priorityClient === "") {
          clearTimeout(this.capacityPriorityCounters[counter]);
          delete this.capacityPriorityCounters[counter];
          this.instance._drainAll(capacity);
        } else {
          this.capacityPriorityCounters[counter] = setTimeout(async () => {
            try {
              delete this.capacityPriorityCounters[counter];
              await this.runScript("blacklist_client", [priorityClient]);
              await this.instance._drainAll(capacity);
            } catch (e) {
              this.instance.Events.trigger("error", e);
            }
          }, 1000);
        }
      } else if (type === "message") {
        this.instance.Events.trigger("message", data);
      } else if (type === "blocked") {
        await this.instance._dropAllQueued();
      }
    } catch (e) {
      this.instance.Events.trigger("error", e);
    }
  }

  async __disconnect__(flush: boolean): Promise<void> {
    await this.__leaveCluster__();
    if (this.sharedConnection) {
      await this.connection.__removeLimiter__(this.instance);
    } else {
      await this.connection.disconnect(flush);
    }
  }

  /**
   * Stops the heartbeat, releases this client's jobs and removes it from the cluster, since it can no longer free them.
   * Does nothing before the client registered (the heartbeat starts then) or once it has left.
   * @returns {Promise<void>}
   */
  async __leaveCluster__(): Promise<void> {
    if (this.heartbeat == null) {
      return;
    }
    clearInterval(this.heartbeat);
    this.heartbeat = undefined;
    try {
      await this.connection.__runScript__("unregister_client", this.originalId, this.prepareArray([Date.now(), this.clientId]));
    } catch (e) {
      this.instance.Events.trigger("error", e);
    }
  }

  async runScript(name: string, args: any[]): Promise<any> {
    if (name !== "init" && name !== "register_client") {
      await this.ready;
    }
    
    const all_args = [Date.now(), this.clientId, ...args];
    this.instance.Events.trigger("debug", `Calling Redis script: ${name}.lua`, all_args);
    return this.connection.__runScript__(name, this.originalId, this.prepareArray(all_args)).catch((e: any) => {
      if (e.message.match(/^(.*\s)?SETTINGS_KEY_NOT_FOUND$/) != null) {
        if (name === "heartbeat") {
          return this.Promise.resolve();
        } else {
          return this.runScript("init", this.prepareInitSettings(false))
            .then(() => this.runScript(name, args));
        }
      } else if (e.message.match(/^(.*\s)?UNKNOWN_CLIENT$/) != null) {
        return this.runScript("register_client", [this.instance.queued()])
          .then(() => this.runScript(name, args));
      } else {
        return this.Promise.reject(e);
      }
    });
  }

  prepareArray(arr: any[]): string[] {
    return arr.map(x => x != null ? x.toString() : "");
  }

  prepareObject(obj: { [key: string]: any }): string[] {
    const arr: string[] = [];
    for (const k of Object.keys(obj)) {
      arr.push(k, obj[k] != null ? obj[k].toString() : "");
    }
    return arr;
  }

  prepareInitSettings(clear?: boolean): any[] {
    const args = this.prepareObject({
      ...this.storeOptions,
      id: this.originalId,
      version: this.instance.version,
      groupTimeout: this.timeout,
      clientTimeout: this.clientTimeout
    });
    args.unshift(clear ? "1" : "0", this.instance.version);
    return args;
  }

  convertBool(b: any): boolean {
    return !!b;
  }

  async __updateSettings__(options: Partial<StoreOptions>): Promise<void> {
    await this.runScript("update_settings", this.prepareObject(options));
    parser.overwrite(options, options, this.storeOptions);
  }

  __running__(): Promise<number> {
    return this.runScript("running", []);
  }

  __queued__(): Promise<number> {
    return this.runScript("queued", []);
  }

  __done__(): Promise<number> {
    return this.runScript("done", []);
  }

  async __groupCheck__(): Promise<boolean> {
    return this.convertBool(await this.runScript("group_check", []));
  }

  __incrementReservoir__(incr: number): Promise<number> {
    return this.runScript("increment_reservoir", [incr]);
  }

  __currentReservoir__(): Promise<number> {
    return this.runScript("current_reservoir", []);
  }

  async __check__(weight: number): Promise<boolean> {
    return this.convertBool(await this.runScript("check", this.prepareArray([weight])));
  }

  async __register__(
    index: string, 
    weight: number, 
    expiration: number | null
  ): Promise<{ success: boolean; wait: number; reservoir: number }> {
    const [success, wait, reservoir] = await this.runScript(
      "register", 
      this.prepareArray([index, weight, expiration])
    );
    return {
      success: this.convertBool(success),
      wait,
      reservoir
    };
  }

  async __submit__(
    queueLength: number, 
    weight: number
  ): Promise<{ reachedHWM: boolean; blocked: boolean; strategy: number }> {
    try {
      const [reachedHWM, blocked, strategy] = await this.runScript(
        "submit", 
        this.prepareArray([queueLength, weight])
      );
      return {
        reachedHWM: this.convertBool(reachedHWM),
        blocked: this.convertBool(blocked),
        strategy
      };
    } catch (e) {
      const error = e as any;
      const overweight = error.message.match(/^(?:.*\s)?OVERWEIGHT:(\d+):(\d+)$/);
      if (overweight != null) {
        const [, weight, maxConcurrent] = overweight;
        throw new BottleneckError(
          `Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${maxConcurrent}`
        );
      } else {
        throw e;
      }
    }
  }

  async __free__(index: string, weight: number): Promise<{ running: number }> {
    const running = await this.runScript("free", this.prepareArray([index]));
    return { running };
  }
}

export = RedisDatastore;
