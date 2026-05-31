// src/index.js — Cloudflare Worker entry point

import { handleAuth } from './api/auth.js';
import { handleDashboard } from './api/dashboard.js';
import { handleProducts } from './api/products.js';
import { handleComponents } from './api/components.js';
import { handleProduction } from './api/production.js';
import { handleStock } from './api/stock.js';
import { handleFaults } from './api/faults.js';
import { handleReports } from './api/reports.js';
import { requireAuth } from './lib/auth.js';
import { kvGetJSON, kvPutJSON, kvPutNumber } from './lib/kv.js';
import { getDashboardHTML } from './ui/dashboard.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Serve dashboard HTML
    if (path === '/' || path === '') {
      const html = getDashboardHTML();
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...CORS_HEADERS }
      });
    }

    // Auth routes (no session required)
    if (path.startsWith('/api/auth/')) {
      const res = await handleAuth(request, env.KV, env);
      return addCors(res);
    }

    // Seed route
    if (path === '/api/seed' && request.method === 'GET') {
      const session = await requireAuth(env.KV, request);
      if (!session) return unauthorizedResponse();
      const res = await handleSeed(env.KV);
      return addCors(res);
    }

    // Settings routes
    if (path.startsWith('/api/settings')) {
      const session = await requireAuth(env.KV, request);
      if (!session) return unauthorizedResponse();
      const res = await handleSettings(request, env.KV, session);
      return addCors(res);
    }

    // All other /api/* routes require auth
    if (path.startsWith('/api/')) {
      const session = await requireAuth(env.KV, request);
      if (!session) return unauthorizedResponse();

      try {
        let res;
        if (path === '/api/dashboard') {
          res = await handleDashboard(request, env.KV, env);
        } else if (path.startsWith('/api/products')) {
          res = await handleProducts(request, env.KV, session);
        } else if (path.startsWith('/api/components')) {
          res = await handleComponents(request, env.KV, session, env);
        } else if (path.startsWith('/api/production')) {
          res = await handleProduction(request, env.KV, session, env);
        } else if (path.startsWith('/api/stock')) {
          res = await handleStock(request, env.KV, session, env);
        } else if (path.startsWith('/api/faults')) {
          res = await handleFaults(request, env.KV, session, env);
        } else if (path.startsWith('/api/reports') || path === '/api/repair') {
          res = await handleReports(request, env.KV, session, env);
        } else {
          res = jsonError('API route not found', 404);
        }
        return addCors(res);
      } catch (err) {
        console.error('API Error:', err);
        return addCors(jsonError(`Internal server error: ${err.message}`, 500));
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleSeed(kv) {
  const existing = await kvGetJSON(kv, 'components:list', []);
  if (existing.length > 0) {
    return new Response(JSON.stringify({ message: 'Already seeded', components: existing }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default components
  const components = [
    { name: 'laser-diode', unit: 'pcs', min: 50 },
    { name: 'case', unit: 'pcs', min: 30 },
    { name: 'heat-sink', unit: 'pcs', min: 20 },
    { name: 'switch', unit: 'pcs', min: 50 },
    { name: '2core-cable', unit: 'm', min: 50 },
    { name: 'ribbon-wire', unit: 'm', min: 30 },
  ];

  for (const c of components) {
    await kvPutJSON(kv, `component:${c.name}:meta`, { unit: c.unit, supplier: '', createdAt: Date.now() });
    await kvPutNumber(kv, `component:${c.name}:stock`, 100);
    await kvPutNumber(kv, `component:${c.name}:min`, c.min);
  }
  await kvPutJSON(kv, 'components:list', components.map(c => c.name));

  // Default products
  const products = [
    { name: 'Laser Box', unit: 'pcs', dailyTarget: 50 }
  ];
  for (const p of products) {
    await kvPutJSON(kv, `product:${p.name}:meta`, { unit: p.unit, dailyTarget: p.dailyTarget, createdAt: Date.now() });
    await kvPutJSON(kv, `product:${p.name}:bom`, {
      'laser-diode': { qty: 1, unit: 'pcs' },
      'case': { qty: 1, unit: 'pcs' },
      'heat-sink': { qty: 1, unit: 'pcs' },
      'switch': { qty: 1, unit: 'pcs' },
      '2core-cable': { qty: 3, unit: 'm' },
    });
    await kvPutNumber(kv, `finished:${p.name}:stock`, 0);
  }
  await kvPutJSON(kv, 'products:list', products.map(p => p.name));

  // Default settings
  await kv.put('settings:company', 'My Factory');
  await kv.put('settings:timezone', 'Asia/Kolkata');
  await kvPutJSON(kv, 'settings:shifts', ['Morning', 'Evening', 'Night']);

  return new Response(JSON.stringify({ message: 'Seeded successfully', components, products }), {
    status: 201, headers: { 'Content-Type': 'application/json' }
  });
}

async function handleSettings(request, kv, session) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const company = await kv.get('settings:company') || 'My Factory';
    const timezone = await kv.get('settings:timezone') || 'Asia/Kolkata';
    const shifts = await kvGetJSON(kv, 'settings:shifts', ['Morning', 'Evening', 'Night']);
    return new Response(JSON.stringify({ company, timezone, shifts }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }

    if (body.company !== undefined) await kv.put('settings:company', body.company);
    if (body.timezone !== undefined) await kv.put('settings:timezone', body.timezone);
    if (body.shifts !== undefined) await kvPutJSON(kv, 'settings:shifts', body.shifts);

    // PIN changes (admin only)
    if (body.adminPin && session.role === 'admin') {
      const { hashPin } = await import('./lib/auth.js');
      const hash = await hashPin(body.adminPin);
      await kv.put('auth:admin:pin', hash);
    }
    if (body.operatorPin && session.role === 'admin') {
      const { hashPin } = await import('./lib/auth.js');
      const hash = await hashPin(body.operatorPin);
      await kv.put('auth:operator:pin', hash);
    }

    return new Response(JSON.stringify({ message: 'Settings saved' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return jsonError('Method not allowed', 405);
}

function addCors(response) {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized', code: 401 }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

function jsonError(msg, code = 400) {
  return new Response(JSON.stringify({ error: msg, code }), {
    status: code, headers: { 'Content-Type': 'application/json' }
  });
}
