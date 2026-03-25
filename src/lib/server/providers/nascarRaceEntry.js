// src/lib/server/providers/nascarRaceEntry.js

/**
 * Option 1: "true entrants for a specific race"
 *
 * Strategy:
 *  - Fetch race_list_basic.json for the season
 *  - Find the Daytona 500 race_id in series_1 (Cup)
 *  - Try to fetch an entry list / roster feed for that race_id
 *  - Normalize to [{ id, name, carNumber? }]
 *
 * Note: Some historical endpoints (weekend-feed.json) have been pulled or return null.
 * We try multiple endpoints and fallback.
 */

export async function findCupRaceId({ fetchImpl = fetch, seasonYear, raceName }) {
  const url = `https://cf.nascar.com/cacher/${seasonYear}/race_list_basic.json`;

  const res = await fetchImpl(url, {
    headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`race_list_basic fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  // race_list_basic has keys like: series_1, series_2, series_3
  const cup = Array.isArray(data?.series_1) ? data.series_1 : [];
  if (!cup.length) throw new Error('race_list_basic missing series_1');

  const want = String(raceName || '').trim().toLowerCase();
  const match =
    cup.find((r) => String(r?.race_name || '').trim().toLowerCase() === want) ||
    cup.find((r) => String(r?.race_name || '').toLowerCase().includes(want));

  if (!match?.race_id) throw new Error(`Could not find race_id for "${raceName}" in ${seasonYear}`);

  return Number(match.race_id);
}

export async function fetchRaceEntryList({ fetchImpl = fetch, seasonYear, seriesId, raceId }) {
  // Try endpoints in order (some may be unavailable depending on year/season)
  const candidates = [
    // historically used by race center (may return weekend_race:null now)
    `https://cf.nascar.com/cacher/${seasonYear}/${seriesId}/${raceId}/weekend-feed.json`,

    // other cached artifacts that have existed in the ecosystem
    `https://cf.nascar.com/cacher/${seasonYear}/${seriesId}/${raceId}/live-feed.json`,
    `https://cf.nascar.com/cacher/${seasonYear}/${seriesId}/${raceId}/live_feed.json`,

    // live feeds (may not exist until race week)
    `https://cf.nascar.com/live/feeds/series_${seriesId}/${raceId}/live_feed.json`,
    `https://cf.nascar.com/live/feeds/series_${seriesId}/${raceId}/live_points.json`
  ];

  let lastErr = null;

  for (const url of candidates) {
    try {
      const res = await fetchImpl(url, {
        headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' }
      });

      if (!res.ok) {
        lastErr = new Error(`(${res.status}) ${url}`);
        continue;
      }

      const data = await res.json();
      const options = normalizeEntrantsFromAnyShape(data);

      if (options.length) {
        return { sourceUrl: url, options };
      }
    } catch (e) {
      lastErr = e;
    }
  }

  // Nothing worked
  const msg = lastErr ? String(lastErr.message || lastErr) : 'No entry list endpoints worked';
  return { sourceUrl: null, options: [], error: msg };
}

/**
 * Brutal but effective:
 * Find a likely "entrants" array and normalize.
 * We accept various shapes and keys:
 * - driver_id, car_number, full_name, name, etc.
 */
function normalizeEntrantsFromAnyShape(root) {
  const arr = findLikelyEntrantsArray(root);
  if (!Array.isArray(arr) || !arr.length) return [];

  const out = [];
  const seen = new Set();

  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;

    const id =
      x.Nascar_Driver_ID ?? x.driver_id ?? x.DriverId ?? x.Driver_ID ?? x.id ?? x.Id ?? null;

    const name =
      (x.Full_Name || x.full_name || x.name || x.Name || '').toString().trim() ||
      `${(x.First_Name || x.first_name || '').toString().trim()} ${(x.Last_Name || x.last_name || '').toString().trim()}`.trim();

    if (!id || !name) continue;

    const idStr = String(id);
    if (seen.has(idStr)) continue;
    seen.add(idStr);

    const carNumber =
      x.car_number ?? x.CarNumber ?? x.Car_Number ?? x.Number ?? x.number ?? null;

    out.push({
      id: idStr,
      name,
      carNumber: carNumber != null ? String(carNumber) : null
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function findLikelyEntrantsArray(root) {
  // BFS scan
  const queue = [root];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    if (Array.isArray(cur)) {
      if (!cur.length) continue;
      const first = cur[0];
      if (first && typeof first === 'object') {
        const keys = Object.keys(first);
        const hasId = keys.some((k) => /driver/i.test(k)) || keys.some((k) => /Nascar_Driver_ID/i.test(k));
        const hasName = keys.some((k) => /name/i.test(k)) || (keys.includes('First_Name') && keys.includes('Last_Name'));
        const hasCar = keys.some((k) => /car/i.test(k)) || keys.some((k) => /number/i.test(k));

        // entrants arrays almost always have id+name; car number is common
        if (hasId && hasName && (hasCar || keys.length > 5)) return cur;
      }
      continue;
    }

    for (const v of Object.values(cur)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }

  return null;
}
