"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const Events_1 = tslib_1.__importDefault(require("./Events"));
const RedisConnection_1 = tslib_1.__importDefault(require("./RedisConnection"));
const IORedisConnection_1 = tslib_1.__importDefault(require("./IORedisConnection"));
const Scripts = tslib_1.__importStar(require("./Scripts"));
class Group {
  constructor(limiterOptions = {}) {
    this.limiterOptions = limiterOptions;
    this.defaults = {
      timeout: 1000 * 60 * 5,
      connection: null,
      Promise: Promise,
      id: "group-key"
    };
    this.instances = {};
    this.deleteKey = (key = "") => tslib_1.__awaiter(this, void 0, void 0, function* () {
      const instance = this.instances[key];
      let deleted = 0;
      if (this.connection) {
        deleted = yield this.connection.__runCommand__(["del", ...Scripts.allKeys(`${this.id}-${key}`)]);
      }
      if (instance != null) {
        delete this.instances[key];
        yield instance.disconnect();
      }
      return instance != null || deleted > 0;
    });
    parser.load(this.limiterOptions, this.defaults, this);
    this.Events = new Events_1.default(this);
    this.Bottleneck = require("./Bottleneck");
    this._startAutoCleanup();
    this.sharedConnection = this.connection != null;
    if (this.connection == null) {
      if (this.limiterOptions.datastore === "redis") {
        this.connection = new RedisConnection_1.default(Object.assign(Object.assign({}, this.limiterOptions), {
          Events: this.Events
        }));
      } else if (this.limiterOptions.datastore === "ioredis") {
        this.connection = new IORedisConnection_1.default(Object.assign(Object.assign({}, this.limiterOptions), {
          Events: this.Events
        }));
      }
    }
  }
  key(key = "") {
    var _a;
    return (_a = this.instances[key]) !== null && _a !== void 0 ? _a : (() => {
      const limiter = this.instances[key] = new this.Bottleneck(Object.assign(Object.assign({}, this.limiterOptions), {
        id: `${this.id}-${key}`,
        timeout: this.timeout,
        connection: this.connection
      }));
      this.Events.trigger("created", limiter, key);
      return limiter;
    })();
  }
  limiters() {
    return Object.keys(this.instances).map(k => ({
      key: k,
      limiter: this.instances[k]
    }));
  }
  keys() {
    return Object.keys(this.instances);
  }
  clusterKeys() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (this.connection == null) {
        return this.Promise.resolve(this.keys());
      }
      const keys = [];
      let cursor = null;
      const start = `b_${this.id}-`.length;
      const end = "_settings".length;
      do {
        const result = yield this.connection.__runCommand__(["scan", cursor !== null && cursor !== void 0 ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 10000]);
        const [next, found] = result;
        cursor = ~~next;
        for (const k of found) {
          keys.push(k.slice(start, -end));
        }
      } while (cursor !== 0);
      return keys;
    });
  }
  _startAutoCleanup() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
      const time = Date.now();
      for (const [k, v] of Object.entries(this.instances)) {
        try {
          if (yield v._store.__groupCheck__(time)) {
            this.deleteKey(k);
          }
        } catch (e) {
          v.Events.trigger("error", e);
        }
      }
    }), this.timeout / 2);
    if (this.interval.unref) {
      this.interval.unref();
    }
  }
  updateSettings(options = {}) {
    parser.overwrite(options, this.defaults, this);
    parser.overwrite(options, options, this.limiterOptions);
    if (options.timeout != null) {
      this._startAutoCleanup();
    }
  }
  disconnect(flush = true) {
    var _a;
    if (!this.sharedConnection) {
      (_a = this.connection) === null || _a === void 0 ? void 0 : _a.disconnect(flush);
    }
  }
}
module.exports = Group;