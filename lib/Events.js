"use strict";

var Events;
Events = class Events {
  constructor(instance) {
    this.instance = instance;
    this._events = {};
    if (this.instance.on != null || this.instance.once != null || this.instance.removeAllListeners != null) {
      throw new Error("An Emitter already exists for this object");
    }
    this.instance.on = (name, cb) => {
      return this._addListener(name, "many", cb);
    };
    this.instance.once = (name, cb) => {
      return this._addListener(name, "once", cb);
    };
    this.instance.removeAllListeners = (name = null) => {
      if (name != null) {
        return delete this._events[name];
      } else {
        return this._events = {};
      }
    };
  }
  _addListener(name, status, cb) {
    var base;
    if ((base = this._events)[name] == null) {
      base[name] = [];
    }
    this._events[name].push({
      cb,
      status
    });
    return this.instance;
  }
  listenerCount(name) {
    if (this._events[name] != null) {
      return this._events[name].length;
    } else {
      return 0;
    }
  }
  async trigger(name, ...args) {
    var e, promises;
    try {
      if (name !== "debug") {
        this.trigger("debug", `Event triggered: ${name}`, args);
      }
      if (this._events[name] == null) {
        return;
      }
      this._events[name] = this._events[name].filter(function (listener) {
        return listener.status !== "none";
      });
      promises = this._events[name].map(async listener => {
        var e, returned;
        if (listener.status === "none") {
          return;
        }
        if (listener.status === "once") {
          listener.status = "none";
        }
        try {
          returned = typeof listener.cb === "function" ? listener.cb(...args) : void 0;
          if (typeof (returned != null ? returned.then : void 0) === "function") {
            return await returned;
          } else {
            return returned;
          }
        } catch (error) {
          e = error;
          if ("name" !== "error") {
            this.trigger("error", e);
          }
          return null;
        }
      });
      return (await Promise.all(promises)).find(function (x) {
        return x != null;
      });
    } catch (error) {
      e = error;
      if ("name" !== "error") {
        this.trigger("error", e);
      }
      return null;
    }
  }
};
module.exports = Events;