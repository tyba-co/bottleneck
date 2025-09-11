"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const Events = require("./Events");
const Scripts = tslib_1.__importStar(require("./Scripts"));
class IORedisConnection {
  constructor(options = {}) {
    var _a, _b, _c;
    this.datastore = "ioredis";
    this.defaults = {
      Redis: null,
      clientOptions: {},
      clusterNodes: null,
      client: null,
      Promise: Promise,
      Events: null
    };
    this.limiters = {};
    this.terminated = false;
    parser.load(options, this.defaults, this);
    this.Redis = (_a = this.Redis) !== null && _a !== void 0 ? _a : eval("require")("ioredis"); // Obfuscated or else Webpack/Angular will try to inline the optional ioredis module
    this.Events = (_b = this.Events) !== null && _b !== void 0 ? _b : new Events(this);
    if (this.clusterNodes != null) {
      this.client = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
      this.subscriber = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
    } else if (this.client != null && !this.client.duplicate) {
      this.subscriber = new this.Redis.Cluster(this.client.startupNodes, this.client.options);
    } else {
      this.client = (_c = this.client) !== null && _c !== void 0 ? _c : new this.Redis(this.clientOptions);
      this.subscriber = this.client.duplicate();
    }
    this.ready = Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(() => {
      this._loadScripts();
      return {
        client: this.client,
        subscriber: this.subscriber
      };
    });
  }
  _setup(client, sub) {
    client.setMaxListeners(0);
    return new this.Promise((resolve, reject) => {
      client.on("error", e => this.Events.trigger("error", e));
      if (sub) {
        client.on("message", (channel, message) => {
          var _a;
          (_a = this.limiters[channel]) === null || _a === void 0 ? void 0 : _a._store.onMessage(channel, message);
        });
      }
      if (client.status === "ready") {
        resolve();
      } else {
        client.once("ready", resolve);
      }
    });
  }
  _loadScripts() {
    Scripts.names.forEach(name => {
      this.client.defineCommand(name, {
        lua: Scripts.payload(name)
      });
    });
  }
  __runCommand__(cmd) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.ready;
      const [[_, deleted]] = yield this.client.pipeline([cmd]).exec();
      return deleted;
    });
  }
  __addLimiter__(instance) {
    return Promise.all([instance.channel(), instance.channel_client()].map(channel => new this.Promise((resolve, reject) => {
      this.subscriber.subscribe(channel, () => {
        this.limiters[channel] = instance;
        resolve();
      });
    })));
  }
  __removeLimiter__(instance) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      const channels = [instance.channel(), instance.channel_client()];
      for (const channel of channels) {
        if (!this.terminated) {
          yield this.subscriber.unsubscribe(channel);
        }
        delete this.limiters[channel];
      }
    });
  }
  __scriptArgs__(name, id, args, cb) {
    const keys = Scripts.keys(name, id);
    return [keys.length, ...keys, ...args, cb];
  }
  __scriptFn__(name) {
    return this.client[name].bind(this.client);
  }
  disconnect(flush = true) {
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
module.exports = IORedisConnection;