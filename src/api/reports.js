// api/reports.js

import { kvGetJSON, kvGetNumber } from '../lib/kv.js';
import { getTodayDate, getWeekDates, getMonthDates } from '../lib/date.js';

export async function handleReports(request, kv, session, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';

  if (path === '/api/reports/daily') return dailyReport(url, kv, timezone);
  if (path === '/api/reports/weekly') return weeklyReport(url, kv, timezone);
  if (path === '/api/reports/monthly') return monthlyReport(url, kv, timezone);
  if (path === '/api/reports/product') return productReport(url, kv, timezone);
  if (path === '/api/reports/export') return exportReport(url, kv, session, timezone);
  if (path === '/api/repair') {
    if (session.role !== 'admin') return jsonError('Admin only', 403);
    return repairStats(kv);
  }

  return jsonError('Not found', 404);
}

async function dailyReport(url, kv, timezone) {
  const date = url.searchParams.get('date') || getTodayDate(timezone);
  const prodLog = await kvGetJSON(kv, `prod:${date}`, []);
  const faultLog = await kvGetJSON(kv, `fault:${date}`, []);
  const compLog = await kvGetJSON(kv, `complog:${date}`, []);
  const dispLog = await kvGetJSON(kv, `dispatch:${date}`, []);

  const byProduct = {};
  const byShift = {};
  let totalProduced = 0;

  for (const entry of prodLog) {
    totalProduced += entry.qty;
    byProduct[entry.product] = (byProduct[entry.product] || { qty: 0, netGood: 0, shifts: {} });
    byProduct[entry.product].qty += entry.qty;
    byProduct[entry.product].netGood = (byProduct[entry.product].netGood || 0) + (entry.netGood || entry.qty);
    byProduct[entry.product].shifts[entry.shift] = (byProduct[entry.product].shifts[entry.shift] || 0) + entry.qty;
    byShift[entry.shift] = (byShift[entry.shift] || 0) + entry.qty;
  }

  return jsonResponse({ date, totalProduced, byProduct, byShift, faults: faultLog, componentMovements: compLog, dispatches: dispLog });
}

async function weeklyReport(url, kv, timezone) {
  const from = url.searchParams.get('from') || getTodayDate(timezone);
  const dates = getWeekDates(from, 7);
  const daily = [];
  let weekTotal = 0;

  for (const date of dates) {
    const log = await kvGetJSON(kv, `prod:${date}`, []);
    const total = log.reduce((s, e) => s + e.qty, 0);
    const byProd = {};
    for (const e of log) byProd[e.product] = (byProd[e.product] || 0) + e.qty;
    daily.push({ date, total, byProduct: byProd });
    weekTotal += total;
  }

  return jsonResponse({ from, to: dates[dates.length - 1], weekTotal, daily });
}

async function monthlyReport(url, kv, timezone) {
  const month = url.searchParams.get('month') || getTodayDate(timezone).slice(0, 7);
  const dates = getMonthDates(month);
  const daily = [];
  let monthTotal = 0;

  for (const date of dates) {
    const log = await kvGetJSON(kv, `prod:${date}`, []);
    const total = log.reduce((s, e) => s + e.qty, 0);
    const byProd = {};
    for (const e of log) byProd[e.product] = (byProd[e.product] || 0) + e.qty;
    daily.push({ date, total, byProduct: byProd });
    monthTotal += total;
  }

  const products = await kvGetJSON(kv, 'products:list', []);
  const byProduct = {};
  for (const p of products) byProduct[p] = 0;
  for (const d of daily) {
    for (const [p, q] of Object.entries(d.byProduct)) {
      byProduct[p] = (byProduct[p] || 0) + q;
    }
  }

  return jsonResponse({ month, monthTotal, daily, byProduct });
}

async function productReport(url, kv, timezone) {
  const name = url.searchParams.get('name');
  const from = url.searchParams.get('from') || getTodayDate(timezone);
  const to = url.searchParams.get('to') || from;

  if (!name) return jsonError('name required', 400);

  const days = [];
  let total = 0;
  let bestDay = null;
  let bestQty = 0;
  let faultTotal = 0;

  let cursor = new Date(from + 'T00:00:00');
  const endDate = new Date(to + 'T00:00:00');

  while (cursor <= endDate) {
    const d = cursor.toISOString().split('T')[0];
    const log = await kvGetJSON(kv, `prod:${d}`, []);
    const faultLog = await kvGetJSON(kv, `fault:${d}`, []);

    const qty = log.filter(e => e.product === name).reduce((s, e) => s + e.qty, 0);
    const faults = faultLog.filter(e => e.product === name).reduce((s, e) => s + e.qty, 0);
    days.push({ date: d, qty, faults });
    total += qty;
    faultTotal += faults;
    if (qty > bestQty) { bestQty = qty; bestDay = d; }
    cursor.setDate(cursor.getDate() + 1);
  }

  const dayCount = days.filter(d => d.qty > 0).length;
  const avgPerDay = dayCount > 0 ? Math.round(total / dayCount) : 0;
  const faultRate = total > 0 ? Math.round((faultTotal / total) * 100 * 10) / 10 : 0;

  // Component consumption
  const bom = await kvGetJSON(kv, `product:${name}:bom`, {});
  const componentConsumption = {};
  for (const [comp, entry] of Object.entries(bom)) {
    componentConsumption[comp] = { qty: entry.qty * total, unit: entry.unit };
  }

  return jsonResponse({ name, from, to, total, avgPerDay, bestDay, bestQty, faultRate, days, componentConsumption });
}

async function exportReport(url, kv, session, timezone) {
  const from = url.searchParams.get('from') || getTodayDate(timezone);
  const to = url.searchParams.get('to') || from;
  const type = url.searchParams.get('type') || 'csv';

  const rows = [['date','product','shift','produced','faults','net','note','by','time']];

  let cursor = new Date(from + 'T00:00:00');
  const endDate = new Date(to + 'T00:00:00');

  while (cursor <= endDate) {
    const d = cursor.toISOString().split('T')[0];
    const log = await kvGetJSON(kv, `prod:${d}`, []);
    for (const e of log) {
      const faultQty = (e.faults || []).reduce((s, f) => s + f.qty, 0);
      rows.push([d, e.product, e.shift, e.qty, faultQty, e.netGood || e.qty - faultQty, `"${(e.note||'').replace(/"/g,'""')}"`, e.by, e.time]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const csv = rows.map(r => r.join(',')).join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="production-${from}-${to}.csv"`
    }
  });
}

async function repairStats(kv) {
  // Recalculate all stats by scanning prod:* keys
  const keys = await kv.list({ prefix: 'prod:' });
  let overall = 0;
  const productTotals = {};
  const finishedGoods = {};

  for (const key of keys.keys) {
    const log = await kvGetJSON(kv, key.name, []);
    for (const e of log) {
      overall += e.qty;
      productTotals[e.product] = (productTotals[e.product] || 0) + e.qty;
      finishedGoods[e.product] = (finishedGoods[e.product] || 0) + (e.netGood || e.qty);
    }
  }

  // Deduct dispatches
  const dispKeys = await kv.list({ prefix: 'dispatch:' });
  for (const key of dispKeys.keys) {
    const log = await kvGetJSON(kv, key.name, []);
    for (const e of log) {
      finishedGoods[e.product] = (finishedGoods[e.product] || 0) - e.qty;
    }
  }

  await kv.put('stats:overall', String(overall));
  for (const [p, q] of Object.entries(productTotals)) {
    await kv.put(`stats:total:${p}`, String(q));
  }
  for (const [p, q] of Object.entries(finishedGoods)) {
    await kv.put(`finished:${p}:stock`, String(q));
  }

  return jsonResponse({ message: 'Stats repaired', overall, productTotals, finishedGoods });
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
