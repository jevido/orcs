/**
 * Environment variable reader with typed variants.
 * Reads from Bun.env with fallback defaults.
 */
export function env(key, fallback = undefined) {
  const value = Bun.env[key];
  if (value === undefined) return fallback;
  return value;
}

env.bool = function (key, fallback = false) {
  const value = Bun.env[key];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
};

env.int = function (key, fallback = 0) {
  const value = Bun.env[key];
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

env.float = function (key, fallback = 0) {
  const value = Bun.env[key];
  if (value === undefined) return fallback;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

env.json = function (key, fallback = undefined) {
  const value = Bun.env[key];
  if (value === undefined) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
