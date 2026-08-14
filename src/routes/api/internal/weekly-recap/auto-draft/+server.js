import {
  json
} from '@sveltejs/kit';

import {
  resolveLeagueContext
} from '$lib/server/league/context.js';

import {
  buildWeeklyRecapPacket
} from '$lib/server/league/weeklyRecapPacket.js';

import {
  generateWeeklyRecap
} from '$lib/server/league/weeklyRecapWriter.js';

import {
  getWeeklyRecap,
  saveWeeklyRecapDraft
} from '$lib/server/league/weeklyRecapRepository.js';

import {
  upsertWeeklyRecapDraftPost
} from '$lib/server/league/weeklyPostRepository.js';

import {
  getSleeperMatchupsForWeek,
  getSleeperNFLState
} from '$lib/server/league/sleeperClient.js';


const MAX_AUTO_RECAP_WEEK =
  17;


function numberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function isAuthorized(
  request,
  env
) {
  const expected =
    String(
      env
        ?.WEEKLY_CRON_SECRET ||
      ''
    ).trim();

  if (!expected) {
    return false;
  }

  const supplied =
    String(
      request.headers.get(
        'authorization'
      ) ||
      ''
    );

  return (
    supplied ===
    `Bearer ${expected}`
  );
}


function matchupScore(
  entry
) {
  const score =
    Number(
      entry?.custom_points ??
      entry?.points
    );

  return Number.isFinite(
    score
  )
    ? score
    : null;
}


function matchupsLookComplete(
  matchups,
  expectedRosterCount = 0
) {
  if (
    !Array.isArray(
      matchups
    ) ||
    matchups.length < 2
  ) {
    return false;
  }

  if (
    expectedRosterCount > 0 &&
    matchups.length <
      expectedRosterCount
  ) {
    return false;
  }

  const groups =
    new Map();

  for (
    const entry of matchups
  ) {
    const key =
      Number(
        entry.matchup_id
      );

    if (
      !groups.has(
        key
      )
    ) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(
        key
      )
      .push(
        entry
      );
  }

  /*
   * Every fantasy matchup should
   * have exactly two sides.
   */
  if (
    [...groups.values()]
      .some(
        (teams) =>
          teams.length !== 2
      )
  ) {
    return false;
  }

  const scores =
    matchups.map(
      matchupScore
    );

  /*
   * Null/undefined scoring means
   * the data is not ready.
   */
  if (
    scores.some(
      (score) =>
        score === null
    )
  ) {
    return false;
  }

  /*
   * Future Sleeper matchups may
   * already exist but contain all
   * zero scores.
   */
  return scores.some(
    (score) =>
      score > 0
  );
}


function packetUrl({
  url,
  season,
  week
}) {
  const next =
    new URL(
      url
    );

  next.searchParams.set(
    'season',
    String(
      season
    )
  );

  next.searchParams.set(
    'week',
    String(
      week
    )
  );

  next.searchParams.delete(
    'weeks'
  );

  return next;
}


async function findLatestCompletedWeek({
  url,
  env
}) {
  const state =
    await getSleeperNFLState();

  const season =
    numberOrNull(
      state?.season
    );

  if (
    !Number.isInteger(
      season
    )
  ) {
    throw new Error(
      'Sleeper did not return a valid NFL season.'
    );
  }

  const stateWeek =
    Math.max(
      1,

      numberOrNull(
        state?.display_week
      ) || 1,

      numberOrNull(
        state?.week
      ) || 1,

      numberOrNull(
        state?.leg
      ) || 1
    );

  const upperWeek =
    Math.min(
      MAX_AUTO_RECAP_WEEK,
      stateWeek
    );

  /*
   * Scan backward.
   *
   * This handles both possibilities:
   * - Sleeper has already advanced
   *   to the next week (all zeroes).
   * - Sleeper still reports the week
   *   that just finished.
   */
  for (
    let week =
      upperWeek;

    week >= 1;

    week -= 1
  ) {
    const candidateUrl =
      packetUrl({
        url,
        season,
        week
      });

    const context =
      await resolveLeagueContext({
        url:
          candidateUrl,

        env,

        allWeeksByDefault:
          false
      });

    const matchups =
      await getSleeperMatchupsForWeek(
        context.leagueId,
        week
      );

    const expectedRosterCount =
      Number(
        context.league
          ?.total_rosters ||
        0
      );

    if (
      matchupsLookComplete(
        matchups,
        expectedRosterCount
      )
    ) {
      return {
        season,
        week,
        leagueId:
          context.leagueId
      };
    }
  }

  return null;
}


export async function POST({
  request,
  url,
  platform
}) {
  const env =
    platform?.env;

  if (
    !isAuthorized(
      request,
      env
    )
  ) {
    return json(
      {
        ok: false,
        error:
          'Unauthorized.'
      },
      {
        status: 401
      }
    );
  }

  const db =
    env?.DB;

  if (!db) {
    return json(
      {
        ok: false,
        error:
          'D1 binding is unavailable.'
      },
      {
        status: 500
      }
    );
  }

  const apiKey =
    String(
      env?.OPENAI_API_KEY ||
      ''
    ).trim();

  if (!apiKey) {
    return json(
      {
        ok: false,
        error:
          'OPENAI_API_KEY is not configured.'
      },
      {
        status: 500
      }
    );
  }

  try {
    const seasonParam =
      numberOrNull(
        url.searchParams.get(
          'season'
        )
      );

    const weekParam =
      numberOrNull(
        url.searchParams.get(
          'week'
        )
      );

    const force =
      url.searchParams.get(
        'force'
      ) ===
      '1';

    /*
     * Explicit season/week is handy
     * for safe manual testing.
     *
     * Normal cron calls provide neither.
     */
    const hasExplicitSelection =
      Number.isInteger(
        seasonParam
      ) &&
      Number.isInteger(
        weekParam
      );

    if (
      (
        seasonParam !== null ||
        weekParam !== null
      ) &&
      !hasExplicitSelection
    ) {
      return json(
        {
          ok: false,
          error:
            'Provide both season and week, or neither.'
        },
        {
          status: 400
        }
      );
    }

    const selection =
      hasExplicitSelection
        ? {
            season:
              seasonParam,

            week:
              weekParam
          }
        : await findLatestCompletedWeek({
            url,
            env
          });

    if (!selection) {
      return json({
        ok: true,

        status:
          'skipped',

        reason:
          'No completed Irving fantasy week was found.'
      });
    }

    const {
      season,
      week
    } =
      selection;

    if (
      week < 1 ||
      week >
        MAX_AUTO_RECAP_WEEK
    ) {
      return json(
        {
          ok: false,

          error:
            'Selected week is outside the automatic recap window.'
        },
        {
          status: 400
        }
      );
    }

    const existing =
      await getWeeklyRecap(
        db,
        {
          season,
          week
        }
      );

      const dryRun =
  url.searchParams.get(
    'dryRun'
  ) ===
  '1';

if (dryRun) {
  return json({
    ok: true,

    status:
      'dry_run',

    season,
    week,

    existing: {
      found:
        Boolean(existing),

      hasDraft:
        Boolean(
          existing?.draftRecap
        ),

      hasPublished:
        Boolean(
          existing?.publishedRecap
        )
    }
  });
}

    /*
     * The cron should never stomp on
     * something Dave has already worked on.
     */
    if (
      !force &&
      (
        existing?.draftRecap ||
        existing?.publishedRecap
      )
    ) {
      return json({
        ok: true,

        status:
          'skipped',

        reason:
          'A draft or published recap already exists.',

        season,
        week
      });
    }

    const recapUrl =
      packetUrl({
        url,
        season,
        week
      });

    console.log(
      `[weekly-cron] Building ${season} Week ${week} packet.`
    );

    const packet =
      await buildWeeklyRecapPacket({
        url:
          recapUrl,

        env
      });

    console.log(
      `[weekly-cron] Sending ${season} Week ${week} to OpenAI.`
    );

    const {
      recap,
      meta
    } =
      await generateWeeklyRecap({
        packet,
        apiKey
      });

    console.log(
      `[weekly-cron] Saving ${season} Week ${week} draft.`
    );

    const savedRecap =
      await saveWeeklyRecapDraft(
        db,
        {
          season,
          week,

          leagueId:
            packet.league.id,

          recap,

          packet,

          aiMeta:
            meta,

          generatedBy:
            'automation'
        }
      );

    await upsertWeeklyRecapDraftPost(
      db,
      {
        season,
        week,

        title:
          recap.title,

        subtitle:
          recap.subtitle
      }
    );

    return json(
      {
        ok: true,

        status:
          'draft_created',

        season,
        week,

        title:
          recap.title,

        generatedAt:
          savedRecap
            ?.draftGeneratedAt ||
          null
      },
      {
        status: 201
      }
    );
  } catch (error) {
    console.error(
      '[weekly-cron] Auto draft failed:',
      error
    );

    return json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Automatic recap generation failed.'
      },
      {
        status: 500
      }
    );
  }
}