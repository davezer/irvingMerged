const CATEGORY_KEYS = [
  'personas',
  'weekly',
  'luck',
  'stains',
  'yearly',
  'legacy'
];

export const EMPTY_BADGE_SECTIONS = {
  personas: [],
  weekly: [],
  luck: [],
  stains: [],
  yearly: [],
  legacy: []
};

function emptySections() {
  return {
    personas: [],
    weekly: [],
    luck: [],
    stains: [],
    yearly: [],
    legacy: []
  };
}

function emptyManagerBuckets() {
  return {
    personas: [],
    weekly: [],
    luck: [],
    stains: [],
    yearly: [],
    legacy: []
  };
}

function parseJson(value) {
  if (!value) return {};

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function badgeType(category) {
  return category === 'personas'
    ? 'persona'
    : category;
}

function makeEarned(row) {
  const metadata = parseJson(
    row.metadata_json
  );

  return {
    awardId: row.award_id,

    managerId: row.manager_id,

    /*
     * Prefer the historical snapshot saved with
     * the award. Fall back to the current manager
     * record when one isn't available.
     */
    managerName:
      metadata.managerName ||
      row.manager_name ||
      null,

    teamName:
      metadata.teamName ||
      row.team_name ||
      null,

    teamLogo:
      metadata.teamLogo ||
      row.team_logo ||
      null,

    season:
      row.season ?? null,

    week:
      numberOrNull(row.week),

    points:
      numberOrNull(row.score),

    opponent:
      row.opponent_manager_id ??
      null,

    opponentName:
  metadata.opponentName ||
  row.opponent_name ||
  null,

    opponentTeamName:
  metadata.opponentTeamName ||
  row.opponent_team_name ||
  null,

    opponentTeamLogo:
  metadata.opponentTeamLogo ||
  row.opponent_team_logo ||
  null,

    opponentPoints:
      numberOrNull(
        row.opponent_score
      ),

    explanation:
      row.reason ?? null,

    nominatedBy:
      row.nominated_by_manager_id ??
      null,

    nominatedByName:
  metadata.nominatedByName ||
  row.nominated_by_name ||
  null,

    nominatedByTeamName:
  metadata.nominatedByTeamName ||
  row.nominated_by_team_name ||
  null,

    nominatedByTeamLogo:
  metadata.nominatedByTeamLogo ||
  row.nominated_by_team_logo ||
  null,

    source:
      row.source ?? null,

    metadata
  };
}

function groupLegacyAwards(rows) {
  const grouped = new Map();

  for (const row of rows) {
    const earned = makeEarned(row);

    const year =
      numberOrNull(
        earned.metadata?.awardYear
      ) ??
      numberOrNull(row.season);

    if (!grouped.has(row.manager_id)) {
      grouped.set(row.manager_id, {
        ...earned,
        years: []
      });
    }

    const item =
      grouped.get(row.manager_id);

    if (
      year !== null &&
      !item.years.includes(year)
    ) {
      item.years.push(year);
    }
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,

      years: [...item.years].sort(
        (a, b) => a - b
      )
    }))
    .sort((a, b) =>
      String(a.teamName || '')
        .localeCompare(
          String(b.teamName || '')
        )
    );
}

function buildSections(
  definitions,
  awardRows
) {
  const sections = emptySections();

  const awardsByBadge =
    new Map();

  for (const row of awardRows) {
    if (
      !awardsByBadge.has(
        row.badge_key
      )
    ) {
      awardsByBadge.set(
        row.badge_key,
        []
      );
    }

    awardsByBadge
      .get(row.badge_key)
      .push(row);
  }

  for (const definition of definitions) {
    const category =
      definition.category;

    if (
      !CATEGORY_KEYS.includes(
        category
      )
    ) {
      continue;
    }

    const rawAwards =
      awardsByBadge.get(
        definition.key
      ) ?? [];

    const earned =
      category === 'legacy'
        ? groupLegacyAwards(
            rawAwards
          )
        : rawAwards.map(
            makeEarned
          );

    sections[category].push({
      id: definition.key,
      key: definition.key,

      type:
        badgeType(category),

      category,

      name:
        definition.title,

      definition:
        definition.description ||
        '',

      icon:
        definition.icon ||
        '/badges/stains.png',

      tone:
        definition.tone ||
        null,

      scope:
        definition.scope ||
        null,

      awardMode:
        definition.award_mode ||
        'manual',

      automationKey:
        definition.automation_key ||
        null,

      repeatable:
        Boolean(
          definition.repeatable
        ),

      earned,

      /*
       * Legacy badges are grouped by manager,
       * so this gives us the old-site behavior:
       *
       * DTSP = 4
       * Irving = 9
       *
       * instead of counting each title year.
       */
      count:
        earned.length
    });
  }

  return sections;
}

function buildByManager(sections) {
  const byManager = {};

  for (
    const category of CATEGORY_KEYS
  ) {
    for (
      const badge of
      sections[category]
    ) {
      for (
        const earned of
        badge.earned ?? []
      ) {
        const managerId =
          earned.managerId;

        if (!managerId) {
          continue;
        }

        if (!byManager[managerId]) {
          byManager[managerId] =
            emptyManagerBuckets();
        }

        byManager[managerId][
          category
        ].push({
          awardId:
            earned.awardId,

          badgeId:
            badge.id,

          badgeName:
            badge.name,

          icon:
            badge.icon,

          type:
            badge.type,

          years:
            earned.years ??
            null,

          season:
            earned.season ??
            null,

          week:
            earned.week ??
            null,

          points:
            earned.points ??
            null,

          opponent:
            earned.opponent ??
            null,

          opponentPoints:
            earned.opponentPoints ??
            null,

          opponentName:
            earned.opponentName ??
            null,

          opponentTeamName:
            earned.opponentTeamName ??
            null,

          opponentTeamLogo:
            earned.opponentTeamLogo ??
            null,

          explanation:
            earned.explanation ??
            null,

          nominatedBy:
            earned.nominatedBy ??
            null,

          nominatedByName:
            earned.nominatedByName ??
            null,

          nominatedByTeamName:
            earned.nominatedByTeamName ??
            null,

          nominatedByTeamLogo:
            earned.nominatedByTeamLogo ??
            null,

          source:
            earned.source ??
            null,

          metadata:
            earned.metadata ?? {}
        });
      }
    }
  }

  return byManager;
}


/*
 * =========================================================
 * PUBLIC READ API
 * =========================================================
 */

export async function getBadgeCabinet(db) {
  if (!db) {
    throw new Error(
      'getBadgeCabinet requires a D1 database binding.'
    );
  }
  /*
   * -------------------------------------------------------
   * Badge definitions
   * -------------------------------------------------------
   */

  const definitionsResult =
    await db
      .prepare(`
        SELECT
          key,
          title,
          icon,
          tone,
          description,
          category,
          sort_order,
          scope,
          award_mode,
          automation_key,
          repeatable,
          active

        FROM badge_definitions

        WHERE active = 1

        ORDER BY
          CASE category
            WHEN 'personas' THEN 1
            WHEN 'weekly'   THEN 2
            WHEN 'luck'     THEN 3
            WHEN 'stains'   THEN 4
            WHEN 'yearly'   THEN 5
            WHEN 'legacy'   THEN 6
            ELSE 99
          END,
          sort_order ASC,
          title ASC
      `)
      .all();

  const definitions =
    definitionsResult.results ?? [];


  /*
   * -------------------------------------------------------
   * Awards
   *
   * Career and legacy awards are always visible.
   *
   * Weekly / Luck / Stains are filtered to the
   * selected season.
   * -------------------------------------------------------
   */

  const awardsResult =
  await db
    .prepare(`
      SELECT
        mb.id
          AS award_id,

        mb.badge_key,
        mb.manager_id,
        mb.season,
        mb.week,
        mb.reason,
        mb.score,
        mb.metadata_json,

        mb.opponent_manager_id,
        mb.opponent_score,

        mb.nominated_by_manager_id,

        mb.source,
        mb.created_at,

        bd.category,
        bd.scope,

        manager.name
          AS manager_name,

        manager.team_name
          AS team_name,

        manager.photo
          AS team_logo,

        opponent.name
          AS opponent_name,

        opponent.team_name
          AS opponent_team_name,

        opponent.photo
          AS opponent_team_logo,

        nominator.name
          AS nominated_by_name,

        nominator.team_name
          AS nominated_by_team_name,

        nominator.photo
          AS nominated_by_team_logo

      FROM manager_badges mb

      INNER JOIN badge_definitions bd
        ON bd.key =
           mb.badge_key

      LEFT JOIN managers manager
        ON manager.id =
           mb.manager_id

      LEFT JOIN managers opponent
        ON opponent.id =
           mb.opponent_manager_id

      LEFT JOIN managers nominator
        ON nominator.id =
           mb.nominated_by_manager_id

      WHERE
        mb.revoked_at IS NULL
        AND bd.active = 1

      ORDER BY
        CASE bd.category
          WHEN 'personas' THEN 1
          WHEN 'weekly'   THEN 2
          WHEN 'luck'     THEN 3
          WHEN 'stains'   THEN 4
          WHEN 'yearly'   THEN 5
          WHEN 'legacy'   THEN 6
          ELSE 99
        END,
        bd.sort_order ASC,
        CAST(mb.season AS INTEGER) DESC,
        COALESCE(mb.week, 0) DESC,
        mb.created_at DESC
    `)
    .all();

const awardRows =
  awardsResult.results ?? [];

  const sections =
    buildSections(
      definitions,
      awardRows
    );

  const byManager =
    buildByManager(
      sections
    );

  return {
    sections,

    byManager,

   meta: {
  definitions:
    definitions.length,

  awardRows:
    awardRows.length,

  displayedAwards:
    CATEGORY_KEYS.reduce(
      (sum, category) =>
        sum +
        sections[category].reduce(
          (categoryTotal, badge) =>
            categoryTotal + badge.count,
          0
        ),
      0
    )
}
  };
}


/*
 * =========================================================
 * MANAGER BADGES
 *
 * We'll use this on the manager dossier pages shortly.
 * =========================================================
 */

export async function getManagerBadges(
  db,
  managerId
) {
  if (!db) {
    throw new Error(
      'getManagerBadges requires a D1 database binding.'
    );
  }

  if (
    managerId == null ||
    String(managerId).trim() === ''
  ) {
    return {
      managerId: null,
      totalAwards: 0,
      uniqueBadges: 0,
      badges: []
    };
  }

  const result =
    await db
      .prepare(`
        SELECT
          mb.id AS award_id,
          mb.badge_key,
          mb.manager_id,
          mb.season,
          mb.week,
          mb.reason,
          mb.score,
          mb.opponent_manager_id,
          mb.opponent_score,
          mb.nominated_by_manager_id,
          mb.source,
          mb.metadata_json,
          mb.created_at,

          bd.title,
          bd.icon,
          bd.description,
          bd.category,
          bd.sort_order,
          bd.scope

        FROM manager_badges mb

        JOIN badge_definitions bd
          ON bd.key = mb.badge_key

        WHERE
          mb.manager_id = ?
          AND mb.revoked_at IS NULL
          AND bd.active = 1

        ORDER BY
          CASE bd.category
            WHEN 'personas' THEN 1
            WHEN 'weekly'   THEN 2
            WHEN 'luck'     THEN 3
            WHEN 'stains'   THEN 4
            WHEN 'yearly'   THEN 5
            WHEN 'legacy'   THEN 6
            ELSE 99
          END,

          bd.sort_order,

          CASE
            WHEN mb.season GLOB '[0-9]*'
              THEN CAST(mb.season AS INTEGER)
            ELSE 0
          END DESC,

          COALESCE(
            mb.week,
            0
          ) DESC,

          mb.created_at DESC
      `)
      .bind(
        String(managerId)
      )
      .all();

  const rows =
    result.results ?? [];

  const grouped =
    new Map();


  function parseMetadata(value) {
    if (!value) {
      return {};
    }

    if (
      typeof value === 'object'
    ) {
      return value;
    }

    try {
      return JSON.parse(
        value
      );
    } catch {
      return {};
    }
  }


  for (const row of rows) {
    const key =
      String(
        row.badge_key
      );

    const metadata =
      parseMetadata(
        row.metadata_json
      );

    if (
      !grouped.has(key)
    ) {
      grouped.set(
        key,
        {
          key,

          title:
            row.title,

          icon:
            row.icon ||
            '/badges/stains.png',

          description:
            row.description ||
            '',

          category:
            row.category ||
            'other',

          scope:
            row.scope ||
            'season',

          sortOrder:
            Number(
              row.sort_order ||
              0
            ),

          count: 0,

          awards: []
        }
      );
    }


    const badge =
      grouped.get(key);

    badge.count += 1;

    badge.awards.push({
      awardId:
        row.award_id,

      season:
        row.season,

      week:
        row.week == null
          ? null
          : Number(
              row.week
            ),

      reason:
        row.reason ||
        null,

      score:
        row.score == null
          ? null
          : Number(
              row.score
            ),

      opponentManagerId:
        row.opponent_manager_id ||
        null,

      opponentScore:
        row.opponent_score == null
          ? null
          : Number(
              row.opponent_score
            ),

      nominatedByManagerId:
        row.nominated_by_manager_id ||
        null,

      source:
        row.source ||
        null,

      createdAt:
        row.created_at ||
        null,

      opponentName:
        metadata.opponentName ||
        null,

      opponentTeamName:
        metadata.opponentTeamName ||
        null,

      nominatedByName:
        metadata.nominatedByName ||
        null,

      nominatedByTeamName:
        metadata.nominatedByTeamName ||
        null,

      metadata
    });
  }


  const badges =
    [...grouped.values()];


  const categoryOrder = {
    personas: 1,
    weekly: 2,
    luck: 3,
    stains: 4,
    yearly: 5,
    legacy: 6
  };


  badges.sort(
    (a, b) =>
      (
        categoryOrder[
          a.category
        ] ?? 99
      ) -
        (
          categoryOrder[
            b.category
          ] ?? 99
        ) ||
      a.sortOrder -
        b.sortOrder ||
      a.title.localeCompare(
        b.title
      )
  );


  return {
    managerId:
      String(managerId),

    totalAwards:
      rows.length,

    uniqueBadges:
      badges.length,

    badges
  };
}

/*
 * =========================================================
 * ADMIN READS
 * =========================================================
 */

export async function getBadgeDefinitions(
  db,
  options = {}
) {
  if (!db) {
    throw new Error(
      'getBadgeDefinitions requires a D1 database binding.'
    );
  }

  const activeOnly =
    options.activeOnly ?? true;

  const whereClause =
    activeOnly
      ? 'WHERE active = 1'
      : '';

  const result = await db
    .prepare(`
      SELECT
        key,
        title,
        icon,
        tone,
        description,
        category,
        sort_order,
        scope,
        award_mode,
        automation_key,
        repeatable,
        active
      FROM badge_definitions
      ${whereClause}
      ORDER BY
        CASE category
          WHEN 'personas' THEN 1
          WHEN 'weekly'   THEN 2
          WHEN 'luck'     THEN 3
          WHEN 'stains'   THEN 4
          WHEN 'yearly'   THEN 5
          WHEN 'legacy'   THEN 6
          ELSE 99
        END,
        sort_order,
        title
    `)
    .all();

  return result.results ?? [];
}


export async function getRecentBadgeAwards(
  db,
  {
    season = null,
    limit = 100
  } = {}
) {
  if (!db) {
    throw new Error(
      'getRecentBadgeAwards requires a D1 database binding.'
    );
  }

  const safeLimit = Math.min(
    Math.max(Number(limit) || 100, 1),
    250
  );

  const seasonalWhere = season
    ? `
      AND (
        bd.scope IN ('career', 'legacy')
        OR mb.season = ?
      )
    `
    : '';

  const statement = db.prepare(`
    SELECT
      mb.id,
      mb.season,
      mb.week,
      mb.badge_key,
      mb.manager_id,
      mb.reason,
      mb.score,
      mb.metadata_json,

      mb.opponent_manager_id,
      mb.opponent_score,

      mb.nominated_by_manager_id,

      mb.source,
      mb.dedupe_key,
      mb.awarded_by,
      mb.created_at,
      mb.updated_at,
      mb.revoked_at,

      bd.title AS badge_title,
      bd.icon AS badge_icon,
      bd.category,
      bd.scope,
      bd.award_mode,
      bd.repeatable

    FROM manager_badges mb

    INNER JOIN badge_definitions bd
      ON bd.key = mb.badge_key

    WHERE
      mb.revoked_at IS NULL
      ${seasonalWhere}

    ORDER BY
      mb.created_at DESC,
      mb.id DESC

    LIMIT ${safeLimit}
  `);

  const result = season
    ? await statement.bind(String(season)).all()
    : await statement.all();

  return (result.results ?? []).map((row) => {
    let metadata = {};

    try {
      metadata = row.metadata_json
        ? JSON.parse(row.metadata_json)
        : {};
    } catch {
      metadata = {};
    }

    return {
      ...row,
      metadata
    };
  });
}


/*
 * =========================================================
 * ADMIN WRITES
 * =========================================================
 */

export async function awardBadge(
  db,
  {
    badgeKey,
    managerId,

    season,
    week = null,

    reason = null,
    score = null,

    opponentManagerId = null,
    opponentScore = null,

    nominatedByManagerId = null,

    source = 'manual',
    awardedBy = null,

    metadata = {}
  }
) {
  if (!db) {
    throw new Error(
      'awardBadge requires a D1 database binding.'
    );
  }

  if (!badgeKey) {
    throw new Error('Badge is required.');
  }

  if (!managerId) {
    throw new Error('Manager is required.');
  }

  /*
   * Load definition so the repository — not the UI —
   * decides how this badge behaves.
   */
  const badge = await db
    .prepare(`
      SELECT
        key,
        title,
        category,
        scope,
        award_mode,
        repeatable,
        active
      FROM badge_definitions
      WHERE key = ?
      LIMIT 1
    `)
    .bind(badgeKey)
    .first();

  if (!badge) {
    throw new Error(
      `Unknown badge: ${badgeKey}`
    );
  }

  if (!badge.active) {
    throw new Error(
      `${badge.title} is currently inactive.`
    );
  }

  /*
   * Career awards don't belong to a particular season.
   *
   * Legacy awards use the supplied season as the
   * championship / award year.
   */
  let storedSeason = String(
    season || new Date().getFullYear()
  );

  let storedWeek =
    week == null
      ? null
      : Number(week);

  if (badge.scope === 'career') {
    storedSeason = 'career';
    storedWeek = null;
  }

  if (badge.scope === 'legacy') {
    storedWeek = null;
  }

  /*
   * Automatic and week-based awards get deterministic
   * dedupe keys.
   *
   * Career non-repeatable awards do too.
   *
   * This protects us from double-clicks and eventually
   * from committing the same generated awards twice.
   */
  let dedupeKey = null;

  if (!badge.repeatable) {
    dedupeKey =
      `career:${badge.key}:${managerId}`;
  } else if (storedWeek != null) {
    dedupeKey =
      `${storedSeason}:${storedWeek}:${badge.key}:${managerId}`;
  } else if (badge.scope === 'legacy') {
    dedupeKey =
      `legacy:${storedSeason}:${badge.key}:${managerId}`;
  }

  const result = await db
    .prepare(`
      INSERT INTO manager_badges (
        season,
        badge_key,
        manager_id,

        reason,
        score,
        metadata_json,

        week,

        opponent_manager_id,
        opponent_score,

        nominated_by_manager_id,

        source,
        dedupe_key,
        awarded_by,

        created_at,
        updated_at
      )
      VALUES (
        ?,
        ?,
        ?,

        ?,
        ?,
        ?,

        ?,

        ?,
        ?,

        ?,

        ?,
        ?,
        ?,

        unixepoch(),
        unixepoch()
      )
    `)
    .bind(
      storedSeason,
      badgeKey,
      managerId,

      reason || null,
      score == null ? null : Number(score),
      JSON.stringify(metadata || {}),

      storedWeek,

      opponentManagerId || null,
      opponentScore == null
        ? null
        : Number(opponentScore),

      nominatedByManagerId || null,

      source,
      dedupeKey,
      awardedBy || null
    )
    .run();

  return {
    ok: true,
    id:
      result.meta?.last_row_id ??
      null,

    badgeKey,
    managerId,
    season: storedSeason,
    week: storedWeek
  };
}


export async function revokeBadge(
  db,
  awardId
) {
  if (!db) {
    throw new Error(
      'revokeBadge requires a D1 database binding.'
    );
  }

  const id = Number(awardId);

  if (!Number.isInteger(id)) {
    throw new Error(
      'Invalid badge award ID.'
    );
  }

  const existing = await db
    .prepare(`
      SELECT id
      FROM manager_badges
      WHERE
        id = ?
        AND revoked_at IS NULL
      LIMIT 1
    `)
    .bind(id)
    .first();

  if (!existing) {
    throw new Error(
      'That badge award does not exist or has already been revoked.'
    );
  }

  await db
    .prepare(`
      UPDATE manager_badges
      SET
        revoked_at = unixepoch(),
        updated_at = unixepoch()
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return {
    ok: true,
    id
  };
}