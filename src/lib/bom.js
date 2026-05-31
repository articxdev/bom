// lib/bom.js — BOM deduction logic

import { kvGetJSON, kvGetNumber, kvPutNumber, kvPutJSON } from './kv.js';
import { currentTime } from './date.js';

export async function deductBOM(kv, productName, qty, date, by, timezone = 'Asia/Kolkata') {
  const bom = await kvGetJSON(kv, `product:${productName}:bom`, {});
  const alerts = [];
  const compLogEntries = [];

  for (const [compName, bomEntry] of Object.entries(bom)) {
    const deductQty = bomEntry.qty * qty;
    const currentStock = await kvGetNumber(kv, `component:${compName}:stock`, 0);
    const minStock = await kvGetNumber(kv, `component:${compName}:min`, 0);
    const meta = await kvGetJSON(kv, `component:${compName}:meta`, { unit: 'pcs' });

    const newStock = currentStock - deductQty;
    await kvPutNumber(kv, `component:${compName}:stock`, newStock);

    // Log the auto deduction
    const logKey = `complog:${date}`;
    const existingLog = await kvGetJSON(kv, logKey, []);
    const entry = {
      id: `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      time: currentTime(timezone),
      component: compName,
      type: 'auto',
      qty: deductQty,
      unit: bomEntry.unit || meta.unit || 'pcs',
      product: productName,
      note: `Auto-deducted for ${qty} × ${productName}`,
      by
    };
    existingLog.push(entry);
    compLogEntries.push(entry);
    await kvPutJSON(kv, logKey, existingLog);

    if (newStock < 0) {
      alerts.push({ component: compName, stock: newStock, min: minStock, status: 'CRITICAL', unit: meta.unit });
    } else if (newStock < minStock) {
      alerts.push({ component: compName, stock: newStock, min: minStock, status: 'LOW', unit: meta.unit });
    }
  }

  return { alerts, compLogEntries };
}

export async function getBOMDetails(kv, productName) {
  const bom = await kvGetJSON(kv, `product:${productName}:bom`, {});
  const details = [];
  for (const [name, entry] of Object.entries(bom)) {
    const meta = await kvGetJSON(kv, `component:${name}:meta`, {});
    const stock = await kvGetNumber(kv, `component:${name}:stock`, 0);
    details.push({ name, qty: entry.qty, unit: entry.unit || meta.unit || 'pcs', stock });
  }
  return details;
}
