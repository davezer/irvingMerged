const LEGACY_DRAFT_MONEY_URL = 'https://script.google.com/macros/s/AKfycby5H8hQmlCoiDl6WOdoEcTxEddym__VtMFuqzotiewfNX0uGv2dEfErERAwp5KPShXO/exec?type=pivot';
const TTL_MS = 5 * 60 * 1000;
let cache = { ts: 0, payload: null, error: null };

function normalized(value = '') {
  return String(value).trim().toLowerCase();
}

function numeric(value) {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function endpointFromEnv(env) {
  return env?.PUBLIC_PIVOT_WEBAPP_URL
    || env?.PIVOT_WEBAPP_URL
    || env?.DRAFT_MONEY_WEBAPP_URL
    || LEGACY_DRAFT_MONEY_URL;
}

function appendType(url, type = 'draftMoney') {
  const source = String(url || '').trim();
  if (!source) return source;
  if (/[?&]type=/.test(source)) return source;
  return `${source}${source.includes('?') ? '&' : '?'}type=${encodeURIComponent(type)}`;
}

function managerKeys(manager = {}) {
  return new Set([
    manager.key,
    manager.managerID,
    manager.managerId,
    manager.id,
    manager.teamName,
    manager.liveTeamName,
    manager.name
  ].filter(Boolean).map(normalized));
}

function objectRowKey(row = {}) {
  return row.key
    ?? row.managerKey
    ?? row.managerID
    ?? row.managerId
    ?? row.id
    ?? row.teamId
    ?? row.teamName
    ?? row.team
    ?? row.name
    ?? row.label
    ?? null;
}

function objectRowValue(row = {}, year = null) {
  const direct = row.value
    ?? row.draftMoney
    ?? row.futureDraftMoney
    ?? row.future_draft_money
    ?? row.amount
    ?? row.total
    ?? row.balance
    ?? row[`${year} Total`]
    ?? row[String(year)]
    ?? null;
  const directNumber = numeric(direct);
  if (directNumber != null) return directNumber;

  for (const [key, value] of Object.entries(row)) {
    if (/total|draft|money|budget|balance/i.test(key)) {
      const n = numeric(value);
      if (n != null) return n;
    }
  }
  return null;
}

function extractFromMatrix(rows = [], manager = {}, year = null) {
  if (!Array.isArray(rows[0])) return null;
  const keys = managerKeys(manager);
  const headerYear = rows[0] || [];
  const headerType = rows[1] || [];
  const yearString = year ? String(year) : String(new Date().getFullYear());

  let valueIndex = headerType.findIndex((cell, idx) => {
    const typeText = String(cell || '');
    const yearText = String(headerYear[idx] || '');
    return typeText === `${yearString} Total` || (yearText === yearString && /total/i.test(typeText));
  });

  if (valueIndex < 1) {
    valueIndex = headerType.findIndex((cell) => /total|draft|money|balance/i.test(String(cell || '')));
  }

  if (valueIndex < 1) valueIndex = 1;

  for (const row of rows.slice(2)) {
    const rowKey = normalized(row?.[0]);
    if (!keys.has(rowKey)) continue;
    return numeric(row?.[valueIndex]);
  }
  return null;
}

export function extractDraftMoneyValue(payload, manager = {}, year = null) {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    if (Array.isArray(payload[0])) return extractFromMatrix(payload, manager, year);

    const keys = managerKeys(manager);
    for (const row of payload) {
      const rowKey = normalized(objectRowKey(row));
      if (!keys.has(rowKey)) continue;
      const value = objectRowValue(row, year);
      if (value != null) return value;
    }
    return null;
  }

  if (Array.isArray(payload.data)) return extractDraftMoneyValue(payload.data, manager, year);
  if (Array.isArray(payload.rows)) return extractDraftMoneyValue(payload.rows, manager, year);
  if (Array.isArray(payload.pivot)) return extractDraftMoneyValue(payload.pivot, manager, year);

  const value = objectRowValue(payload, year);
  return value != null ? value : null;
}

export async function getDraftMoneySnapshot({ env, fetchFn = globalThis.fetch, manager = {}, year = null, type = 'draftMoney' } = {}) {
  const endpoint = appendType(endpointFromEnv(env), type);
  if (!endpoint || !fetchFn) return { value: null, source: 'not configured' };

  const now = Date.now();
  if (cache.payload && now - cache.ts < TTL_MS) {
    return {
      value: extractDraftMoneyValue(cache.payload, manager, year),
      source: 'cached pivot',
      updatedAt: cache.ts
    };
  }

  try {
    const res = await fetchFn(endpoint, {
      headers: { accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const payload = await res.json();
    cache = { ts: now, payload, error: null };
    return {
      value: extractDraftMoneyValue(payload, manager, year),
      source: 'live pivot',
      updatedAt: now
    };
  } catch (err) {
    cache.error = String(err?.message || err);
    if (cache.payload) {
      return {
        value: extractDraftMoneyValue(cache.payload, manager, year),
        source: 'stale pivot',
        updatedAt: cache.ts,
        error: 'Using cached draft money; live source failed.'
      };
    }
    return {
      value: null,
      source: 'pivot unavailable',
      error: 'Draft money source unavailable.'
    };
  }
}

export function buildDraftEconomy(draftRows = []) {
  const byManager = new Map();
  for (const row of draftRows || []) {
    const managerId = String(row.manager_id || row.managerId || row.managerID || '').trim();
    if (!managerId) continue;
    if (!byManager.has(managerId)) {
      byManager.set(managerId, {
        season: String(row.season || new Date().getFullYear()),
        manager_id: managerId,
        totalSpent: 0,
        keeperSpent: 0,
        auctionSpent: 0,
        pickCount: 0,
        keeperCount: 0,
        maxPurchase: 0,
        averagePurchase: 0
      });
    }
    const item = byManager.get(managerId);
    const amount = Number(row.amount || row.auction_amount || row.value || 0);
    const isKeeper = Number(row.is_keeper || row.isKeeper || 0) === 1 || row.is_keeper === true || row.isKeeper === true;
    item.totalSpent += amount;
    item.pickCount += 1;
    item.maxPurchase = Math.max(item.maxPurchase, amount);
    if (isKeeper) {
      item.keeperSpent += amount;
      item.keeperCount += 1;
    } else {
      item.auctionSpent += amount;
    }
  }
  return [...byManager.values()].map((row) => ({
    ...row,
    totalSpent: Number(row.totalSpent.toFixed(2)),
    keeperSpent: Number(row.keeperSpent.toFixed(2)),
    auctionSpent: Number(row.auctionSpent.toFixed(2)),
    maxPurchase: Number(row.maxPurchase.toFixed(2)),
    averagePurchase: row.pickCount ? Number((row.totalSpent / row.pickCount).toFixed(2)) : 0
  }));
}

export function buildDraftBudgetLedger({ season, economyRows = [], startingBudget = 200 } = {}) {
  return (economyRows || []).map((row) => {
    const spent = Number(row.totalSpent || 0);
    const keeperCommitment = Number(row.keeperSpent || 0);
    return {
      season: String(season || row.season || new Date().getFullYear()),
      manager_id: String(row.manager_id),
      starting_budget: Number(startingBudget || 200),
      spent_budget: Number(spent.toFixed(2)),
      remaining_budget: Number((Number(startingBudget || 200) - spent).toFixed(2)),
      keeper_commitment: Number(keeperCommitment.toFixed(2)),
      max_purchase: Number(row.maxPurchase || 0),
      average_purchase: Number(row.averagePurchase || 0)
    };
  });
}
