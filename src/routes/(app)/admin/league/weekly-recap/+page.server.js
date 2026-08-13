import {
  fail
} from '@sveltejs/kit';

import {
  buildWeeklyRecapPacket
} from '$lib/server/league/weeklyRecapPacket.js';

function validSeason(value) {
  const season =
    Number(value);

  return Number.isInteger(
    season
  ) &&
  season >= 2017 &&
  season <= 2100;
}

function validWeek(value) {
  const week =
    Number(value);

  return Number.isInteger(
    week
  ) &&
  week >= 1 &&
  week <= 18;
}

export function load({
  url
}) {
  const season =
    Number(
      url.searchParams.get(
        'season'
      ) || 2025
    );

  const week =
    Number(
      url.searchParams.get(
        'week'
      ) || 8
    );

  return {
    defaultSeason:
      validSeason(season)
        ? season
        : 2025,

    defaultWeek:
      validWeek(week)
        ? week
        : 8
  };
}

export const actions = {
  build: async ({
    request,
    url,
    platform
  }) => {
    const form =
      await request.formData();

    const season =
      Number(
        form.get('season')
      );

    const week =
      Number(
        form.get('week')
      );

    if (
      !validSeason(
        season
      )
    ) {
      return fail(
        400,
        {
          ok: false,
          season,
          week,
          error:
            'Choose a valid season.'
        }
      );
    }

    if (
      !validWeek(
        week
      )
    ) {
      return fail(
        400,
        {
          ok: false,
          season,
          week,
          error:
            'Choose a week from 1 through 18.'
        }
      );
    }

    const packetUrl =
      new URL(
        url
      );

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

    try {
      const packet =
        await buildWeeklyRecapPacket({
          url:
            packetUrl,

          env:
            platform?.env
        });

      return {
        ok:
          true,

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
  }
};