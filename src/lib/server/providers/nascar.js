// src/lib/server/providers/nascar.js

const DRIVERS_JSON_URL = 'https://cf.nascar.com/cacher/drivers.json';

/**
 * Fetch NASCAR Cup drivers from cf.nascar.com cacher feed.
 * Returns: [{ id, name, firstName, lastName, manufacturer, team, series, ... }]
 */
export async function fetchCupDrivers(fetchImpl = fetch) {
  const res = await fetchImpl(DRIVERS_JSON_URL, {
    headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`drivers.json fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  // Based on your logs: top-level keys = status/message/response, and response is the array
  const arr = Array.isArray(data?.response) ? data.response : [];
  if (!arr.length) return [];

  const out = [];
  const seen = new Set();
  console.log('nascar cacher total:', arr.length, 'cup:', out.length);

  for (const d of arr) {
    const norm = normalizeFromCacher(d);
    if (!norm) continue;
    if (!isCupFromCacher(d)) continue;
    if (!isUsableDriverFromCacher(d)) continue;

    if (seen.has(norm.id)) continue;
    seen.add(norm.id);
    out.push(norm);
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function normalizeFromCacher(d) {
  if (!d || typeof d !== 'object') return null;

  // Best stable id: Nascar_Driver_ID
  const id = d.Nascar_Driver_ID ?? d.Driver_ID ?? null;
  const idStr = id != null ? String(id) : null;

  const full = (d.Full_Name || '').trim();
  const first = (d.First_Name || '').trim();
  const last = (d.Last_Name || '').trim().replace(/\s+$/, '');

  const name = full || `${first} ${last}`.trim();

  if (!idStr || !name) return null;

  const manufacturer = (d.Manufacturer || '').trim() || null;
  const team = (d.Team || '').trim() || null;

  // Optional nice-to-haves
  const badgeImage = d.Badge_Image || null;
  const image = d.Image || null;

  return {
    id: idStr,
    name,
    firstName: first || null,
    lastName: last || null,
    manufacturer,
    team,
    badgeImage,
    image
  };
}

function isCupFromCacher(d) {
  const logo = String(d?.Series_Logo || '').toLowerCase();

  // Cup logo usually includes "cup" somewhere (different variants exist)
  if (logo.includes('cup')) return true;

  // Some records may encode series elsewhere
  const series = String(d?.Driver_Series || '').toLowerCase();
  if (series.includes('cup')) return true;

  // If neither is present, treat as not Cup
  return false;
}


function isUsableDriverFromCacher(d) {
  const full = String(d?.Full_Name || '').trim();
  if (!full) return false;

  // Filter obvious placeholder default images
  const img = String(d?.Image || '').toLowerCase();
  if (img.includes('/wp-includes/images/media/default.png')) return false;

  // Filter obvious junk entries with no real stats AND draft status
  const status = String(d?.Driver_Post_Status || '').toLowerCase();
  const rank = Number(d?.Rank || 0);
  const points = Number(d?.Points || 0);

  if (status === 'draft' && rank === 0 && points === 0) return false;

  return true;
}
