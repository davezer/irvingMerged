import { getOptionsCache, setOptionsCache } from '$lib/server/db/optionsCache.js';

const PROVIDER = 'masters';
const FIELD_CACHE_KEY = 'masters:field:espn-direct:v4';
const LEADERBOARD_CACHE_KEY = 'masters:leaderboard:espn:v1';
const EVENT_CACHE_KEY = 'masters:event:espn:v2';

const FIELD_MAX_AGE_SECONDS = 60 * 60 * 6;
const LEADERBOARD_MAX_AGE_SECONDS = 90;
const EVENT_MAX_AGE_SECONDS = 60 * 60 * 12;

function asStr(v) {
  return v == null ? '' : String(v).trim();
}

function safeObj(v) {
  return v && typeof v === 'object' ? v : {};
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function yearFromEvent(event) {
  const sec = Number(event?.start_at ?? 0);
  if (sec > 0) return new Date(sec * 1000).getUTCFullYear();
  return new Date().getUTCFullYear();
}

function normalizeWhitespace(value) {
  return asStr(value).replace(/\s+/g, ' ').trim();
}

function cleanPlayerName(name) {
  return normalizeWhitespace(name);
}

function normalizeNameKey(name) {
  return asStr(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function looksLikePlayerName(name) {
  const value = cleanPlayerName(name);
  if (!value) return false;
  if (!/\s/.test(value)) return false;
  if (value.length < 4 || value.length > 60) return false;
  return true;
}

function buildCalendarUrl() {
  return 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';
}

function buildScoreboardUrl(eventId) {
  return `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard?event=${encodeURIComponent(String(eventId))}`;
}

async function fetchJson(fetchImpl, url) {
  const res = await fetchImpl(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

function golferFromCompetitor(node) {
  const n = safeObj(node);
  const athlete = safeObj(n.athlete);
  const id = asStr(athlete.id || n.id);
  const name = cleanPlayerName(athlete.displayName || athlete.fullName || n.displayName || n.fullName || n.name);

  if (!id || !looksLikePlayerName(name)) return null;

  return {
    id,
    name,
    shortName: asStr(athlete.shortName) || null,
    country: asStr(athlete?.flag?.alt) || null,
    teeTime: null,
    status: null,
    image: asStr(athlete?.headshot?.href) || null
  };
}

function uniqueByIdOrName(rows) {
  const seenIds = new Set();
  const seenNames = new Set();
  const out = [];

  for (const row of rows || []) {
    const id = asStr(row?.id);
    const name = cleanPlayerName(row?.name);
    const nameKey = normalizeNameKey(name);
    if (!id || !nameKey) continue;
    if (seenIds.has(id) || seenNames.has(nameKey)) continue;
    seenIds.add(id);
    seenNames.add(nameKey);
    out.push({ ...row, id, name });
  }

  return out;
}

function sortByName(rows) {
  return [...rows].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
}

function findMastersEventInScoreboard(data, event) {
  const year = yearFromEvent(event);
  const wantedName = asStr(event?.name).toLowerCase();

  const events = safeArray(data?.events);
  const fromEvents =
    events.find((row) => {
      const name = asStr(row?.name).toLowerCase();
      const date = asStr(row?.date);
      return name.includes('masters') && (!date || date.startsWith(String(year)));
    }) ||
    events.find((row) => asStr(row?.name).toLowerCase().includes(wantedName)) ||
    null;

  if (fromEvents?.id) return fromEvents;

  const calendar = safeArray(data?.leagues?.[0]?.calendar);
  const calMatch =
    calendar.find((row) => {
      const label = asStr(row?.label).toLowerCase();
      const startDate = asStr(row?.startDate);
      return label.includes('masters') && (!startDate || startDate.startsWith(String(year)));
    }) ||
    calendar.find((row) => asStr(row?.label).toLowerCase().includes(wantedName)) ||
    null;

  if (!calMatch?.id) return null;

  return {
    id: String(calMatch.id),
    name: asStr(calMatch.label) || event?.name || 'Masters Tournament',
    date: asStr(calMatch.startDate) || null,
    endDate: asStr(calMatch.endDate) || null,
    competitions: []
  };
}

function extractFieldRowsFromData(data, event) {
  const mastersEvent = findMastersEventInScoreboard(data, event) || safeArray(data?.events)[0] || null;
  const competitors = safeArray(mastersEvent?.competitions?.[0]?.competitors);
  const rows = competitors.map(golferFromCompetitor).filter(Boolean);
  return sortByName(uniqueByIdOrName(rows));
}

function rankPosition(pos) {
  const s = asStr(pos).toUpperCase();
  if (!s) return 9996;
  const cleaned = s.replace(/^T/, '');
  const n = Number.parseInt(cleaned, 10);
  if (Number.isFinite(n)) return n;
  if (s === 'CUT') return 9997;
  if (s === 'WD') return 9998;
  if (s === 'DQ') return 9999;
  return 9996;
}

function leaderboardRowFromCompetitor(node) {
  const n = safeObj(node);
  const athlete = safeObj(n.athlete);
  const id = asStr(athlete.id || n.id);
  const name = cleanPlayerName(athlete.displayName || athlete.fullName || n.displayName || n.fullName || n.name);
  if (!id || !looksLikePlayerName(name)) return null;

  const position = asStr(n.position?.displayValue || n.position?.abbreviation || n.rank || n.place) || null;
  const toPar = asStr(n.score || n.scoreToPar || n.toPar?.displayValue || n.toPar) || null;
  const thru = asStr(n.thru?.displayValue || n.thru || n.holesPlayed) || null;
  const status = asStr(n.status?.type?.description || n.status?.displayValue || n.status?.detail || n.status) || null;
  const teeTime = asStr(n.teeTime?.displayValue || n.teeTime || n.startTime) || null;

  let today = null;
  const linescores = safeArray(n.linescores);
  if (linescores.length) {
    const latest = safeObj(linescores[linescores.length - 1]);
    today = asStr(latest.displayValue || latest.value || latest.score) || null;
  }

  return {
    id,
    name,
    shortName: asStr(athlete.shortName) || null,
    country: asStr(athlete?.flag?.alt) || null,
    position,
    toPar,
    today,
    thru,
    teeTime,
    status,
    image: asStr(athlete?.headshot?.href) || null
  };
}

function normalizeLeaderboardFromData(data, event) {
  const mastersEvent = findMastersEventInScoreboard(data, event) || safeArray(data?.events)[0] || null;
  const competitors = safeArray(mastersEvent?.competitions?.[0]?.competitors);
  const rows = competitors.map(leaderboardRowFromCompetitor).filter(Boolean);

  return [...rows].sort((a, b) => {
    const posDelta = rankPosition(a?.position) - rankPosition(b?.position);
    if (posDelta !== 0) return posDelta;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}

async function discoverMastersEvent({ db, event, fetchImpl }) {
  const eventId = event?.id;

  const fresh = await getOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: EVENT_CACHE_KEY,
    maxAgeSeconds: EVENT_MAX_AGE_SECONDS
  });

  if (fresh?.eventId) return fresh;

  const data = await fetchJson(fetchImpl, buildCalendarUrl());
  const mastersEvent = findMastersEventInScoreboard(data, event);

  if (!mastersEvent?.id) {
    throw new Error('Could not find Masters event in ESPN scoreboard');
  }

  const payload = {
    eventId: String(mastersEvent.id),
    label: asStr(mastersEvent.name) || asStr(event?.name) || 'Masters Tournament',
    startDate: asStr(mastersEvent.date) || null,
    endDate: asStr(mastersEvent.endDate) || null
  };

  await setOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: EVENT_CACHE_KEY,
    payload,
    fetchedAt: Math.floor(Date.now() / 1000)
  });

  return payload;
}

export async function getMastersField({ db, event, fetchImpl }) {
  const eventId = event?.id;
  const cached = await getOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: FIELD_CACHE_KEY,
    maxAgeSeconds: FIELD_MAX_AGE_SECONDS
  });

  if (Array.isArray(cached) && cached.length) {
    return {
      provider: PROVIDER,
      cacheKey: FIELD_CACHE_KEY,
      options: cached,
      mode: 'cache',
      note: `Loaded ${cached.length} golfers from cache.`
    };
  }

  const stale = await getOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: FIELD_CACHE_KEY,
    maxAgeSeconds: 60 * 60 * 24 * 365
  });

  try {
    const baseData = await fetchJson(fetchImpl, buildCalendarUrl());
    let options = extractFieldRowsFromData(baseData, event);

    let eventMeta = null;
    if (options.length < 40) {
      eventMeta = await discoverMastersEvent({ db, event, fetchImpl });
      const eventData = await fetchJson(fetchImpl, buildScoreboardUrl(eventMeta.eventId));
      const eventRows = extractFieldRowsFromData(eventData, event);
      if (eventRows.length > options.length) {
        options = eventRows;
      }
    }

    if (!options.length) {
      if (Array.isArray(stale) && stale.length) {
        return {
          provider: PROVIDER,
          cacheKey: FIELD_CACHE_KEY,
          options: stale,
          mode: 'cache:stale',
          note: 'ESPN field fetch returned nothing; using stale cached field.'
        };
      }

      return {
        provider: PROVIDER,
        cacheKey: FIELD_CACHE_KEY,
        options: [],
        mode: 'live:empty',
        note: 'ESPN returned no Masters field rows.'
      };
    }

    await setOptionsCache({
      db,
      eventId,
      provider: PROVIDER,
      cacheKey: FIELD_CACHE_KEY,
      payload: options,
      fetchedAt: Math.floor(Date.now() / 1000)
    });

    return {
      provider: PROVIDER,
      cacheKey: FIELD_CACHE_KEY,
      options,
      mode: 'live:espn',
      note: `Loaded ${options.length} golfers directly from ESPN's Masters competitors list.`
    };
  } catch (err) {
    if (Array.isArray(stale) && stale.length) {
      return {
        provider: PROVIDER,
        cacheKey: FIELD_CACHE_KEY,
        options: stale,
        mode: 'cache:stale',
        note: `Field fetch failed; using stale cache (${err?.message || 'unknown error'}).`
      };
    }

    return {
      provider: PROVIDER,
      cacheKey: FIELD_CACHE_KEY,
      options: [],
      mode: 'error',
      note: err?.message || 'Failed to load Masters field.'
    };
  }
}

export async function getMastersLeaderboard({ db, event, fetchImpl }) {
  const eventId = event?.id;
  const cached = await getOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: LEADERBOARD_CACHE_KEY,
    maxAgeSeconds: LEADERBOARD_MAX_AGE_SECONDS
  });

  if (Array.isArray(cached) && cached.length) {
    return {
      provider: PROVIDER,
      cacheKey: LEADERBOARD_CACHE_KEY,
      leaderboard: cached,
      mode: 'cache',
      note: 'Loaded live board from cache.'
    };
  }

  const stale = await getOptionsCache({
    db,
    eventId,
    provider: PROVIDER,
    cacheKey: LEADERBOARD_CACHE_KEY,
    maxAgeSeconds: 60 * 60 * 24
  });

  try {
    const eventMeta = await discoverMastersEvent({ db, event, fetchImpl });
    const data = await fetchJson(fetchImpl, buildScoreboardUrl(eventMeta.eventId));
    const leaderboard = normalizeLeaderboardFromData(data, event);

    if (!leaderboard.length) {
      return {
        provider: PROVIDER,
        cacheKey: LEADERBOARD_CACHE_KEY,
        leaderboard: Array.isArray(stale) ? stale : [],
        mode: Array.isArray(stale) && stale.length ? 'cache:stale' : 'live:empty',
        note: Array.isArray(stale) && stale.length
          ? 'ESPN returned no live leaderboard rows; using stale cache.'
          : 'ESPN event feed did not expose live leaderboard rows yet.'
      };
    }

    await setOptionsCache({
      db,
      eventId,
      provider: PROVIDER,
      cacheKey: LEADERBOARD_CACHE_KEY,
      payload: leaderboard,
      fetchedAt: Math.floor(Date.now() / 1000)
    });

    return {
      provider: PROVIDER,
      cacheKey: LEADERBOARD_CACHE_KEY,
      leaderboard,
      mode: 'live:espn',
      note: `Loaded ${leaderboard.length} live rows from ESPN.`
    };
  } catch (err) {
    return {
      provider: PROVIDER,
      cacheKey: LEADERBOARD_CACHE_KEY,
      leaderboard: Array.isArray(stale) ? stale : [],
      mode: Array.isArray(stale) && stale.length ? 'cache:stale' : 'error',
      note: Array.isArray(stale) && stale.length
        ? `Live board fetch failed; using stale cache (${err?.message || 'unknown error'}).`
        : err?.message || 'Failed to load Masters leaderboard from ESPN.'
    };
  }
}

export async function getMastersEventMeta({ db, event, fetchImpl }) {
  try {
    const meta = await discoverMastersEvent({ db, event, fetchImpl });
    return {
      provider: PROVIDER,
      mode: 'live:espn',
      note: 'Loaded Masters event metadata from ESPN.',
      ...meta
    };
  } catch (err) {
    return {
      provider: PROVIDER,
      mode: 'error',
      note: err?.message || 'Failed to discover Masters event on ESPN.',
      eventId: null,
      label: null,
      startDate: null,
      endDate: null
    };
  }
}
