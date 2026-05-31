// lib/auth.js — PIN hashing, session management

const SESSION_TTL = 8 * 60 * 60; // 8 hours in seconds

export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ':production-mgmt-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin, storedHash) {
  const hash = await hashPin(pin);
  return hash === storedHash;
}

export function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(kv, role) {
  const token = generateToken();
  const session = { role, createdAt: Date.now() };
  await kv.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL
  });
  return token;
}

export async function getSession(kv, token) {
  if (!token) return null;
  try {
    const data = await kv.get(`session:${token}`, 'json');
    return data;
  } catch {
    return null;
  }
}

export async function deleteSession(kv, token) {
  try {
    await kv.delete(`session:${token}`);
  } catch {}
}

export function extractToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function requireAuth(kv, request) {
  const token = extractToken(request);
  if (!token) return null;
  return getSession(kv, token);
}
