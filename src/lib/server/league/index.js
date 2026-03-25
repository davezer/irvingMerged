
import { standings, sleeperManagers, drafts, draftPicks, trades, waivers } from '$lib/data/leagueSeed';
import { managers, leagueName, homepageText } from '$lib/legacy/leagueInfo';

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const managerIndex = new Map(managers.map((m, idx) => [m.managerID, { ...m, index: idx, slug: slugify(m.teamName || m.name) }]));
const sleeperIndex = new Map(sleeperManagers.map((m) => [m.user_id, m]));

export function getManagers() {
  return managers.map((m, idx) => {
    const sleeper = sleeperIndex.get(m.managerID) || {};
    return {
      ...m,
      index: idx,
      slug: slugify(m.teamName || m.name),
      avatar: sleeper.avatar || m.photo,
      displayName: sleeper.display_name || m.name,
      username: sleeper.username || null
    };
  });
}

export function getStandings() {
  const rows = standings.map((row) => {
    const matched = getManagers().find((m) => m.name.replaceAll(' ', '_') === row.name || m.managerID === row.user_id || m.teamName === row.team_name);
    const wins = Number(row.wins || 0);
    const losses = Number(row.losses || 0);
    const ties = Number(row.ties || 0);
    const pct = wins + losses + ties > 0 ? ((wins + ties * 0.5) / (wins + losses + ties)) : 0;
    const points = Number(`${row.fpts}.${row.fpts_decimal || 0}`);
    return {
      ...row,
      wins,
      losses,
      ties,
      pct,
      points,
      manager: matched || null,
      teamName: matched?.teamName || row.team_name,
      displayName: matched?.name || String(row.name || '').replaceAll('_', ' '),
      slug: matched?.slug || slugify(matched?.teamName || row.team_name || row.name)
    };
  }).sort((a,b) => (b.wins-a.wins) || (b.points-a.points));

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

export function getManagerBySlug(slug) {
  return getManagers().find((m) => m.slug === slug) || null;
}

export function getManagerSnapshot(slug) {
  const manager = getManagerBySlug(slug);
  if (!manager) return null;
  const standing = getStandings().find((s) => s.slug === slug) || null;
  const picks = draftPicks.filter((p) => p.picked_by === manager.managerID);
  const topSpend = [...picks].sort((a,b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 5);
  return {
    manager,
    standing,
    picks,
    topSpend,
    recordLabel: standing ? `${standing.wins}-${standing.losses}${standing.ties ? '-' + standing.ties : ''}` : '—',
    totalSpend: picks.reduce((sum, p) => sum + Number(p.price || 0), 0)
  };
}

export function getDraftOverview() {
  const current = drafts[0] || null;
  const topPicks = [...draftPicks].sort((a,b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 24);
  return {
    current,
    totalPicks: draftPicks.length,
    topPicks,
    byManager: getManagers().map((m) => {
      const picks = draftPicks.filter((p) => p.picked_by === m.managerID);
      return {
        manager: m,
        picks: picks.length,
        spend: picks.reduce((sum, p) => sum + Number(p.price || 0), 0),
        mostExpensive: [...picks].sort((a,b) => Number(b.price || 0) - Number(a.price || 0))[0] || null
      };
    }).sort((a,b) => b.spend - a.spend)
  };
}

export function getTransactionsOverview() {
  const all = [
    ...trades.map((t) => ({ ...t, kind: 'trade' })),
    ...waivers.map((w) => ({ ...w, kind: 'waiver' }))
  ];
  return {
    total: all.length,
    tradesCount: trades.length,
    waiversCount: waivers.length,
    items: all
  };
}

export function getHomepageStats() {
  const standings = getStandings();
  const draft = getDraftOverview();
  return {
    leagueName,
    homepageText,
    totalManagers: getManagers().length,
    totalGames: standings.reduce((sum, row) => sum + row.wins + row.losses + row.ties, 0) / 2,
    topSeed: standings[0] || null,
    mostExpensivePick: draft.topPicks[0] || null
  };
}

export function getNewsPosts() {
  const standings = getStandings();
  const draft = getDraftOverview();
  const tx = getTransactionsOverview();
  const topSeed = standings[0];
  return [
    {
      slug: 'lounge-launch',
      title: 'The Lounge Merge Begins',
      excerpt: 'Irving Collective is becoming the private clubhouse for every Irving League ritual: standings, picks, history, and the full admin command center.',
      body: 'This build is the merged foundation. The visual language, route map, and Cloudflare-first architecture now point both worlds into a single members-only app.',
      tag: 'Product',
      publishedAt: '2026-03-24'
    },
    {
      slug: 'top-seed-watch',
      title: `${topSeed?.teamName || 'League'} currently holds the top seed`,
      excerpt: `${topSeed?.displayName || 'A manager'} leads the table at ${topSeed?.wins || 0}-${topSeed?.losses || 0}.`,
      body: 'Standings are now a first-class league surface inside the merged app, setting the tone for dashboards, manager dossiers, and postseason tracking.',
      tag: 'League',
      publishedAt: '2026-03-24'
    },
    {
      slug: 'draft-economy',
      title: 'Draft economy snapshot',
      excerpt: `${draft.totalPicks} auction picks have been preserved in the migration scaffold, including spend data and manager-by-manager summaries.`,
      body: 'This route is designed to evolve into a full D1-backed draft archive with round views, keeper support, and historical comparison.',
      tag: 'Drafts',
      publishedAt: '2026-03-24'
    },
    {
      slug: 'transactions-pending',
      title: 'Transactions are wired for archive migration',
      excerpt: `Current exported activity count: ${tx.total}. Trade and waiver pipelines are scaffolded for D1 normalization.`,
      body: 'As more historical exports get dropped in, the transactions section can become a permanent searchable archive instead of a legacy helper flow.',
      tag: 'Operations',
      publishedAt: '2026-03-24'
    }
  ];
}

export function getHistoryModules() {
  return [
    {
      title: 'Records',
      href: '/history/records',
      description: 'Single-game, single-season, and all-time bragging rights. Scaffolded as a structured D1 domain instead of fragile helper output.'
    },
    {
      title: 'Awards',
      href: '/history/awards',
      description: 'Championships, toilet bowls, division honors, and the ceremonial layer that makes the league feel alive.'
    },
    {
      title: 'Badges',
      href: '/history/badges',
      description: 'Persona-driven identity markers for managers, rivalries, and career storylines.'
    },
    {
      title: 'Rivalry',
      href: '/history/rivalry',
      description: 'Head-to-head animosity, respect, and grudges — reimagined as dossier-grade comparisons.'
    }
  ];
}
