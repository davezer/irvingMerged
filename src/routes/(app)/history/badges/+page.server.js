import {
  getBadgeCabinet
} from '$lib/server/league/badgeRepository';


export const load = async ({
  platform
}) => {
  const db =
    platform?.env?.DB;

  if (!db) {
    throw new Error(
      'Cloudflare D1 binding "DB" is unavailable.'
    );
  }


  const badgeCabinet =
    await getBadgeCabinet(db);


  const categoryStats =
    Object.entries(
      badgeCabinet.sections || {}
    ).map(
      ([key, badges]) => ({
        key,

        definitions:
          badges.length,

        earnedDefinitions:
          badges.filter(
            (badge) =>
              Number(
                badge?.count || 0
              ) > 0
          ).length,

        awards:
          badges.reduce(
            (sum, badge) =>
              sum +
              Number(
                badge?.count || 0
              ),
            0
          )
      })
    );


  return {
    sections:
      badgeCabinet.sections,

    byManager:
      badgeCabinet.byManager,

    badgeMeta:
      badgeCabinet.meta,

    categoryStats,

    stats: {
      definitions:
        badgeCabinet.meta
          ?.definitions ?? 0,

      awards:
        badgeCabinet.meta
          ?.displayedAwards ?? 0,

      managers:
        Object.keys(
          badgeCabinet.byManager || {}
        ).length,

      earnedBadges:
        categoryStats.reduce(
          (sum, category) =>
            sum +
            category.earnedDefinitions,
          0
        )
    }
  };
};