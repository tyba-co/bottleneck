interface EventListener {
  cb: (...args: any[]) => any;
  status: "many" | "once" | "none";
}

class Events {
  private _events: { [key: string]: EventListener[] } = {};

  constructor(private instance: any) {
    if (this.instance.on || this.instance.once || this.instance.removeAllListeners) {
      throw new Error("An Emitter already exists for this object");
    }
    this.instance.on = (name: string, cb: (...args: any[]) => any) => 
      this._addListener(name, "many", cb);
    this.instance.once = (name: string, cb: (...args: any[]) => any) => 
      this._addListener(name, "once", cb);
    this.instance.removeAllListeners = (name?: string) => {
      if (name != null) {
        delete this._events[name];
      } else {
        this._events = {};
      }
    };
  }

  /**
   * Lets another object register listeners on this emitter, like a connection created by a limiter or Group.
   * @param {any} target
   */
  shareListenersWith(target: any): void {
    target.on = this.instance.on;
    target.once = this.instance.once;
    target.removeAllListeners = this.instance.removeAllListeners;
  }

  private _addListener(name: string, status: "many" | "once", cb: (...args: any[]) => any): any {
    if (!this._events[name]) {
      this._events[name] = [];
    }
    this._events[name].push({ cb, status });
    return this.instance;
  }

  listenerCount(name: string): number {
    return this._events[name] ? this._events[name].length : 0;
  }

  async trigger(name: string, ...args: any[]): Promise<any> {
    try {
      if (name !== "debug") {
        this.trigger("debug", `Event triggered: ${name}`, args);
      }
      if (!this._events[name]) {
        return;
      }
      this._events[name] = this._events[name].filter(listener => listener.status !== "none");
      const promises = this._events[name].map(async (listener) => {
        if (listener.status === "none") {
          return;
        }
        if (listener.status === "once") {
          listener.status = "none";
        }
        try {
          const returned = listener.cb?.(...args);
          if (typeof returned?.then === "function") {
            return await returned;
          } else {
            return returned;
          }
        } catch (e) {
          if (name !== "error") {
            this.trigger("error", e);
          }
          return null;
        }
      });
      const results = await Promise.all(promises);
      return results.find(x => x != null);
    } catch (e) {
      if (name !== "error") {
        this.trigger("error", e);
      }
      return null;
    }
  }
}

export = Events;
