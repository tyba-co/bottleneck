import DLList = require("./DLList");
import Events = require("./Events");
import Job = require("./Job");

class Queues {
  public Events: Events;
  private _length: number = 0;
  private _lists: DLList<Job>[];
  
  // Métodos agregados dinámicamente por Events
  public on!: (name: string, cb: (...args: any[]) => any) => any;
  public once!: (name: string, cb: (...args: any[]) => any) => any;
  public removeAllListeners!: (name?: string) => void;

  constructor(num_priorities: number) {
    this.Events = new Events(this);
    this._lists = [];
    for (let i = 0; i < num_priorities; i++) {
      this._lists.push(new DLList<Job>(() => this.incr(), () => this.decr()));
    }
  }

  private incr(): void {
    if (this._length++ === 0) {
      this.Events.trigger("leftzero");
    }
  }

  private decr(): void {
    if (--this._length === 0) {
      this.Events.trigger("zero");
    }
  }

  push(job: Job): void {
    this._lists[job.options.priority].push(job);
  }

  queued(priority?: number): number {
    return priority != null ? this._lists[priority].length : this._length;
  }

  shiftAll(fn: (job: Job) => void): void {
    this._lists.forEach(list => list.forEachShift(fn));
  }

  getFirst(arr: DLList<Job>[] = this._lists): DLList<Job> {
    for (const list of arr) {
      if (list.length > 0) {
        return list;
      }
    }
    return new DLList<Job>();
  }

  shiftLastFrom(priority: number): Job | undefined {
    const reversedLists = this._lists.slice(priority).reverse();
    return this.getFirst(reversedLists).shift();
  }
}

export = Queues;
