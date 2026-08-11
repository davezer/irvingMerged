import {
  getTeamsIndexBundle
} from '$lib/server/league/franchisePages.js';

import {
  getDraftCapitalBalances
} from '$lib/server/league/draftCapitalRepository.js';


export async function load({
  url,
  platform
}) {
  const env =
    platform?.env;


  /*
   * Load the normal Sleeper/team directory data.
   */
  const bundle =
    await getTeamsIndexBundle({
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
   * ============================================================
   * DRAFT CAPITAL
   *
   * ONE D1 query for the entire league.
   *
   * No Google Sheets.
   * No Apps Script.
   * No 14 sequential fetches.
   * ============================================================
   */

  let balances = [];


  if (env?.DB) {
    try {
      balances =
        await getDraftCapitalBalances(
          env.DB,
          {
            year:
              season
          }
        );
    } catch (error) {
      console.warn(
        '[teams] D1 draft capital lookup failed:',
        error
      );
    }
  }


  const balanceByManager =
    new Map(
      balances.map(
        (row) => [
          String(
            row.managerId
          ),
          row
        ]
      )
    );


  /*
   * The team cards themselves don't carry managerID,
   * but bundle.dossiers does.
   */
  const dossiersBySlug =
    new Map(
      (
        bundle.dossiers ||
        []
      ).map(
        (row) => [
          row.slug,
          row
        ]
      )
    );


  const cards =
    (
      bundle.cards ||
      []
    ).map(
      (card) => {
        const dossier =
          dossiersBySlug.get(
            card.slug
          ) || {};


        const managerId =
          dossier.managerID ??
          dossier.managerId ??
          dossier.id ??
          null;


        const capital =
          managerId != null
            ? balanceByManager.get(
                String(
                  managerId
                )
              )
            : null;


        const value =
          capital?.balance ??
          null;


        return {
          ...card,

          futureDraftDollars:
            value,

          /*
           * Preserve this shape in case anything else
           * on the page expects draftMoney.
           */
          draftMoney: {
            value,

            balance:
              value,

            balanceCents:
              capital?.balanceCents ??
              null,

            year:
              season,

            managerId:
              managerId != null
                ? String(
                    managerId
                  )
                : null,

            source:
              capital
                ? 'D1 draft capital ledger'
                : 'D1 draft capital unavailable'
          }
        };
      }
    );


  return {
    ...bundle,

    season,

    cards
  };
}