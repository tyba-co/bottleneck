"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const BottleneckError = require("./BottleneckError");
const RedisConnection = require("./RedisConnection");
const IORedisConnection = require("./IORedisConnection");
class RedisDatastore {
  constructor(instance, storeOptions, storeInstanceOptions) {
    var _a;
    this.instance = instance;
    this.storeOptions = storeOptions;
    this.capacityPriorityCounters = {};
    this.originalId = this.instance.id;
    this.clientId = this.instance._randomIndex();
    parser.load(storeInstanceOptions, storeInstanceOptions, this);
    this.clients = {};
    this.sharedConnection = storeInstanceOptions.connection != null;
    this.connection = (_a = storeInstanceOptions.connection) !== null && _a !== void 0 ? _a : this.instance.datastore === "redis" ? new RedisConnection({
      Redis: this.Redis,
      clientOptions: this.clientOptions,
      Promise: this.Promise,
      Events: this.instance.Events
    }) : this.instance.datastore === "ioredis" ? new IORedisConnection({
      Redis: this.Redis,
      clientOptions: this.clientOptions,
      clusterNodes: this.clusterNodes,
      Promise: this.Promise,
      Events: this.instance.Events
    }) : (() => {
      throw new Error("Invalid datastore");
    })();
    this.instance.connection = this.connection;
    this.instance.datastore = this.connection.datastore;
    this.ready = this.connection.ready.then(clients => {
      this.clients = clients;
      return this.runScript("init", this.prepareInitSettings(this.clearDatastore));
    }).then(() => this.connection.__addLimiter__(this.instance)).then(() => this.runScript("register_client", [this.instance.queued()])).then(() => {
      this.heartbeat = setInterval(() => {
        this.runScript("heartbeat", []).catch(e => this.instance.Events.trigger("error", e));
      }, this.heartbeatInterval);
      if (this.heartbeat.unref) {
        this.heartbeat.unref();
      }
      return this.clients;
    });
  }
  __publish__(message) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      const {
        client
      } = yield this.ready;
      client.publish(this.instance.channel(), `message:${message.toString()}`);
    });
  }
  onMessage(channel, message) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      try {
        const pos = message.indexOf(":");
        const [type, data] = [message.slice(0, pos), message.slice(pos + 1)];
        if (type === "capacity") {
          yield this.instance._drainAll(data.length > 0 ? ~~data : undefined);
        } else if (type === "capacity-priority") {
          const [rawCapacity, priorityClient, counter] = data.split(":");
          const capacity = rawCapacity.length > 0 ? ~~rawCapacity : undefined;
          if (priorityClient === this.clientId) {
            const drained = yield this.instance._drainAll(capacity);
            const newCapacity = capacity != null ? capacity - (drained || 0) : "";
            yield this.clients.client.publish(this.instance.channel(), `capacity-priority:${newCapacity}::${counter}`);
          } else if (priorityClient === "") {
            clearTimeout(this.capacityPriorityCounters[counter]);
            delete this.capacityPriorityCounters[counter];
            this.instance._drainAll(capacity);
          } else {
            this.capacityPriorityCounters[counter] = setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
              try {
                delete this.capacityPriorityCounters[counter];
                yield this.runScript("blacklist_client", [priorityClient]);
                yield this.instance._drainAll(capacity);
              } catch (e) {
                this.instance.Events.trigger("error", e);
              }
            }), 1000);
          }
        } else if (type === "message") {
          this.instance.Events.trigger("message", data);
        } else if (type === "blocked") {
          yield this.instance._dropAllQueued();
        }
      } catch (e) {
        this.instance.Events.trigger("error", e);
      }
    });
  }
  __disconnect__(flush) {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    if (this.sharedConnection) {
      return this.connection.__removeLimiter__(this.instance).then(() => {});
    } else {
      return this.connection.disconnect(flush);
    }
  }
  runScript(name, args) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (name !== "init" && name !== "register_client") {
        yield this.ready;
      }
      return new this.Promise((resolve, reject) => {
        const all_args = [Date.now(), this.clientId, ...args];
        this.instance.Events.trigger("debug", `Calling Redis script: ${name}.lua`, all_args);
        const arr = this.connection.__scriptArgs__(name, this.originalId, all_args, (err, replies) => {
          if (err != null) {
            return reject(err);
          }
          return resolve(replies);
        });
        this.connection.__scriptFn__(name)(...arr);
      }).catch(e => {
        if (e.message.match(/^(.*\s)?SETTINGS_KEY_NOT_FOUND$/) != null) {
          if (name === "heartbeat") {
            return this.Promise.resolve();
          } else {
            return this.runScript("init", this.prepareInitSettings(false)).then(() => this.runScript(name, args));
          }
        } else if (e.message.match(/^(.*\s)?UNKNOWN_CLIENT$/) != null) {
          return this.runScript("register_client", [this.instance.queued()]).then(() => this.runScript(name, args));
        } else {
          return this.Promise.reject(e);
        }
      });
    });
  }
  prepareArray(arr) {
    return arr.map(x => x != null ? x.toString() : "");
  }
  prepareObject(obj) {
    const arr = [];
    for (const [k, v] of Object.entries(obj)) {
      arr.push(k, v != null ? v.toString() : "");
    }
    return arr;
  }
  prepareInitSettings(clear) {
    const args = this.prepareObject(Object.assign(Object.assign({}, this.storeOptions), {
      id: this.originalId,
      version: this.instance.version,
      groupTimeout: this.timeout,
      clientTimeout: this.clientTimeout
    }));
    args.unshift(clear ? "1" : "0", this.instance.version);
    return args;
  }
  convertBool(b) {
    return !!b;
  }
  __updateSettings__(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      yield this.runScript("update_settings", this.prepareObject(options));
      parser.overwrite(options, options, this.storeOptions);
    });
  }
  __running__() {
    return this.runScript("running", []);
  }
  __queued__() {
    return this.runScript("queued", []);
  }
  __done__() {
    return this.runScript("done", []);
  }
  __groupCheck__() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      return this.convertBool(yield this.runScript("group_check", []));
    });
  }
  __incrementReservoir__(incr) {
    return this.runScript("increment_reservoir", [incr]);
  }
  __currentReservoir__() {
    return this.runScript("current_reservoir", []);
  }
  __check__(weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      return this.convertBool(yield this.runScript("check", this.prepareArray([weight])));
    });
  }
  __register__(index, weight, expiration) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      const [success, wait, reservoir] = yield this.runScript("register", this.prepareArray([index, weight, expiration]));
      return {
        success: this.convertBool(success),
        wait,
        reservoir
      };
    });
  }
  __submit__(queueLength, weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      try {
        const [reachedHWM, blocked, strategy] = yield this.runScript("submit", this.prepareArray([queueLength, weight]));
        return {
          reachedHWM: this.convertBool(reachedHWM),
          blocked: this.convertBool(blocked),
          strategy
        };
      } catch (e) {
        const error = e;
        if (error.message.indexOf("OVERWEIGHT") === 0) {
          const [overweight, weight, maxConcurrent] = error.message.split(":");
          throw new BottleneckError(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${maxConcurrent}`);
        } else {
          throw e;
        }
      }
    });
  }
  __free__(index, weight) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      const running = yield this.runScript("free", this.prepareArray([index]));
      return {
        running
      };
    });
  }
}
module.exports = RedisDatastore;