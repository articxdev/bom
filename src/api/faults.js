// api/faults.js

import { kvGetJSON, kvPutJSON } from '../lib/kv.js';
import { getTodayDate, currentTime } from '../lib/date.js';

const FAULT_CLASSIFICATIONS = ['BURNT','CRACKED','DEFECTIVE','MISSING','DAMAGED','CUT-WRONG','WASTAGE','OTHER'];

export async function handleFaults(request, kv, session, env) {
  const url = new URL(request.url);
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';

  if (request.method === 'GET') return getFaults(url, kv, timezone);
  if (request.method === 'POST') return addFaults(request, kv, session, timezone);

  return jsonError('Not found', 404);
}

async function getFaults(url, kv, timezone) {
  const from = url.searchParams.get('from') || getTodayDate(timezone);
  const to = url.searchParams.get('to') || from;
  const productFilter = url.searchParams.get('product') || '';
  const compFilter = url.searchParams.get('component') || '';

  const allFaults = [];
  let cursor = new Date(from + 'T00:00:00');
  const endDate = new Date(to + 'T00:00:00');

  while (cursor <= endDate) {
    const d = cursor.toISOString().split('T')[0];
    const log = await kvGetJSON(kv, `fault:${d}`, []);
    for (const fault of log) {
      if (productFilter && fault.product !== productFilter) continue;
      if (compFilter && fault.component !== compFilter) continue;
      allFaults.push({ ...fault, date: d });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return jsonResponse(allFaults.sort((a, b) => b.date.localeCompare(a.date)));
}

async function addFaults(request, kv, session, timezone) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }

  const { product, date, faults = [] } = body;
  if (!product || !faults.length) return jsonError('product and faults required', 400);

  const logDate = date || getTodayDate(timezone);
  const faultLog = await kvGetJSON(kv, `fault:${logDate}`, []);

  for (const f of faults) {
    const meta = await kvGetJSON(kv, `component:${f.component}:meta`, { unit: 'pcs' });
    faultLog.push({
      id: `flt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: currentTime(timezone),
      product,
      component: f.component,
      qty: Number(f.qty) || 0,
      unit: f.unit || meta.unit || 'pcs',
      classification: FAULT_CLASSIFICATIONS.includes(f.classification) ? f.classification : 'OTHER',
      note: f.note || '',
      by: session.role
    });
  }

  await kvPutJSON(kv, `fault:${logDate}`, faultLog);
  return jsonResponse({ message: 'Faults logged', count: faults.length }, 201);
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
