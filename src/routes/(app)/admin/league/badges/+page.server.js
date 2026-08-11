import { fail } from '@sveltejs/kit';

import {
  getManagers
} from '$lib/server/league';

import {
  getBadgeDefinitions,
  getRecentBadgeAwards,
  awardBadge,
  revokeBadge
} from '$lib/server/league/badgeRepository';

import {
  resolveLeagueContext
} from '$lib/server/league/context.js';

import {
  buildWeeklyBadgePreview
} from '$lib/server/league/weeklyBadgeGenerator.js';


function parseOptionalNumber(value) {
  if (
    value == null ||
    String(value).trim() === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function clean(value) {
  const text =
    String(value ?? '').trim();

  return text || null;
}


function managerSnapshot(manager) {
  if (!manager) {
    return null;
  }

  return {
    managerId:
      manager.managerID,

    managerName:
      manager.name,

    teamName:
      manager.teamName,

    teamLogo:
      manager.photo || null
  };
}


async function getAutomationContext({
  form,
  url,
  platform
}) {
  const season =
    String(
      form.get('automationSeason') ||
      new Date().getFullYear()
    );

  const week =
    Number(
      form.get('automationWeek')
    );

  if (
    !Number.isInteger(week) ||
    week < 1 ||
    week > 18
  ) {
    throw new Error(
      'Choose a valid week.'
    );
  }

  const contextUrl =
    new URL(url);

  contextUrl.searchParams.set(
    'season',
    season
  );

  contextUrl.searchParams.set(
    'week',
    String(week)
  );

  const context =
    await resolveLeagueContext({
      url: contextUrl,
      env: platform?.env
    });

  return {
    season:
      String(context.season),

    week,

    leagueId:
      context.leagueId
  };
}


/*
 * =========================================================
 * LOAD
 * =========================================================
 */

export async function load({
  platform,
  url
}) {
  const db =
    platform?.env?.DB;

  if (!db) {
    throw new Error(
      'Cloudflare D1 binding "DB" is unavailable.'
    );
  }

  const season =
    url.searchParams.get('season') ??
    String(
      new Date().getFullYear()
    );

  const [
    badges,
    awards
  ] = await Promise.all([
    getBadgeDefinitions(db),

    getRecentBadgeAwards(
      db,
      {
        season,
        limit: 100
      }
    )
  ]);

  const managers =
    getManagers()
      .map((manager) => ({
        id:
          manager.managerID,

        name:
          manager.name,

        teamName:
          manager.teamName,

        photo:
          manager.photo || null
      }))
      .sort((a, b) =>
        a.teamName.localeCompare(
          b.teamName
        )
      );

  const managerIndex =
    new Map(
      managers.map(
        (manager) => [
          String(manager.id),
          manager
        ]
      )
    );

  const enrichedAwards =
    awards.map((award) => {
      const currentManager =
        managerIndex.get(
          String(
            award.manager_id
          )
        );

      const opponent =
        award.opponent_manager_id
          ? managerIndex.get(
              String(
                award.opponent_manager_id
              )
            )
          : null;

      const nominator =
        award.nominated_by_manager_id
          ? managerIndex.get(
              String(
                award.nominated_by_manager_id
              )
            )
          : null;

      return {
        ...award,

        managerName:
          award.metadata?.managerName ||
          currentManager?.name ||
          award.manager_id,

        teamName:
          award.metadata?.teamName ||
          currentManager?.teamName ||
          'Unknown team',

        teamLogo:
          award.metadata?.teamLogo ||
          currentManager?.photo ||
          null,

        opponentName:
          award.metadata?.opponentName ||
          opponent?.name ||
          null,

        opponentTeamName:
          award.metadata?.opponentTeamName ||
          opponent?.teamName ||
          null,

        nominatedByName:
          award.metadata?.nominatedByName ||
          nominator?.name ||
          null,

        nominatedByTeamName:
          award.metadata?.nominatedByTeamName ||
          nominator?.teamName ||
          null
      };
    });

  return {
    season,
    badges,
    managers,
    awards:
      enrichedAwards
  };
}


/*
 * =========================================================
 * ACTIONS
 * =========================================================
 */

export const actions = {

  /*
   * -------------------------------------------------------
   * MANUAL AWARD
   * -------------------------------------------------------
   */

  award: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !locals.user ||
      locals.user.role !== 'admin'
    ) {
      return fail(403, {
        ok: false,
        error:
          'Admin access required.'
      });
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(500, {
        ok: false,
        error:
          'Cloudflare D1 binding is unavailable.'
      });
    }

    const form =
      await request.formData();

    const badgeKey =
      clean(
        form.get('badgeKey')
      );

    const managerId =
      clean(
        form.get('managerId')
      );

    const season =
      clean(
        form.get('season')
      ) ??
      String(
        new Date().getFullYear()
      );

    const week =
      parseOptionalNumber(
        form.get('week')
      );

    const reason =
      clean(
        form.get('reason')
      );

    const score =
      parseOptionalNumber(
        form.get('score')
      );

    const opponentManagerId =
      clean(
        form.get(
          'opponentManagerId'
        )
      );

    const opponentScore =
      parseOptionalNumber(
        form.get(
          'opponentScore'
        )
      );

    const nominatedByManagerId =
      clean(
        form.get(
          'nominatedByManagerId'
        )
      );

    if (
      !badgeKey ||
      !managerId
    ) {
      return fail(400, {
        ok: false,
        error:
          'Choose both a badge and a team.'
      });
    }

    const managers =
      getManagers();

    const manager =
      managers.find(
        (item) =>
          String(
            item.managerID
          ) ===
          String(managerId)
      );

    if (!manager) {
      return fail(400, {
        ok: false,
        error:
          'Selected manager could not be found.'
      });
    }

    const opponent =
      opponentManagerId
        ? managers.find(
            (item) =>
              String(
                item.managerID
              ) ===
              String(
                opponentManagerId
              )
          )
        : null;

    const nominator =
      nominatedByManagerId
        ? managers.find(
            (item) =>
              String(
                item.managerID
              ) ===
              String(
                nominatedByManagerId
              )
          )
        : null;

    const managerMeta =
      managerSnapshot(
        manager
      );

    const opponentMeta =
      managerSnapshot(
        opponent
      );

    const nominatorMeta =
      managerSnapshot(
        nominator
      );

    const metadata = {
      managerName:
        managerMeta.managerName,

      teamName:
        managerMeta.teamName,

      teamLogo:
        managerMeta.teamLogo,

      ...(opponentMeta
        ? {
            opponentName:
              opponentMeta.managerName,

            opponentTeamName:
              opponentMeta.teamName,

            opponentTeamLogo:
              opponentMeta.teamLogo
          }
        : {}),

      ...(nominatorMeta
        ? {
            nominatedByName:
              nominatorMeta.managerName,

            nominatedByTeamName:
              nominatorMeta.teamName,

            nominatedByTeamLogo:
              nominatorMeta.teamLogo
          }
        : {})
    };

    try {
      const result =
        await awardBadge(
          db,
          {
            badgeKey,
            managerId,

            season,
            week,

            reason,
            score,

            opponentManagerId,
            opponentScore,

            nominatedByManagerId,

            source:
              'manual',

            awardedBy:
              locals.user.id,

            metadata
          }
        );

      return {
        ok: true,

        action:
          'award',

        message:
          `${manager.teamName} received the badge.`,

        result
      };
    } catch (error) {
      console.error(
        'Manual badge award failed:',
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unable to award badge.';

      if (
        message.includes(
          'UNIQUE constraint failed'
        )
      ) {
        return fail(409, {
          ok: false,

          error:
            'That team already has this badge for the selected week/year.'
        });
      }

      return fail(500, {
        ok: false,
        error: message
      });
    }
  },


  /*
   * -------------------------------------------------------
   * REVOKE
   * -------------------------------------------------------
   */

  revoke: async ({
    request,
    platform,
    locals
  }) => {
    if (
      !locals.user ||
      locals.user.role !== 'admin'
    ) {
      return fail(403, {
        ok: false,
        error:
          'Admin access required.'
      });
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(500, {
        ok: false,
        error:
          'Cloudflare D1 binding is unavailable.'
      });
    }

    const form =
      await request.formData();

    const awardId =
      form.get('awardId');

    try {
      const result =
        await revokeBadge(
          db,
          awardId
        );

      return {
        ok: true,
        action:
          'revoke',

        message:
          'Badge award revoked.',

        result
      };
    } catch (error) {
      return fail(400, {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : 'Unable to revoke badge.'
      });
    }
  },


  /*
   * -------------------------------------------------------
   * GENERATE / PREVIEW
   * -------------------------------------------------------
   */

  previewWeekly: async ({
    request,
    platform,
    locals,
    url
  }) => {
    if (
      !locals.user ||
      locals.user.role !== 'admin'
    ) {
      return fail(403, {
        ok: false,
        error:
          'Admin access required.'
      });
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(500, {
        ok: false,
        error:
          'Cloudflare D1 binding is unavailable.'
      });
    }

    const form =
      await request.formData();

    try {
      const {
        season,
        week,
        leagueId
      } =
        await getAutomationContext({
          form,
          url,
          platform
        });

      const preview =
        await buildWeeklyBadgePreview({
          db,
          leagueId,
          season,
          week
        });

      return {
        ok: true,

        action:
          'previewWeekly',

        automationSeason:
          season,

        automationWeek:
          week,

        preview
      };
    } catch (error) {
      console.error(
        'Badge preview failed:',
        error
      );

      return fail(400, {
        ok: false,

        action:
          'previewWeekly',

        automationSeason:
          String(
            form.get(
              'automationSeason'
            ) || ''
          ),

        automationWeek:
          Number(
            form.get(
              'automationWeek'
            )
          ) || null,

        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate weekly awards.'
      });
    }
  },


  /*
   * -------------------------------------------------------
   * COMMIT GENERATED AWARDS
   * -------------------------------------------------------
   */

  commitWeekly: async ({
    request,
    platform,
    locals,
    url
  }) => {
    if (
      !locals.user ||
      locals.user.role !== 'admin'
    ) {
      return fail(403, {
        ok: false,
        error:
          'Admin access required.'
      });
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(500, {
        ok: false,
        error:
          'Cloudflare D1 binding is unavailable.'
      });
    }

    const form =
      await request.formData();

    try {
      const {
        season,
        week,
        leagueId
      } =
        await getAutomationContext({
          form,
          url,
          platform
        });

      /*
       * Regenerate server-side rather than trusting
       * anything posted back by the browser.
       */
      const preview =
        await buildWeeklyBadgePreview({
          db,
          leagueId,
          season,
          week
        });

      let committed = 0;
      let skipped = 0;

      for (
        const candidate of
        preview.candidates
      ) {
        if (
          candidate.alreadyAwarded
        ) {
          skipped++;
          continue;
        }

        try {
          await awardBadge(
            db,
            {
              badgeKey:
                candidate.badgeKey,

              managerId:
                candidate.managerId,

              season:
                candidate.season,

              week:
                candidate.week,

              reason:
                candidate.reason,

              score:
                candidate.score,

              opponentManagerId:
                candidate.opponentManagerId,

              opponentScore:
                candidate.opponentScore,

              source:
                'automatic',

              awardedBy:
                locals.user.id,

              metadata:
                candidate.metadata
            }
          );

          committed++;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : String(error);

          if (
            message.includes(
              'UNIQUE constraint failed'
            )
          ) {
            skipped++;
            continue;
          }

          throw error;
        }
      }

      const refreshed =
        await buildWeeklyBadgePreview({
          db,
          leagueId,
          season,
          week
        });

      return {
        ok: true,

        action:
          'commitWeekly',

        automationSeason:
          season,

        automationWeek:
          week,

        message:
          committed
            ? `Committed ${committed} weekly badge award${committed === 1 ? '' : 's'}.`
            : 'No new awards needed to be committed.',

        committed,
        skipped,

        preview:
          refreshed
      };
    } catch (error) {
      console.error(
        'Badge commit failed:',
        error
      );

      return fail(400, {
        ok: false,

        action:
          'commitWeekly',

        error:
          error instanceof Error
            ? error.message
            : 'Unable to commit weekly awards.'
      });
    }
  }
};