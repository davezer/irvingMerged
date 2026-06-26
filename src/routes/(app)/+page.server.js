import { eventDisplay } from '$lib/events/displayNames';
import { getHomepageStats, getManagers, getNewsPosts, getStandings } from '$lib/server/league';

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function normalizeEvent(event) {
  if (!event) return null;
  const display = eventDisplay(event);
  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    type: event.type,
    title: display?.title || event.name,
    subtitle: display?.subtitle || event.type,
    logo: display?.logo || null,
    start_at: event.start_at ? Number(event.start_at) : null,
    lock_at: Number(event.lock_at || 0),
    manual_lock: Number(event.manual_lock || 0),
    manual_unlock: Number(event.manual_unlock || 0),
    results_published_at: event.results_published_at ? Number(event.results_published_at) : null
  };
}

async function getCollectiveSnapshot(db, user) {
  const empty = {
    nextEvent: null,
    eventsUpcoming: [],
    bankroll: 0,
    top: [],
    myRank: null,
    activeEvents: 0,
    completedEvents: 0
  };

  if (!db || !user?.id) return empty;

  const now = nowSec();

  try {
    const [eventsRes, bankrollRow, topRes, myRankRow] = await Promise.all([
      db
        .prepare(
          `
          SELECT id, slug, name, type, start_at, lock_at, manual_lock, manual_unlock, results_published_at
          FROM events
          ORDER BY COALESCE(start_at, lock_at) ASC
        `
        )
        .all(),
      db
        .prepare(`SELECT COALESCE(SUM(score_total), 0) AS total FROM entry_scores WHERE user_id = ?`)
        .bind(user.id)
        .first(),
      db
        .prepare(
          `
          SELECT
            u.id AS user_id,
            u.display_name AS display_name,
            COALESCE(SUM(es.score_total), 0) AS total
          FROM users u
          LEFT JOIN entry_scores es ON es.user_id = u.id
          GROUP BY u.id
          ORDER BY total DESC, u.display_name ASC
          LIMIT 5
        `
        )
        .all(),
      db
        .prepare(
          `
          WITH totals AS (
            SELECT u.id AS user_id, COALESCE(SUM(es.score_total), 0) AS total
            FROM users u
            LEFT JOIN entry_scores es ON es.user_id = u.id
            GROUP BY u.id
          ),
          ranked AS (
            SELECT user_id, total, DENSE_RANK() OVER (ORDER BY total DESC) AS r
            FROM totals
          )
          SELECT r AS rank
          FROM ranked
          WHERE user_id = ?
        `
        )
        .bind(user.id)
        .first()
    ]);

    const eventsAll = (eventsRes.results ?? []).map(normalizeEvent);
    const eventsUpcoming = eventsAll.filter((event) => (event.start_at || event.lock_at || 0) >= now - 60 * 60 * 24).slice(0, 4);

    return {
      nextEvent: eventsUpcoming[0] || eventsAll[0] || null,
      eventsUpcoming,
      bankroll: Number(bankrollRow?.total ?? 0),
      top: (topRes.results ?? []).map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        displayName: row.display_name,
        total: Number(row.total ?? 0)
      })),
      myRank: myRankRow?.rank ? Number(myRankRow.rank) : null,
      activeEvents: eventsUpcoming.length,
      completedEvents: eventsAll.filter((event) => event.results_published_at).length
    };
  } catch (err) {
    console.warn('Homepage collective snapshot unavailable', err);
    return empty;
  }
}

export async function load({ platform, locals }) {
  const leagueStats = getHomepageStats();
  const standings = getStandings();
  const managers = getManagers();
  const posts = getNewsPosts();
  const collective = await getCollectiveSnapshot(platform?.env?.DB, locals.user);

  return {
    user: {
      displayName: locals.user?.displayName || locals.user?.display_name || locals.user?.name || 'Member',
      role: locals.user?.role || 'gm'
    },
    leagueStats,
    standings: standings.slice(0, 6),
    managers: managers.slice(0, 8),
    posts: posts.slice(0, 3),
    collective,
    commandCards: [
      {
        eyebrow: 'IRVING CHAMPIONS LEAGUE',
        title: 'Fantasy Football War Room',
        body: 'Standings, rosters, matchups, drafts, transactions, manager dossiers, and the dumb prestigious history that makes this league this league.',
        href: '/league',
        cta: 'Enter HQ'
      },
      {
        eyebrow: 'Offseason Lounge',
        title: 'Games Floor',
        body: 'Masters panic, Derby double, March Madness, Race Crash Cash, World Cup chaos, leaderboard pressure, and fresh ways to lose dignity.',
        href: '/games',
        cta: 'Play Games'
      },
      {
        eyebrow: 'Trophy Room',
        title: 'History, Badges & Rivalries',
        body: 'Legacy titles, personas, stains, grudges, records, and the permanent paper trail of every manager’s worst choices.',
        href: '/history',
        cta: 'Open History'
      }
    ]
  };
}
