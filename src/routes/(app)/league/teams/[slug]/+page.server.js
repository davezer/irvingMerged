import {
  getTeamDetailBundle
} from '$lib/server/league/franchisePages.js';

import {
  getLegacyManagerBySlug
} from '$lib/server/league/identity.js';

import {
  getDraftCapitalRunningBalances
} from '$lib/server/league/draftCapitalRunningBalances.js';


export async function load({
  params,
  url,
  platform
}) {
  const env =
    platform?.env;


  /*
   * Load the normal individual-team dossier first.
   */
  const bundle =
    await getTeamDetailBundle({
      slug:
        params.slug,

      url,

      env
    });


  const season =
    Number(
      url.searchParams.get(
        'season'
      ) ||
      bundle.season
    );


  /*
   * The displayed league season manages the following
   * auction year's capital.
   *
   * 2025 season -> 2026 capital
   * 2026 season -> 2027 capital
   */
  const capitalYear =
    season + 1;


  /*
   * Resolve the same Irving/Sleeper manager ID used by
   * the Draft Capital ledger.
   */
  const profile =
    getLegacyManagerBySlug(
      params.slug
    );


  const managerId =
    profile?.managerID ??
    bundle.manager?.managerID ??
    bundle.manager?.managerId ??
    bundle.manager?.id ??
    null;


  let capital =
    null;


  if (
    env?.DB &&
    managerId != null
  ) {
    try {
      const balances =
        await getDraftCapitalRunningBalances(
          env.DB,
          {
            year:
              capitalYear
          }
        );


      capital =
        balances.find(
          (row) =>
            String(
              row.managerId
            ) ===
            String(
              managerId
            )
        ) ||
        null;

    } catch (error) {
      console.warn(
        '[team detail] D1 draft capital lookup failed:',
        error
      );
    }
  }


  /*
   * If D1 is available, use the exact same rolled-forward
   * balance logic as the Teams index page.
   *
   * Fall back to the dossier's existing value only if the
   * D1 lookup is unavailable.
   */
  const value =
    capital?.balance ??
    bundle.draftMoney?.value ??
    null;


  return {
    ...bundle,

    season,

    futureDraftDollars:
      value,

    draftMoney: {
      ...(
        bundle.draftMoney ||
        {}
      ),

      value,

      balance:
        value,

      balanceCents:
        capital?.balanceCents ??
        bundle.draftMoney?.balanceCents ??
        null,

      year:
        capitalYear,

      managerId:
        managerId != null
          ? String(
              managerId
            )
          : null,

      source:
        capital
          ? 'D1 rolled-forward draft capital ledger'
          : bundle.draftMoney?.source ||
            'D1 draft capital unavailable'
    }
  };
}
