"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const Events = require("./Events");
const Scripts = tslib_1.__importStar(require("./Scripts"));
class RedisConnection {
  constructor(options = {}) {
    var _a, _b, _c;
    this.datastore = "redis";
    this.defaults = {
      Redis: null,
      clientOptions: {},
      client: null,
      Promise: Promise,
      Events: null
    };
    this.limiters = {};
    this.shas = {};
    this.terminated = false;
    parser.load(options, this.defaults, this);
    this.Redis = (_a = this.Redis) !== null && _a !== void 0 ? _a : eval("require")("redis"); // Obfuscated or else Webpack/Angular will try to inline the optional redis module
    this.Events = (_b = this.Events) !== null && _b !== void 0 ? _b : new Events(this);
    this.client = (_c = this.client) !== null && _c !== void 0 ? _c : this.Redis.createClient(this.defaults.clientOptions);
    this.subscriber = this.client.duplicate();
    this.ready = Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(() => this._loadScripts()).then(() => ({
      client: this.client,
      subscriber: this.subscriber
    }));
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
      if (client.ready) {
        resolve();
      } else {
        client.once("ready", resolve);
      }
    });
  }
  _loadScript(name) {
    return new this.Promise((resolve, reject) => {
      const payload = Scripts.payload(name);
      this.client.multi([["script", "load", payload]]).exec((err, replies) => {
        if (err != null) {
          return reject(err);
        }
        this.shas[name] = replies[0];
        resolve(replies[0]);
      });
    });
  }
  _loadScripts() {
    return Promise.all(Scripts.names.map(k => this._loadScript(k)));
  }
  __runCommand__(cmd) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.ready;
      return new this.Promise((resolve, reject) => {
        this.client.multi([cmd]).exec_atomic((err, replies) => {
          if (err != null) {
            reject(err);
          } else {
            resolve(replies[0]);
          }
        });
      });
    });
  }
  __addLimiter__(instance) {
    return Promise.all([instance.channel(), instance.channel_client()].map(channel => new this.Promise((resolve, reject) => {
      const handler = chan => {
        if (chan === channel) {
          this.subscriber.removeListener("subscribe", handler);
          this.limiters[channel] = instance;
          resolve();
        }
      };
      this.subscriber.on("subscribe", handler);
      this.subscriber.subscribe(channel);
    })));
  }
  __removeLimiter__(instance) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      return Promise.all([instance.channel(), instance.channel_client()].map(channel => tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!this.terminated) {
          yield new this.Promise((resolve, reject) => {
            this.subscriber.unsubscribe(channel, (err, chan) => {
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
      })));
    });
  }
  __scriptArgs__(name, id, args, cb) {
    const keys = Scripts.keys(name, id);
    return [this.shas[name], keys.length, ...keys, ...args, cb];
  }
  __scriptFn__(name) {
    return this.client.evalsha.bind(this.client);
  }
  disconnect(flush = true) {
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
module.exports = RedisConnection;