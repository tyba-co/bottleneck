"use strict";

const tslib_1 = require("tslib");
const parser = tslib_1.__importStar(require("./parser"));
const Events = require("./Events");
class Batcher {
  constructor(options = {}) {
    this.options = options;
    this.defaults = {
      maxTime: null,
      maxSize: null,
      Promise: Promise
    };
    this._arr = [];
    parser.load(this.options, this.defaults, this);
    this.Events = new Events(this);
    this._resetPromise();
    this._lastFlush = Date.now();
  }
  _resetPromise() {
    this._promise = new this.Promise(res => {
      this._resolve = res;
    });
  }
  _flush() {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._lastFlush = Date.now();
    this._resolve();
    this.Events.trigger("batch", this._arr);
    this._arr = [];
    this._resetPromise();
  }
  add(data) {
    this._arr.push(data);
    const ret = this._promise;
    if (this._arr.length === this.maxSize) {
      this._flush();
    } else if (this.maxTime != null && this._arr.length === 1) {
      this._timeout = setTimeout(() => {
        this._flush();
      }, this.maxTime);
    }
    return ret;
  }
}
module.exports = Batcher;