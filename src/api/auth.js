// api/auth.js

import { hashPin, verifyPin, createSession, deleteSession, extractToken } from '../lib/auth.js';
import { kvGet } from '../lib/kv.js';

export async function handleAuth(request, kv, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/auth/auto' && request.method === 'POST') {
    return handleAutoLogin(kv);
  }
  if (path === '/api/auth/login' && request.method === 'POST') {
    return handleLogin(request, kv, env);
  }
  if (path === '/api/auth/logout' && request.method === 'POST') {
    return handleLogout(request, kv);
  }

  return new Response(JSON.stringify({ error: 'Not found', code: 404 }), {
    status: 404, headers: { 'Content-Type': 'application/json' }
  });
}

async function handleAutoLogin(kv) {
  const token = await createSession(kv, 'admin');
  return jsonResponse({ token, role: 'admin', message: 'Auto-login' });
}

async function handleLogin(request, kv, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonError('Invalid JSON', 400);
  }

  const { pin, role } = body;
  if (!pin || !role) return jsonError('pin and role required', 400);
  if (!['admin', 'operator'].includes(role)) return jsonError('Invalid role', 400);

  // Get stored hash — either from KV (set via wrangler secret) or env
  let storedHash = await kvGet(kv, `auth:${role}:pin`, null);

  // Fallback: first-time setup — accept default PINs and store them
  if (!storedHash) {
    const defaultPin = role === 'admin' ? '1234' : '0000';
    storedHash = await hashPin(defaultPin);
    await kv.put(`auth:${role}:pin`, storedHash);
  }

  const valid = await verifyPin(pin, storedHash);
  if (!valid) return jsonError('Invalid PIN', 401);

  const token = await createSession(kv, role);
  return jsonResponse({ token, role, message: 'Login successful' });
}

async function handleLogout(request, kv) {
  const token = extractToken(request);
  if (token) await deleteSession(kv, token);
  return jsonResponse({ message: 'Logged out' });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}

function jsonError(message, code = 400) {
  return new Response(JSON.stringify({ error: message, code }), {
    status: code, headers: { 'Content-Type': 'application/json' }
  });
}
