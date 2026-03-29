import { getSleeperPlayers } from '$lib/server/league/sleeperClient.js';

const TEAM_NAMES = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
  LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders'
};

function isDefenseId(playerId) {
  return /^[A-Z]{2,4}$/.test(String(playerId || ''));
}

function playerPhotoUrl(playerId) {
  return `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;
}

function teamLogoUrl(teamAbbr) {
  return `https://sleepercdn.com/images/team_logos/nfl/${String(teamAbbr || '').toLowerCase()}.png`;
}

function normalizeFantasyPositions(rawPlayer = {}) {
  const set = new Set();
  if (Array.isArray(rawPlayer?.fantasy_positions)) {
    for (const pos of rawPlayer.fantasy_positions) {
      if (pos) set.add(String(pos).toUpperCase());
    }
  }
  if (rawPlayer?.position) set.add(String(rawPlayer.position).toUpperCase());
  return [...set];
}

function normalizeDefense(playerId) {
  const team = String(playerId || '').toUpperCase();
  return {
    id: team,
    name: `${TEAM_NAMES[team] || team} D/ST`,
    shortName: `${team} D/ST`,
    position: 'DEF',
    fantasyPositions: ['DEF'],
    team,
    teamLabel: TEAM_NAMES[team] || team,
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
      fantasyPositions: [],
      team: null,
      teamLabel: null,
      photoUrl: playerPhotoUrl(playerId),
      isDefense: false
    };
  }

  const name = [rawPlayer.first_name, rawPlayer.last_name].filter(Boolean).join(' ') || rawPlayer.full_name || `Player ${playerId}`;
  const team = rawPlayer.team || rawPlayer.metadata?.team || null;
  const fantasyPositions = normalizeFantasyPositions(rawPlayer);

  return {
    id: String(playerId),
    name,
    shortName: rawPlayer.last_name || name,
    position: rawPlayer.position || fantasyPositions[0] || null,
    fantasyPositions,
    team,
    teamLabel: team ? TEAM_NAMES[team] || team : null,
    photoUrl: playerPhotoUrl(playerId),
    isDefense: false
  };
}

export async function resolvePlayersByIds(playerIds = []) {
  const ids = [...new Set((playerIds || []).map((id) => String(id)).filter(Boolean))];
  if (!ids.length) return new Map();

  const players = await getSleeperPlayers();
  const playerMap = new Map();

  for (const id of ids) {
    playerMap.set(id, normalizePlayer(id, players?.[id] || null));
  }

  return playerMap;
}
