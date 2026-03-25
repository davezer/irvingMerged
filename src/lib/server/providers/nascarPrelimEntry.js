// src/lib/server/providers/nascarPrelimEntry.js

const PRELIM_URL = (raceId) => `https://feed.nascar.com/api/prelimentrylist/${raceId}`;

export async function fetchPrelimEntryList({ fetchImpl = fetch, raceId }) {
  const res = await fetchImpl(PRELIM_URL(raceId), {
    headers: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0'
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      error: `prelimentrylist fetch failed (${res.status}): ${text.slice(0, 200)}`
    };
  }

  const data = await res.json();

  const options = normalizePrelim(data);

  return {
    ok: options.length > 0,
    status: 200,
    options,
    rawShape: {
      topKeys: data && typeof data === 'object' ? Object.keys(data).slice(0, 30) : []
    }
  };
}

function normalizePrelim(root) {
  const arr = findLikelyEntrantsArray(root);
  if (!Array.isArray(arr)) return [];

  const seen = new Set();
  const out = [];

  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;

    // Try multiple common id/name fields
    const id =
      x.Nascar_Driver_ID ?? x.Driver_ID ?? x.driver_id ?? x.driverId ?? x.id ?? x.Id ?? null;

    const name =
      String(x.Full_Name ?? x.full_name ?? x.name ?? x.Name ?? '').trim() ||
      `${String(x.First_Name ?? x.first_name ?? '').trim()} ${String(x.Last_Name ?? x.last_name ?? '').trim()}`.trim();

    if (!id || !name) continue;

    const idStr = String(id);
    if (seen.has(idStr)) continue;
    seen.add(idStr);

    const carNumber =
      x.Car_Number ?? x.car_number ?? x.CarNumber ?? x.number ?? x.Number ?? null;

    out.push({
      id: idStr,
      name,
      carNumber: carNumber != null ? String(carNumber) : null
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// BFS scan to find an entrants-like array
function findLikelyEntrantsArray(root) {
  const queue = [root];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    if (Array.isArray(cur)) {
      if (cur.length && cur[0] && typeof cur[0] === 'object') {
        const keys = Object.keys(cur[0]);
        const hasId = keys.some((k) => /driver/i.test(k)) || keys.includes('Nascar_Driver_ID');
        const hasName = keys.some((k) => /name/i.test(k)) || (keys.includes('First_Name') && keys.includes('Last_Name'));
        if (hasId && hasName) return cur;
      }
      continue;
    }

    for (const v of Object.values(cur)) {
      if (v && typeof v === 'object') queue.push(v);
    }
  }

  return null;
}
