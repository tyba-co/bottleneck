"use strict";

var Events, Group, IORedisConnection, RedisConnection, Scripts, parser;
parser = require("./parser");
Events = require("./Events");
RedisConnection = require("./RedisConnection");
IORedisConnection = require("./IORedisConnection");
Scripts = require("./Scripts");
Group = function () {
  class Group {
    constructor(limiterOptions = {}) {
      this.deleteKey = this.deleteKey.bind(this);
      this.limiterOptions = limiterOptions;
      parser.load(this.limiterOptions, this.defaults, this);
      this.Events = new Events(this);
      this.instances = {};
      this.Bottleneck = require("./Bottleneck");
      this._startAutoCleanup();
      this.sharedConnection = this.connection != null;
      if (this.connection == null) {
        if (this.limiterOptions.datastore === "redis") {
          this.connection = new RedisConnection(Object.assign({}, this.limiterOptions, {
            Events: this.Events
          }));
        } else if (this.limiterOptions.datastore === "ioredis") {
          this.connection = new IORedisConnection(Object.assign({}, this.limiterOptions, {
            Events: this.Events
          }));
        }
      }
    }
    key(key = "") {
      var ref;
      return (ref = this.instances[key]) != null ? ref : (() => {
        var limiter;
        limiter = this.instances[key] = new this.Bottleneck(Object.assign(this.limiterOptions, {
          id: `${this.id}-${key}`,
          timeout: this.timeout,
          connection: this.connection
        }));
        this.Events.trigger("created", limiter, key);
        return limiter;
      })();
    }
    async deleteKey(key = "") {
      var deleted, instance;
      instance = this.instances[key];
      if (this.connection) {
        deleted = await this.connection.__runCommand__(['del', ...Scripts.allKeys(`${this.id}-${key}`)]);
      }
      if (instance != null) {
        delete this.instances[key];
        await instance.disconnect();
      }
      return instance != null || deleted > 0;
    }
    limiters() {
      var k, ref, results, v;
      ref = this.instances;
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push({
          key: k,
          limiter: v
        });
      }
      return results;
    }
    keys() {
      return Object.keys(this.instances);
    }
    async clusterKeys() {
      var cursor, end, found, i, k, keys, len, next, start;
      if (this.connection == null) {
        return this.Promise.resolve(this.keys());
      }
      keys = [];
      cursor = null;
      start = `b_${this.id}-`.length;
      end = "_settings".length;
      while (cursor !== 0) {
        [next, found] = await this.connection.__runCommand__(["scan", cursor != null ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 10000]);
        cursor = ~~next;
        for (i = 0, len = found.length; i < len; i++) {
          k = found[i];
          keys.push(k.slice(start, -end));
        }
      }
      return keys;
    }
    _startAutoCleanup() {
      var base;
      clearInterval(this.interval);
      return typeof (base = this.interval = setInterval(async () => {
        var e, k, ref, results, time, v;
        time = Date.now();
        ref = this.instances;
        results = [];
        for (k in ref) {
          v = ref[k];
          try {
            if (await v._store.__groupCheck__(time)) {
              results.push(this.deleteKey(k));
            } else {
              results.push(void 0);
            }
          } catch (error) {
            e = error;
            results.push(v.Events.trigger("error", e));
          }
        }
        return results;
      }, this.timeout / 2)).unref === "function" ? base.unref() : void 0;
    }
    updateSettings(options = {}) {
      parser.overwrite(options, this.defaults, this);
      parser.overwrite(options, options, this.limiterOptions);
      if (options.timeout != null) {
        return this._startAutoCleanup();
      }
    }
    disconnect(flush = true) {
      var ref;
      if (!this.sharedConnection) {
        return (ref = this.connection) != null ? ref.disconnect(flush) : void 0;
      }
    }
  }
  ;
  Group.prototype.defaults = {
    timeout: 1000 * 60 * 5,
    connection: null,
    Promise: Promise,
    id: "group-key"
  };
  return Group;
}.call(void 0);
module.exports = Group;