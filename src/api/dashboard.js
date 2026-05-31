// api/dashboard.js

import { kvGetJSON, kvGetNumber } from '../lib/kv.js';
import { getTodayDate, daysAgo, weekStart, monthStart, getWeekDates, getMonthDates } from '../lib/date.js';

export async function handleDashboard(request, kv, env) {
  const timezone = await kv.get('settings:timezone') || env.TIMEZONE || 'Asia/Kolkata';
  const today = getTodayDate(timezone);
  const wStart = daysAgo(6, timezone); // last 7 days
  const mStart = monthStart(timezone);

  // Today's production
  const todayLog = await kvGetJSON(kv, `prod:${today}`, []);
  const todayTotal = todayLog.reduce((s, e) => s + (e.qty || 0), 0);

  const byProduct = {};
  const byShift = { Morning: 0, Evening: 0, Night: 0 };
  for (const entry of todayLog) {
    byProduct[entry.product] = (byProduct[entry.product] || 0) + entry.qty;
    if (entry.shift && byShift.hasOwnProperty(entry.shift)) {
      byShift[entry.shift] += entry.qty;
    }
  }

  // Yesterday for comparison
  const yesterday = daysAgo(1, timezone);
  const yLog = await kvGetJSON(kv, `prod:${yesterday}`, []);
  const yTotal = yLog.reduce((s, e) => s + (e.qty || 0), 0);
  const todayChange = yTotal === 0 ? null : Math.round(((todayTotal - yTotal) / yTotal) * 100);

  // Week data (last 7 days)
  const weekDates = getWeekDates(wStart, 7);
  const weekDaily = [];
  let weekTotal = 0;
  for (const date of weekDates) {
    const log = await kvGetJSON(kv, `prod:${date}`, []);
    const total = log.reduce((s, e) => s + (e.qty || 0), 0);
    const byProd = {};
    for (const entry of log) {
      byProd[entry.product] = (byProd[entry.product] || 0) + entry.qty;
    }
    weekDaily.push({ date, total, byProduct: byProd });
    weekTotal += total;
  }

  // Month data
  const monthDates = getMonthDates(today.slice(0, 7));
  const monthDaily = [];
  let monthTotal = 0;
  for (const date of monthDates) {
    const log = await kvGetJSON(kv, `prod:${date}`, []);
    const total = log.reduce((s, e) => s + (e.qty || 0), 0);
    monthDaily.push({ date, total });
    monthTotal += total;
  }

  // Lifetime stats
  const totalLifetime = await kvGetNumber(kv, 'stats:overall', 0);

  // Stock alerts
  const compList = await kvGetJSON(kv, 'components:list', []);
  const stockAlerts = [];
  for (const name of compList) {
    const stock = await kvGetNumber(kv, `component:${name}:stock`, 0);
    const min = await kvGetNumber(kv, `component:${name}:min`, 0);
    const meta = await kvGetJSON(kv, `component:${name}:meta`, { unit: 'pcs' });
    if (stock <= min) {
      stockAlerts.push({
        component: name,
        stock,
        min,
        unit: meta.unit,
        status: stock <= 0 ? 'CRITICAL' : 'LOW'
      });
    }
  }
  stockAlerts.sort((a, b) => a.stock - b.stock);

  // Top product today
  const topProduct = Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return new Response(JSON.stringify({
    today: {
      total: todayTotal,
      change: todayChange,
      byProduct: Object.entries(byProduct).map(([p, q]) => ({ product: p, qty: q })),
      byShift: Object.entries(byShift).map(([s, q]) => ({ shift: s, qty: q }))
    },
    week: { total: weekTotal, daily: weekDaily },
    month: { total: monthTotal, daily: monthDaily },
    stockAlerts,
    topProduct,
    totalLifetime
  }), { headers: { 'Content-Type': 'application/json' } });
}
