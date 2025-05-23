"use strict";

var Events, RedisConnection, Scripts, parser;
parser = require("./parser");
Events = require("./Events");
Scripts = require("./Scripts");
RedisConnection = function () {
  class RedisConnection {
    constructor(options = {}) {
      parser.load(options, this.defaults, this);
      if (this.Redis == null) {
        this.Redis = eval("require")("redis"); // Obfuscated or else Webpack/Angular will try to inline the optional redis module. To override this behavior: pass the redis module to Bottleneck as the 'Redis' option.
      }
      if (this.Events == null) {
        this.Events = new Events(this);
      }
      this.terminated = false;
      if (this.client == null) {
        this.client = this.Redis.createClient(this.clientOptions);
      }
      this.subscriber = this.client.duplicate();
      this.limiters = {};
      this.shas = {};
      this.ready = this.Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(() => {
        return this._loadScripts();
      }).then(() => {
        return {
          client: this.client,
          subscriber: this.subscriber
        };
      });
    }
    _setup(client, sub) {
      client.setMaxListeners(0);
      return new this.Promise((resolve, reject) => {
        client.on("error", e => {
          return this.Events.trigger("error", e);
        });
        if (sub) {
          client.on("message", (channel, message) => {
            var ref;
            return (ref = this.limiters[channel]) != null ? ref._store.onMessage(channel, message) : void 0;
          });
        }
        if (client.ready) {
          return resolve();
        } else {
          return client.once("ready", resolve);
        }
      });
    }
    _loadScript(name) {
      return new this.Promise((resolve, reject) => {
        var payload;
        payload = Scripts.payload(name);
        return this.client.multi([["script", "load", payload]]).exec((err, replies) => {
          if (err != null) {
            return reject(err);
          }
          this.shas[name] = replies[0];
          return resolve(replies[0]);
        });
      });
    }
    _loadScripts() {
      return this.Promise.all(Scripts.names.map(k => {
        return this._loadScript(k);
      }));
    }
    async __runCommand__(cmd) {
      await this.ready;
      return new this.Promise((resolve, reject) => {
        return this.client.multi([cmd]).exec_atomic(function (err, replies) {
          if (err != null) {
            return reject(err);
          } else {
            return resolve(replies[0]);
          }
        });
      });
    }
    __addLimiter__(instance) {
      return this.Promise.all([instance.channel(), instance.channel_client()].map(channel => {
        return new this.Promise((resolve, reject) => {
          var handler;
          handler = chan => {
            if (chan === channel) {
              this.subscriber.removeListener("subscribe", handler);
              this.limiters[channel] = instance;
              return resolve();
            }
          };
          this.subscriber.on("subscribe", handler);
          return this.subscriber.subscribe(channel);
        });
      }));
    }
    __removeLimiter__(instance) {
      return this.Promise.all([instance.channel(), instance.channel_client()].map(async channel => {
        if (!this.terminated) {
          await new this.Promise((resolve, reject) => {
            return this.subscriber.unsubscribe(channel, function (err, chan) {
              if (err != null) {
                return reject(err);
              }
              if (chan === channel) {
                return resolve();
              }
            });
          });
        }
        return delete this.limiters[channel];
      }));
    }
    __scriptArgs__(name, id, args, cb) {
      var keys;
      keys = Scripts.keys(name, id);
      return [this.shas[name], keys.length].concat(keys, args, cb);
    }
    __scriptFn__(name) {
      return this.client.evalsha.bind(this.client);
    }
    disconnect(flush = true) {
      var i, k, len, ref;
      ref = Object.keys(this.limiters);
      for (i = 0, len = ref.length; i < len; i++) {
        k = ref[i];
        clearInterval(this.limiters[k]._store.heartbeat);
      }
      this.limiters = {};
      this.terminated = true;
      this.client.end(flush);
      this.subscriber.end(flush);
      return this.Promise.resolve();
    }
  }
  ;
  RedisConnection.prototype.datastore = "redis";
  RedisConnection.prototype.defaults = {
    Redis: null,
    clientOptions: {},
    client: null,
    Promise: Promise,
    Events: null
  };
  return RedisConnection;
}.call(void 0);
module.exports = RedisConnection;