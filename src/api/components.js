// api/components.js

import { kvGetJSON, kvPutJSON, kvGetNumber, kvPutNumber } from '../lib/kv.js';
import { currentTime } from '../lib/date.js';

export async function handleComponents(request, kv, session, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const name = parts[2] ? decodeURIComponent(parts[2]) : null;
  const isLog = parts[3] === 'log';
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';

  if (!name && request.method === 'GET') return listComponents(kv);
  if (!name && request.method === 'POST') return addComponent(request, kv);
  if (name && isLog && request.method === 'GET') return getComponentLog(request, kv, name);
  if (name && !isLog && request.method === 'PUT') return updateComponent(request, kv, name);
  if (name && !isLog && request.method === 'DELETE') {
    if (session.role !== 'admin') return jsonError('Admin only', 403);
    return deleteComponent(kv, name);
  }

  return jsonError('Not found', 404);
}

async function listComponents(kv) {
  const list = await kvGetJSON(kv, 'components:list', []);
  const components = [];
  for (const name of list) {
    const stock = await kvGetNumber(kv, `component:${name}:stock`, 0);
    const min = await kvGetNumber(kv, `component:${name}:min`, 0);
    const meta = await kvGetJSON(kv, `component:${name}:meta`, {});
    const status = stock <= 0 ? 'CRITICAL' : stock < min ? 'LOW' : 'OK';
    components.push({ name, stock, min, unit: meta.unit || 'pcs', supplier: meta.supplier || '', status });
  }
  return jsonResponse(components);
}

async function addComponent(request, kv) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { name, unit = 'pcs', min = 0, supplier = '' } = body;
  if (!name) return jsonError('name required', 400);

  const list = await kvGetJSON(kv, 'components:list', []);
  if (list.includes(name)) return jsonError('Component already exists', 409);

  list.push(name);
  await kvPutJSON(kv, 'components:list', list);
  await kvPutJSON(kv, `component:${name}:meta`, { unit, supplier, createdAt: Date.now() });
  await kvPutNumber(kv, `component:${name}:stock`, 0);
  await kvPutNumber(kv, `component:${name}:min`, Number(min));

  return jsonResponse({ name, unit, min: Number(min), supplier, stock: 0 }, 201);
}

async function updateComponent(request, kv, name) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const meta = await kvGetJSON(kv, `component:${name}:meta`, null);
  if (!meta) return jsonError('Component not found', 404);

  const { min, supplier } = body;
  if (min !== undefined) await kvPutNumber(kv, `component:${name}:min`, Number(min));
  const newMeta = { ...meta, supplier: supplier !== undefined ? supplier : meta.supplier };
  await kvPutJSON(kv, `component:${name}:meta`, newMeta);

  return jsonResponse({ name, ...newMeta, min: min !== undefined ? Number(min) : await kvGetNumber(kv, `component:${name}:min`, 0) });
}

async function deleteComponent(kv, name) {
  const list = await kvGetJSON(kv, 'components:list', []);
  const newList = list.filter(c => c !== name);
  await kvPutJSON(kv, 'components:list', newList);
  await kv.delete(`component:${name}:meta`);
  await kv.delete(`component:${name}:stock`);
  await kv.delete(`component:${name}:min`);
  return jsonResponse({ message: 'Deleted' });
}

async function getComponentLog(request, kv, name) {
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  // Gather all complog entries for the component in date range
  const entries = [];
  const today = new Date().toISOString().split('T')[0];
  const start = from || today;
  const end = to || today;

  let cursor = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().split('T')[0];
    const log = await kvGetJSON(kv, `complog:${dateStr}`, []);
    for (const entry of log) {
      if (entry.component === name) entries.push(entry);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return jsonResponse(entries.sort((a, b) => (a.time > b.time ? -1 : 1)));
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
