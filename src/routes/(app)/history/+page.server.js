import {
  getManagers,
  getRivalries
} from '$lib/server/league';

import {
  getBadgeCabinet
} from '$lib/server/league/badgeRepository';

import {
  resolveLeagueContext
} from '$lib/server/league/context.js';

import {
  getMergedHistoryArchive
} from '$lib/server/league/historyArchive.js';

const ARCHIVE_START_YEAR = 2003;

function championshipLeagueForYear(manager, year) {
  return (
    manager?.championship?.leagueByYear?.[year] ||
    manager?.championship?.league ||
    'Legacy'
  );
}


function parseChampionshipYears(manager) {
  const raw =
    manager?.championship?.years;

  if (!raw) {
    return [];
  }

  return String(raw)
    .split(',')
    .map((value) =>
      Number(value.trim())
    )
    .filter((value) =>
      Number.isInteger(value)
    );
}


function buildChampionshipLedger(managers) {
  return managers
    .flatMap((manager) => {
      const years =
        parseChampionshipYears(manager);

      return years.map((year) => ({
  year,

  league:
    championshipLeagueForYear(
      manager,
      year
    ),

  managerId:
    manager.managerID,

  managerName:
    manager.name,

  teamName:
    manager.teamName,

  photo:
    manager.photo,

  slug:
    manager.slug
}));
    })
    .sort((a, b) => {
      return (
        b.year - a.year ||
        String(a.league)
          .localeCompare(
            String(b.league)
          ) ||
        a.teamName.localeCompare(
          b.teamName
        )
      );
    });
}


function buildTitleLeaders(managers) {
  return managers
    .map((manager) => {
      const years =
        parseChampionshipYears(manager);

      return {
        managerId:
          manager.managerID,

        managerName:
          manager.name,

        teamName:
          manager.teamName,

        photo:
          manager.photo,

        slug:
          manager.slug,

        league:
          manager?.championship?.league ||
          null,

        years:
          [...years].sort(
            (a, b) => b - a
          ),

        count:
          years.length
      };
    })
    .filter((manager) =>
      manager.count > 0
    )
    .sort((a, b) => {
      return (
        b.count - a.count ||
        (b.years[0] || 0) -
          (a.years[0] || 0) ||
        a.teamName.localeCompare(
          b.teamName
        )
      );
    });
}


function buildLeagueTotals(championships) {
  const totals =
    new Map();

  for (const championship of championships) {
    const league =
      championship.league ||
      'Legacy';

    totals.set(
      league,
      (totals.get(league) || 0) + 1
    );
  }

  return [...totals.entries()]
    .map(([league, count]) => ({
      league,
      count
    }))
    .sort(
      (a, b) =>
        b.count - a.count
    );
}


function buildTenureLeaders(managers) {
  return managers
    .filter((manager) =>
      Number.isInteger(
        Number(
          manager.fantasyStart
        )
      )
    )
    .map((manager) => ({
      managerId:
        manager.managerID,

      managerName:
        manager.name,

      teamName:
        manager.teamName,

      photo:
        manager.photo,

      slug:
        manager.slug,

      fantasyStart:
        Number(
          manager.fantasyStart
        )
    }))
    .sort((a, b) => {
      return (
        a.fantasyStart -
          b.fantasyStart ||
        a.teamName.localeCompare(
          b.teamName
        )
      );
    })
    .slice(0, 6);
}


function buildBadgeHighlights(sections) {
  const allBadges =
    Object.values(
      sections || {}
    ).flat();

  return allBadges
    .filter((badge) =>
      Number(badge?.count || 0) > 0
    )
    .sort((a, b) => {
      return (
        Number(b.count || 0) -
          Number(a.count || 0) ||
        String(a.name || '')
          .localeCompare(
            String(b.name || '')
          )
      );
    })
    .slice(0, 6)
    .map((badge) => ({
      id:
        badge.id,

      name:
        badge.name,

      definition:
        badge.definition,

      icon:
        badge.icon ||
        '/badges/stains.png',

      count:
        Number(
          badge.count || 0
        )
    }));
}


function buildBadgeCategories(sections) {
  return Object.entries(
    sections || {}
  ).map(([key, badges]) => ({
    key,

    definitions:
      badges.length,

    awards:
      badges.reduce(
        (sum, badge) =>
          sum +
          Number(
            badge?.count || 0
          ),
        0
      )
  }));
}


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


  const currentYear =
    new Date().getFullYear();

  const managers =
    getManagers();

  const championships =
    buildChampionshipLedger(
      managers
    );

  const titleLeaders =
    buildTitleLeaders(
      managers
    );

  const tenureLeaders =
    buildTenureLeaders(
      managers
    );

  const leagueTotals =
    buildLeagueTotals(
      championships
    );

  const rivalryDefinitions =
  getRivalries();

const context =
  await resolveLeagueContext({
    url,
    env:
      platform?.env,
    allWeeksByDefault:
      false
  });

const mergedArchive =
  await getMergedHistoryArchive({
    db,

    env:
  platform?.env,

    rootLeagueId:
      context.rootLeagueId,

    currentSeason:
      context.currentSeason,

    currentWeek:
      context.currentWeek,

    managers,

    rivalries:
      rivalryDefinitions
  });

const rivalries =
  mergedArchive.rivalries
    .slice(0, 4);

  const badgeCabinet =
    await getBadgeCabinet(
      db
    );

  const badgeHighlights =
    buildBadgeHighlights(
      badgeCabinet.sections
    );

  const badgeCategories =
    buildBadgeCategories(
      badgeCabinet.sections
    );

  const championshipYears =
    [
      ...new Set(
        championships.map(
          (item) => item.year
        )
      )
    ];

  const archiveYears =
    Array.from(
      {
        length:
          currentYear -
          ARCHIVE_START_YEAR +
          1
      },
      (_, index) =>
        currentYear - index
    );


  return {
    currentYear,

    archiveStartYear:
      ARCHIVE_START_YEAR,

    historyYears:
      currentYear -
      ARCHIVE_START_YEAR,

    archiveYears,

    championshipYears,

    championships,

    recentChampionships:
      championships.slice(
        0,
        8
      ),

    titleLeaders,

    leagueTotals,

    tenureLeaders,

    rivalries,

    badgeHighlights,

    badgeCategories,

     mergerStartYear:
  mergedArchive.mergerStartYear,

seasonArchive:
  mergedArchive.seasonArchive,

    badgeMeta:
      badgeCabinet.meta,

    archiveStats: {
      franchises:
        managers.length,

      championships:
        championships.length,

      champions:
        titleLeaders.length,

      rivalries:
        getRivalries().length
    },
   
  };
};