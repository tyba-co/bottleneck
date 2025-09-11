"use strict";

const tslib_1 = require("tslib");
const DLList = require("./DLList");
class Sync {
  constructor(name, Promise) {
    this.name = name;
    this.Promise = Promise;
    this._running = 0;
    this.schedule = (task, ...args) => {
      let resolve;
      let reject;
      const promise = new this.Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      this._queue.push({
        task,
        args,
        resolve: resolve,
        reject: reject
      });
      this._tryToRun();
      return promise;
    };
    this._queue = new DLList();
  }
  isEmpty() {
    return this._queue.length === 0;
  }
  _tryToRun() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
      if (this._running < 1 && this._queue.length > 0) {
        this._running++;
        const {
          task,
          args,
          resolve,
          reject
        } = this._queue.shift();
        let cb;
        try {
          const returned = yield task(...args);
          cb = () => resolve(returned);
        } catch (error) {
          cb = () => reject(error);
        }
        this._running--;
        this._tryToRun();
        cb();
      }
    });
  }
}
module.exports = Sync;