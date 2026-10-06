import * as parser from "./parser";
import Events = require("./Events");
import * as Scripts from "./Scripts";

interface RedisConnectionOptions {
  Redis?: any;
  clientOptions?: any;
  clusterNodes?: any;
  client?: any;
  Promise?: PromiseConstructor;
  Events?: Events;
}

interface RedisConnectionDefaults {
  Redis: any;
  clientOptions: any;
  clusterNodes: any;
  client: any;
  Promise: PromiseConstructor;
  Events: any;
}

/**
 * Connection to Redis or Redis Cluster through node-redis v4.
 */
class RedisConnection {
  public datastore: "redis" = "redis";
  private defaults: RedisConnectionDefaults = {
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
  public shas: { [name: string]: string } = {};
  public ready: Promise<any>;
  private clientOptions: any;
  private clusterNodes: any;
  private terminated: boolean = false;
  private connectAttempts = new Map<any, Promise<void>>();

  constructor(options: RedisConnectionOptions = {}) {
    parser.load(options, this.defaults, this);
    this.Redis = this.Redis ?? eval("require")("redis"); // Obfuscated or else Webpack/Angular will try to inline the optional redis module
    this.Events = this.Events ?? new Events(this);

    this.client = this.client ?? (
      this.clusterNodes != null
        ? this.Redis.createCluster({ rootNodes: this.clusterNodes, defaults: this.clientOptions })
        : this.Redis.createClient(this.clientOptions)
    );
    this.subscriber = this.client.duplicate();

    this.ready = this.Promise.all([this._connect(this.client), this._connect(this.subscriber)])
      .then(() => this._loadScripts())
      .then(() => ({ client: this.client, subscriber: this.subscriber }));
  }

  private _isCluster(): boolean {
    return typeof this.client.nodeClient === "function";
  }

  private async _connect(client: any): Promise<void> {
    client.on("error", (e: any) => this.Events.trigger("error", e));
    if (client.isOpen) {
      return;
    }
    const connectAttempt = client.connect();
    this.connectAttempts.set(client, connectAttempt);
    try {
      await connectAttempt;
    } finally {
      this.connectAttempts.delete(client);
    }
  }

  /**
   * node-redis 4 cannot abort a socket that is still being created: closing the client meanwhile leaves that socket
   * open once it connects, so wait until the attempt connects or fails first.
   * @param {any} client
   * @returns {Promise<void>}
   */
  private _connectAttemptSettled(client: any): Promise<void> {
    const connectAttempt = this.connectAttempts.get(client);
    if (connectAttempt == null) {
      return this.Promise.resolve();
    }
    return new this.Promise<void>(resolve => {
      const settle = () => {
        client.off("error", settle);
        resolve();
      };
      client.once("error", settle);
      connectAttempt.then(settle, settle);
    });
  }

  /**
   * @param {string[]} args
   * @param {string} [firstKey] routes the command to the slot owner on Redis Cluster; any node when omitted
   * @returns {Promise<any>}
   */
  private _sendCommand(args: string[], firstKey?: string): Promise<any> {
    return this._isCluster()
      ? this.client.sendCommand(firstKey, false, args)
      : this.client.sendCommand(args);
  }

  private async _loadScripts(): Promise<void> {
    await this.Promise.all(Scripts.names.map(async name => {
      this.shas[name] = await this._sendCommand(["SCRIPT", "LOAD", Scripts.payload(name)]);
    }));
  }

  /**
   * Runs a Bottleneck Lua script. On Redis Cluster the script is only loaded on one node up front,
   * so the first call on every other node falls back from EVALSHA to EVAL, which caches it there.
   * Goes through sendCommand because node-redis 4 evalSha/eval route a cluster call by the SHA instead of the first key.
   * @param {string} name
   * @param {string} id
   * @param {string[]} args
   * @returns {Promise<any>}
   */
  async __runScript__(name: string, id: string, args: string[]): Promise<any> {
    const keys = Scripts.keys(name, id);
    const keysAndArgs = [String(keys.length), ...keys, ...args];
    try {
      return await this._sendCommand(["EVALSHA", this.shas[name], ...keysAndArgs], keys[0]);
    } catch (e) {
      if (!/^NOSCRIPT/.test((e as any)?.message)) {
        throw e;
      }
      return this._sendCommand(["EVAL", Scripts.payload(name), ...keysAndArgs], keys[0]);
    }
  }

  /**
   * @param {string} channel
   * @param {string} message
   * @returns {Promise<void>}
   */
  async __publish__(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }

  async __runCommand__(cmd: any[]): Promise<any> {
    await this.ready;
    return this._sendCommand(cmd.map(String), cmd[1] != null ? String(cmd[1]) : undefined);
  }

  /**
   * Scans every master, since on Redis Cluster a SCAN only covers the node that receives it
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  async __scanKeys__(pattern: string): Promise<string[]> {
    await this.ready;
    const nodes = this._isCluster()
      ? await this.Promise.all(this.client.masters.map((master: any) => this.client.nodeClient(master)))
      : [this.client];
    const keys: string[] = [];
    for (const node of nodes) {
      for await (const key of node.scanIterator({ MATCH: pattern, COUNT: 10000 })) {
        keys.push(key);
      }
    }
    return keys;
  }

  __addLimiter__(instance: any): Promise<void[]> {
    return this.Promise.all([instance.channel(), instance.channel_client()].map(async channel => {
      await this.subscriber.subscribe(channel, (message: string) => {
        this.limiters[channel]?._store.onMessage(channel, message);
      });
      this.limiters[channel] = instance;
    }));
  }

  async __removeLimiter__(instance: any): Promise<void[]> {
    return this.Promise.all([instance.channel(), instance.channel_client()].map(async channel => {
      if (!this.terminated) {
        await this.subscriber.unsubscribe(channel);
      }
      delete this.limiters[channel];
    }));
  }

  private async _close(client: any, flush: boolean): Promise<void> {
    await this._connectAttemptSettled(client);
    if (!client.isOpen) {
      return;
    }
    // QUIT has to reach the server, so a client still retrying to connect can only be dropped (clusters have no isReady)
    await (flush && client.isReady !== false ? client.quit() : client.disconnect());
  }

  async disconnect(flush: boolean = true): Promise<void> {
    for (const k of Object.keys(this.limiters)) {
      clearInterval(this.limiters[k]._store.heartbeat);
    }
    this.limiters = {};
    this.terminated = true;

    await this.Promise.all([this._close(this.client, flush), this._close(this.subscriber, flush)]);
  }
}

export = RedisConnection;
