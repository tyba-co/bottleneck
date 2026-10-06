import * as parser from "./parser";
import Events = require("./Events");
import * as Scripts from "./Scripts";

interface RedisConnectionOptions {
  Redis?: any;
  clientOptions?: any;
  client?: any;
  Promise?: PromiseConstructor;
  Events?: Events;
}

interface RedisConnectionDefaults {
  Redis: any;
  clientOptions: any;
  client: any;
  Promise: PromiseConstructor;
  Events: any;
}

class RedisConnection {
  public datastore: "redis" = "redis";
  private defaults: RedisConnectionDefaults = {
    Redis: null,
    clientOptions: {},
    client: null,
    Promise: Promise,
    Events: null
  };

  public Redis: any;
  public Events!: Events;
  public Promise!: PromiseConstructor;
  public client: any;
  public subscriber: any;
  public limiters: { [channel: string]: any } = {};
  public shas: { [name: string]: string } = {};
  public ready: Promise<any>;
  private terminated: boolean = false;

  constructor(options: RedisConnectionOptions = {}) {
    parser.load(options, this.defaults, this);
    this.Redis = this.Redis ?? eval("require")("redis"); // Obfuscated or else Webpack/Angular will try to inline the optional redis module
    this.Events = this.Events ?? new Events(this);

    this.client = this.client ?? this.Redis.createClient(this.defaults.clientOptions);
    this.subscriber = this.client.duplicate();

    this.ready = Promise.all([
      this._setup(this.client, false),
      this._setup(this.subscriber, true)
    ])
    .then(() => this._loadScripts())
    .then(() => ({ client: this.client, subscriber: this.subscriber }));
  }

  private _setup(client: any, sub: boolean): Promise<void> {
    client.setMaxListeners(0);
    return new this.Promise<void>((resolve, reject) => {
      client.on("error", (e: any) => this.Events.trigger("error", e));
      if (sub) {
        client.on("message", (channel: string, message: string) => {
          this.limiters[channel]?._store.onMessage(channel, message);
        });
      }
      if (client.ready) {
        resolve();
      } else {
        client.once("ready", resolve);
      }
    });
  }

  private _loadScript(name: string): Promise<string> {
    return new this.Promise<string>((resolve, reject) => {
      const payload = Scripts.payload(name);
      this.client.multi([["script", "load", payload]]).exec((err: any, replies: any[]) => {
        if (err != null) {
          return reject(err);
        }
        this.shas[name] = replies[0];
        resolve(replies[0]);
      });
    });
  }

  private _loadScripts(): Promise<string[]> {
    return Promise.all(Scripts.names.map(k => this._loadScript(k)));
  }

  async __runCommand__(cmd: any[]): Promise<any> {
    await this.ready;
    return new this.Promise((resolve, reject) => {
      this.client.multi([cmd]).exec_atomic((err: any, replies: any[]) => {
        if (err != null) {
          reject(err);
        } else {
          resolve(replies[0]);
        }
      });
    });
  }

  /**
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  async __scanKeys__(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, found] = await this.__runCommand__(["scan", cursor, "match", pattern, "count", 10000]);
      cursor = next;
      keys.push(...found);
    } while (cursor !== "0");
    return keys;
  }

  __addLimiter__(instance: any): Promise<void[]> {
    return Promise.all([instance.channel(), instance.channel_client()].map(channel =>
      new this.Promise<void>((resolve, reject) => {
        const handler = (chan: string) => {
          if (chan === channel) {
            this.subscriber.removeListener("subscribe", handler);
            this.limiters[channel] = instance;
            resolve();
          }
        };
        this.subscriber.on("subscribe", handler);
        this.subscriber.subscribe(channel);
      })
    ));
  }

  async __removeLimiter__(instance: any): Promise<void[]> {
    return Promise.all([instance.channel(), instance.channel_client()].map(async channel => {
      if (!this.terminated) {
        await new this.Promise<void>((resolve, reject) => {
          this.subscriber.unsubscribe(channel, (err: any, chan: string) => {
            if (err != null) {
              return reject(err);
            }
            if (chan === channel) {
              return resolve();
            }
          });
        });
      }
      delete this.limiters[channel];
    }));
  }

  __scriptArgs__(name: string, id: string, args: any[], cb: any): any[] {
    const keys = Scripts.keys(name, id);
    return [this.shas[name], keys.length, ...keys, ...args, cb];
  }

  __scriptFn__(name: string): any {
    return this.client.evalsha.bind(this.client);
  }

  disconnect(flush: boolean = true): Promise<void> {
    for (const k of Object.keys(this.limiters)) {
      clearInterval(this.limiters[k]._store.heartbeat);
    }
    this.limiters = {};
    this.terminated = true;

    this.client.end(flush);
    this.subscriber.end(flush);
    return this.Promise.resolve();
  }
}

export = RedisConnection;
