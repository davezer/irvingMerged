import { leagueID as FALLBACK_LEAGUE_ID } from '$lib/legacy/leagueInfo';
import { getOrSetRuntimeCache } from '$lib/server/league/cache.js';

const SLEEPER_BASE = 'https://api.sleeper.app/v1';
const PLAYERS_TTL_MS = 24 * 60 * 60 * 1000;
const FAST_TTL_MS = 5 * 60 * 1000;
const TEAM_NAMES = {
  ARI: 'Arizona Cardinals',
  ATL: 'Atlanta Falcons',
  BAL: 'Baltimore Ravens',
  BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers',
  CHI: 'Chicago Bears',
  CIN: 'Cincinnati Bengals',
  CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys',
  DEN: 'Denver Broncos',
  DET: 'Detroit Lions',
  GB: 'Green Bay Packers',
  HOU: 'Houston Texans',
  IND: 'Indianapolis Colts',
  JAX: 'Jacksonville Jaguars',
  KC: 'Kansas City Chiefs',
  LV: 'Las Vegas Raiders',
  LAC: 'Los Angeles Chargers',
  LAR: 'Los Angeles Rams',
  MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings',
  NE: 'New England Patriots',
  NO: 'New Orleans Saints',
  NYG: 'New York Giants',
  NYJ: 'New York Jets',
  PHI: 'Philadelphia Eagles',
  PIT: 'Pittsburgh Steelers',
  SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers',
  TB: 'Tampa Bay Buccaneers',
  TEN: 'Tennessee Titans',
  WAS: 'Washington Commanders'
};

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sleeper request failed (${res.status}) for ${url}: ${text}`);
  }

  return res.json();
}

function getLeagueIdForSeason({ env, season, urlLeagueId }) {
  return String(
    urlLeagueId ||
      env?.[`SLEEPER_LEAGUE_ID_${season}`] ||
      env?.SLEEPER_LEAGUE_ID ||
      FALLBACK_LEAGUE_ID ||
      ''
  ).trim();
}

export function getSleeperLeagueIdForSeason({ env, season, urlLeagueId }) {
  const leagueId = getLeagueIdForSeason({ env, season, urlLeagueId });
  if (!leagueId) throw new Error('Missing Sleeper league id.');
  return leagueId;
}

export async function getSleeperLeague(leagueId) {
  return getOrSetRuntimeCache(`sleeper:league:${leagueId}`, FAST_TTL_MS, () =>
    fetchJson(`${SLEEPER_BASE}/league/${leagueId}`)
  );
}

export async function getSleeperUsers(leagueId) {
  return getOrSetRuntimeCache(`sleeper:users:${leagueId}`, FAST_TTL_MS, () =>
    fetchJson(`${SLEEPER_BASE}/league/${leagueId}/users`)
  );
}

export async function getSleeperRosters(leagueId) {
  return getOrSetRuntimeCache(`sleeper:rosters:${leagueId}`, FAST_TTL_MS, () =>
    fetchJson(`${SLEEPER_BASE}/league/${leagueId}/rosters`)
  );
}

export async function getSleeperTransactionsForWeek(leagueId, week) {
  return getOrSetRuntimeCache(`sleeper:transactions:${leagueId}:week:${week}`, FAST_TTL_MS, async () => {
    try {
      return await fetchJson(`${SLEEPER_BASE}/league/${leagueId}/transactions/${week}`);
    } catch (error) {
      if (String(error?.message || '').includes('(404)')) return [];
      throw error;
    }
  });
}

export async function getSleeperPlayers() {
  return getOrSetRuntimeCache('sleeper:players:nfl', PLAYERS_TTL_MS, () =>
    fetchJson(`${SLEEPER_BASE}/players/nfl`)
  );
}

function isDefenseId(playerId) {
  return /^[A-Z]{2,4}$/.test(String(playerId || ''));
}

function defaultPlayerPhoto(playerId) {
  return `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;
}

function teamLogoUrl(teamAbbr) {
  return `https://sleepercdn.com/images/team_logos/nfl/${String(teamAbbr || '').toLowerCase()}.png`;
}

function normalizeDefense(playerId) {
  const team = String(playerId || '').toUpperCase();
  return {
    id: team,
    name: `${TEAM_NAMES[team] || team} D/ST`,
    shortName: `${team} D/ST`,
    position: 'DEF',
    team,
    photoUrl: teamLogoUrl(team),
    isDefense: true
  };
}

function normalizePlayer(playerId, rawPlayer) {
  if (isDefenseId(playerId)) return normalizeDefense(playerId);

  if (!rawPlayer) {
    return {
      id: String(playerId),
      name: `Player ${playerId}`,
      shortName: `#${playerId}`,
      position: null,
      team: null,
      photoUrl: defaultPlayerPhoto(playerId),
      isDefense: false
    };
  }

  const name = [rawPlayer.first_name, rawPlayer.last_name].filter(Boolean).join(' ') || rawPlayer.full_name || `Player ${playerId}`;

  return {
    id: String(playerId),
    name,
    shortName: rawPlayer.last_name || name,
    position: rawPlayer.position || rawPlayer.fantasy_positions?.[0] || null,
    team: rawPlayer.team || null,
    photoUrl: defaultPlayerPhoto(playerId),
    isDefense: false
  };
}

export async function resolvePlayersByIds(playerIds = []) {
  const uniqueIds = [...new Set((playerIds || []).map((id) => String(id)).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const players = await getSleeperPlayers();
  const out = new Map();

  for (const playerId of uniqueIds) {
    out.set(playerId, normalizePlayer(playerId, players?.[playerId] || null));
  }

  return out;
}

export async function getSleeperLeagueBundle({ env, season, weeks = [], urlLeagueId = null }) {
  const leagueId = getSleeperLeagueIdForSeason({ env, season, urlLeagueId });
  const league = await getSleeperLeague(leagueId);
  const [users, rosters, transactionsByWeek] = await Promise.all([
    getSleeperUsers(leagueId),
    getSleeperRosters(leagueId),
    Promise.all((weeks || []).map((week) => getSleeperTransactionsForWeek(leagueId, week)))
  ]);

  return {
    leagueId,
    league,
    users,
    rosters,
    transactions: transactionsByWeek.flat()
  };
}
