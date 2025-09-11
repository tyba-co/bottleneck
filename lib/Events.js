"use strict";

const tslib_1 = require("tslib");
class Events {
  constructor(instance) {
    this.instance = instance;
    this._events = {};
    if (this.instance.on || this.instance.once || this.instance.removeAllListeners) {
      throw new Error("An Emitter already exists for this object");
    }
    this.instance.on = (name, cb) => this._addListener(name, "many", cb);
    this.instance.once = (name, cb) => this._addListener(name, "once", cb);
    this.instance.removeAllListeners = name => {
      if (name != null) {
        delete this._events[name];
      } else {
        this._events = {};
      }
    };
  }
  _addListener(name, status, cb) {
    if (!this._events[name]) {
      this._events[name] = [];
    }
    this._events[name].push({
      cb,
      status
    });
    return this.instance;
  }
  listenerCount(name) {
    return this._events[name] ? this._events[name].length : 0;
  }
  trigger(name, ...args) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      try {
        if (name !== "debug") {
          this.trigger("debug", `Event triggered: ${name}`, args);
        }
        if (!this._events[name]) {
          return;
        }
        this._events[name] = this._events[name].filter(listener => listener.status !== "none");
        const promises = this._events[name].map(listener => tslib_1.__awaiter(this, void 0, void 0, function* () {
          var _a;
          if (listener.status === "none") {
            return;
          }
          if (listener.status === "once") {
            listener.status = "none";
          }
          try {
            const returned = (_a = listener.cb) === null || _a === void 0 ? void 0 : _a.call(listener, ...args);
            if (typeof (returned === null || returned === void 0 ? void 0 : returned.then) === "function") {
              return yield returned;
            } else {
              return returned;
            }
          } catch (e) {
            if (name !== "error") {
              this.trigger("error", e);
            }
            return null;
          }
        }));
        const results = yield Promise.all(promises);
        return results.find(x => x != null);
      } catch (e) {
        if (name !== "error") {
          this.trigger("error", e);
        }
        return null;
      }
    });
  }
}
module.exports = Events;