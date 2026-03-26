function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function unixNow() {
  return Math.floor(Date.now() / 1000);
}

export function normalizeLeagueBundle(bundle) {
  const users = Array.isArray(bundle?.users) ? bundle.users : [];
  const rosters = Array.isArray(bundle?.rosters) ? bundle.rosters : [];
  const draftPicks = Array.isArray(bundle?.draftPicks) ? bundle.draftPicks : [];
  const transactionsByWeek = Array.isArray(bundle?.transactionsByWeek) ? bundle.transactionsByWeek : [];
  const matchupWeeks = Array.isArray(bundle?.matchupWeeks) ? bundle.matchupWeeks : [];
  const season = String(bundle?.season || new Date().getFullYear());
  const now = unixNow();

  const userById = new Map(users.map((u) => [String(u.user_id), u]));
  const managers = [];
  const standings = [];
  const rosterRows = [];

  for (const roster of rosters) {
    const ownerId = String(roster.owner_id || '');
    const user = userById.get(ownerId) || {};
    const metadata = user.metadata || {};
    const settings = roster.settings || {};
    const teamName = metadata.team_name || user.display_name || user.username || `Manager ${ownerId.slice(0, 6)}`;

    managers.push({
      id: ownerId,
      slug: slugify(teamName),
      name: user.display_name || user.username || teamName,
      team_name: teamName,
      photo: user.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : null,
      bio: null,
      favorite_team: metadata.favorite_team || null,
      persona: null,
      philosophy: null,
      created_at: now,
      sleeper_user_id: ownerId,
      sleeper_roster_id: toNumber(roster.roster_id, 0),
      sleeper_avatar: user.avatar || null,
      sleeper_username: user.username || null,
      metadata_json: JSON.stringify({ user, roster })
    });

    standings.push({
      season,
      manager_id: ownerId,
      wins: toNumber(settings.wins, 0),
      losses: toNumber(settings.losses, 0),
      ties: toNumber(settings.ties, 0),
      points_for: toNumber(settings.fpts, 0) + toNumber(settings.fpts_decimal, 0) / 100,
      points_against: toNumber(settings.fpts_against, 0) + toNumber(settings.fpts_against_decimal, 0) / 100,
      streak_type: settings.streak > 0 ? 'W' : settings.streak < 0 ? 'L' : null,
      streak_value: Math.abs(toNumber(settings.streak, 0)),
      rank: toNumber(settings.rank, 0)
    });

    for (const playerId of roster.players || []) {
      rosterRows.push({
        season,
        manager_id: ownerId,
        sleeper_roster_id: toNumber(roster.roster_id, 0),
        player_id: String(playerId),
        slot: 'BENCH',
        lineup_order: null,
        created_at: now
      });
    }
  }

  const drafts = [];
  const draftPicksRows = [];
  if (bundle?.draft) {
    drafts.push({
      id: String(bundle.draft.draft_id),
      season,
      label: bundle.draft.type === 'auction' ? `${season} Auction` : `${season} Draft`,
      kind: bundle.draft.type || 'snake',
      status: bundle.draft.status || 'complete',
      draft_order_json: JSON.stringify(bundle.draft.draft_order || {}),
      settings_json: JSON.stringify(bundle.draft.settings || {}),
      created_at: now
    });

    for (const pick of draftPicks) {
      draftPicksRows.push({
        draft_id: String(bundle.draft.draft_id),
        season,
        pick_no: toNumber(pick.pick_no, 0),
        round: toNumber(pick.round, 0),
        manager_id: String(pick.picked_by || ''),
        player_id: String(pick.player_id || ''),
        amount: pick.metadata?.amount ? toNumber(pick.metadata.amount, 0) : null,
        is_keeper: pick.is_keeper ? 1 : 0,
        metadata_json: JSON.stringify(pick),
        created_at: now
      });
    }
  }

  const matchups = [];
  matchupWeeks.forEach((weekRows, index) => {
    const week = index + 1;
    for (const row of weekRows || []) {
      matchups.push({
        season,
        week,
        matchup_id: toNumber(row.matchup_id, 0),
        roster_id: toNumber(row.roster_id, 0),
        manager_id: String(row.owner_id || ''),
        starters_json: JSON.stringify(row.starters || []),
        players_json: JSON.stringify(row.players || []),
        points: toNumber(row.points, 0),
        custom_points: row.custom_points != null ? toNumber(row.custom_points, 0) : null,
        metadata_json: JSON.stringify(row),
        created_at: now
      });
    }
  });

  const transactions = [];
  transactionsByWeek.forEach((weekRows, index) => {
    const week = index + 1;
    for (const row of weekRows || []) {
      transactions.push({
        id: String(row.transaction_id || `${season}-${week}-${Math.random().toString(36).slice(2, 10)}`),
        season,
        week,
        kind: row.type || row.status || 'unknown',
        status: row.status || null,
        creator_id: String(row.creator || ''),
        roster_ids_json: JSON.stringify(row.roster_ids || []),
        adds_json: JSON.stringify(row.adds || {}),
        drops_json: JSON.stringify(row.drops || {}),
        draft_picks_json: JSON.stringify(row.draft_picks || []),
        waiver_budget_json: JSON.stringify(row.settings || {}),
        metadata_json: JSON.stringify(row),
        created_at: toNumber(row.created / 1000, now)
      });
    }
  });

  return {
    managers,
    standings,
    rosters: rosterRows,
    drafts,
    draftPicks: draftPicksRows,
    matchups,
    transactions
  };
}
