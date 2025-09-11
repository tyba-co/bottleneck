"use strict";

class DLList {
  constructor(incr, decr) {
    this.incr = incr;
    this.decr = decr;
    this._first = null;
    this._last = null;
    this.length = 0;
  }
  push(value) {
    var _a;
    this.length++;
    (_a = this.incr) === null || _a === void 0 ? void 0 : _a.call(this);
    const node = {
      value,
      prev: this._last,
      next: null
    };
    if (this._last) {
      this._last.next = node;
      this._last = node;
    } else {
      this._first = this._last = node;
    }
  }
  shift() {
    var _a;
    if (!this._first) {
      return;
    }
    this.length--;
    (_a = this.decr) === null || _a === void 0 ? void 0 : _a.call(this);
    const value = this._first.value;
    this._first = this._first.next;
    if (this._first) {
      this._first.prev = null;
    } else {
      this._last = null;
    }
    return value;
  }
  first() {
    var _a;
    return (_a = this._first) === null || _a === void 0 ? void 0 : _a.value;
  }
  getArray() {
    const result = [];
    let node = this._first;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }
  forEachShift(cb) {
    let node = this.shift();
    while (node !== undefined) {
      cb(node);
      node = this.shift();
    }
  }
  debug() {
    var _a, _b;
    const result = [];
    let node = this._first;
    while (node) {
      result.push({
        value: node.value,
        prev: (_a = node.prev) === null || _a === void 0 ? void 0 : _a.value,
        next: (_b = node.next) === null || _b === void 0 ? void 0 : _b.value
      });
      node = node.next;
    }
    return result;
  }
}
module.exports = DLList;