/** Small LRU for expensive immutable data. Never quantizes timestamps or inputs. */
export class BoundedCache<Key, Value> {
  private readonly values = new Map<Key, Value>();

  constructor(private readonly capacity: number) {}

  get(key: Key): Value | undefined {
    const value = this.values.get(key);
    if (value !== undefined) {
      this.values.delete(key);
      this.values.set(key, value);
    }
    return value;
  }

  set(key: Key, value: Value): void {
    this.values.delete(key);
    this.values.set(key, value);
    if (this.values.size > this.capacity) {
      this.values.delete(this.values.keys().next().value!);
    }
  }
}
