import {
  getHistoryModules,
  getRecordsBoard,
  getRivalries
} from '$lib/server/league';

import {
  getBadgeCabinet
} from '$lib/server/league/badgeRepository';


export const load = async ({
  platform,
  url
}) => {
  const db =
    platform?.env?.DB;

  if (!db) {
    throw new Error(
      'Cloudflare D1 binding "DB" is unavailable.'
    );
  }

  const season =
    url.searchParams.get(
      'season'
    ) ??
    String(
      new Date().getFullYear()
    );

  const badgeCabinet =
    await getBadgeCabinet(
      db,
      { season }
    );

  return {
    modules:
      getHistoryModules(),

    records:
      getRecordsBoard()
        .slice(0, 2),

    rivalries:
      getRivalries()
        .slice(0, 2),

    sections:
      badgeCabinet.sections,

    byManager:
      badgeCabinet.byManager,

    badgeMeta:
      badgeCabinet.meta
  };
};