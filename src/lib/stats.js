// lib/stats.js — Stats update helpers

import { kvGetNumber, kvPutNumber } from './kv.js';

export async function updateStats(kv, productName, qty) {
  const overall = await kvGetNumber(kv, 'stats:overall', 0);
  await kvPutNumber(kv, 'stats:overall', overall + qty);

  const productTotal = await kvGetNumber(kv, `stats:total:${productName}`, 0);
  await kvPutNumber(kv, `stats:total:${productName}`, productTotal + qty);
}

export async function updateFinishedStock(kv, productName, netGood) {
  const current = await kvGetNumber(kv, `finished:${productName}:stock`, 0);
  await kvPutNumber(kv, `finished:${productName}:stock`, current + netGood);
  return current + netGood;
}

export async function deductFinishedStock(kv, productName, qty) {
  const current = await kvGetNumber(kv, `finished:${productName}:stock`, 0);
  const newStock = current - qty;
  await kvPutNumber(kv, `finished:${productName}:stock`, newStock);
  return newStock;
}

export async function reverseProductionStats(kv, productName, qty, netGood) {
  const overall = await kvGetNumber(kv, 'stats:overall', 0);
  await kvPutNumber(kv, 'stats:overall', Math.max(0, overall - qty));

  const productTotal = await kvGetNumber(kv, `stats:total:${productName}`, 0);
  await kvPutNumber(kv, `stats:total:${productName}`, Math.max(0, productTotal - qty));

  const finished = await kvGetNumber(kv, `finished:${productName}:stock`, 0);
  await kvPutNumber(kv, `finished:${productName}:stock`, Math.max(0, finished - netGood));
}
