import BottleneckError = require("./BottleneckError");

class States {
  private _jobs: { [id: string]: number } = {};
  public counts: number[];

  constructor(private status: string[]) {
    this.counts = this.status.map(() => 0);
  }

  next(id: string): void {
    const current = this._jobs[id];
    const next = current + 1;
    if (current != null && next < this.status.length) {
      this.counts[current]--;
      this.counts[next]++;
      this._jobs[id]++;
    } else if (current != null) {
      this.counts[current]--;
      delete this._jobs[id];
    }
  }

  start(id: string): void {
    const initial = 0;
    this._jobs[id] = initial;
    this.counts[initial]++;
  }

  remove(id: string): boolean {
    const current = this._jobs[id];
    if (current != null) {
      this.counts[current]--;
      delete this._jobs[id];
    }
    return current != null;
  }

  jobStatus(id: string): string | null {
    return this.status[this._jobs[id]] ?? null;
  }

  statusJobs(status?: string): string[] {
    if (status != null) {
      const pos = this.status.indexOf(status);
      if (pos < 0) {
        throw new BottleneckError(`status must be one of ${this.status.join(', ')}`);
      }
      return Object.keys(this._jobs).filter(k => this._jobs[k] === pos);
    } else {
      return Object.keys(this._jobs);
    }
  }

  statusCounts(): { [status: string]: number } {
    return this.counts.reduce((acc, v, i) => {
      acc[this.status[i]] = v;
      return acc;
    }, {} as { [status: string]: number });
  }
}

export = States;
