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
const rankLabels = ['Commissioner’s Circle', 'Velvet Rope', 'High Stakes', 'Chasing the Board'];

function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

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
  const allManagers = getManagers();
  const rows = standings.map((row) => {
    const matched = allManagers.find((m) => m.name.replaceAll(' ', '_') === row.name || m.managerID === row.user_id || m.teamName === row.team_name);
    const wins = Number(row.wins || 0);
    const losses = Number(row.losses || 0);
    const ties = Number(row.ties || 0);
    const gamesPlayed = wins + losses + ties;
    const pct = gamesPlayed > 0 ? ((wins + ties * 0.5) / gamesPlayed) : 0;
    const points = Number(`${row.fpts}.${row.fpts_decimal || 0}`);
    return {
      ...row,
      wins,
      losses,
      ties,
      gamesPlayed,
      pct,
      points,
      manager: matched || null,
      teamName: matched?.teamName || row.team_name,
      displayName: matched?.name || String(row.name || '').replaceAll('_', ' '),
      slug: matched?.slug || slugify(matched?.teamName || row.team_name || row.name)
    };
  }).sort((a, b) => (b.wins - a.wins) || (b.points - a.points));

  return rows.map((row, i) => ({
    ...row,
    rank: i + 1,
    tier: rankLabels[i < 2 ? 0 : i < 6 ? 1 : i < 10 ? 2 : 3],
    pointsBehind: Number((rows[0].points - row.points).toFixed(2))
  }));
}

export function getManagerBySlug(slug) {
  return getManagers().find((m) => m.slug === slug) || null;
}

function parseChampionshipYears(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getManagerAwards() {
  const standingsRows = getStandings();
  return getManagers().map((manager) => {
    const standing = standingsRows.find((row) => row.slug === manager.slug);
    const chips = parseChampionshipYears(manager.championship?.years);
    return {
      managerId: manager.managerID,
      slug: manager.slug,
      managerName: manager.name,
      teamName: manager.teamName,
      championships: chips,
      championshipCount: chips.length,
      currentRank: standing?.rank || null,
      currentRecord: standing ? `${standing.wins}-${standing.losses}${standing.ties ? `-${standing.ties}` : ''}` : '—',
      currentPoints: standing?.points || 0,
      awardCase: [
        chips.length ? `${chips.length} title${chips.length === 1 ? '' : 's'}` : 'Still hunting the confetti',
        standing?.rank ? `${ordinal(standing.rank)} in the current table` : 'Awaiting placement',
        manager.persona || 'Unclassifiable operator'
      ]
    };
  }).sort((a, b) => b.championshipCount - a.championshipCount || (a.currentRank || 99) - (b.currentRank || 99));
}

export function getManagerSnapshot(slug) {
  const manager = getManagerBySlug(slug);
  if (!manager) return null;
  const standing = getStandings().find((s) => s.slug === slug) || null;
  const picks = draftPicks.filter((p) => p.picked_by === manager.managerID);
  const topSpend = [...picks].sort((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 5);
  const awards = getManagerAwards().find((entry) => entry.slug === slug);
  const rivalry = getRivalries().find((entry) => entry.left.slug === slug || entry.right.slug === slug) || null;
  return {
    manager,
    standing,
    picks,
    topSpend,
    awards,
    rivalry,
    recordLabel: standing ? `${standing.wins}-${standing.losses}${standing.ties ? '-' + standing.ties : ''}` : '—',
    totalSpend: picks.reduce((sum, p) => sum + Number(p.price || 0), 0),
    averageSpend: picks.length ? picks.reduce((sum, p) => sum + Number(p.price || 0), 0) / picks.length : 0,
    dossierStats: [
      { label: 'Current rank', value: standing ? `#${standing.rank}` : '—' },
      { label: 'Record', value: standing ? `${standing.wins}-${standing.losses}` : '—' },
      { label: 'Points for', value: standing ? standing.points.toFixed(2) : '0.00' },
      { label: 'Championships', value: String(awards?.championshipCount || 0) }
    ]
  };
}

export function getDraftOverview() {
  const current = drafts[0] || null;
  const topPicks = [...draftPicks].sort((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 24);
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
        mostExpensive: [...picks].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0] || null
      };
    }).sort((a, b) => b.spend - a.spend)
  };
}

export function getTransactionsOverview() {
  const all = [
    ...trades.map((t) => ({ ...t, kind: 'trade' })),
    ...waivers.map((w) => ({ ...w, kind: 'waiver' }))
  ].map((item) => ({
    ...item,
    label: item.kind === 'trade' ? 'Trade wire' : 'Waiver desk'
  }));
  return {
    total: all.length,
    tradesCount: trades.length,
    waiversCount: waivers.length,
    items: all
  };
}

export function getLeaguePulse() {
  const table = getStandings();
  const awards = getManagerAwards();
  const draft = getDraftOverview();
  return {
    topSeed: table[0],
    hottest: [...table].sort((a, b) => b.points - a.points)[0],
    championshipLeader: awards[0],
    mostExpensivePick: draft.topPicks[0] || null,
    averagePoints: table.length ? table.reduce((sum, row) => sum + row.points, 0) / table.length : 0
  };
}

export function getHomepageStats() {
  const table = getStandings();
  const draft = getDraftOverview();
  return {
    leagueName,
    homepageText,
    totalManagers: getManagers().length,
    totalGames: table.reduce((sum, row) => sum + row.wins + row.losses + row.ties, 0) / 2,
    topSeed: table[0] || null,
    mostExpensivePick: draft.topPicks[0] || null
  };
}

export function getRecordsBoard() {
  const table = getStandings();
  const byTitles = getManagerAwards()[0];
  const highestPoints = [...table].sort((a, b) => b.points - a.points)[0];
  const lowestPoints = [...table].sort((a, b) => a.points - b.points)[0];
  const bestWinPct = [...table].sort((a, b) => b.pct - a.pct)[0];
  const mostGames = [...getManagers()].sort((a, b) => Number(b.fantasyStart || 0) - Number(a.fantasyStart || 0));
  return [
    {
      title: 'Top of the current board',
      value: highestPoints.teamName,
      detail: `${highestPoints.displayName} has piled up ${highestPoints.points.toFixed(2)} points and owns the sharpest points-for profile in the room.`,
      accent: 'Gold Room'
    },
    {
      title: 'Best win rate',
      value: `${bestWinPct.displayName} · ${(bestWinPct.pct * 100).toFixed(1)}%`,
      detail: `${bestWinPct.wins}-${bestWinPct.losses}${bestWinPct.ties ? `-${bestWinPct.ties}` : ''} through ${bestWinPct.gamesPlayed} games.`,
      accent: 'Velvet Rope'
    },
    {
      title: 'Most championships',
      value: `${byTitles.managerName} · ${byTitles.championshipCount}`,
      detail: byTitles.championships.length ? `Titles: ${byTitles.championships.join(', ')}` : 'No title years were found in the imported profile data.',
      accent: 'House Legend'
    },
    {
      title: 'Most dangerous bargain',
      value: lowestPoints.teamName,
      detail: `${lowestPoints.displayName} is the current pressure point on the table at ${lowestPoints.points.toFixed(2)} points.`,
      accent: 'Cold Table'
    }
  ];
}

export function getBadgesBoard() {
  return getManagers().map((manager) => ({
    slug: manager.slug,
    managerName: manager.name,
    teamName: manager.teamName,
    badges: [
      manager.persona || 'Unknown Persona',
      manager.mode || 'Open Table',
      manager.favoriteTeam ? `${String(manager.favoriteTeam).toUpperCase()} loyalty` : 'Neutral loyalties',
      manager.yearsOfService ? `${manager.yearsOfService} years of service` : 'Fresh blood'
    ],
    photo: manager.photo
  }));
}

export function getRivalries() {
  const allManagers = getManagers();
  return allManagers
    .map((manager) => {
      const rival = allManagers[manager.rival?.link];
      if (!rival) return null;
      const leftStanding = getStandings().find((row) => row.slug === manager.slug);
      const rightStanding = getStandings().find((row) => row.slug === rival.slug);
      return {
        key: [manager.slug, rival.slug].sort().join('__'),
        left: { slug: manager.slug, name: manager.name, teamName: manager.teamName, photo: manager.photo, rank: leftStanding?.rank || null },
        right: { slug: rival.slug, name: rival.name, teamName: rival.teamName, photo: rival.photo, rank: rightStanding?.rank || null },
        headline: `${manager.teamName} vs ${rival.teamName}`,
        subhead: `${manager.persona || 'Operator'} energy colliding with ${rival.persona || 'house chaos'}.`,
        stakes: `${manager.philosophy || 'No quote'}  /  ${rival.philosophy || 'No quote'}`
      };
    })
    .filter(Boolean)
    .filter((entry, index, list) => list.findIndex((item) => item.key === entry.key) === index)
    .sort((a, b) => (a.left.rank || 99) - (b.left.rank || 99));
}

export function getNewsPosts() {
  const pulse = getLeaguePulse();
  const tx = getTransactionsOverview();
  const awardLeader = getManagerAwards()[0];
  const posts = [
    {
      slug: 'table-at-midnight',
      title: `${pulse.topSeed?.teamName || 'The table'} owns the room tonight`,
      excerpt: `${pulse.topSeed?.displayName || 'A manager'} sits in the one-seat with a ${pulse.topSeed?.wins || 0}-${pulse.topSeed?.losses || 0} record and ${pulse.topSeed?.points?.toFixed(2) || '0.00'} points for.`,
      body: [
        'The merged lounge is designed to make the standings feel ceremonial. Every rank should feel earned, every swing should feel expensive, and every visit should feel like you are checking the private board in the back room.',
        `Right now the top line belongs to ${pulse.topSeed?.teamName || 'the leader'}, and that team is setting the tone for how the rest of the room has to play catch-up.`,
        'This page is ready to evolve into a fully managed post desk once your D1-backed editor and admin tools are hooked up.'
      ],
      tag: 'League Pulse',
      publishedAt: '2026-03-24',
      readTime: '3 min read'
    },
    {
      slug: 'house-legend-board',
      title: `${awardLeader.managerName} leads the title ledger`,
      excerpt: `${awardLeader.championshipCount} championships currently headline the imported history dossier.`,
      body: [
        'History is where this product stops being a stats website and starts feeling like a club with memory. Rings, grudges, collapses, droughts, and legends all need a proper room.',
        `At the moment, ${awardLeader.managerName} is sitting on the largest imported stack of championships, which makes that manager the obvious anchor for the awards wall.`,
        'As phase two deepens, this surface should become the place where banners, trophies, and season arcs get recorded permanently.'
      ],
      tag: 'History',
      publishedAt: '2026-03-24',
      readTime: '4 min read'
    },
    {
      slug: 'transactions-wire-room',
      title: `The wire room is holding ${tx.total} preserved moves`,
      excerpt: `${tx.tradesCount} trades and ${tx.waiversCount} waiver items are already scaffolded for the archive migration.`,
      body: [
        'Transactions are one of the easiest ways to make this app feel alive because they create a living ticker of aggression, panic, and opportunism.',
        'Even before the full D1 normalization lands, the imported trade and waiver data gives you a backbone for a proper activity rail.',
        'That means the eventual roster, matchup, and transaction views are not starting from zero — they already have a narrative spine.'
      ],
      tag: 'Operations',
      publishedAt: '2026-03-24',
      readTime: '2 min read'
    }
  ];

  return posts.map((post) => ({ ...post, excerptHtml: `<p>${post.excerpt}</p>` }));
}

export function getPostBySlug(slug) {
  return getNewsPosts().find((post) => post.slug === slug) || null;
}

export function getHistoryModules() {
  const records = getRecordsBoard();
  const rivalries = getRivalries();
  const badges = getBadgesBoard();
  return [
    {
      title: 'Records',
      href: '/history/records',
      description: `${records.length} headline entries are already staged as a proper board instead of throwaway copy.`
    },
    {
      title: 'Awards',
      href: '/history/awards',
      description: `${getManagerAwards().filter((entry) => entry.championshipCount).length} managers already have imported title history ready for the lounge wall.`
    },
    {
      title: 'Badges',
      href: '/history/badges',
      description: `${badges.length} managers can already be surfaced as archetypes, not just rows in a table.`
    },
    {
      title: 'Rivalry',
      href: '/history/rivalry',
      description: `${rivalries.length} rivalry pairings are mapped from the existing league dossier data.`
    }
  ];
}

export function getAdminLeagueDeck() {
  const table = getStandings();
  const posts = getNewsPosts();
  const awards = getManagerAwards();
  return [
    { title: 'Managers', value: String(getManagers().length), detail: 'Profile dossiers, bios, photos, rivalry links, and identity surfaces.' },
    { title: 'Standings rows', value: String(table.length), detail: 'Current imported board ready for D1 snapshot normalization.' },
    { title: 'News posts', value: String(posts.length), detail: 'Initial lounge desk stories ready to turn into editable content.' },
    { title: 'Award dossiers', value: String(awards.length), detail: 'Championship counts and trophy wall scaffolding from imported manager history.' }
  ];
}

export { currency };
