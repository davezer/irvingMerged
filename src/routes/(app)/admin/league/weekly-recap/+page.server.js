import {
  fail
} from '@sveltejs/kit';

import {
  buildWeeklyRecapPacket
} from '$lib/server/league/weeklyRecapPacket.js';

import {
  upsertWeeklyRecapPost
} from '$lib/server/league/weeklyPostRepository.js';

import {
  getWeeklyRecap,
  publishWeeklyRecap,
  saveWeeklyRecapDraft
} from '$lib/server/league/weeklyRecapRepository.js';


function validSeason(
  value
) {
  const season =
    Number(value);

  return (
    Number.isInteger(
      season
    ) &&
    season >= 2017 &&
    season <= 2100
  );
}


function validWeek(
  value
) {
  const week =
    Number(value);

  return (
    Number.isInteger(
      week
    ) &&
    week >= 1 &&
    week <= 18
  );
}


function validateSelection(
  season,
  week
) {
  if (
    !validSeason(
      season
    )
  ) {
    return 'Choose a valid season.';
  }

  if (
    !validWeek(
      week
    )
  ) {
    return 'Choose a week from 1 through 18.';
  }

  return null;
}


function buildPacketUrl({
  url,
  season,
  week
}) {
  const packetUrl =
    new URL(url);

  packetUrl.searchParams.set(
    'season',
    String(season)
  );

  packetUrl.searchParams.set(
    'week',
    String(week)
  );

  packetUrl.searchParams.delete(
    'weeks'
  );

  packetUrl.searchParams.delete(
    'team'
  );

  packetUrl.searchParams.delete(
    'rosterId'
  );

  return packetUrl;
}


async function readSelection(
  request
) {
  const form =
    await request.formData();

  return {
    form,

    season:
      Number(
        form.get(
          'season'
        )
      ),

    week:
      Number(
        form.get(
          'week'
        )
      )
  };
}


function assertEditableRecap(
  recap
) {
  if (
    !recap ||
    typeof recap !==
      'object' ||
    Array.isArray(
      recap
    )
  ) {
    throw new Error(
      'The edited recap is not a valid recap object.'
    );
  }

  for (
    const field of [
      'title',
      'subtitle',
      'opening',
      'closing'
    ]
  ) {
    if (
      typeof recap[field] !==
      'string'
    ) {
      throw new Error(
        `The edited recap is missing "${field}".`
      );
    }
  }

  if (
    !String(
      recap.title
    ).trim()
  ) {
    throw new Error(
      'The recap title cannot be blank.'
    );
  }

  if (
    !Array.isArray(
      recap.matchupRecaps
    ) ||
    !recap.waiverWire ||
    !recap.tradeDesk ||
    !recap.standings ||
    !recap.awards
  ) {
    throw new Error(
      'The edited recap is missing one or more required sections.'
    );
  }
}


export async function load({
  url,
  platform
}) {
  const currentYear =
    new Date()
      .getFullYear();

  const season =
    Number(
      url.searchParams.get(
        'season'
      ) ||
      currentYear
    );

  const week =
    Number(
      url.searchParams.get(
        'week'
      ) ||
      1
    );

  const defaultSeason =
    validSeason(
      season
    )
      ? season
      : currentYear;

  const defaultWeek =
    validWeek(
      week
    )
      ? week
      : 1;

  const db =
    platform?.env?.DB;

  let savedRecap =
    null;

  if (db) {
    try {
      savedRecap =
        await getWeeklyRecap(
          db,
          {
            season:
              defaultSeason,

            week:
              defaultWeek
          }
        );
    } catch (error) {
      console.warn(
        '[weekly-recap] Could not load saved recap:',
        error
      );
    }
  }

  return {
    defaultSeason,
    defaultWeek,
    savedRecap
  };
}


export const actions = {
  build: async ({
    request,
    url,
    platform
  }) => {
    const {
      season,
      week
    } =
      await readSelection(
        request
      );

    const error =
      validateSelection(
        season,
        week
      );

    if (error) {
      return fail(
        400,
        {
          ok:
            false,

          season,
          week,
          error
        }
      );
    }

    try {
      const packet =
        await buildWeeklyRecapPacket({
          url:
            buildPacketUrl({
              url,
              season,
              week
            }),

          env:
            platform?.env
        });

      return {
        ok:
          true,

        mode:
          'packet',

        season,
        week,
        packet
      };
    } catch (error) {
      console.error(
        '[weekly-recap] Build failed:',
        error
      );

      return fail(
        500,
        {
          ok:
            false,

          season,
          week,

          error:
            error instanceof Error
              ? error.message
              : 'Could not build weekly recap packet.'
        }
      );
    }
  },


  save: async ({
    request,
    platform,
    locals
  }) => {
    const {
      form,
      season,
      week
    } =
      await readSelection(
        request
      );

    const selectionError =
      validateSelection(
        season,
        week
      );

    if (selectionError) {
      return fail(
        400,
        {
          ok:
            false,

          season,
          week,

          error:
            selectionError
        }
      );
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(
        500,
        {
          ok:
            false,

          season,
          week,

          error:
            'Cloudflare D1 binding is unavailable.'
        }
      );
    }

    try {
      const existing =
        await getWeeklyRecap(
          db,
          {
            season,
            week
          }
        );

      if (
        !existing
          ?.draftRecap
      ) {
        throw new Error(
          'Generate a draft before trying to edit it.'
        );
      }

      const rawRecap =
        String(
          form.get(
            'recap_json'
          ) ||
          ''
        );

      let recap;

      try {
        recap =
          JSON.parse(
            rawRecap
          );
      } catch {
        throw new Error(
          'The edited recap could not be read. Reload the page and try again.'
        );
      }

      assertEditableRecap(
        recap
      );

      const editedBy =
        locals.user?.id ||
        null;

      const aiMeta = {
        ...(
          existing.draftAiMeta ||
          {}
        ),

        manuallyEdited:
          true,

        manuallyEditedAt:
          new Date()
            .toISOString(),

        manuallyEditedBy:
          editedBy
      };

      const savedRecap =
        await saveWeeklyRecapDraft(
          db,
          {
            season,
            week,

            leagueId:
              existing.leagueId,

            recap,

            packet:
              existing.draftPacket,

            aiMeta,

            generatedBy:
              existing.draftGeneratedBy ||
              editedBy
          }
        );

      return {
        ok:
          true,

        mode:
          'save',

        season,
        week,
        savedRecap,

        message:
          `${season} Week ${week} draft changes saved.`
      };
    } catch (error) {
      console.error(
        '[weekly-recap] Save failed:',
        error
      );

      return fail(
        400,
        {
          ok:
            false,

          season,
          week,

          error:
            error instanceof Error
              ? error.message
              : 'Could not save recap edits.'
        }
      );
    }
  },


  publish: async ({
    request,
    platform,
    locals
  }) => {
    const {
      season,
      week
    } =
      await readSelection(
        request
      );

    const selectionError =
      validateSelection(
        season,
        week
      );

    if (selectionError) {
      return fail(
        400,
        {
          ok:
            false,

          season,
          week,

          error:
            selectionError
        }
      );
    }

    const db =
      platform?.env?.DB;

    if (!db) {
      return fail(
        500,
        {
          ok:
            false,

          season,
          week,

          error:
            'Cloudflare D1 binding is unavailable.'
        }
      );
    }

    try {
      const publishedBy =
        locals.user?.id ||
        null;

      const savedRecap =
        await publishWeeklyRecap(
          db,
          {
            season,
            week,
            publishedBy
          }
        );

      await upsertWeeklyRecapPost(
        db,
        {
          season,
          week,

          title:
            savedRecap.publishedTitle,

          subtitle:
            savedRecap.publishedSubtitle,

          publishedAt:
            savedRecap.publishedAt,

          publishedBy
        }
      );

      return {
        ok:
          true,

        mode:
          'publish',

        season,
        week,
        savedRecap,

        message:
          `${season} Week ${week} recap published.`
      };
    } catch (error) {
      console.error(
        '[weekly-recap] Publish failed:',
        error
      );

      return fail(
        400,
        {
          ok:
            false,

          season,
          week,

          error:
            error instanceof Error
              ? error.message
              : 'Could not publish recap.'
        }
      );
    }
  }
};
