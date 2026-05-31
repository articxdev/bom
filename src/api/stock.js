// api/stock.js

import { kvGetJSON, kvPutJSON, kvGetNumber, kvPutNumber } from '../lib/kv.js';
import { getTodayDate, currentTime } from '../lib/date.js';
import { deductFinishedStock } from '../lib/stats.js';

export async function handleStock(request, kv, session, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';

  if (path === '/api/stock' && request.method === 'GET') return getStock(kv);
  if (path === '/api/stock/componentin' && request.method === 'POST') return componentIn(request, kv, session, timezone);
  if (path === '/api/stock/componentout' && request.method === 'POST') return componentOut(request, kv, session, timezone);
  if (path === '/api/stock/dispatch' && request.method === 'POST') return dispatchProduct(request, kv, session, timezone);

  return jsonError('Not found', 404);
}

async function getStock(kv) {
  const compList = await kvGetJSON(kv, 'components:list', []);
  const components = [];
  for (const name of compList) {
    const stock = await kvGetNumber(kv, `component:${name}:stock`, 0);
    const min = await kvGetNumber(kv, `component:${name}:min`, 0);
    const meta = await kvGetJSON(kv, `component:${name}:meta`, {});
    const status = stock <= 0 ? 'CRITICAL' : stock < min ? 'LOW' : 'OK';
    components.push({ name, stock, min, unit: meta.unit || 'pcs', supplier: meta.supplier || '', status });
  }

  const prodList = await kvGetJSON(kv, 'products:list', []);
  const finished = [];
  for (const name of prodList) {
    const stock = await kvGetNumber(kv, `finished:${name}:stock`, 0);
    const meta = await kvGetJSON(kv, `product:${name}:meta`, {});
    finished.push({ product: name, stock, unit: meta.unit || 'pcs' });
  }

  return jsonResponse({ components, finished });
}

async function componentIn(request, kv, session, timezone) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { component, qty, note = '' } = body;
  if (!component || !qty) return jsonError('component and qty required', 400);
  if (isNaN(qty) || qty <= 0) return jsonError('qty must be positive', 400);

  const current = await kvGetNumber(kv, `component:${component}:stock`, 0);
  const newStock = current + Number(qty);
  await kvPutNumber(kv, `component:${component}:stock`, newStock);

  // Log the movement
  const today = getTodayDate(timezone);
  const meta = await kvGetJSON(kv, `component:${component}:meta`, { unit: 'pcs' });
  const log = await kvGetJSON(kv, `complog:${today}`, []);
  log.push({
    id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: currentTime(timezone),
    component,
    type: 'in',
    qty: Number(qty),
    unit: meta.unit || 'pcs',
    product: null,
    note,
    by: session.role
  });
  await kvPutJSON(kv, `complog:${today}`, log);

  return jsonResponse({ component, newStock, message: 'Stock added' });
}

async function componentOut(request, kv, session, timezone) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { component, qty, note = '' } = body;
  if (!component || !qty) return jsonError('component and qty required', 400);
  if (isNaN(qty) || qty <= 0) return jsonError('qty must be positive', 400);

  const current = await kvGetNumber(kv, `component:${component}:stock`, 0);
  const newStock = current - Number(qty);
  await kvPutNumber(kv, `component:${component}:stock`, newStock);

  const today = getTodayDate(timezone);
  const meta = await kvGetJSON(kv, `component:${component}:meta`, { unit: 'pcs' });
  const log = await kvGetJSON(kv, `complog:${today}`, []);
  log.push({
    id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: currentTime(timezone),
    component,
    type: 'out',
    qty: Number(qty),
    unit: meta.unit || 'pcs',
    product: null,
    note,
    by: session.role
  });
  await kvPutJSON(kv, `complog:${today}`, log);

  return jsonResponse({ component, newStock, message: 'Stock deducted' });
}

async function dispatchProduct(request, kv, session, timezone) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { product, qty, note = '', date } = body;
  if (!product || !qty) return jsonError('product and qty required', 400);
  if (isNaN(qty) || qty <= 0) return jsonError('qty must be positive', 400);

  const dispDate = date || getTodayDate(timezone);
  const newStock = await deductFinishedStock(kv, product, Number(qty));

  const log = await kvGetJSON(kv, `dispatch:${dispDate}`, []);
  log.push({
    id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: currentTime(timezone),
    product,
    qty: Number(qty),
    note,
    by: session.role
  });
  await kvPutJSON(kv, `dispatch:${dispDate}`, log);

  const warn = newStock < 0 ? 'Stock went negative after dispatch' : null;
  return jsonResponse({ product, newStock, message: 'Dispatched', warning: warn });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
function jsonError(msg, code = 400) {
  return new Response(JSON.stringify({ error: msg, code }), {
    status: code, headers: { 'Content-Type': 'application/json' }
  });
}
