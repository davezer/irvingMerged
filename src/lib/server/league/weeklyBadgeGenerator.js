import {
  getManagers as getLeagueManagers
} from '$lib/server/league';

import {
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperPlayers,
  getSleeperLeague
} from '$lib/server/league/sleeperClient.js';

const AUTOMATIC_BADGES = [
  'bde',
  'suck',
  'ides',
  'hbk',
  'zerohour',
  'byebye',
  'captain'
];



function number(value, fallback = 0) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function scoreFor(matchup) {
  /*
   * Sleeper can contain a manual custom score.
   * If one exists, honor it.
   */
  if (
    matchup?.custom_points !== null &&
    matchup?.custom_points !== undefined
  ) {
    return number(
      matchup.custom_points
    );
  }

  return number(
    matchup?.points
  );
}


function round2(value) {
  return Number(
    Number(value).toFixed(2)
  );
}


function getManagers() {
  return getLeagueManagers().map((manager) => ({
    /*
     * managerID in leagueInfo is the Sleeper user/owner ID.
     */
    id: String(manager.managerID),

    name: manager.name,

    team_name: manager.teamName,

    photo: manager.photo || null,

    sleeper_user_id:
      String(manager.managerID),

    /*
     * We don't need to persist roster IDs.
     * Sleeper's roster endpoint gives us the
     * season-specific roster_id -> owner_id map.
     */
    sleeper_roster_id: null
  }));
}


async function getAutomaticDefinitions(
  db
) {
  const result = await db
    .prepare(`
      SELECT
        key,
        title,
        icon,
        description,
        automation_key
      FROM badge_definitions
      WHERE
        active = 1
        AND key IN (
          'bde',
          'suck',
          'ides',
          'hbk',
          'zerohour',
            'byebye',
            'captain'
        )
    `)
    .all();

  return new Map(
    (result.results ?? [])
      .map((row) => [
        row.key,
        row
      ])
  );
}


async function getExistingAwards(
  db,
  season,
  week
) {
  const result = await db
    .prepare(`
      SELECT
        badge_key,
        manager_id
      FROM manager_badges
      WHERE
        season = ?
        AND week = ?
        AND revoked_at IS NULL
        AND badge_key IN (
          'bde',
          'suck',
          'ides',
          'hbk',
          'zerohour',
            'byebye',
            'captain'
        )
    `)
    .bind(
      String(season),
      Number(week)
    )
    .all();

  return new Set(
    (result.results ?? [])
      .map(
        (row) =>
          `${row.badge_key}:${row.manager_id}`
      )
  );
}


function buildManagerLookup(
  managers,
  rosters
) {
  const bySleeperUser =
    new Map();

  const byRosterId =
    new Map();

  for (const manager of managers) {
    if (manager.sleeper_user_id) {
      bySleeperUser.set(
        String(
          manager.sleeper_user_id
        ),
        manager
      );
    }

    /*
     * Your manager IDs are also historically
     * Sleeper owner IDs, so this is another
     * safe lookup path.
     */
    if (manager.id) {
      bySleeperUser.set(
        String(manager.id),
        manager
      );
    }

    if (
      manager.sleeper_roster_id !==
        null &&
      manager.sleeper_roster_id !==
        undefined
    ) {
      byRosterId.set(
        String(
          manager.sleeper_roster_id
        ),
        manager
      );
    }
  }


  const rosterManagers =
    new Map();

  for (const roster of rosters) {
    const rosterId =
      String(
        roster.roster_id
      );

    const ownerId =
      String(
        roster.owner_id || ''
      );

    const manager =
      bySleeperUser.get(
        ownerId
      ) ||
      byRosterId.get(
        rosterId
      ) ||
      null;

    if (manager) {
      rosterManagers.set(
        rosterId,
        manager
      );
    }
  }

  return rosterManagers;
}

function playerNameFromId(playersById, playerId) {
  const player = playersById?.[String(playerId)];

  if (!player) {
    return `Player ${playerId}`;
  }

  const fullName =
    player.full_name ||
    [player.first_name, player.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

  return fullName || `Player ${playerId}`;
}

function normalizePosition(value) {
  const position =
    String(value || '')
      .trim()
      .toUpperCase();

  if (
    position === 'DST' ||
    position === 'D/ST'
  ) {
    return 'DEF';
  }

  return position;
}


function playerPositionsFromId(
  playersById,
  playerId
) {
  const id =
    String(playerId);

  const player =
    playersById?.[id];

  /*
   * Sleeper team-defense player IDs are commonly
   * NFL abbreviations such as PHI, NYG, etc.
   */
  if (
    !player &&
    NFL_TEAM_NAMES[id]
  ) {
    return new Set([
      'DEF'
    ]);
  }

  if (!player) {
    return new Set();
  }

  const fantasyPositions =
    Array.isArray(
      player.fantasy_positions
    )
      ? player.fantasy_positions
      : [];

  const positions =
    fantasyPositions.length
      ? fantasyPositions
      : [player.position];

  return new Set(
    positions
      .map(normalizePosition)
      .filter(Boolean)
  );
}


function playerCanFillSlot(
  playersById,
  playerId,
  slot
) {
  const normalizedSlot =
    normalizePosition(slot);

  const positions =
    playerPositionsFromId(
      playersById,
      playerId
    );

  if (!positions.size) {
    return false;
  }


  /*
   * Normal single-position slots.
   */
  if (
    [
      'QB',
      'RB',
      'WR',
      'TE',
      'K',
      'DEF'
    ].includes(
      normalizedSlot
    )
  ) {
    return positions.has(
      normalizedSlot
    );
  }


  /*
   * Standard RB / WR / TE flex.
   */
  if (
    normalizedSlot === 'FLEX' ||
    normalizedSlot === 'WRRBTE_FLEX'
  ) {
    return (
      positions.has('RB') ||
      positions.has('WR') ||
      positions.has('TE')
    );
  }


  /*
   * RB / WR only flex.
   */
  if (
    normalizedSlot === 'WRRB_FLEX'
  ) {
    return (
      positions.has('RB') ||
      positions.has('WR')
    );
  }


  /*
   * WR / TE receiving flex.
   */
  if (
    normalizedSlot === 'REC_FLEX'
  ) {
    return (
      positions.has('WR') ||
      positions.has('TE')
    );
  }


  /*
   * Superflex support, even though Irving
   * currently doesn't use one.
   */
  if (
    normalizedSlot === 'SUPER_FLEX'
  ) {
    return (
      positions.has('QB') ||
      positions.has('RB') ||
      positions.has('WR') ||
      positions.has('TE')
    );
  }


  return false;
}


function scoreForPlayer(
  team,
  playerId
) {
  const id =
    String(playerId);

  if (
    !Object.prototype.hasOwnProperty.call(
      team.playersPoints,
      id
    )
  ) {
    return null;
  }

  const score =
    Number(
      team.playersPoints[id]
    );

  return Number.isFinite(score)
    ? score
    : null;
}

const NFL_TEAM_NAMES = {
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


function playerTeamFromId(
  playersById,
  playerId
) {
  return String(
    playersById?.[
      String(playerId)
    ]?.team || ''
  ).toUpperCase();
}


function humanList(items) {
  const clean =
    items.filter(Boolean);

  if (!clean.length) {
    return '';
  }

  if (clean.length === 1) {
    return clean[0];
  }

  if (clean.length === 2) {
    return `${clean[0]} and ${clean[1]}`;
  }

  return `${clean
    .slice(0, -1)
    .join(', ')}, and ${clean.at(-1)}`;
}


async function getByeSchedule(
  db,
  season,
  week
) {
  const result =
    await db
      .prepare(`
        SELECT
          week,
          team
        FROM nfl_bye_weeks
        WHERE season = ?
        ORDER BY week, team
      `)
      .bind(
        Number(season)
      )
      .all();

  const rows =
    result.results ?? [];

  return {
    seasonLoaded:
      rows.length > 0,

    teams:
      new Set(
        rows
          .filter(
            (row) =>
              Number(row.week) ===
              Number(week)
          )
          .map(
            (row) =>
              String(
                row.team
              ).toUpperCase()
          )
      )
  };
}

function makeCandidate({
  badgeKey,
  definitions,

  manager,
  score,

  season,
  week,

  matchupId = null,

  opponent = null,
  opponentScore = null,

  margin = null,

  reason,
  metadataExtra = {}
}) {
  const definition =
    definitions.get(
      badgeKey
    );

  if (!definition) {
    throw new Error(
      `Missing badge definition for "${badgeKey}".`
    );
  }

  return {
    id:
      `${badgeKey}:${manager.id}`,

    badgeKey,

    badgeTitle:
      definition.title,

    badgeIcon:
      definition.icon,

    badgeDescription:
      definition.description,

    managerId:
      String(manager.id),

    managerName:
      manager.name,

    teamName:
      manager.team_name,

    teamLogo:
      manager.photo,

    season:
      String(season),

    week:
      Number(week),

    score:
      round2(score),

    opponentManagerId:
      opponent?.id
        ? String(opponent.id)
        : null,

    opponentName:
      opponent?.name ??
      null,

    opponentTeamName:
      opponent?.team_name ??
      null,

    opponentTeamLogo:
      opponent?.photo ??
      null,

    opponentScore:
      opponentScore == null
        ? null
        : round2(
            opponentScore
          ),

    margin:
      margin == null
        ? null
        : round2(
            margin
          ),

    matchupId:
      matchupId == null
        ? null
        : Number(matchupId),

    reason,

    metadata: {
      managerName:
        manager.name,

      teamName:
        manager.team_name,

      teamLogo:
        manager.photo,

      ...(opponent
        ? {
            opponentName:
              opponent.name,

            opponentTeamName:
              opponent.team_name,

            opponentTeamLogo:
              opponent.photo
          }
        : {}),

      ...(matchupId != null
        ? {
            matchupId:
              Number(
                matchupId
              )
          }
        : {}),

      ...(margin != null
        ? {
            margin:
              round2(
                margin
              )
          }
        : {}),

        ...metadataExtra
    }
  };
}


export async function buildWeeklyBadgePreview({
  db,
  leagueId,
  season,
  week
}) {
  if (!db) {
    throw new Error(
      'D1 database binding is required.'
    );
  }

  if (!leagueId) {
    throw new Error(
      'Sleeper league ID is required.'
    );
  }

  const weekNumber =
    Number(week);

  if (
    !Number.isInteger(
      weekNumber
    ) ||
    weekNumber < 1 ||
    weekNumber > 18
  ) {
    throw new Error(
      'Choose a valid NFL week.'
    );
  }


  /*
   * Fetch everything in parallel.
   */
  const [
  matchups,
  rosters,
  managers,
  definitions,
  existingAwards,
  playersById,
  byeSchedule,
  league
] = await Promise.all([
  getSleeperMatchupsForWeek(
    leagueId,
    weekNumber
  ),

  getSleeperRosters(
    leagueId
  ),

  Promise.resolve(
    getManagers()
  ),

  getAutomaticDefinitions(
    db
  ),

  getExistingAwards(
    db,
    season,
    weekNumber
  ),

  getSleeperPlayers(),
  getByeSchedule(
  db,
  season,
  weekNumber
),

getSleeperLeague(
  leagueId
)
]);

const starterSlots =
  Array.isArray(
    league?.roster_positions
  )
    ? league.roster_positions.filter(
        (slot) => {
          const normalized =
            normalizePosition(
              slot
            );

          return ![
            'BN',
            'IR',
            'RESERVE',
            'TAXI'
          ].includes(
            normalized
          );
        }
      )
    : [];


  if (!matchups.length) {
    throw new Error(
      `Sleeper returned no matchup data for ${season} Week ${weekNumber}.`
    );
  }


  for (
    const badgeKey of
    AUTOMATIC_BADGES
  ) {
    if (
      !definitions.has(
        badgeKey
      )
    ) {
      throw new Error(
        `Badge definition "${badgeKey}" is missing or inactive.`
      );
    }
  }


  const rosterManagers =
    buildManagerLookup(
      managers,
      rosters
    );


  const teams = [];

  const warnings = [];

    if (!byeSchedule.seasonLoaded) {
  warnings.push(
    `No NFL bye-week data is loaded for ${season}; Bye Bye Bye detection was skipped.`
  );
}
  for (const matchup of matchups) {
    const rosterId =
      String(
        matchup.roster_id
      );

    const manager =
      rosterManagers.get(
        rosterId
      );

    if (!manager) {
      warnings.push(
        `Could not match Sleeper roster ${rosterId} to an Irving manager.`
      );

      continue;
    }

    teams.push({
  matchupId:
    Number(matchup.matchup_id),

  rosterId,

  manager,

  points:
    scoreFor(matchup),

  customPoints:
    matchup.custom_points ?? null,

  starters:
    Array.isArray(
      matchup.starters
    )
      ? matchup.starters.map(
          String
        )
      : [],

  players:
    Array.isArray(
      matchup.players
    )
      ? matchup.players.map(
          String
        )
      : [],

  playersPoints:
    matchup.players_points &&
    typeof matchup.players_points === 'object'
      ? matchup.players_points
      : {}
});
  }


  if (!teams.length) {
    throw new Error(
      'No Sleeper matchup teams could be mapped to Irving managers.'
    );
  }


  /*
   * Stops us from awarding all fourteen teams
   * BDE/Sucko before a week has actually begun.
   */
  const anyScoring =
    teams.some(
      (team) =>
        team.points > 0
    );

  if (!anyScoring) {
    throw new Error(
      `Week ${weekNumber} has no scoring yet. Nothing to generate.`
    );
  }


  /*
   * Group teams into actual H2H matchups.
   */
  const groups =
    new Map();

  for (const team of teams) {
    if (
      !groups.has(
        team.matchupId
      )
    ) {
      groups.set(
        team.matchupId,
        []
      );
    }

    groups
      .get(team.matchupId)
      .push(team);
  }


  const losers = [];


  for (
    const [
      matchupId,
      pair
    ] of groups
  ) {
    if (pair.length !== 2) {
      warnings.push(
        `Matchup ${matchupId} contains ${pair.length} team(s); H2H loss badges were skipped for it.`
      );

      continue;
    }

    const [a, b] =
      pair;

    /*
     * Tie = nobody lost.
     */
    if (
      a.points === b.points
    ) {
      continue;
    }

    const loser =
      a.points < b.points
        ? a
        : b;

    const winner =
      loser === a
        ? b
        : a;

    losers.push({
      ...loser,

      opponent:
        winner,

      margin:
        round2(
          winner.points -
            loser.points
        )
    });
  }


  const candidates = [];


  /*
   * =======================================================
   * BDE
   * Highest score.
   *
   * A true tie awards both rather than silently
   * choosing one arbitrarily.
   * =======================================================
   */

  const highScore =
    Math.max(
      ...teams.map(
        (team) =>
          team.points
      )
    );

  const bdeTeams =
    teams.filter(
      (team) =>
        team.points === highScore
    );

  for (
    const team of
    bdeTeams
  ) {
    candidates.push(
      makeCandidate({
        badgeKey:
          'bde',

        definitions,

        manager:
          team.manager,

        score:
          team.points,

        season,
        week:
          weekNumber,

        matchupId:
          team.matchupId,

        reason:
          `Highest score of Week ${weekNumber}: ${team.points.toFixed(2)} points.`,
          
      })
    );
  }


  /*
   * =======================================================
   * SUCKO
   * Lowest score.
   * =======================================================
   */

  const lowScore =
    Math.min(
      ...teams.map(
        (team) =>
          team.points
      )
    );

  const suckoTeams =
    teams.filter(
      (team) =>
        team.points === lowScore
    );

  for (
    const team of
    suckoTeams
  ) {
    candidates.push(
      makeCandidate({
        badgeKey:
          'suck',

        definitions,

        manager:
          team.manager,

        score:
          team.points,

        season,
        week:
          weekNumber,

        matchupId:
          team.matchupId,

        reason:
          `Lowest score of Week ${weekNumber}: ${team.points.toFixed(2)} points.`
      })
    );
  }


  /*
   * =======================================================
   * IDES
   * Highest-scoring H2H loser.
   * =======================================================
   */

  if (losers.length) {
    const highestLoserScore =
      Math.max(
        ...losers.map(
          (team) =>
            team.points
        )
      );

    const idesTeams =
      losers.filter(
        (team) =>
          team.points ===
          highestLoserScore
      );

    for (
      const team of
      idesTeams
    ) {
      candidates.push(
        makeCandidate({
          badgeKey:
            'ides',

          definitions,

          manager:
            team.manager,

          score:
            team.points,

          season,
          week:
            weekNumber,

          matchupId:
            team.matchupId,

          opponent:
            team.opponent.manager,

          opponentScore:
            team.opponent.points,

          margin:
            team.margin,

          reason:
            `Highest-scoring loser of Week ${weekNumber}: lost ${team.points.toFixed(2)}–${team.opponent.points.toFixed(2)}.`
        })
      );
    }
  }


  /*
   * =======================================================
   * HBK
   *
   * Every manager who LOST by 1.00 point or less.
   * There can be more than one in a week.
   * =======================================================
   */

  const heartbreakers =
    losers.filter(
      (team) =>
        team.margin > 0 &&
        team.margin <= 1
    );


  for (
    const team of
    heartbreakers
  ) {
    candidates.push(
      makeCandidate({
        badgeKey:
          'hbk',

        definitions,

        manager:
          team.manager,

        score:
          team.points,

        season,
        week:
          weekNumber,

        matchupId:
          team.matchupId,

        opponent:
          team.opponent.manager,

        opponentScore:
          team.opponent.points,

        margin:
          team.margin,

        reason:
          `Lost Week ${weekNumber} by ${team.margin.toFixed(2)} point${team.margin === 1 ? '' : 's'} (${team.points.toFixed(2)}–${team.opponent.points.toFixed(2)}).`
      })
    );
  }

 /*
 * =======================================================
 * ZERO HOUR
 *
 * One badge per manager per week if they started at
 * least one player who finished with exactly 0.00.
 * =======================================================
 */

for (const team of teams) {
  const zeroStarters = [];

  for (const playerId of team.starters) {
    if (
      !Object.prototype.hasOwnProperty.call(
        team.playersPoints,
        playerId
      )
    ) {
      continue;
    }

    const nflTeam =
  playerTeamFromId(
    playersById,
    playerId
  );

/*
 * Bye-week starters belong to
 * Bye Bye Bye, not Zero Hour.
 */
if (
  nflTeam &&
  byeSchedule.teams.has(
    nflTeam
  )
) {
  continue;
}

    const playerScore =
      Number(
        team.playersPoints[playerId]
      );

    if (
      Number.isFinite(playerScore) &&
      playerScore <= 0
    ) {
      zeroStarters.push({
        id: String(playerId),
        name: playerNameFromId(
          playersById,
          playerId
        )
      });
    }
  }

  if (!zeroStarters.length) {
    continue;
  }

  const count =
    zeroStarters.length;

  const names =
    zeroStarters.map(
      (player) => player.name
    );

  let reason = '';

  if (count === 1) {
    reason =
      `Started ${names[0]} in Week ${weekNumber}. He scored 0.00 points.`;
  } else if (count === 2) {
    reason =
      `Started ${names[0]} and ${names[1]} in Week ${weekNumber}. Both scored 0.00 points.`;
  } else {
    reason =
      `Started ${names.slice(0, -1).join(', ')}, and ${names.at(-1)} in Week ${weekNumber}. All scored 0.00 points.`;
  }

  candidates.push(
    makeCandidate({
      badgeKey:
        'zerohour',

      definitions,

      manager:
        team.manager,

      score:
        team.points,

      season,

      week:
        weekNumber,

      matchupId:
        team.matchupId,

      reason,

      metadataExtra: {
        zeroStarters,
        zeroStarterIds:
          zeroStarters.map(
            (player) => player.id
          ),
        zeroStarterNames:
          zeroStarters.map(
            (player) => player.name
          ),
        zeroStarterCount:
          count
      }
    })
  );
}

/*
 * =======================================================
 * BYE BYE BYE
 *
 * One badge per manager per week if they started at
 * least one player whose NFL team was on bye.
 * =======================================================
 */

if (
  byeSchedule.seasonLoaded &&
  byeSchedule.teams.size
) {
  for (const team of teams) {
    const byeStarters = [];

    for (
      const playerId of
      team.starters
    ) {
      const nflTeam =
        playerTeamFromId(
          playersById,
          playerId
        );

      if (
        !nflTeam ||
        !byeSchedule.teams.has(
          nflTeam
        )
      ) {
        continue;
      }

      byeStarters.push({
        id:
          String(playerId),

        name:
          playerNameFromId(
            playersById,
            playerId
          ),

        nflTeam,

        nflTeamName:
          NFL_TEAM_NAMES[
            nflTeam
          ] || nflTeam
      });
    }


    if (!byeStarters.length) {
      continue;
    }


    const playerNames =
      humanList(
        byeStarters.map(
          (player) =>
            player.name
        )
      );


    const nflTeams = [
      ...new Set(
        byeStarters.map(
          (player) =>
            player.nflTeamName
        )
      )
    ];


    const teamNames =
      humanList(
        nflTeams
      );


    const reason =
      nflTeams.length === 1
        ? `Started ${playerNames} in Week ${weekNumber} while ${teamNames} was on bye.`
        : `Started ${playerNames} in Week ${weekNumber} while ${teamNames} were on bye.`;


    candidates.push(
      makeCandidate({
        badgeKey:
          'byebye',

        definitions,

        manager:
          team.manager,

        score:
          team.points,

        season,

        week:
          weekNumber,

        matchupId:
          team.matchupId,

        reason,

        metadataExtra: {
          byeStarters,

          byeStarterIds:
            byeStarters.map(
              (player) =>
                player.id
            ),

          byeStarterNames:
            byeStarters.map(
              (player) =>
                player.name
            ),

          byeNflTeams: [
            ...new Set(
              byeStarters.map(
                (player) =>
                  player.nflTeam
              )
            )
          ],

          byeStarterCount:
            byeStarters.length
        }
      })
    );
  }
}

/*
 * =======================================================
 * CAP'N HINDSIGHT
 *
 * Awarded when a manager loses H2H but had a bench player
 * who could have legally replaced a starter and changed
 * the loss into a win.
 *
 * One badge per manager per week.
 * =======================================================
 */

for (const team of losers) {

  /*
   * A commissioner custom-score override makes a
   * hypothetical lineup calculation unreliable.
   */
  if (
    team.customPoints !== null &&
    team.customPoints !== undefined
  ) {
    warnings.push(
      `${team.manager.team_name}: Cap'n Hindsight skipped because the matchup used custom points.`
    );

    continue;
  }


  if (
    starterSlots.length !==
    team.starters.length
  ) {
    warnings.push(
      `${team.manager.team_name}: Cap'n Hindsight skipped because Sleeper returned ${team.starters.length} starters but ${starterSlots.length} starting slots.`
    );

    continue;
  }


  const starterIds =
    new Set(
      team.starters.map(
        String
      )
    );


  /*
   * Sleeper defines the bench as players minus starters.
   */
  const benchIds =
    team.players.filter(
      (playerId) =>
        !starterIds.has(
          String(playerId)
        )
    );


  /*
   * Pair every starter with the roster slot that player
   * occupied that week.
   */
  const startingLineup =
    team.starters
      .map(
        (
          playerId,
          index
        ) => {
          const playerScore =
            scoreForPlayer(
              team,
              playerId
            );

          if (
            playerScore === null
          ) {
            return null;
          }

          return {
            playerId:
              String(playerId),

            playerName:
              playerNameFromId(
                playersById,
                playerId
              ),

            slot:
              starterSlots[index],

            score:
              playerScore
          };
        }
      )
      .filter(Boolean);


  const winningMoves = [];


  for (
    const benchPlayerId of
    benchIds
  ) {
    const benchScore =
      scoreForPlayer(
        team,
        benchPlayerId
      );


    /*
     * We need an actual Sleeper score for the
     * bench player to evaluate the move.
     */
    if (
      benchScore === null
    ) {
      continue;
    }


    /*
     * Find every starting slot this bench player
     * could legally occupy.
     */
    const eligibleStarters =
      startingLineup.filter(
        (starter) =>
          playerCanFillSlot(
            playersById,
            benchPlayerId,
            starter.slot
          )
      );


    if (
      !eligibleStarters.length
    ) {
      continue;
    }


    /*
     * The sensible hypothetical move is to replace
     * the LOWEST scoring eligible starter.
     */
    const replaceableStarter =
      [...eligibleStarters]
        .sort(
          (a, b) =>
            a.score - b.score
        )[0];


    const pointGain =
      benchScore -
      replaceableStarter.score;


    if (
      pointGain <= 0
    ) {
      continue;
    }


    const hypotheticalScore =
      round2(
        team.points +
        pointGain
      );


    /*
     * Tie isn't enough.
     *
     * Cap'n Hindsight means this move would
     * have actually produced a win.
     */
    if (
      hypotheticalScore <=
      team.opponent.points
    ) {
      continue;
    }


    winningMoves.push({
      benchPlayerId:
        String(
          benchPlayerId
        ),

      benchPlayerName:
        playerNameFromId(
          playersById,
          benchPlayerId
        ),

      benchScore:
        round2(
          benchScore
        ),

      replacedPlayerId:
        replaceableStarter.playerId,

      replacedPlayerName:
        replaceableStarter.playerName,

      replacedPlayerScore:
        round2(
          replaceableStarter.score
        ),

      replacedSlot:
        replaceableStarter.slot,

      pointGain:
        round2(
          pointGain
        ),

      originalScore:
        round2(
          team.points
        ),

      opponentScore:
        round2(
          team.opponent.points
        ),

      hypotheticalScore
    });
  }


  if (
    !winningMoves.length
  ) {
    continue;
  }


  /*
   * If multiple bench decisions would have won,
   * use the biggest missed point swing as the
   * headline example.
   *
   * Store every qualifying move in metadata.
   */
  winningMoves.sort(
    (a, b) =>
      b.pointGain -
      a.pointGain
  );


  const bestMove =
    winningMoves[0];


  const reason =
    `Benched ${bestMove.benchPlayerName} (${bestMove.benchScore.toFixed(2)} pts) in Week ${weekNumber}. Starting ${bestMove.benchPlayerName} over ${bestMove.replacedPlayerName} (${bestMove.replacedPlayerScore.toFixed(2)} pts) would have flipped the loss to ${bestMove.hypotheticalScore.toFixed(2)}–${bestMove.opponentScore.toFixed(2)}.`;


  candidates.push(
    makeCandidate({
      badgeKey:
        'captain',

      definitions,

      manager:
        team.manager,

      score:
        team.points,

      season,

      week:
        weekNumber,

      matchupId:
        team.matchupId,

      opponent:
        team.opponent.manager,

      opponentScore:
        team.opponent.points,

      margin:
        team.margin,

      reason,

      metadataExtra: {
        hindsightBenchPlayerId:
          bestMove.benchPlayerId,

        hindsightBenchPlayerName:
          bestMove.benchPlayerName,

        hindsightBenchScore:
          bestMove.benchScore,

        hindsightReplacedPlayerId:
          bestMove.replacedPlayerId,

        hindsightReplacedPlayerName:
          bestMove.replacedPlayerName,

        hindsightReplacedPlayerScore:
          bestMove.replacedPlayerScore,

        hindsightReplacedSlot:
          bestMove.replacedSlot,

        hindsightPointGain:
          bestMove.pointGain,

        hindsightOriginalScore:
          bestMove.originalScore,

        hindsightOpponentScore:
          bestMove.opponentScore,

        hindsightHypotheticalScore:
          bestMove.hypotheticalScore,

        hindsightWinningMoves:
          winningMoves
      }
    })
  );
}

  /*
   * Mark candidates that have already been committed.
   */
  const finalCandidates =
    candidates.map(
      (candidate) => ({
        ...candidate,

        alreadyAwarded:
          existingAwards.has(
            candidate.id
          )
      })
    );


  /*
   * Keep UI order predictable.
   */
  const order = {
  bde: 1,
  suck: 2,
  ides: 3,
  hbk: 4,
  zerohour: 5,
  byebye: 6,
  captain: 7
};


  finalCandidates.sort(
    (a, b) =>
      (
        order[a.badgeKey] -
        order[b.badgeKey]
      ) ||
      a.teamName.localeCompare(
        b.teamName
      )
  );


  return {
    season:
      String(season),

    week:
      weekNumber,

    leagueId:
      String(leagueId),

    teamCount:
      teams.length,

    matchupCount:
      groups.size,

    candidates:
      finalCandidates,

    pendingCount:
      finalCandidates.filter(
        (candidate) =>
          !candidate.alreadyAwarded
      ).length,

    warnings
  };
}