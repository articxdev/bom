// api/products.js

import { kvGetJSON, kvPutJSON, kvDelete, kvGetNumber } from '../lib/kv.js';

export async function handleProducts(request, kv, session) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean); // ['api','products',name?,...]
  const name = parts[2] ? decodeURIComponent(parts[2]) : null;
  const isBom = parts[3] === 'bom';

  if (!name && request.method === 'GET') return listProducts(kv);
  if (!name && request.method === 'POST') return addProduct(request, kv);
  if (name && isBom && request.method === 'GET') return getProductBom(kv, name);
  if (name && isBom && request.method === 'PUT') return updateProductBom(request, kv, name);
  if (name && !isBom && request.method === 'PUT') return updateProduct(request, kv, name);
  if (name && !isBom && request.method === 'DELETE') {
    if (session.role !== 'admin') return jsonError('Admin only', 403);
    return deleteProduct(kv, name);
  }

  return jsonError('Not found', 404);
}

async function listProducts(kv) {
  const list = await kvGetJSON(kv, 'products:list', []);
  const products = [];
  for (const name of list) {
    const meta = await kvGetJSON(kv, `product:${name}:meta`, {});
    const bom = await kvGetJSON(kv, `product:${name}:bom`, {});
    const stock = await kvGetNumber(kv, `finished:${name}:stock`, 0);
    const total = await kvGetNumber(kv, `stats:total:${name}`, 0);
    products.push({ name, ...meta, stock, bomCount: Object.keys(bom).length, total });
  }
  return jsonResponse(products);
}

async function addProduct(request, kv) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { name, unit = 'pcs', dailyTarget = 0 } = body;
  if (!name) return jsonError('name required', 400);

  const list = await kvGetJSON(kv, 'products:list', []);
  if (list.includes(name)) return jsonError('Product already exists', 409);

  list.push(name);
  await kvPutJSON(kv, 'products:list', list);
  await kvPutJSON(kv, `product:${name}:meta`, { unit, dailyTarget: Number(dailyTarget), createdAt: Date.now() });
  await kvPutJSON(kv, `product:${name}:bom`, {});

  return jsonResponse({ name, unit, dailyTarget: Number(dailyTarget), message: 'Product created' }, 201);
}

async function updateProduct(request, kv, name) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const meta = await kvGetJSON(kv, `product:${name}:meta`, null);
  if (!meta) return jsonError('Product not found', 404);

  const updated = { ...meta, ...body, name: undefined };
  delete updated.name;
  await kvPutJSON(kv, `product:${name}:meta`, updated);
  return jsonResponse({ name, ...updated, message: 'Updated' });
}

async function deleteProduct(kv, name) {
  const list = await kvGetJSON(kv, 'products:list', []);
  const newList = list.filter(p => p !== name);
  await kvPutJSON(kv, 'products:list', newList);
  await kv.delete(`product:${name}:meta`);
  await kv.delete(`product:${name}:bom`);
  return jsonResponse({ message: 'Deleted' });
}

async function getProductBom(kv, name) {
  const bom = await kvGetJSON(kv, `product:${name}:bom`, {});
  return jsonResponse(bom);
}

async function updateProductBom(request, kv, name) {
  let body;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }
  const { components } = body;
  if (!components || typeof components !== 'object') return jsonError('components object required', 400);

  await kvPutJSON(kv, `product:${name}:bom`, components);
  return jsonResponse({ message: 'BOM updated', bom: components });
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
