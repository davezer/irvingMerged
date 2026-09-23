import {
  managers
} from '$lib/legacy/leagueInfo.js';

import {
  getLeagueHistory,
  getSleeperMatchupsForWeek,
  getSleeperRosters
} from '$lib/server/league/sleeperClient.js';


/*
 * ============================================================
 * IRVING WEEKLY — BRAIN REPAIR LAYER
 *
 * Two jobs:
 *
 * 1. Keep commissioner editorial lore in ONE dedicated source so a
 *    future league-memory refactor cannot silently replace 12 teams'
 *    notes with a one-team placeholder.
 *
 * 2. Use linked Sleeper league history for merged-era head-to-head
 *    matchup memory. The D1 matchups table is useful when backfilled,
 *    but it is not guaranteed to contain the previous merged season.
 * ============================================================
 */


export const TEAM_EDITORIAL_NOTES = {
  'Lehigh Crucible': [
    'Lehigh went all in on the 2025 championship, spending future draft capital to maximize the title window. The post-title resource squeeze is a direct result of that strategy.',
    'Dave and Kevin have a long-standing rivalry dating back to the early 2000s.',
    'Lehigh lost the 2025 ICL championship to Dunedin in a close matchup. Around the league, it was viewed as a major upset given how aggressively Lehigh had built for that title run.',
    'The 2004 Irving championship was a defining early moment for the franchise, followed by a long championship drought.'
  ],

  'Ultimate City Warriors': [
    "One of Jeff's most famous championship runs came in a season where he was effectively unable to participate normally in the draft because of overconsumption, forcing a remarkable recovery afterward.",
    'Jeff and Jamie are brothers. Their rivalry is built into the family dynamic and amplified by decades of fantasy football history.',
    "Jeff's Littlefinger persona fits his league reputation for strategic maneuvering, unexpected trades, and moves that tend to catch the rest of the league off guard.",
    'Ultimate City went all in on the 2025 playoff run, spending future draft capital to maximize the title window. The resource squeeze that followed is a direct result of that strategy.'
  ],

  'Dagobah Lightsabres': [
    'Jamie and Jeff are brothers. Their rivalry is built into the family dynamic and amplified by decades of fantasy football history.',
    'Jamie has a league-wide reputation as one of the strongest negotiators in the trade market and is often able to extract premium value from his trade partners.'
  ],

  'Rebel Radio Lone Rangers': [
    'Kenny and James are longtime friends who frequently find themselves arguing about just about everything.',
    'Kenny is often one of the first managers to speak up about league rules or call out a trade he thinks is absurd, frequently turning a simple transaction into a league-wide debate.'
  ],

  'Salem Hipsterjacks': [
    'Salem famously went into full sell mode only three weeks into the 2025 season.',
    "Clifton loves to trade. A recurring league joke is that his enthusiasm for making deals sometimes exceeds the quality of the deals themselves."
  ],

  'Nakatomi Plaza CC': [
    'The 2023 and 2024 championships were back-to-back titles and should be treated as a defining recent Nakatomi era when that history is relevant.',
    "Kevin and Dave were roommates and have a long-standing friendship that naturally developed into one of the league's oldest rivalries.",
    'Before the 2026 draft, Kevin made two trades that were widely viewed around the league as especially sharp strategic moves.',
    "Nakatomi has a league reputation for refusing to disappear from the playoff picture. Even during a rebuild or transition year, the franchise is rarely treated as harmless. The John McClane comparison is part of the team mythology."
  ],

  'Amherst Union': [
    "Drew is one of the league's more willing and active trade partners."
  ],

  'Milford Jayhawks': [
    'Jay and Adam are longtime friends going all the way back to high school. Their real-life friendship adds another layer to the Milford-Saskatchewan rivalry.'
  ],

  'Jacksonville Vincitori': [
    'Jacksonville won three consecutive DTSP championships from 2016 through 2018. When that history is relevant, treat it as a dynasty-era run rather than three isolated titles.'
  ],

  'Dunedin Homers': [
    'The 2025 championship was an intentional all-in title push. Dunedin aggressively spent future resources to maximize its championship window, won the ICL title, and entered 2026 dealing with the roster and draft-capital squeeze created by that successful push.',
    "Do not frame Dunedin's post-2025 shortage of draft resources as an unexplained collapse or simple mismanagement. When relevant, it is the bill for a championship strategy that actually worked.",
    'When Dunedin is competitive despite its post-title resource disadvantage, that is a meaningful part of the story because the franchise entered 2026 with far less flexibility than most of the league.',
    'Jamie and James have a rivalry that extends well beyond fantasy football. Sports arguments, everyday disagreements, and years of friendship have all fed into a rivalry that feels more personal than an ordinary league matchup.',
    'During the 2025 championship push, James was willing to pay premium prices for elite players rather than preserve future flexibility.'
  ],

  'Kansas City Kodachromes': [],

  'Tallahassee Tribe': [],

  'Saskatchewan Mounties': [
    'Jay and Adam are longtime friends going all the way back to high school. Their real-life friendship adds another layer to the Milford-Saskatchewan rivalry.',
    'The Mounties have a reputation for sticking with their guys. Adam rarely treats the roster as a revolving door and does not explore the trade market as aggressively as many other managers.',
    'Saskatchewan has a long-running reputation for staying relevant. Even in transition years, the Mounties are rarely dismissed from the playoff picture.'
  ],

  'Clearwater HenryPussycats': [
    "Brad is one of the league's true mystery managers: quiet, low-profile, and rarely interested in broadcasting what he is thinking or planning.",
    'Clearwater has long carried a dark-horse quality because the franchise tends to operate quietly compared with the louder personalities around the league.'
  ]
};


function managerMaps() {
  const byId =
    new Map();

  const byTeam =
    new Map();

  for (
    const manager of
    managers
  ) {
    byId.set(
      String(
        manager.managerID
      ),
      manager
    );

    byTeam.set(
      String(
        manager.teamName ||
        ''
      ),
      manager
    );
  }

  return {
    byId,
    byTeam
  };
}


async function safeArray(
  label,
  task,
  warnings
) {
  try {
    const value =
      await task();

    return Array.isArray(
      value
    )
      ? value
      : [];
  } catch (error) {
    console.warn(
      `[weekly-recap-brain] ${label} failed:`,
      error
    );

    warnings.push(
      `${label} failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );

    return [];
  }
}


function weekList({
  leagueSeason,
  currentSeason,
  currentWeek
}) {
  if (
    Number(
      leagueSeason
    ) ===
    Number(
      currentSeason
    )
  ) {
    const max =
      Math.max(
        0,
        Number(
          currentWeek
        ) -
        1
      );

    return Array.from(
      {
        length:
          max
      },
      (_, index) =>
        index + 1
    );
  }

  return Array.from(
    {
      length:
        18
    },
    (_, index) =>
      index + 1
  );
}


function scoreFor(
  side
) {
  const score =
    Number(
      side?.custom_points ??
      side?.points ??
      0
    );

  return Number.isFinite(
    score
  )
    ? Number(
        score.toFixed(
          2
        )
      )
    : 0;
}


async function loadMergedEraGames({
  rootLeagueId,
  season,
  week
}) {
  const warnings =
    [];

  if (!rootLeagueId) {
    return {
      games: [],
      warnings
    };
  }

  let history =
    [];

  try {
    history =
      await getLeagueHistory(
        rootLeagueId
      );
  } catch (error) {
    warnings.push(
      `Linked Sleeper league history failed: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );

    return {
      games: [],
      warnings
    };
  }

  /*
   * The ICL merged era begins with 2025.
   * For a 2026 recap we need:
   *   - all of 2025
   *   - earlier completed weeks of 2026
   *
   * Keeping this intentionally narrow avoids dozens of unnecessary
   * Sleeper calls while still answering the league-history question
   * the recap actually needs.
   */
  const relevant =
    (
      history ||
      []
    )
      .filter(
        (league) => {
          const leagueSeason =
            Number(
              league?.season
            );

          return (
            Number.isInteger(
              leagueSeason
            ) &&
            leagueSeason >=
              Math.max(
                2025,
                Number(
                  season
                ) -
                1
              ) &&
            leagueSeason <=
              Number(
                season
              )
          );
        }
      )
      .sort(
        (a, b) =>
          Number(
            a.season
          ) -
          Number(
            b.season
          )
      );

  const games =
    [];

  for (
    const league of
    relevant
  ) {
    const leagueId =
      String(
        league.league_id ||
        ''
      );

    if (!leagueId) {
      continue;
    }

    const rosters =
      await safeArray(
        `Sleeper rosters ${league.season}`,
        () =>
          getSleeperRosters(
            leagueId
          ),
        warnings
      );

    const ownerByRoster =
      new Map(
        rosters
          .filter(
            (roster) =>
              roster?.roster_id !=
                null &&
              roster?.owner_id
          )
          .map(
            (roster) => [
              Number(
                roster.roster_id
              ),
              String(
                roster.owner_id
              )
            ]
          )
      );

    const weeks =
      weekList({
        leagueSeason:
          league.season,

        currentSeason:
          season,

        currentWeek:
          week
      });

    const buckets =
      await Promise.all(
        weeks.map(
          async (
            selectedWeek
          ) => ({
            week:
              selectedWeek,

            items:
              await safeArray(
                `Sleeper ${league.season} Week ${selectedWeek} matchups`,
                () =>
                  getSleeperMatchupsForWeek(
                    leagueId,
                    selectedWeek
                  ),
                warnings
              )
          })
        )
      );

    for (
      const bucket of
      buckets
    ) {
      const groups =
        new Map();

      for (
        const side of
        bucket.items ||
        []
      ) {
        const matchupId =
          Number(
            side?.matchup_id
          );

        if (
          !Number.isFinite(
            matchupId
          )
        ) {
          continue;
        }

        if (
          !groups.has(
            matchupId
          )
        ) {
          groups.set(
            matchupId,
            []
          );
        }

        groups
          .get(
            matchupId
          )
          .push(
            side
          );
      }

      for (
        const [
          matchupId,
          sides
        ] of groups
      ) {
        if (
          sides.length !==
          2
        ) {
          continue;
        }

        const normalized =
          sides
            .map(
              (side) => ({
                managerId:
                  ownerByRoster.get(
                    Number(
                      side.roster_id
                    )
                  ) ||
                  null,

                score:
                  scoreFor(
                    side
                  )
              })
            )
            .filter(
              (side) =>
                side.managerId
            );

        if (
          normalized.length !==
          2
        ) {
          continue;
        }

        games.push({
          season:
            Number(
              league.season
            ),

          week:
            Number(
              bucket.week
            ),

          matchupId,
          sides:
            normalized
        });
      }
    }
  }

  return {
    games,
    warnings
  };
}


function resultForSide(
  game,
  managerId
) {
  const wanted =
    String(
      managerId
    );

  const mine =
    game.sides.find(
      (side) =>
        side.managerId ===
        wanted
    ) ||
    null;

  const other =
    game.sides.find(
      (side) =>
        side.managerId !==
        wanted
    ) ||
    null;

  if (
    !mine ||
    !other
  ) {
    return null;
  }

  return {
    result:
      mine.score ===
      other.score
        ? 'T'
        : mine.score >
          other.score
          ? 'W'
          : 'L',

    score:
      mine.score,

    opponentScore:
      other.score,

    opponentManagerId:
      other.managerId
  };
}


function seriesForMatchup({
  matchup,
  games,
  teamByName
}) {
  const leftTeam =
    String(
      matchup
        ?.left
        ?.teamName ||
      ''
    );

  const rightTeam =
    String(
      matchup
        ?.right
        ?.teamName ||
      ''
    );

  const leftManager =
    teamByName.get(
      leftTeam
    ) ||
    null;

  const rightManager =
    teamByName.get(
      rightTeam
    ) ||
    null;

  if (
    !leftManager ||
    !rightManager
  ) {
    return null;
  }

  const leftId =
    String(
      leftManager.managerID
    );

  const rightId =
    String(
      rightManager.managerID
    );

  const meetings =
    (
      games ||
      []
    )
      .filter(
        (game) => {
          const ids =
            new Set(
              game.sides.map(
                (side) =>
                  side.managerId
              )
            );

          return (
            ids.has(
              leftId
            ) &&
            ids.has(
              rightId
            )
          );
        }
      )
      .map(
        (game) => ({
          game,

          left:
            resultForSide(
              game,
              leftId
            )
        })
      )
      .filter(
        (row) =>
          row.left
      )
      .sort(
        (a, b) =>
          a.game.season -
            b.game.season ||
          a.game.week -
            b.game.week
      );

  const leftWins =
    meetings.filter(
      (row) =>
        row.left.result ===
        'W'
    ).length;

  const rightWins =
    meetings.filter(
      (row) =>
        row.left.result ===
        'L'
    ).length;

  const ties =
    meetings.filter(
      (row) =>
        row.left.result ===
        'T'
    ).length;

  const last =
    meetings[
      meetings.length -
      1
    ] ||
    null;

  let currentSeriesStreak =
    null;

  if (
    meetings.length
  ) {
    const latestResult =
      meetings[
        meetings.length -
        1
      ].left.result;

    let count =
      0;

    for (
      let index =
        meetings.length -
        1;
      index >= 0;
      index -= 1
    ) {
      if (
        meetings[
          index
        ].left.result !==
        latestResult
      ) {
        break;
      }

      count += 1;
    }

    currentSeriesStreak = {
      teamName:
        latestResult ===
        'W'
          ? leftTeam
          : latestResult ===
              'L'
            ? rightTeam
            : null,

      result:
        latestResult,

      count
    };
  }

  const leftRival =
    String(
      leftManager
        ?.rival
        ?.name ||
      ''
    )
      .trim()
      .toLowerCase();

  const rightRival =
    String(
      rightManager
        ?.rival
        ?.name ||
      ''
    )
      .trim()
      .toLowerCase();

  const leftNames =
    new Set([
      String(
        rightManager.name ||
        ''
      )
        .trim()
        .toLowerCase(),

      String(
        rightManager.teamName ||
        ''
      )
        .trim()
        .toLowerCase()
    ]);

  const rightNames =
    new Set([
      String(
        leftManager.name ||
        ''
      )
        .trim()
        .toLowerCase(),

      String(
        leftManager.teamName ||
        ''
      )
        .trim()
        .toLowerCase()
    ]);

  const declaredBy =
    [];

  if (
    leftRival &&
    leftNames.has(
      leftRival
    )
  ) {
    declaredBy.push(
      leftTeam
    );
  }

  if (
    rightRival &&
    rightNames.has(
      rightRival
    )
  ) {
    declaredBy.push(
      rightTeam
    );
  }

  return {
    matchupId:
      Number(
        matchup.matchupId
      ),

    leftTeam,
    rightTeam,

    meetings:
      meetings.length,

    leftWins,
    rightWins,
    ties,

    seriesLeader:
      leftWins ===
      rightWins
        ? null
        : leftWins >
          rightWins
          ? leftTeam
          : rightTeam,

    currentSeriesStreak,

    lastMeeting:
      last
        ? {
            season:
              last.game.season,

            week:
              last.game.week,

            leftScore:
              last.left.score,

            rightScore:
              last.left.opponentScore,

            winner:
              last.left.result ===
              'W'
                ? leftTeam
                : last.left.result ===
                    'L'
                  ? rightTeam
                  : null
          }
        : null,

    recentMeetings:
      meetings
        .slice(
          -5
        )
        .map(
          (row) => ({
            season:
              row.game.season,

            week:
              row.game.week,

            leftScore:
              row.left.score,

            rightScore:
              row.left.opponentScore,

            winner:
              row.left.result ===
              'W'
                ? leftTeam
                : row.left.result ===
                    'L'
                  ? rightTeam
                  : null
          })
        ),

    declaredRivalry:
      declaredBy.length >
      0,

    declaredBy,

    source:
      'linked Sleeper merged-era history'
  };
}


function injectEditorialNotes(
  beatWriterContext
) {
  const teams =
    (
      beatWriterContext
        ?.teams ||
      []
    ).map(
      (team) => ({
        ...team,

        editorialNotes:
          TEAM_EDITORIAL_NOTES[
            team.teamName
          ] ||
          []
      })
    );

  return {
    ...beatWriterContext,
    teams
  };
}


function buildMatchupLore({
  matchups,
  teams,
  series
}) {
  const teamByName =
    new Map(
      (
        teams ||
        []
      ).map(
        (team) => [
          team.teamName,
          team
        ]
      )
    );

  const seriesByMatchup =
    new Map(
      (
        series ||
        []
      ).map(
        (row) => [
          Number(
            row.matchupId
          ),
          row
        ]
      )
    );

  return (
    matchups ||
    []
  )
    .map(
      (matchup) => {
        const left =
          teamByName.get(
            matchup
              ?.left
              ?.teamName
          ) ||
          null;

        const right =
          teamByName.get(
            matchup
              ?.right
              ?.teamName
          ) ||
          null;

        if (
          !left ||
          !right
        ) {
          return null;
        }

        return {
          matchupId:
            Number(
              matchup.matchupId
            ),

          left,
          right,

          series:
            seriesByMatchup.get(
              Number(
                matchup.matchupId
              )
            ) ||
            null
        };
      }
    )
    .filter(
      Boolean
    );
}


function priorityHooks(
  series
) {
  const hooks =
    [];

  for (
    const row of
    series ||
    []
  ) {
    if (
      row.declaredRivalry
    ) {
      const record =
        row.meetings
          ? ` In the merged-era Sleeper history, ${row.leftTeam} leads ${row.leftWins}-${row.rightWins}${row.ties ? `-${row.ties}` : ''}.`
          : '';

      hooks.push(
        `${row.leftTeam} vs. ${row.rightTeam} is a declared Irving rivalry matchup.${record}`
      );
    }

    if (
      row
        .currentSeriesStreak
        ?.teamName &&
      Number(
        row
          .currentSeriesStreak
          .count
      ) >=
      2
    ) {
      hooks.push(
        `${row.currentSeriesStreak.teamName} enters this matchup on a ${row.currentSeriesStreak.count}-game head-to-head winning streak against ${row.currentSeriesStreak.teamName === row.leftTeam ? row.rightTeam : row.leftTeam} in the merged-era Sleeper history.`
      );
    }
  }

  return [
    ...new Set(
      hooks
    )
  ];
}


function archiveCoverage(
  games
) {
  if (
    !games?.length
  ) {
    return null;
  }

  const seasons =
    games.map(
      (game) =>
        Number(
          game.season
        )
    );

  return {
    firstSeason:
      Math.min(
        ...seasons
      ),

    lastSeason:
      Math.max(
        ...seasons
      ),

    completedMatchups:
      games.length,

    source:
      'linked Sleeper merged-era history'
  };
}


export async function repairWeeklyRecapBeatWriterContext({
  beatWriterContext,
  rootLeagueId,
  season,
  week,
  matchups = []
} = {}) {
  if (
    !beatWriterContext
  ) {
    return beatWriterContext;
  }

  let repaired =
    injectEditorialNotes(
      beatWriterContext
    );

  const warnings =
    [
      ...(
        repaired.warnings ||
        []
      )
    ];

  const {
    games,
    warnings:
      sleeperWarnings
  } =
    await loadMergedEraGames({
      rootLeagueId,
      season,
      week
    });

  warnings.push(
    ...sleeperWarnings
  );

  const maps =
    managerMaps();

  const sleeperSeries =
    (
      matchups ||
      []
    )
      .map(
        (matchup) =>
          seriesForMatchup({
            matchup,
            games,
            teamByName:
              maps.byTeam
          })
      )
      .filter(
        Boolean
      );

  /*
   * If linked Sleeper history was available, it becomes the matchup
   * authority for the merged era. Otherwise retain whatever D1 knew.
   */
  const usableSleeperHistory =
    games.length >
    0;

  const currentMatchupSeries =
    usableSleeperHistory
      ? sleeperSeries
      : repaired.currentMatchupSeries ||
        [];

  const currentMatchupLore =
    buildMatchupLore({
      matchups,

      teams:
        repaired.teams,

      series:
        currentMatchupSeries
    });

  const franchisesWithNotes =
    (
      repaired.teams ||
      []
    ).filter(
      (team) =>
        (
          team.editorialNotes ||
          []
        ).length >
        0
    ).length;

  repaired = {
    ...repaired,

    purpose:
      'Authoritative institutional memory for the Irving Weekly writer. Commissioner lore is balanced matchup-by-matchup, while merged-era head-to-head history comes from linked Sleeper leagues rather than assuming D1 has been fully backfilled.',

    writerDirectives: [
      'Before writing EACH matchup, inspect currentMatchupLore for BOTH teams. Treat both franchises as equal context sources.',
      'Commissioner editorial notes are first-class factual league lore. Do not ignore them merely because a different team appears in priorityStoryHooks.',
      'priorityStoryHooks are intentionally sparse and week-specific. They are not a ranking of which franchises deserve coverage.',
      'Do not make the defending champion a recurring priority storyline simply because they are the defending champion. Use that context only when it actually matters to the current result.',
      'Head-to-head series data labeled linked Sleeper merged-era history covers the merged ICL era available through the league chain. Do not describe it as lifetime history.',
      ...(
        repaired
          .writerDirectives ||
        []
      )
    ],

    editorialNotesStatus: {
      franchiseProfiles:
        (
          repaired.teams ||
          []
        ).length,

      franchisesWithNotes,

      source:
        'TEAM_EDITORIAL_NOTES in weeklyRecapBrainRepair.js'
    },

    archiveCoverage:
      usableSleeperHistory
        ? archiveCoverage(
            games
          )
        : repaired.archiveCoverage ||
          null,

    /*
     * Important: no automatic "defending champion" priority hook.
     * That was the source of the persistent Dunedin gravity.
     */
    priorityStoryHooks:
      priorityHooks(
        currentMatchupSeries
      ),

    currentMatchupSeries,

    currentMatchupLore,

    warnings: [
      ...new Set(
        warnings
      )
    ]
  };

  return repaired;
}
