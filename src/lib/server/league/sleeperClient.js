import { withLeagueCache } from '$lib/server/league/cacheStore.js';

const SLEEPER_BASE = 'https://api.sleeper.app/v1';
const FAST_TTL_MS = 5 * 60 * 1000;
const HISTORY_TTL_MS = 60 * 60 * 1000;
const PLAYERS_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchJson(url, { allow404 = false } = {}) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    if (allow404 && res.status === 404) return null;
    const text = await res.text().catch(() => '');
    throw new Error(`Sleeper request failed (${res.status}) for ${url}: ${text}`);
  }
  return res.json();
}

export async function getSleeperNFLState() {
  return withLeagueCache('sleeper:nfl-state', FAST_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/state/nfl`));
}

export async function getSleeperLeague(leagueId) {
  return withLeagueCache(`sleeper:league:${leagueId}`, FAST_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/league/${leagueId}`));
}

export async function getSleeperUsers(leagueId) {
  return withLeagueCache(`sleeper:users:${leagueId}`, FAST_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/league/${leagueId}/users`));
}

export async function getSleeperRosters(leagueId) {
  return withLeagueCache(`sleeper:rosters:${leagueId}`, FAST_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/league/${leagueId}/rosters`));
}

export async function getSleeperTransactionsForWeek(leagueId, week) {
  return withLeagueCache(`sleeper:transactions:${leagueId}:week:${week}`, FAST_TTL_MS, async () => {
    const data = await fetchJson(`${SLEEPER_BASE}/league/${leagueId}/transactions/${week}`, { allow404: true });
    return Array.isArray(data) ? data : [];
  });
}

export async function getSleeperMatchupsForWeek(leagueId, week) {
  return withLeagueCache(`sleeper:matchups:${leagueId}:week:${week}`, FAST_TTL_MS, async () => {
    const data = await fetchJson(`${SLEEPER_BASE}/league/${leagueId}/matchups/${week}`, { allow404: true });
    return Array.isArray(data) ? data : [];
  });
}

export async function getSleeperLeagueDrafts(leagueId) {
  return withLeagueCache(`sleeper:league-drafts:${leagueId}`, FAST_TTL_MS, async () => {
    const data = await fetchJson(`${SLEEPER_BASE}/league/${leagueId}/drafts`, { allow404: true });
    return Array.isArray(data) ? data : [];
  });
}

export async function getSleeperDraft(draftId) {
  return withLeagueCache(`sleeper:draft:${draftId}`, FAST_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/draft/${draftId}`));
}

export async function getSleeperDraftPicks(draftId) {
  return withLeagueCache(`sleeper:draft-picks:${draftId}`, FAST_TTL_MS, async () => {
    const data = await fetchJson(`${SLEEPER_BASE}/draft/${draftId}/picks`, { allow404: true });
    return Array.isArray(data) ? data : [];
  });
}

export async function getSleeperDraftTradedPicks(draftId) {
  return withLeagueCache(`sleeper:draft-traded-picks:${draftId}`, FAST_TTL_MS, async () => {
    const data = await fetchJson(`${SLEEPER_BASE}/draft/${draftId}/traded_picks`, { allow404: true });
    return Array.isArray(data) ? data : [];
  });
}

export async function getSleeperPlayers() {
  return withLeagueCache('sleeper:players:nfl', PLAYERS_TTL_MS, () => fetchJson(`${SLEEPER_BASE}/players/nfl`));
}

export async function getLeagueHistory(rootLeagueId) {
  return withLeagueCache(`sleeper:league-history:${rootLeagueId}`, HISTORY_TTL_MS, async () => {
    const history = [];
    const seen = new Set();
    let cursor = String(rootLeagueId);

    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const league = await getSleeperLeague(cursor);
      history.push(league);
      cursor = league?.previous_league_id ? String(league.previous_league_id) : '';
    }

    return history;
  });
}
