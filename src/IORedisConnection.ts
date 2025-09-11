import * as parser from "./parser";
import Events = require("./Events");
import * as Scripts from "./Scripts";

interface IORedisConnectionOptions {
  Redis?: any;
  clientOptions?: any;
  clusterNodes?: any;
  client?: any;
  Promise?: PromiseConstructor;
  Events?: Events;
}

interface IORedisConnectionDefaults {
  Redis: any;
  clientOptions: any;
  clusterNodes: any;
  client: any;
  Promise: PromiseConstructor;
  Events: any;
}

class IORedisConnection {
  public datastore: "ioredis" = "ioredis";
  private defaults: IORedisConnectionDefaults = {
    Redis: null,
    clientOptions: {},
    clusterNodes: null,
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
  public ready: Promise<any>;
  private terminated: boolean = false;
  private clusterNodes: any;
  private clientOptions: any;

  constructor(options: IORedisConnectionOptions = {}) {
    parser.load(options, this.defaults, this);
    this.Redis = this.Redis ?? eval("require")("ioredis"); // Obfuscated or else Webpack/Angular will try to inline the optional ioredis module
    this.Events = this.Events ?? new Events(this);

    if (this.clusterNodes != null) {
      this.client = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
      this.subscriber = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
    } else if (this.client != null && !this.client.duplicate) {
      this.subscriber = new this.Redis.Cluster(this.client.startupNodes, this.client.options);
    } else {
      this.client = this.client ?? new this.Redis(this.clientOptions);
      this.subscriber = this.client.duplicate();
    }

    this.ready = Promise.all([
      this._setup(this.client, false),
      this._setup(this.subscriber, true)
    ]).then(() => {
      this._loadScripts();
      return { client: this.client, subscriber: this.subscriber };
    });
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
      if (client.status === "ready") {
        resolve();
      } else {
        client.once("ready", resolve);
      }
    });
  }

  private _loadScripts(): void {
    Scripts.names.forEach(name => {
      this.client.defineCommand(name, { lua: Scripts.payload(name) });
    });
  }

  async __runCommand__(cmd: any[]): Promise<any> {
    await this.ready;
    const [[_, deleted]] = await this.client.pipeline([cmd]).exec();
    return deleted;
  }

  __addLimiter__(instance: any): Promise<void[]> {
    return Promise.all([instance.channel(), instance.channel_client()].map(channel =>
      new this.Promise<void>((resolve, reject) => {
        this.subscriber.subscribe(channel, () => {
          this.limiters[channel] = instance;
          resolve();
        });
      })
    ));
  }

  async __removeLimiter__(instance: any): Promise<void> {
    const channels = [instance.channel(), instance.channel_client()];
    for (const channel of channels) {
      if (!this.terminated) {
        await this.subscriber.unsubscribe(channel);
      }
      delete this.limiters[channel];
    }
  }

  __scriptArgs__(name: string, id: string, args: any[], cb: any): any[] {
    const keys = Scripts.keys(name, id);
    return [keys.length, ...keys, ...args, cb];
  }

  __scriptFn__(name: string): any {
    return this.client[name].bind(this.client);
  }

  disconnect(flush: boolean = true): Promise<void> {
    for (const k of Object.keys(this.limiters)) {
      clearInterval(this.limiters[k]._store.heartbeat);
    }
    this.limiters = {};
    this.terminated = true;

    if (flush) {
      return Promise.all([this.client.quit(), this.subscriber.quit()]).then(() => undefined);
    } else {
      this.client.disconnect();
      this.subscriber.disconnect();
      return this.Promise.resolve();
    }
  }
}

export = IORedisConnection;
