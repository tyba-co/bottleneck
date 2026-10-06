import * as parser from "./parser";
import Events from "./Events";
import RedisConnection from "./RedisConnection";
import GlideConnection from "./GlideConnection";
import * as Scripts from "./Scripts";

interface LimiterOptions {
  timeout?: number;
  connection?: any;
  Promise?: PromiseConstructor;
  id?: string;
  datastore?: string;
  [key: string]: any;
}

interface GroupDefaults {
  timeout: number;
  connection: any;
  Promise: PromiseConstructor;
  id: string;
}

class Group {
  private defaults: GroupDefaults = {
    timeout: 1000 * 60 * 5,
    connection: null,
    Promise: Promise,
    id: "group-key"
  };

  public Events: Events;
  public instances: { [key: string]: any } = {};
  public Bottleneck: any;
  public timeout!: number;
  public connection: any;
  public Promise!: PromiseConstructor;
  public id!: string;
  private interval?: NodeJS.Timeout;
  private sharedConnection: boolean;

  constructor(public limiterOptions: LimiterOptions = {}) {
    parser.load(this.limiterOptions, this.defaults, this);
    this.Events = new Events(this);
    this.Bottleneck = require("./Bottleneck");
    this._startAutoCleanup();
    this.sharedConnection = this.connection != null;

    if (this.connection == null && this.limiterOptions.datastore === "redis") {
      this.connection = new RedisConnection({ ...this.limiterOptions, Events: this.Events });
    } else if (this.connection == null && this.limiterOptions.datastore === "valkey-glide") {
      this.connection = new GlideConnection({ ...this.limiterOptions, Events: this.Events });
    }
  }

  key(key: string = ""): any {
    return this.instances[key] ?? (() => {
      const limiter = this.instances[key] = new this.Bottleneck({
        ...this.limiterOptions,
        id: `${this.id}-${key}`,
        timeout: this.timeout,
        connection: this.connection
      });
      this.Events.trigger("created", limiter, key);
      return limiter;
    })();
  }

  deleteKey = async (key: string = ""): Promise<boolean> => {
    const instance = this.instances[key];
    let deleted = 0;
    if (this.connection) {
      deleted = await this.connection.__runCommand__(["del", ...Scripts.allKeys(`${this.id}-${key}`)]);
    }
    if (instance != null) {
      delete this.instances[key];
      await instance.disconnect();
    }
    return instance != null || deleted > 0;
  };

  limiters(): Array<{ key: string; limiter: any }> {
    return Object.keys(this.instances).map(k => ({ key: k, limiter: this.instances[k] }));
  }

  keys(): string[] {
    return Object.keys(this.instances);
  }

  async clusterKeys(): Promise<string[]> {
    if (this.connection == null) {
      return this.Promise.resolve(this.keys());
    }
    const start = `b_${this.id}-`.length;
    const end = "_settings".length;
    const settingsKeys: string[] = await this.connection.__scanKeys__(`b_${this.id}-*_settings`);
    return settingsKeys.map(k => k.slice(start, -end));
  }

  private _startAutoCleanup(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      const time = Date.now();
      for (const [k, v] of Object.entries(this.instances)) {
        try {
          if (await v._store.__groupCheck__(time)) {
            this.deleteKey(k);
          }
        } catch (e) {
          v.Events.trigger("error", e);
        }
      }
    }, this.timeout / 2);
    
    if (this.interval.unref) {
      this.interval.unref();
    }
  }

  updateSettings(options: Partial<LimiterOptions> = {}): void {
    parser.overwrite(options, this.defaults, this);
    parser.overwrite(options, options, this.limiterOptions);
    if (options.timeout != null) {
      this._startAutoCleanup();
    }
  }

  disconnect(flush: boolean = true): void {
    if (!this.sharedConnection) {
      this.connection?.disconnect(flush);
    }
  }
}

export = Group;
