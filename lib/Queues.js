"use strict";

const DLList = require("./DLList");
const Events = require("./Events");
class Queues {
  constructor(num_priorities) {
    this._length = 0;
    this.Events = new Events(this);
    this._lists = [];
    for (let i = 0; i < num_priorities; i++) {
      this._lists.push(new DLList(() => this.incr(), () => this.decr()));
    }
  }
  incr() {
    if (this._length++ === 0) {
      this.Events.trigger("leftzero");
    }
  }
  decr() {
    if (--this._length === 0) {
      this.Events.trigger("zero");
    }
  }
  push(job) {
    this._lists[job.options.priority].push(job);
  }
  queued(priority) {
    return priority != null ? this._lists[priority].length : this._length;
  }
  shiftAll(fn) {
    this._lists.forEach(list => list.forEachShift(fn));
  }
  getFirst(arr = this._lists) {
    for (const list of arr) {
      if (list.length > 0) {
        return list;
      }
    }
    return new DLList();
  }
  shiftLastFrom(priority) {
    const reversedLists = this._lists.slice(priority).reverse();
    return this.getFirst(reversedLists).shift();
  }
}
module.exports = Queues;