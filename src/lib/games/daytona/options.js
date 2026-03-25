// src/lib/games/daytona/options.js
//
// NOTE: Daytona options are intentionally hardwired.
// We manually publish results and do not need (or want) the fragility of external NASCAR feeds.

import { getOptionsCache, setOptionsCache } from '$lib/server/db/optionsCache.js';
import { getManualCupDriverOptions } from '$lib/server/nascar/manualCupDrivers.js';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function pickCarNumber(raw) {
  return (
    raw?.carNumber ??
    raw?.car_number ??
    raw?.vehicleNumber ??
    raw?.vehicle_number ??
    raw?.number ??
    raw?.carNo ??
    raw?.car ??
    raw?.vehicle?.number ??
    raw?.vehicle?.carNumber ??
    raw?.competitor?.vehicleNumber ??
    raw?.competitor?.carNumber ??
    null
  );
}

function normalizeOption(raw) {
  const id =
    raw?.id != null
      ? String(raw.id)
      : raw?.driverId != null
        ? String(raw.driverId)
        : raw?.driver_id != null
          ? String(raw.driver_id)
          : '';

  const name =
    raw?.name ||
    [raw?.firstName, raw?.lastName].filter(Boolean).join(' ') ||
    raw?.fullName ||
    id;

  const car = pickCarNumber(raw);

  return {
    id,
    name,
    carNumber: car != null && String(car).trim() ? String(car).trim() : null
  };
}

function normalizeOptions(list) {
  if (!Array.isArray(list)) return [];
  const normalized = list.map(normalizeOption).filter((o) => o.id && o.name);

  const seen = new Set();
  return normalized.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

export async function getOptions({ db, event }) {
  const seasonYear = new Date(Number(event.start_at) * 1000).getUTCFullYear() || 2026;

  const provider = 'manual';
  // Bump the version if you ever change IDs or the list format.
  const cacheKey = `daytona-manual:${seasonYear}:v1`;

  // 1) Serve cached manual options (keeps behavior consistent with other games)
  const cached = await getOptionsCache({
    db,
    eventId: event.id,
    provider,
    cacheKey,
    maxAgeSeconds: MAX_AGE_SECONDS
  });

  if (cached && Array.isArray(cached) && cached.length) {
    return {
      provider,
      cacheKey,
      options: normalizeOptions(cached),
      mode: 'manual:cache',
      note: ''
    };
  }

  // 2) Load hardwired list
  const manual = normalizeOptions(getManualCupDriverOptions());

  if (!manual.length) {
    return {
      provider,
      cacheKey,
      options: [],
      mode: 'manual:empty',
      note: 'Manual Daytona driver list is empty. Check src/lib/server/nascar/manualCupDrivers.js'
    };
  }

  // 3) Store in cache table
  const fetchedAt = Math.floor(Date.now() / 1000);
  await setOptionsCache({
    db,
    eventId: event.id,
    provider,
    cacheKey,
    payload: manual,
    fetchedAt
  });

  return {
    provider,
    cacheKey,
    options: manual,
    mode: 'manual',
    note: ''
  };
}
