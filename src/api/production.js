// api/production.js

import { kvGetJSON, kvPutJSON, kvGetNumber } from '../lib/kv.js';
import { deductBOM } from '../lib/bom.js';
import { updateStats, updateFinishedStock, reverseProductionStats } from '../lib/stats.js';
import { getTodayDate, currentTime } from '../lib/date.js';

const FAULT_CLASSIFICATIONS = ['BURNT','CRACKED','DEFECTIVE','MISSING','DAMAGED','CUT-WRONG','WASTAGE','OTHER'];

export async function handleProduction(request, kv, session, env) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[2]; // /api/production/:id
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';

  if (!id && request.method === 'GET') return getProduction(url, kv, timezone);
  if (!id && request.method === 'POST') return addProduction(request, kv, session, timezone);
  if (id && request.method === 'DELETE') return deleteProduction(url, kv, id, timezone);

  return jsonError('Not found', 404);
}

async function getProduction(url, kv, timezone) {
  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (date) {
    const log = await kvGetJSON(kv, `prod:${date}`, []);
    return jsonResponse(log);
  }

  if (from && to) {
    const allEntries = [];
    let cursor = new Date(from + 'T00:00:00');
    const endDate = new Date(to + 'T00:00:00');
    while (cursor <= endDate) {
      const d = cursor.toISOString().split('T')[0];
      const log = await kvGetJSON(kv, `prod:${d}`, []);
      allEntries.push(...log.map(e => ({ ...e, date: d })));
      cursor.setDate(cursor.getDate() + 1);
    }
    return jsonResponse(allEntries);
  }

  // Default: today
  const today = getTodayDate(timezone);
  const log = await kvGetJSON(kv, `prod:${today}`, []);
  return jsonResponse(log);
}

async function addProduction(request, kv, session, timezone) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }

  const { product, qty, shift, date, note = '', faults = [] } = body;
  if (!product || !qty || !shift) return jsonError('product, qty, shift required', 400);
  if (isNaN(qty) || qty <= 0) return jsonError('qty must be positive number', 400);

  // Validate product exists
  const products = await kvGetJSON(kv, 'products:list', []);
  if (!products.includes(product)) return jsonError('Product not found', 404);

  const logDate = date || getTodayDate(timezone);

  // Calculate net good units (faults are informational, stock already consumed)
  let faultTotal = 0;
  const validFaults = [];
  for (const f of faults) {
    const fQty = Number(f.qty) || 0;
    faultTotal += fQty;
    if (f.component && fQty > 0) {
      if (!FAULT_CLASSIFICATIONS.includes(f.classification)) {
        f.classification = 'OTHER';
      }
      validFaults.push({ ...f, qty: fQty });
    }
  }
  const netGood = Math.max(0, qty - faultTotal);

  // Create production log entry
  const entry = {
    id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    time: currentTime(timezone),
    product,
    qty: Number(qty),
    shift,
    note,
    by: session.role,
    faults: validFaults,
    netGood,
    date: logDate
  };

  // Save production log
  const prodLog = await kvGetJSON(kv, `prod:${logDate}`, []);
  prodLog.push(entry);
  await kvPutJSON(kv, `prod:${logDate}`, prodLog);

  // Deduct BOM components
  const { alerts } = await deductBOM(kv, product, Number(qty), logDate, session.role, timezone);

  // Log faults
  if (validFaults.length > 0) {
    const faultLog = await kvGetJSON(kv, `fault:${logDate}`, []);
    for (const f of validFaults) {
      const meta = await kvGetJSON(kv, `component:${f.component}:meta`, { unit: 'pcs' });
      faultLog.push({
        id: `flt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: entry.time,
        product,
        component: f.component,
        qty: f.qty,
        unit: f.unit || meta.unit || 'pcs',
        classification: f.classification || 'OTHER',
        note: f.note || '',
        by: session.role
      });
    }
    await kvPutJSON(kv, `fault:${logDate}`, faultLog);
  }

  // Update stats and finished goods
  await updateStats(kv, product, Number(qty));
  const newFinished = await updateFinishedStock(kv, product, netGood);

  return jsonResponse({ entry, alerts, netGood, newFinished, message: 'Production logged' }, 201);
}

async function deleteProduction(url, kv, entryId, timezone) {
  const date = url.searchParams.get('date') || getTodayDate(timezone);
  const prodLog = await kvGetJSON(kv, `prod:${date}`, []);
  const idx = prodLog.findIndex(e => e.id === entryId);
  if (idx === -1) return jsonError('Entry not found', 404);

  const [removed] = prodLog.splice(idx, 1);
  await kvPutJSON(kv, `prod:${date}`, prodLog);

  // Reverse stats
  await reverseProductionStats(kv, removed.product, removed.qty, removed.netGood || removed.qty);

  return jsonResponse({ message: 'Entry deleted', entry: removed });
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
