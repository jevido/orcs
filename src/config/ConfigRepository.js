/**
 * Stores and retrieves configuration values with dot-notation access.
 */
export class ConfigRepository {
  #items = {};

  constructor(items = {}) {
    this.#items = items;
  }

  get(key, fallback = undefined) {
    const parts = key.split(".");
    let current = this.#items;
    for (const part of parts) {
      if (
        current === undefined ||
        current === null ||
        typeof current !== "object"
      ) {
        return fallback;
      }
      current = current[part];
    }
    return current === undefined ? fallback : current;
  }

  set(key, value) {
    const parts = key.split(".");
    let current = this.#items;
    for (let i = 0; i < parts.length - 1; i++) {
      if (
        current[parts[i]] === undefined ||
        typeof current[parts[i]] !== "object"
      ) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }

  all() {
    return this.#items;
  }

  has(key) {
    return this.get(key) !== undefined;
  }
}
