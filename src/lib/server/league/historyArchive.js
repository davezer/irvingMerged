import {
  buildRosterIdentityMap
} from '$lib/server/league/identity.js';

import {
  buildRosterSettingsMap,
  chunkPairs,
  normalizeMatchupGroup
} from '$lib/server/league/matchupAnalytics.js';

import {
  getLeagueHistory,
  getSleeperLeague,
  getSleeperMatchupsForWeek,
  getSleeperRosters,
  getSleeperUsers,
  getSleeperWinnersBracket
} from '$lib/server/league/sleeperClient.js';

import {
  listPublishedWeeklyPosts
} from '$lib/server/league/weeklyPostRepository.js';
import {
  resolveRuntimeEnv
} from '$lib/server/env.js';

export const MERGER_START_YEAR = 2025;


/* =========================================================
   SMALL HELPERS
   ========================================================= */

function numberValue(value) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
}


function pairKey(left, right) {
  return [
    String(left),
    String(right)
  ]
    .sort()
    .join('__');
}


function isComplete({
  league,
  currentSeason
}) {
  const season =
    Number(league?.season || 0);

  const status =
    String(
      league?.status || ''
    ).toLowerCase();

  return (
    season < Number(currentSeason) ||
    status === 'complete' ||
    status === 'completed' ||
    status === 'closed'
  );
}


function prettyStatus(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function weeksForSeason({
  league,
  currentSeason,
  currentWeek
}) {
  const completed =
    isComplete({
      league,
      currentSeason
    });

  const maxWeek =
    completed
      ? 18
      : Math.max(
          1,
          Math.min(
            18,
            Number(
              currentWeek || 1
            )
          )
        );

  return Array.from(
    {
      length: maxWeek
    },
    (_, index) =>
      index + 1
  );
}


function identityView(identity) {
  if (!identity) {
    return null;
  }

  return {
    managerId:
      identity.managerId
        ? String(
            identity.managerId
          )
        : null,

    managerName:
      identity.managerName,

    managerSlug:
      identity.managerSlug,

    teamName:
      identity.teamName,

    teamPhoto:
  identity.teamPhoto,

teamChiclet:
  identity.teamChiclet ||
  identity.teamPhoto
  };
}


async function safeArray(
  label,
  task
) {
  try {
    const value =
      await task();

    return Array.isArray(value)
      ? value
      : [];
  } catch (error) {
    console.warn(
      `[historyArchive] ${label} failed`,
      error?.message || error
    );

    return [];
  }
}


/* =========================================================
   ONE SLEEPER SEASON
   ========================================================= */

async function buildSeasonData({
  league,
  currentSeason,
  currentWeek,
  recapCount = 0
}) {
  const leagueId =
    String(
      league.league_id
    );

  const season =
    Number(
      league.season
    );

  const completed =
    isComplete({
      league,
      currentSeason
    });

  const playoffStartWeek =
    Number(
      league?.settings
        ?.playoff_week_start ||
      15
    );


  const [
    users,
    rosters,
    winnersBracket
  ] = await Promise.all([

    safeArray(
      `users ${leagueId}`,
      () =>
        getSleeperUsers(
          leagueId
        )
    ),

    safeArray(
      `rosters ${leagueId}`,
      () =>
        getSleeperRosters(
          leagueId
        )
    ),

    safeArray(
      `winners bracket ${leagueId}`,
      () =>
        getSleeperWinnersBracket(
          leagueId
        )
    )
  ]);


  const rosterIdentityMap =
    buildRosterIdentityMap({
      rosters,
      users
    });

  const rosterSettingsMap =
    buildRosterSettingsMap(
      rosters
    );


  const weeks =
    weeksForSeason({
      league,
      currentSeason,
      currentWeek
    });


  const rawWeeks =
    await Promise.all(
      weeks.map(
        async (week) => ({
          week,

          entries:
            await safeArray(
              `matchups ${leagueId} week ${week}`,
              () =>
                getSleeperMatchupsForWeek(
                  leagueId,
                  week
                )
            )
        })
      )
    );


  const games = [];


  for (
    const weekData of
    rawWeeks
  ) {
    const groups =
      chunkPairs(
        weekData.entries
      )
        .filter(
          (group) =>
            group.matchupId > 0 &&
            group.teams.length === 2
        );


    for (const group of groups) {
      const matchup =
        normalizeMatchupGroup(
          group,
          rosterIdentityMap,
          rosterSettingsMap,
          new Map(),
          {
            includeStarters:
              false
          }
        );

      if (
        !matchup.left ||
        !matchup.right
      ) {
        continue;
      }


      const leftIdentity =
        rosterIdentityMap.get(
          matchup.left.rosterId
        );

      const rightIdentity =
        rosterIdentityMap.get(
          matchup.right.rosterId
        );


      const leftManagerId =
        leftIdentity?.managerId
          ? String(
              leftIdentity.managerId
            )
          : null;

      const rightManagerId =
        rightIdentity?.managerId
          ? String(
              rightIdentity.managerId
            )
          : null;


      if (
        !leftManagerId ||
        !rightManagerId
      ) {
        continue;
      }


      games.push({
        season,

        week:
          weekData.week,

        playoff:
          weekData.week >=
          playoffStartWeek,

        pairKey:
          pairKey(
            leftManagerId,
            rightManagerId
          ),

        left: {
          ...identityView(
            leftIdentity
          ),

          score:
            numberValue(
              matchup.left.score
            )
        },

        right: {
          ...identityView(
            rightIdentity
          ),

          score:
            numberValue(
              matchup.right.score
            )
        },

        margin:
          matchup.margin
      });
    }
  }


  /*
   * Sleeper's winner bracket uses
   * placement "1" for the title game.
   */

  const championshipGame =
    winnersBracket
      .filter(
        (row) =>
          Number(row?.p) === 1 &&
          row?.w != null
      )
      .sort(
        (a, b) =>
          Number(b?.r || 0) -
          Number(a?.r || 0)
      )[0] ||
    null;


  const champion =
    championshipGame
      ? identityView(
          rosterIdentityMap.get(
            Number(
              championshipGame.w
            )
          )
        )
      : null;


  const runnerUp =
    championshipGame?.l != null
      ? identityView(
          rosterIdentityMap.get(
            Number(
              championshipGame.l
            )
          )
        )
      : null;


  const weeksWithData =
    rawWeeks.filter(
      (week) =>
        week.entries.length > 0
    );


  const lastWeekWithData =
    weeksWithData.length
      ? Math.max(
          ...weeksWithData.map(
            (week) => week.week
          )
        )
      : null;


  const current =
    season ===
    Number(currentSeason);


  let statusLabel;

  if (completed) {
    statusLabel =
      'Final';
  } else if (current) {
    const status =
      prettyStatus(
        league?.status
      );

    statusLabel =
      status
        ? `Current · ${status}`
        : 'Current Season';
  } else {
    statusLabel =
      prettyStatus(
        league?.status
      ) ||
      'Archived';
  }


  return {
    season,

    leagueId,

    leagueName:
      league?.name ||
      `Season ${season}`,

    status:
      league?.status ||
      null,

    statusLabel,

    current,

    completed,

    teamCount:
      rosters.length,

    playoffStartWeek,

    weeksWithData:
      weeksWithData.length,

    lastWeekWithData,

    games,

    champion,

    runnerUp,

    recapCount,

    links: {
      standings:
        `/league/standings?season=${season}`,

      draft:
        `/league/drafts?season=${season}`,

      matchups:
        completed
          ? `/league/matchups?season=${season}&week=${lastWeekWithData || 17}`
          : `/league/matchups?season=${season}&week=${Math.max(
              1,
              Number(
                currentWeek || 1
              )
            )}`
    }
  };
}


/* =========================================================
   RIVALRY HISTORY
   ========================================================= */

function orientGame(
  game,
  leftManagerId,
  rightManagerId
) {
  const left =
    game.left.managerId ===
    leftManagerId
      ? game.left
      : game.right.managerId ===
          leftManagerId
        ? game.right
        : null;


  const right =
    game.left.managerId ===
    rightManagerId
      ? game.left
      : game.right.managerId ===
          rightManagerId
        ? game.right
        : null;


  if (
    !left ||
    !right
  ) {
    return null;
  }


  let winnerManagerId =
    null;

  if (
    left.score >
    right.score
  ) {
    winnerManagerId =
      leftManagerId;
  } else if (
    right.score >
    left.score
  ) {
    winnerManagerId =
      rightManagerId;
  }


  return {
    season:
      game.season,

    week:
      game.week,

    playoff:
      game.playoff,

    leftScore:
      Number(
        left.score.toFixed(2)
      ),

    rightScore:
      Number(
        right.score.toFixed(2)
      ),

    margin:
      Number(
        Math.abs(
          left.score -
          right.score
        ).toFixed(2)
      ),

    winnerManagerId
  };
}


function buildStreak({
  games,
  leftManagerId,
  rightManagerId,
  leftTeamName,
  rightTeamName
}) {
  if (!games.length) {
    return {
      count: 0,
      managerId: null,
      label: '—'
    };
  }


  const latest =
    games[
      games.length - 1
    ];


  if (
    !latest.winnerManagerId
  ) {
    return {
      count: 1,
      managerId: null,
      label: 'T1'
    };
  }


  const winnerManagerId =
    latest.winnerManagerId;

  let count =
    0;


  for (
    let index =
      games.length - 1;

    index >= 0;

    index -= 1
  ) {
    if (
      games[index]
        .winnerManagerId !==
      winnerManagerId
    ) {
      break;
    }

    count += 1;
  }


  const teamName =
    winnerManagerId ===
    leftManagerId
      ? leftTeamName
      : winnerManagerId ===
          rightManagerId
        ? rightTeamName
        : 'Unknown';


  return {
    count,

    managerId:
      winnerManagerId,

    teamName,

    label:
      `${teamName} W${count}`
  };
}


function buildRivalryHistory({
  rivalries,
  managers,
  games
}) {
  const managerBySlug =
    new Map(
      managers.map(
        (manager) => [
          manager.slug,
          manager
        ]
      )
    );


  return rivalries.map(
    (rivalry) => {

      const leftManager =
        managerBySlug.get(
          rivalry.left.slug
        );

      const rightManager =
        managerBySlug.get(
          rivalry.right.slug
        );


      if (
        !leftManager ||
        !rightManager
      ) {
        return {
          ...rivalry,

          hasData: false,

          meetings: 0,

          leftWins: 0,

          rightWins: 0,

          ties: 0,

          leftPoints: 0,

          rightPoints: 0,

          playoffMeetings: 0,

          currentStreak: {
            label: '—'
          },

          lastMeeting: null,

          biggestBlowout: null
        };
      }


      const leftManagerId =
        String(
          leftManager.managerID
        );

      const rightManagerId =
        String(
          rightManager.managerID
        );


      const wantedPair =
        pairKey(
          leftManagerId,
          rightManagerId
        );


      const meetings =
        games
          .filter(
            (game) =>
              game.pairKey ===
              wantedPair
          )
          .map(
            (game) =>
              orientGame(
                game,
                leftManagerId,
                rightManagerId
              )
          )
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.season -
                b.season ||
              a.week -
                b.week
          );


      const leftWins =
        meetings.filter(
          (game) =>
            game.winnerManagerId ===
            leftManagerId
        ).length;


      const rightWins =
        meetings.filter(
          (game) =>
            game.winnerManagerId ===
            rightManagerId
        ).length;


      const ties =
        meetings.filter(
          (game) =>
            !game.winnerManagerId
        ).length;


      const leftPoints =
        Number(
          meetings.reduce(
            (sum, game) =>
              sum +
              game.leftScore,
            0
          ).toFixed(2)
        );


      const rightPoints =
        Number(
          meetings.reduce(
            (sum, game) =>
              sum +
              game.rightScore,
            0
          ).toFixed(2)
        );


      const playoffMeetings =
        meetings.filter(
          (game) =>
            game.playoff
        ).length;


      const lastMeeting =
        meetings.at(-1) ||
        null;


      const biggestBlowout =
        meetings.length
          ? [...meetings]
              .sort(
                (a, b) =>
                  b.margin -
                  a.margin
              )[0]
          : null;


      const currentStreak =
        buildStreak({
          games:
            meetings,

          leftManagerId,

          rightManagerId,

          leftTeamName:
            rivalry.left
              .teamName,

          rightTeamName:
            rivalry.right
              .teamName
        });


      let seriesLeader =
        'Series tied';


      if (
        leftWins >
        rightWins
      ) {
        seriesLeader =
          `${rivalry.left.teamName} leads`;
      }

      if (
        rightWins >
        leftWins
      ) {
        seriesLeader =
          `${rivalry.right.teamName} leads`;
      }


      return {
        ...rivalry,

        hasData:
          meetings.length > 0,

        meetings:
          meetings.length,

        leftWins,

        rightWins,

        ties,

        leftPoints,

        rightPoints,

        playoffMeetings,

        seriesLeader,

        currentStreak,

        lastMeeting,

        biggestBlowout
      };
    }
  );
}


/* =========================================================
   PUBLIC ARCHIVE BUNDLE
   ========================================================= */

   async function resolveMergedLeagues({
  rootLeagueId,
  env,
  currentSeason
}) {
  const runtimeEnv =
    resolveRuntimeEnv(env);

  const byLeagueId =
    new Map();


  /*
   * First grab anything Sleeper has
   * properly chained together.
   */
  const chainedHistory =
    await getLeagueHistory(
      rootLeagueId
    ).catch(() => []);


  for (
    const league of
    chainedHistory
  ) {
    const season =
      Number(
        league?.season || 0
      );

    if (
      season <
      MERGER_START_YEAR
    ) {
      continue;
    }

    if (
      league?.league_id
    ) {
      byLeagueId.set(
        String(
          league.league_id
        ),
        league
      );
    }
  }


  /*
   * Then explicitly check the same
   * season-specific env vars the rest
   * of the app already supports.
   *
   * Example:
   * SLEEPER_LEAGUE_ID_2025
   * SLEEPER_LEAGUE_ID_2026
   */
  for (
    let season =
      MERGER_START_YEAR;

    season <=
      Number(currentSeason);

    season += 1
  ) {
    const explicitLeagueId =
      String(
        runtimeEnv?.[
          `SLEEPER_LEAGUE_ID_${season}`
        ] || ''
      ).trim();


    if (!explicitLeagueId) {
      continue;
    }


    if (
      byLeagueId.has(
        explicitLeagueId
      )
    ) {
      continue;
    }


    try {
      const league =
        await getSleeperLeague(
          explicitLeagueId
        );


      if (
        league?.league_id
      ) {
        byLeagueId.set(
          String(
            league.league_id
          ),
          league
        );
      }

    } catch (error) {
      console.warn(
        `[historyArchive] could not load configured ${season} league`,
        error?.message || error
      );
    }
  }


  /*
   * Last-resort inclusion of the
   * supplied root league itself.
   */
  if (
    rootLeagueId &&
    !byLeagueId.has(
      String(rootLeagueId)
    )
  ) {
    try {
      const rootLeague =
        await getSleeperLeague(
          rootLeagueId
        );

      if (
        Number(
          rootLeague?.season || 0
        ) >=
          MERGER_START_YEAR &&
        rootLeague?.league_id
      ) {
        byLeagueId.set(
          String(
            rootLeague.league_id
          ),
          rootLeague
        );
      }

    } catch (error) {
      console.warn(
        '[historyArchive] root league lookup failed',
        error?.message || error
      );
    }
  }


  return [
    ...byLeagueId.values()
  ].sort(
    (a, b) =>
      Number(
        b?.season || 0
      ) -
      Number(
        a?.season || 0
      )
  );
}

export async function getMergedHistoryArchive({
  db,
  env,
  rootLeagueId,
  currentSeason,
  currentWeek,
  managers = [],
  rivalries = []
} = {}) {
    const mergedLeagues =
  await resolveMergedLeagues({
    rootLeagueId,
    env,
    currentSeason
  });


  let publishedPosts =
    [];

  if (db) {
    publishedPosts =
      await listPublishedWeeklyPosts(
        db,
        {
          limit: 250
        }
      ).catch(
        (error) => {
          console.warn(
            '[historyArchive] weekly post index failed',
            error?.message ||
              error
          );

          return [];
        }
      );
  }


  const recapCountBySeason =
    new Map();


  for (
    const post of
    publishedPosts
  ) {
    if (
      post.recapSeason == null
    ) {
      continue;
    }

    const season =
      Number(
        post.recapSeason
      );

    recapCountBySeason.set(
      season,
      (
        recapCountBySeason.get(
          season
        ) || 0
      ) + 1
    );
  }


  const seasonArchive =
    await Promise.all(
      mergedLeagues.map(
        (league) =>
          buildSeasonData({
            league,

            currentSeason,

            currentWeek,

            recapCount:
              recapCountBySeason.get(
                Number(
                  league.season
                )
              ) || 0
          })
      )
    );


  const allGames =
    seasonArchive.flatMap(
      (season) =>
        season.games
    );


  const rivalryHistory =
    buildRivalryHistory({
      rivalries,
      managers,
      games:
        allGames
    });


  return {
    mergerStartYear:
      MERGER_START_YEAR,

    seasonArchive:
      seasonArchive.map(
        ({
          games,
          ...season
        }) => season
      ),

    rivalries:
      rivalryHistory,

    games:
      allGames
  };
}