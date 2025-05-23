"use strict";

var Events, IORedisConnection, Scripts, parser;
parser = require("./parser");
Events = require("./Events");
Scripts = require("./Scripts");
IORedisConnection = function () {
  class IORedisConnection {
    constructor(options = {}) {
      parser.load(options, this.defaults, this);
      if (this.Redis == null) {
        this.Redis = eval("require")("ioredis"); // Obfuscated or else Webpack/Angular will try to inline the optional ioredis module. To override this behavior: pass the ioredis module to Bottleneck as the 'Redis' option.
      }
      if (this.Events == null) {
        this.Events = new Events(this);
      }
      this.terminated = false;
      if (this.clusterNodes != null) {
        this.client = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
        this.subscriber = new this.Redis.Cluster(this.clusterNodes, this.clientOptions);
      } else if (this.client != null && this.client.duplicate == null) {
        this.subscriber = new this.Redis.Cluster(this.client.startupNodes, this.client.options);
      } else {
        if (this.client == null) {
          this.client = new this.Redis(this.clientOptions);
        }
        this.subscriber = this.client.duplicate();
      }
      this.limiters = {};
      this.ready = this.Promise.all([this._setup(this.client, false), this._setup(this.subscriber, true)]).then(() => {
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
        client.on("error", e => {
          return this.Events.trigger("error", e);
        });
        if (sub) {
          client.on("message", (channel, message) => {
            var ref;
            return (ref = this.limiters[channel]) != null ? ref._store.onMessage(channel, message) : void 0;
          });
        }
        if (client.status === "ready") {
          return resolve();
        } else {
          return client.once("ready", resolve);
        }
      });
    }
    _loadScripts() {
      return Scripts.names.forEach(name => {
        return this.client.defineCommand(name, {
          lua: Scripts.payload(name)
        });
      });
    }
    async __runCommand__(cmd) {
      var _, deleted;
      await this.ready;
      [[_, deleted]] = await this.client.pipeline([cmd]).exec();
      return deleted;
    }
    __addLimiter__(instance) {
      return this.Promise.all([instance.channel(), instance.channel_client()].map(channel => {
        return new this.Promise((resolve, reject) => {
          return this.subscriber.subscribe(channel, () => {
            this.limiters[channel] = instance;
            return resolve();
          });
        });
      }));
    }
    __removeLimiter__(instance) {
      return [instance.channel(), instance.channel_client()].forEach(async channel => {
        if (!this.terminated) {
          await this.subscriber.unsubscribe(channel);
        }
        return delete this.limiters[channel];
      });
    }
    __scriptArgs__(name, id, args, cb) {
      var keys;
      keys = Scripts.keys(name, id);
      return [keys.length].concat(keys, args, cb);
    }
    __scriptFn__(name) {
      return this.client[name].bind(this.client);
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
      if (flush) {
        return this.Promise.all([this.client.quit(), this.subscriber.quit()]);
      } else {
        this.client.disconnect();
        this.subscriber.disconnect();
        return this.Promise.resolve();
      }
    }
  }
  ;
  IORedisConnection.prototype.datastore = "ioredis";
  IORedisConnection.prototype.defaults = {
    Redis: null,
    clientOptions: {},
    clusterNodes: null,
    client: null,
    Promise: Promise,
    Events: null
  };
  return IORedisConnection;
}.call(void 0);
module.exports = IORedisConnection;