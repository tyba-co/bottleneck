import * as parser from "./parser";
import Events = require("./Events");
import * as Scripts from "./Scripts";

interface GlideConnectionOptions {
  Glide?: any;
  clientOptions?: any;
  clusterNodes?: any;
  client?: any;
  Promise?: PromiseConstructor;
  Events?: Events;
}

interface GlideConnectionDefaults {
  Glide: any;
  clientOptions: any;
  clusterNodes: any;
  client: any;
  Promise: PromiseConstructor;
  Events: any;
}

// subscribe() resolves on confirmation or after this long; it never rejects on timeout
const SUBSCRIPTION_TIMEOUT_MS = 10000;
const DEFAULT_ADDRESSES = [{ host: "127.0.0.1", port: 6379 }];
// GLIDE never reconnects a client whose first connection failed, so creating it is retried this many times
const MAX_CONNECTION_RETRIES = 2;
const CONNECTION_RETRY_DELAY_MS = 500;

/**
 * Connection to Valkey/Redis or a cluster through valkey-glide (GlideClient / GlideClusterClient).
 */
class GlideConnection {
  public datastore: "valkey-glide" = "valkey-glide";
  private defaults: GlideConnectionDefaults = {
    Glide: null,
    clientOptions: {},
    clusterNodes: null,
    client: null,
    Promise: Promise,
    Events: null
  };

  public Glide: any;
  public Events!: Events;
  public Promise!: PromiseConstructor;
  public client: any;
  public subscriber: any;
  public limiters: { [channel: string]: any } = {};
  public ready: Promise<any>;
  private clientOptions: any;
  private clusterNodes: any;
  private scripts: { [name: string]: any } = {};
  private openedClients: any[] = [];
  private pendingRequests: Set<Promise<any>> = new Set();
  private terminated: boolean = false;

  constructor(options: GlideConnectionOptions = {}) {
    parser.load(options, this.defaults, this);
    this.Glide = this.Glide ?? eval("require")("@valkey/valkey-glide"); // Obfuscated or else Webpack/Angular will try to inline the optional valkey-glide module
    if (this.Events == null) {
      this.Events = new Events(this);
    } else {
      this.Events.shareListenersWith(this);
    }

    const ClientClass = this.clusterNodes != null || this._isClusterClient(this.client)
      ? this.Glide.GlideClusterClient
      : this.Glide.GlideClient;
    const configuration = {
      ...this.clientOptions,
      addresses: this.clusterNodes ?? this.clientOptions.addresses ?? DEFAULT_ADDRESSES
    };

    this.ready = this.Promise.all([
      this.client != null
        ? this.Promise.resolve(this.client)
        : this._createClient(ClientClass, {
            protocol: this.Glide.ProtocolVersion.RESP2,
            ...configuration,
            defaultDecoder: this.Glide.Decoder.String
          }),
      // Pub/Sub only works over RESP3, so the subscriber never inherits the command client's protocol
      this._createClient(ClientClass, {
        ...configuration,
        protocol: this.Glide.ProtocolVersion.RESP3,
        defaultDecoder: this.Glide.Decoder.String,
        pubsubSubscriptions: {
          channelsAndPatterns: {},
          callback: (msg: any) => this._onMessage(msg)
        }
      })
    ])
      .then(([client, subscriber]) => {
        this.client = client;
        this.subscriber = subscriber;
        return { client, subscriber };
      })
      .catch((e: any) => {
        // The connection is unusable without both clients, so close the one that did connect instead of leaking it
        this.terminated = true;
        this.openedClients.forEach((client) => client.close());
        this.Events.trigger("error", e);
        throw e;
      });
    // Whoever awaits ready still gets the rejection; a connection closed before it is ready must not crash the process
    this.ready.catch(() => {});
  }

  private _isClusterClient(client: any): boolean {
    return client != null && typeof client.invokeScriptWithRoute === "function";
  }

  private async _createClient(ClientClass: any, configuration: any): Promise<any> {
    const client = await this._connectWithRetries(ClientClass, configuration, MAX_CONNECTION_RETRIES);
    // A disconnect() or failed connection that happened while the client was being created could not close it
    if (this.terminated) {
      client.close();
    } else {
      this.openedClients.push(client);
    }
    return client;
  }

  /**
   * Creates a GLIDE client, retrying a failed first connection unless the connection was terminated meanwhile.
   * @param {any} ClientClass
   * @param {any} configuration
   * @param {number} retriesLeft
   * @returns {Promise<any>}
   */
  private async _connectWithRetries(ClientClass: any, configuration: any, retriesLeft: number): Promise<any> {
    try {
      return await ClientClass.createClient(configuration);
    } catch (e: any) {
      if (retriesLeft === 0 || this.terminated) {
        throw e;
      }
      this.Events.trigger("debug", `Retrying the valkey-glide connection (${retriesLeft} left)`, { error: e });
      await new this.Promise((resolve) => setTimeout(resolve, CONNECTION_RETRY_DELAY_MS));
      if (this.terminated) {
        throw e;
      }
      return this._connectWithRetries(ClientClass, configuration, retriesLeft - 1);
    }
  }

  private _onMessage(msg: any): void {
    const channel = String(msg.channel);
    this.limiters[channel]?._store.onMessage(channel, String(msg.message));
  }

  private _script(name: string): any {
    return this.scripts[name] ?? (this.scripts[name] = new this.Glide.Script(Scripts.payload(name)));
  }

  /**
   * Runs a Bottleneck Lua script; invokeScript falls back from EVALSHA to EVAL and routes by the first key.
   * @param {string} name
   * @param {string} id
   * @param {string[]} args
   * @returns {Promise<any>}
   */
  __runScript__(name: string, id: string, args: string[]): Promise<any> {
    return this._trackRequest(this.client.invokeScript(this._script(name), {
      keys: Scripts.keys(name, id),
      args,
      decoder: this.Glide.Decoder.String
    }));
  }

  /**
   * @param {string} channel
   * @param {string} message
   * @returns {Promise<void>}
   */
  async __publish__(channel: string, message: string): Promise<void> {
    await this._trackRequest(this.client.publish(message, channel));
  }

  async __runCommand__(cmd: any[]): Promise<any> {
    await this.ready;
    const args = cmd.map(String);
    const route = this._isClusterClient(this.client) && cmd[1] != null
      ? { route: { type: "primarySlotKey", key: String(cmd[1]) } }
      : {};
    return this._trackRequest(this.client.customCommand(args, { ...route, decoder: this.Glide.Decoder.String }));
  }

  /**
   * Scans every node: GlideClusterClient.scan walks all the shards with a ClusterScanCursor
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  async __scanKeys__(pattern: string): Promise<string[]> {
    await this.ready;
    const keys: string[] = [];
    const options = { match: pattern, count: 10000, decoder: this.Glide.Decoder.String };
    if (this._isClusterClient(this.client)) {
      let cursor = new this.Glide.ClusterScanCursor();
      while (!cursor.isFinished()) {
        const [next, found] = await this.client.scan(cursor, options);
        cursor = next;
        keys.push(...found);
      }
    } else {
      let cursor = "0";
      do {
        const [next, found] = await this.client.scan(cursor, options);
        cursor = String(next);
        keys.push(...found);
      } while (cursor !== "0");
    }
    return keys;
  }

  async __addLimiter__(instance: any): Promise<void[]> {
    const channels = [instance.channel(), instance.channel_client()];
    for (const channel of channels) {
      this.limiters[channel] = instance;
    }
    await this.subscriber.subscribe(new Set(channels), SUBSCRIPTION_TIMEOUT_MS);
    return [];
  }

  async __removeLimiter__(instance: any): Promise<void[]> {
    // A newer limiter with the same id took over the channel and still needs it
    const channels = [instance.channel(), instance.channel_client()].filter((channel) => this.limiters[channel] === instance);
    for (const channel of channels) {
      delete this.limiters[channel];
    }
    if (channels.length > 0 && !this.terminated) {
      await this.subscriber.unsubscribe(new Set(channels), SUBSCRIPTION_TIMEOUT_MS);
    }
    return [];
  }

  /**
   * Remembers a request until it settles, so disconnect(true) can wait for it.
   * @param {Promise<any>} request
   * @returns {Promise<any>}
   */
  private _trackRequest<T>(request: Promise<T>): Promise<T> {
    this.pendingRequests.add(request);
    const forget = () => this.pendingRequests.delete(request);
    request.then(forget, forget);
    return request;
  }

  /**
   * GLIDE's close() rejects every pending request, so with flush the requests in flight finish first, like node-redis QUIT.
   * @param {boolean} [flush]
   * @returns {Promise<void>}
   */
  async disconnect(flush: boolean = true): Promise<void> {
    const limiters = Object.keys(this.limiters).map((channel) => this.limiters[channel]);
    this.limiters = {};
    await this.Promise.all(limiters.map((limiter) => limiter._store.__leaveCluster__()));
    this.terminated = true;
    if (flush) {
      await this.Promise.all(Array.from(this.pendingRequests, (request) => request.catch(() => {})));
    }

    this.client?.close();
    this.subscriber?.close();
    for (const name of Object.keys(this.scripts)) {
      this.scripts[name].release();
    }
    this.scripts = {};
  }
}

export = GlideConnection;
