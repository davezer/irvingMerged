// src/lib/server/providers/world_cup.js
import { env } from '$env/dynamic/private';
import { getOptionsCache, setOptionsCache } from '$lib/server/db/optionsCache.js';

const PROVIDER = 'api-football';
const SEASON = 2026;
const LEAGUE_ID = 1; // API-Football World Cup league id
const CACHE_KEY = `worldcup:teams:api-football:${SEASON}:v2`;
const MAX_AGE_SECONDS = 60 * 60 * 6; // 6 hours; team list is stable, but lets logos/names refresh

const MANUAL_CACHE_KEY = `worldcup:teams:manual:${SEASON}:v3`;

const MANUAL_WORLD_CUP_TEAMS = [
  // Group A
  { id: 'mex', code: 'MEX', name: 'Mexico', group: 'A' },
  { id: 'rsa', code: 'RSA', name: 'South Africa', group: 'A' },
  { id: 'kor', code: 'KOR', name: 'South Korea', group: 'A' },
  { id: 'cze', code: 'CZE', name: 'Czech Republic', group: 'A' },

  // Group B
  { id: 'can', code: 'CAN', name: 'Canada', group: 'B' },
  { id: 'bih', code: 'BIH', name: 'Bosnia and Herzegovina', group: 'B' },
  { id: 'qat', code: 'QAT', name: 'Qatar', group: 'B' },
  { id: 'sui', code: 'SUI', name: 'Switzerland', group: 'B' },

  // Group C
  { id: 'bra', code: 'BRA', name: 'Brazil', group: 'C' },
  { id: 'mar', code: 'MAR', name: 'Morocco', group: 'C' },
  { id: 'hai', code: 'HAI', name: 'Haiti', group: 'C' },
  { id: 'sco', code: 'SCO', name: 'Scotland', group: 'C' },

  // Group D
  { id: 'usa', code: 'USA', name: 'United States', group: 'D' },
  { id: 'par', code: 'PAR', name: 'Paraguay', group: 'D' },
  { id: 'aus', code: 'AUS', name: 'Australia', group: 'D' },
  { id: 'tur', code: 'TUR', name: 'Turkey', group: 'D' },

  // Group E
  { id: 'ger', code: 'GER', name: 'Germany', group: 'E' },
  { id: 'cuw', code: 'CUW', name: 'Curaçao', group: 'E' },
  { id: 'civ', code: 'CIV', name: 'Ivory Coast', group: 'E' },
  { id: 'ecu', code: 'ECU', name: 'Ecuador', group: 'E' },

  // Group F
  { id: 'ned', code: 'NED', name: 'Netherlands', group: 'F' },
  { id: 'jpn', code: 'JPN', name: 'Japan', group: 'F' },
  { id: 'swe', code: 'SWE', name: 'Sweden', group: 'F' },
  { id: 'tun', code: 'TUN', name: 'Tunisia', group: 'F' },

  // Group G
  { id: 'bel', code: 'BEL', name: 'Belgium', group: 'G' },
  { id: 'egy', code: 'EGY', name: 'Egypt', group: 'G' },
  { id: 'irn', code: 'IRN', name: 'Iran', group: 'G' },
  { id: 'nzl', code: 'NZL', name: 'New Zealand', group: 'G' },

  // Group H
  { id: 'esp', code: 'ESP', name: 'Spain', group: 'H' },
  { id: 'cpv', code: 'CPV', name: 'Cape Verde', group: 'H' },
  { id: 'ksa', code: 'KSA', name: 'Saudi Arabia', group: 'H' },
  { id: 'uru', code: 'URU', name: 'Uruguay', group: 'H' },

  // Group I
  { id: 'fra', code: 'FRA', name: 'France', group: 'I' },
  { id: 'sen', code: 'SEN', name: 'Senegal', group: 'I' },
  { id: 'irq', code: 'IRQ', name: 'Iraq', group: 'I' },
  { id: 'nor', code: 'NOR', name: 'Norway', group: 'I' },

  // Group J
  { id: 'arg', code: 'ARG', name: 'Argentina', group: 'J' },
  { id: 'alg', code: 'ALG', name: 'Algeria', group: 'J' },
  { id: 'aut', code: 'AUT', name: 'Austria', group: 'J' },
  { id: 'jor', code: 'JOR', name: 'Jordan', group: 'J' },

  // Group K
  { id: 'por', code: 'POR', name: 'Portugal', group: 'K' },
  { id: 'cod', code: 'COD', name: 'DR Congo', group: 'K' },
  { id: 'uzb', code: 'UZB', name: 'Uzbekistan', group: 'K' },
  { id: 'col', code: 'COL', name: 'Colombia', group: 'K' },

  // Group L
  { id: 'eng', code: 'ENG', name: 'England', group: 'L' },
  { id: 'cro', code: 'CRO', name: 'Croatia', group: 'L' },
  { id: 'gha', code: 'GHA', name: 'Ghana', group: 'L' },
  { id: 'pan', code: 'PAN', name: 'Panama', group: 'L' }
];

function asStr(v) {
  return v == null ? '' : String(v).trim();
}

function normalizeKey(v) {
  return asStr(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slug(v) {
  return normalizeKey(v).replace(/\s+/g, '-');
}

const MANUAL_BY_ID = new Map(MANUAL_WORLD_CUP_TEAMS.map((t) => [t.id, t]));
const MANUAL_ID_BY_CODE = new Map(MANUAL_WORLD_CUP_TEAMS.map((t) => [normalizeKey(t.code), t.id]));
const MANUAL_ID_BY_NAME = new Map(MANUAL_WORLD_CUP_TEAMS.map((t) => [normalizeKey(t.name), t.id]));

// Provider naming is not always the same as our display naming.
const STABLE_ID_BY_NAME = {
  usa: 'usa',
  'united states': 'usa',
  'united states of america': 'usa',
  'south korea': 'kor',
  'korea republic': 'kor',
  'republic of korea': 'kor',
  'czech republic': 'cze',
  czechia: 'cze',
  curacao: 'cuw',
  curaçao: 'cuw',
  'ivory coast': 'civ',
  'cote d ivoire': 'civ',
  'côte d ivoire': 'civ',
  'saudi arabia': 'ksa',
  'new zealand': 'nzl',
  'cape verde': 'cpv',
  'dr congo': 'cod',
  'congo dr': 'cod',
  'democratic republic of the congo': 'cod',
  'bosnia and herzegovina': 'bih',
  'bosnia herzegovina': 'bih'
};

function stableTeamId({ name, code }) {
  const nameKey = normalizeKey(name);
  if (MANUAL_ID_BY_NAME.has(nameKey)) return MANUAL_ID_BY_NAME.get(nameKey);
  if (STABLE_ID_BY_NAME[nameKey]) return STABLE_ID_BY_NAME[nameKey];

  const codeKey = normalizeKey(code);
  if (MANUAL_ID_BY_CODE.has(codeKey)) return MANUAL_ID_BY_CODE.get(codeKey);
  if (codeKey) return codeKey;

  return slug(name);
}

function groupFromStandingGroup(v) {
  const s = asStr(v);
  const m = s.match(/group\s+([A-L])/i) || s.match(/^([A-L])$/i);
  return m ? m[1].toUpperCase() : null;
}

function normalizeApiTeam(team, extra = {}) {
  const name = asStr(team?.name || extra.name);
  if (!name) return null;

  const code = asStr(team?.code || extra.code).toUpperCase() || null;
  const id = stableTeamId({ name, code });
  const manual = MANUAL_BY_ID.get(id);

  return {
    id,
    name: manual?.name || name,
    code: manual?.code || code,
    country: asStr(team?.country) || manual?.name || name,
    logo: asStr(team?.logo) || null,
    group: extra.group || manual?.group || null,
    providerTeamId: team?.id != null ? String(team.id) : null
  };
}

function sortTeamsForPicker(list) {
  return [...(list || [])].sort((a, b) => {
    const ga = asStr(a?.group).toUpperCase() || 'Z';
    const gb = asStr(b?.group).toUpperCase() || 'Z';
    if (ga !== gb) return ga.localeCompare(gb);
    return asStr(a?.name).localeCompare(asStr(b?.name), undefined, { sensitivity: 'base' });
  });
}

function mergeTeams(...lists) {
  const byId = new Map();

  for (const list of lists) {
    for (const item of list || []) {
      if (!item?.id) continue;
      const prev = byId.get(item.id) || {};
      byId.set(item.id, {
        ...prev,
        ...item,
        // Do not let nullish provider fields erase useful manual/standings fields.
        code: item.code || prev.code || null,
        logo: item.logo || prev.logo || null,
        group: item.group || prev.group || null,
        providerTeamId: item.providerTeamId || prev.providerTeamId || null
      });
    }
  }

  return sortTeamsForPicker(Array.from(byId.values()));
}

async function apiFootballGet({ fetchImpl, apiKey, path, params }) {
  const url = new URL(`https://v3.football.api-sports.io/${path}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetchImpl(url, {
    headers: {
      accept: 'application/json',
      'x-apisports-key': apiKey
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API-Football ${path} failed (${res.status}): ${text.slice(0, 180)}`);
  }

  return res.json();
}

function extractTeamsFromTeamsEndpoint(rows) {
  return (rows || [])
    .map((row) => normalizeApiTeam(row?.team || row))
    .filter(Boolean);
}

function extractTeamsFromStandings(rows) {
  const out = [];

  for (const leagueRow of rows || []) {
    const groups = leagueRow?.league?.standings || [];

    for (const groupRows of groups) {
      for (const row of groupRows || []) {
        const group = groupFromStandingGroup(row?.group);
        const item = normalizeApiTeam(row?.team, { group });
        if (item) out.push(item);
      }
    }
  }

  return out;
}

function extractTeamsFromFixtures(rows) {
  const out = [];

  for (const fixture of rows || []) {
    const home = normalizeApiTeam(fixture?.teams?.home);
    const away = normalizeApiTeam(fixture?.teams?.away);
    if (home) out.push(home);
    if (away) out.push(away);
  }

  return out;
}

async function fetchApiFootballTeams({ fetchImpl, apiKey }) {
  const trace = [];

  const teamsJson = await apiFootballGet({
    fetchImpl,
    apiKey,
    path: 'teams',
    params: { league: LEAGUE_ID, season: SEASON }
  });
  const fromTeams = extractTeamsFromTeamsEndpoint(teamsJson?.response || []);
  trace.push(`teams=${fromTeams.length}`);

  // The teams endpoint can be empty for future/special tournaments. Standings and fixtures are often better
  // once the tournament field/draw/schedule exists.
  let fromStandings = [];
  try {
    const standingsJson = await apiFootballGet({
      fetchImpl,
      apiKey,
      path: 'standings',
      params: { league: LEAGUE_ID, season: SEASON }
    });
    fromStandings = extractTeamsFromStandings(standingsJson?.response || []);
    trace.push(`standings=${fromStandings.length}`);
  } catch (e) {
    trace.push(`standings_error=${e?.message || 'failed'}`);
  }

  let fromFixtures = [];
  try {
    const fixturesJson = await apiFootballGet({
      fetchImpl,
      apiKey,
      path: 'fixtures',
      params: { league: LEAGUE_ID, season: SEASON }
    });
    fromFixtures = extractTeamsFromFixtures(fixturesJson?.response || []);
    trace.push(`fixtures_unique=${mergeTeams(fromFixtures).length}`);
  } catch (e) {
    trace.push(`fixtures_error=${e?.message || 'failed'}`);
  }

  const options = mergeTeams(fromStandings, fromTeams, fromFixtures);
  trace.push(`merged=${options.length}`);

  return { options, trace: trace.join(', ') };
}

function manualReturn(note = '') {
  return {
    provider: 'manual',
    cacheKey: MANUAL_CACHE_KEY,
    options: sortTeamsForPicker(MANUAL_WORLD_CUP_TEAMS),
    mode: 'manual',
    note: note || `Manual ${SEASON} World Cup team list fallback.`
  };
}

export async function getWorldCupTeamOptions({ db, event, fetchImpl = fetch, env: envBindings = {} }) {
  // In Cloudflare/SvelteKit, local `.dev.vars` and Pages secrets are most reliably
  // exposed on `platform.env`. `$env/dynamic/private` is kept as a fallback.
  const apiKey =
    asStr(envBindings.API_FOOTBALL_KEY) ||
    asStr(envBindings.APISPORTS_KEY) ||
    asStr(envBindings.API_SPORTS_KEY) ||
    asStr(env.API_FOOTBALL_KEY) ||
    asStr(env.APISPORTS_KEY) ||
    asStr(env.API_SPORTS_KEY);

  if (!apiKey) {
    return manualReturn('No API_FOOTBALL_KEY configured. Using the manual 48-team World Cup list.');
  }

  const cached = await getOptionsCache({
    db,
    eventId: event.id,
    provider: PROVIDER,
    cacheKey: CACHE_KEY,
    maxAgeSeconds: MAX_AGE_SECONDS
  });

  if (Array.isArray(cached) && cached.length >= 48) {
    return {
      provider: PROVIDER,
      cacheKey: CACHE_KEY,
      options: cached,
      mode: 'cache',
      note: `Loaded ${cached.length} World Cup teams from cache.`
    };
  }

  try {
    const { options, trace } = await fetchApiFootballTeams({ fetchImpl, apiKey });

    // Guardrail: do not cache or serve an obviously partial tournament field.
    if (options.length < 48) {
      return manualReturn(`API-Football did not return the full field (${trace}); using manual fallback instead.`);
    }

    const fetchedAt = Math.floor(Date.now() / 1000);
    await setOptionsCache({
      db,
      eventId: event.id,
      provider: PROVIDER,
      cacheKey: CACHE_KEY,
      payload: options,
      fetchedAt
    });

    return {
      provider: PROVIDER,
      cacheKey: CACHE_KEY,
      options,
      mode: 'live:api-football',
      note: `Loaded ${options.length} World Cup teams from API-Football.`
    };
  } catch (e) {
    return manualReturn(`${e?.message || 'API-Football request failed'} Using manual fallback instead.`);
  }
}
