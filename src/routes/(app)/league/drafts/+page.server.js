import { resolveLeagueContext } from '$lib/server/league/context.js';
import {
  getLeagueHistory,
  getSleeperDraft,
  getSleeperDraftPicks,
  getSleeperDraftTradedPicks,
  getSleeperLeagueDrafts,
  getSleeperRosters,
  getSleeperUsers
} from '$lib/server/league/sleeperClient.js';
import { buildRosterIdentityMap } from '$lib/server/league/identity.js';
import { resolvePlayersByIds } from '$lib/server/league/players.js';
import { buildDraftDNA, buildTeamSpendProfiles, buildValueBoard } from '$lib/server/league/draftAnalytics.js';

function choosePrimaryDraft(drafts = []) {
  if (!drafts.length) return null;
  return drafts.find((draft) => draft.status === 'complete') || drafts[0];
}

function moneyValue(pick) {
  const raw = pick?.metadata?.amount ?? pick?.metadata?.bid_amount ?? pick?.auction_amount ?? pick?.amount;
  return Number(raw || 0);
}

function resolveTeam(rosterIdentityMap, rosterId) {
  return rosterIdentityMap.get(Number(rosterId)) || { teamName: `Roster ${rosterId}`, teamPhoto: null, managerName: 'Unknown Manager', initials: '?' };
}

function toDraftPickView(pick, playersById, rosterIdentityMap) {
  const team = resolveTeam(rosterIdentityMap, pick.roster_id);
  const player = playersById.get(String(pick.player_id)) || {
    id: String(pick.player_id || 'unknown'),
    name: pick.metadata?.first_name && pick.metadata?.last_name ? `${pick.metadata.first_name} ${pick.metadata.last_name}` : pick.metadata?.name || 'Unknown player',
    shortName: pick.metadata?.last_name || pick.metadata?.name || 'Unknown',
    position: pick.metadata?.position || null,
    team: pick.metadata?.team || null,
    teamLabel: pick.metadata?.team || null,
    photoUrl: 'https://sleepercdn.com/images/v2/icons/player_default.webp'
  };
  return {
    id: String(pick.pick_no || `${pick.round}-${pick.draft_slot}-${pick.player_id}`),
    round: Number(pick.round || 0),
    pickNo: Number(pick.pick_no || 0),
    amount: moneyValue(pick),
    rosterId: Number(pick.roster_id || 0),
    teamName: team.teamName,
    teamPhoto: team.teamPhoto,
    managerName: team.managerName,
    managerSlug: team.managerSlug || null,
    player
  };
}

function buildTeamBoards(pickRows = []) {
  const map = new Map();
  for (const pick of pickRows) {
    if (!map.has(pick.teamName)) {
      map.set(pick.teamName, { teamName: pick.teamName, teamPhoto: pick.teamPhoto, managerName: pick.managerName, managerSlug: pick.managerSlug, picks: [], spend: 0, positionSpend: new Map() });
    }
    const row = map.get(pick.teamName);
    row.picks.push(pick);
    row.spend += pick.amount;
    const pos = pick.player.position || 'UNK';
    row.positionSpend.set(pos, (row.positionSpend.get(pos) || 0) + pick.amount);
  }
  return [...map.values()].map((row) => {
    const picks = [...row.picks].sort((a, b) => b.amount - a.amount || a.pickNo - b.pickNo);
    const topPosition = [...row.positionSpend.entries()].sort((a, b) => b[1] - a[1])[0] || null;
    return {
      teamName: row.teamName,
      teamPhoto: row.teamPhoto,
      managerName: row.managerName,
      managerSlug: row.managerSlug,
      picks: row.picks.length,
      spend: row.spend,
      averageSpend: row.picks.length ? Number((row.spend / row.picks.length).toFixed(2)) : 0,
      bestBuy: picks[0] || null,
      samplePicks: picks.slice(0, 4),
      allPicks: picks,
      topPosition: topPosition ? { position: topPosition[0], spend: topPosition[1] } : null
    };
  }).sort((a, b) => b.spend - a.spend || a.teamName.localeCompare(b.teamName));
}

function buildPositionEconomy(pickRows = []) {
  const map = new Map();
  for (const pick of pickRows) {
    const pos = pick.player.position || 'UNK';
    if (!map.has(pos)) map.set(pos, { position: pos, picks: 0, spend: 0 });
    const row = map.get(pos);
    row.picks += 1;
    row.spend += pick.amount;
  }
  return [...map.values()].map((row) => ({ ...row, averageSpend: row.picks ? Number((row.spend / row.picks).toFixed(2)) : 0 })).sort((a, b) => b.spend - a.spend || a.position.localeCompare(b.position));
}

function buildPriceBands(pickRows = []) {
  const bands = [
    { label: '$50+', min: 50, max: Infinity, picks: 0, spend: 0 },
    { label: '$30–$49', min: 30, max: 49.99, picks: 0, spend: 0 },
    { label: '$10–$29', min: 10, max: 29.99, picks: 0, spend: 0 },
    { label: 'Under $10', min: 0, max: 9.99, picks: 0, spend: 0 }
  ];
  for (const pick of pickRows) {
    const band = bands.find((entry) => pick.amount >= entry.min && pick.amount <= entry.max) || bands.at(-1);
    band.picks += 1;
    band.spend += pick.amount;
  }
  return bands;
}

function buildFranchiseHistory(archiveData = [], playersById) {
  const map = new Map();
  for (const season of archiveData) {
    for (const pick of season.picks) {
      const view = toDraftPickView(pick, playersById, season.rosterIdentityMap);
      if (!map.has(view.teamName)) {
        map.set(view.teamName, { teamName: view.teamName, teamPhoto: view.teamPhoto, managerName: view.managerName, managerSlug: view.managerSlug, seasons: [], totalSpend: 0, totalPicks: 0 });
      }
      const row = map.get(view.teamName);
      row.totalSpend += view.amount;
      row.totalPicks += 1;
      let seasonRow = row.seasons.find((entry) => entry.season === season.season);
      if (!seasonRow) {
        seasonRow = { season: season.season, spend: 0, picks: 0, topBuy: null };
        row.seasons.push(seasonRow);
      }
      seasonRow.spend += view.amount;
      seasonRow.picks += 1;
      if (!seasonRow.topBuy || view.amount > seasonRow.topBuy.amount) seasonRow.topBuy = view;
    }
  }
  return [...map.values()].map((row) => ({ ...row, seasons: row.seasons.sort((a, b) => b.season - a.season), averageSpend: row.totalPicks ? Number((row.totalSpend / row.totalPicks).toFixed(2)) : 0 })).sort((a, b) => b.totalSpend - a.totalSpend || a.teamName.localeCompare(b.teamName));
}

function buildSeasonSpendTimeline(archiveData = [], playersById) {
  return archiveData.map((season) => {
    const picks = season.picks.map((pick) => toDraftPickView(pick, playersById, season.rosterIdentityMap));
    const teamBoards = buildTeamBoards(picks);
    const totalSpend = picks.reduce((sum, pick) => sum + pick.amount, 0);
    return {
      season: season.season,
      totalSpend,
      topTeam: teamBoards[0] || null,
      topPick: [...picks].sort((a, b) => b.amount - a.amount || a.pickNo - b.pickNo)[0] || null
    };
  }).sort((a, b) => b.season - a.season);
}

function buildTradedPickRows(tradedPicks = [], rosterIdentityMap) {
  return (tradedPicks || []).map((pick, index) => {
    const currentOwner = resolveTeam(rosterIdentityMap, pick.owner_id);
    const previousOwner = resolveTeam(rosterIdentityMap, pick.previous_owner_id);
    const originalOwner = resolveTeam(rosterIdentityMap, pick.roster_id);
    const lineage = [originalOwner.teamName, previousOwner.teamName, currentOwner.teamName].filter((value, idx, arr) => idx === 0 || value !== arr[idx - 1]);
    return { id: `${pick.season}-${pick.round}-${pick.owner_id}-${index}`, season: Number(pick.season || 0), round: Number(pick.round || 0), lineageLabel: lineage.join(' → ') };
  });
}

export async function load({ url, platform }) {
  const context = await resolveLeagueContext({ url, env: platform?.env, allWeeksByDefault: false });
  const history = await getLeagueHistory(context.rootLeagueId);
  const archive = await Promise.all(history.map(async (league) => {
    const drafts = await getSleeperLeagueDrafts(league.league_id);
    const primary = choosePrimaryDraft(drafts);
    return primary ? { season: Number(league.season || 0), leagueId: String(league.league_id), draftId: String(primary.draft_id), type: primary.type || 'draft', status: primary.status || 'unknown', rounds: Number(primary.settings?.rounds || 0), teams: Number(primary.settings?.teams || league.total_rosters || 0) } : null;
  }));
  const archiveRows = archive.filter(Boolean).sort((a, b) => b.season - a.season);
  const seasonEntry = archiveRows.find((row) => row.season === context.season) || archiveRows[0] || null;
  if (!seasonEntry) return { season: context.season, archive: [], draft: null, hasData: false, source: 'Sleeper API + shared edge/runtime cache' };

  const archiveData = await Promise.all(archiveRows.map(async (entry) => {
    const [draft, picks, tradedPicks, users, rosters] = await Promise.all([
      getSleeperDraft(entry.draftId),
      getSleeperDraftPicks(entry.draftId),
      entry.season === seasonEntry.season ? getSleeperDraftTradedPicks(entry.draftId) : Promise.resolve([]),
      getSleeperUsers(entry.leagueId),
      getSleeperRosters(entry.leagueId)
    ]);
    return { ...entry, draft, picks, tradedPicks, rosterIdentityMap: buildRosterIdentityMap({ rosters, users }) };
  }));

  const selected = archiveData.find((entry) => entry.season === seasonEntry.season) || archiveData[0];
  const allPlayerIds = archiveData.flatMap((entry) => entry.picks.map((pick) => pick.player_id));
  const playersById = await resolvePlayersByIds(allPlayerIds);
  const pickRows = selected.picks.map((pick) => toDraftPickView(pick, playersById, selected.rosterIdentityMap));
  const teamBoards = buildTeamBoards(pickRows);
  const positionEconomy = buildPositionEconomy(pickRows);
  const priceBands = buildPriceBands(pickRows);
  const totalSpend = pickRows.reduce((sum, pick) => sum + pick.amount, 0);
  const topPicks = [...pickRows].sort((a, b) => b.amount - a.amount || a.pickNo - b.pickNo).slice(0, 24);
  const franchiseHistory = buildFranchiseHistory(archiveData, playersById);
  const spendTimeline = buildSeasonSpendTimeline(archiveData, playersById);
  const valueBoard = buildValueBoard(pickRows);
  const spendProfiles = buildTeamSpendProfiles(teamBoards);
  const draftDNA = buildDraftDNA(teamBoards);

  return {
    season: selected.season,
    archive: archiveRows,
    draft: {
      id: selected.draftId,
      type: selected.draft.type || selected.type,
      status: selected.draft.status || selected.status,
      rounds: Number(selected.draft.settings?.rounds || selected.rounds || 0),
      teams: Number(selected.draft.settings?.teams || selected.teams || 0),
      totalPicks: pickRows.length,
      totalSpend,
      averageBid: pickRows.length ? Number((totalSpend / pickRows.length).toFixed(2)) : 0,
      topPicks,
      teamBoards,
      positionEconomy,
      priceBands,
      franchiseHistory,
      spendTimeline,
      tradedPicks: buildTradedPickRows(selected.tradedPicks, selected.rosterIdentityMap),
      valueBoard,
      spendProfiles,
      draftDNA
    },
    hasData: pickRows.length > 0,
    source: 'Sleeper API + shared edge/runtime cache'
  };
}
