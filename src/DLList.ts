interface DLNode<T> {
  value: T;
  prev: DLNode<T> | null;
  next: DLNode<T> | null;
}

class DLList<T> {
  private _first: DLNode<T> | null = null;
  private _last: DLNode<T> | null = null;
  public length: number = 0;

  constructor(private incr?: () => void, private decr?: () => void) {}

  push(value: T): void {
    this.length++;
    this.incr?.();
    const node: DLNode<T> = { value, prev: this._last, next: null };
    if (this._last) {
      this._last.next = node;
      this._last = node;
    } else {
      this._first = this._last = node;
    }
  }

  shift(): T | undefined {
    if (!this._first) {
      return;
    }
    this.length--;
    this.decr?.();
    const value = this._first.value;
    this._first = this._first.next;
    if (this._first) {
      this._first.prev = null;
    } else {
      this._last = null;
    }
    return value;
  }

  first(): T | undefined {
    return this._first?.value;
  }

  getArray(): T[] {
    const result: T[] = [];
    let node = this._first;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }

  forEachShift(cb: (value: T) => void): void {
    let node = this.shift();
    while (node !== undefined) {
      cb(node);
      node = this.shift();
    }
  }

  debug(): Array<{ value: T; prev?: T; next?: T }> {
    const result: Array<{ value: T; prev?: T; next?: T }> = [];
    let node = this._first;
    while (node) {
      result.push({
        value: node.value,
        prev: node.prev?.value,
        next: node.next?.value,
      });
      node = node.next;
    }
    return result;
  }
}

export = DLList;
