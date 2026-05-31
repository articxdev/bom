// lib/kv.js — KV read/write helpers

export async function kvGet(kv, key, defaultVal = null) {
  try {
    const val = await kv.get(key);
    if (val === null) return defaultVal;
    return val;
  } catch (e) {
    console.error(`KV GET error [${key}]:`, e);
    return defaultVal;
  }
}

export async function kvGetJSON(kv, key, defaultVal = null) {
  try {
    const val = await kv.get(key, 'json');
    if (val === null) return defaultVal;
    return val;
  } catch (e) {
    console.error(`KV GET JSON error [${key}]:`, e);
    return defaultVal;
  }
}

export async function kvPut(kv, key, value, opts = {}) {
  try {
    await kv.put(key, value, opts);
    return true;
  } catch (e) {
    console.error(`KV PUT error [${key}]:`, e);
    throw e;
  }
}

export async function kvPutJSON(kv, key, value, opts = {}) {
  return kvPut(kv, key, JSON.stringify(value), opts);
}

export async function kvDelete(kv, key) {
  try {
    await kv.delete(key);
    return true;
  } catch (e) {
    console.error(`KV DELETE error [${key}]:`, e);
    throw e;
  }
}

export async function kvGetNumber(kv, key, defaultVal = 0) {
  const val = await kvGet(kv, key, String(defaultVal));
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

export async function kvPutNumber(kv, key, value) {
  return kvPut(kv, key, String(value));
}

export async function kvList(kv, prefix) {
  try {
    const result = await kv.list({ prefix });
    return result.keys || [];
  } catch (e) {
    console.error(`KV LIST error [${prefix}]:`, e);
    return [];
  }
}
