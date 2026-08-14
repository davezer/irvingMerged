function assertDb(
  db
) {
  if (!db) {
    throw new Error(
      'Cloudflare D1 binding is unavailable.'
    );
  }
}


function parseJson(
  value,
  fallback = null
) {
  if (!value) {
    return fallback;
  }

  if (
    typeof value ===
    'object'
  ) {
    return value;
  }

  try {
    return JSON.parse(
      value
    );
  } catch {
    return fallback;
  }
}


function jsonString(
  value
) {
  return JSON.stringify(
    value ?? null
  );
}


function normalizeRecapRow(
  row
) {
  if (!row) {
    return null;
  }

  const hasPublished =
    Boolean(
      row.published_recap_json
    );

  const hasDraft =
    Boolean(
      row.draft_recap_json
    );

  return {
    id:
      Number(
        row.id
      ),

    season:
      Number(
        row.season
      ),

    week:
      Number(
        row.week
      ),

    leagueId:
      String(
        row.league_id
      ),

    status:
      hasPublished
        ? 'published'
        : hasDraft
          ? 'draft'
          : 'empty',

    draftTitle:
      row.draft_title ||
      null,

    draftSubtitle:
      row.draft_subtitle ||
      null,

    draftRecap:
      parseJson(
        row.draft_recap_json
      ),

    draftPacket:
      parseJson(
        row.draft_packet_json
      ),

    draftAiMeta:
      parseJson(
        row.draft_ai_meta_json
      ),

    draftGeneratedAt:
      row.draft_generated_at == null
        ? null
        : Number(
            row.draft_generated_at
          ),

    draftGeneratedBy:
      row.draft_generated_by ||
      null,

    publishedTitle:
      row.published_title ||
      null,

    publishedSubtitle:
      row.published_subtitle ||
      null,

    publishedRecap:
      parseJson(
        row.published_recap_json
      ),

    publishedPacket:
      parseJson(
        row.published_packet_json
      ),

    publishedAiMeta:
      parseJson(
        row.published_ai_meta_json
      ),

    publishedAt:
      row.published_at == null
        ? null
        : Number(
            row.published_at
          ),

    publishedBy:
      row.published_by ||
      null,

    createdAt:
      Number(
        row.created_at ||
        0
      ),

    updatedAt:
      Number(
        row.updated_at ||
        0
      )
  };
}


/*
 * ============================================================
 * GET ONE WEEK
 * ============================================================
 */

export async function getWeeklyRecap(
  db,
  {
    season,
    week
  } = {}
) {
  assertDb(
    db
  );

  const cleanSeason =
    Number(
      season
    );

  const cleanWeek =
    Number(
      week
    );

  if (
    !Number.isInteger(
      cleanSeason
    ) ||
    !Number.isInteger(
      cleanWeek
    )
  ) {
    return null;
  }

  const row =
    await db
      .prepare(`
        SELECT *
        FROM weekly_recaps
        WHERE
          season = ?
          AND week = ?
        LIMIT 1
      `)
      .bind(
        cleanSeason,
        cleanWeek
      )
      .first();

  return normalizeRecapRow(
    row
  );
}


/*
 * ============================================================
 * SAVE / REPLACE CURRENT DRAFT
 *
 * IMPORTANT:
 * Published fields are intentionally NOT touched here.
 * ============================================================
 */

export async function saveWeeklyRecapDraft(
  db,
  {
    season,
    week,
    leagueId,
    recap,
    packet,
    aiMeta,
    generatedBy = null
  } = {}
) {
  assertDb(
    db
  );

  const cleanSeason =
    Number(
      season
    );

  const cleanWeek =
    Number(
      week
    );

  if (
    !Number.isInteger(
      cleanSeason
    )
  ) {
    throw new Error(
      'A valid recap season is required.'
    );
  }

  if (
    !Number.isInteger(
      cleanWeek
    ) ||
    cleanWeek < 1 ||
    cleanWeek > 18
  ) {
    throw new Error(
      'A valid recap week is required.'
    );
  }

  if (
    !String(
      leagueId ||
      ''
    ).trim()
  ) {
    throw new Error(
      'A league ID is required.'
    );
  }

  if (
    !recap ||
    typeof recap !==
      'object' ||
    !String(
      recap.title ||
      ''
    ).trim()
  ) {
    throw new Error(
      'A generated recap is required.'
    );
  }

  await db
    .prepare(`
      INSERT INTO weekly_recaps (
        season,
        week,
        league_id,

        draft_title,
        draft_subtitle,
        draft_recap_json,
        draft_packet_json,
        draft_ai_meta_json,

        draft_generated_at,
        draft_generated_by,

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

        unixepoch(),
        ?,

        unixepoch()
      )

      ON CONFLICT (
        season,
        week
      )

      DO UPDATE SET
        league_id =
          excluded.league_id,

        draft_title =
          excluded.draft_title,

        draft_subtitle =
          excluded.draft_subtitle,

        draft_recap_json =
          excluded.draft_recap_json,

        draft_packet_json =
          excluded.draft_packet_json,

        draft_ai_meta_json =
          excluded.draft_ai_meta_json,

        draft_generated_at =
          unixepoch(),

        draft_generated_by =
          excluded.draft_generated_by,

        updated_at =
          unixepoch()
    `)
    .bind(
      cleanSeason,
      cleanWeek,
      String(
        leagueId
      ),

      String(
        recap.title
      ),

      String(
        recap.subtitle ||
        ''
      ),

      jsonString(
        recap
      ),

      jsonString(
        packet
      ),

      jsonString(
        aiMeta
      ),

      generatedBy
        ? String(
            generatedBy
          )
        : null
    )
    .run();

  return getWeeklyRecap(
    db,
    {
      season:
        cleanSeason,

      week:
        cleanWeek
    }
  );
}


/*
 * ============================================================
 * PUBLISH
 *
 * Copies the CURRENT DRAFT into immutable-ish published fields.
 * A later regeneration only changes the draft.
 * ============================================================
 */

export async function publishWeeklyRecap(
  db,
  {
    season,
    week,
    publishedBy = null
  } = {}
) {
  assertDb(
    db
  );

  const cleanSeason =
    Number(
      season
    );

  const cleanWeek =
    Number(
      week
    );

  const result =
    await db
      .prepare(`
        UPDATE weekly_recaps

        SET
          published_title =
            draft_title,

          published_subtitle =
            draft_subtitle,

          published_recap_json =
            draft_recap_json,

          published_packet_json =
            draft_packet_json,

          published_ai_meta_json =
            draft_ai_meta_json,

          published_at =
            unixepoch(),

          published_by =
            ?,

          updated_at =
            unixepoch()

        WHERE
          season = ?
          AND week = ?
          AND draft_recap_json IS NOT NULL
      `)
      .bind(
        publishedBy
          ? String(
              publishedBy
            )
          : null,

        cleanSeason,
        cleanWeek
      )
      .run();

  if (
    Number(
      result?.meta?.changes ||
      0
    ) < 1
  ) {
    throw new Error(
      'There is no saved draft to publish for this week.'
    );
  }

  return getWeeklyRecap(
    db,
    {
      season:
        cleanSeason,

      week:
        cleanWeek
    }
  );
}


/*
 * ============================================================
 * PUBLIC ARCHIVE
 * ============================================================
 */

export async function listPublishedWeeklyRecaps(
  db
) {
  assertDb(
    db
  );

  const result =
    await db
      .prepare(`
        SELECT
          id,
          season,
          week,
          league_id,

          published_title,
          published_subtitle,
          published_at

        FROM weekly_recaps

        WHERE
          published_recap_json
            IS NOT NULL

        ORDER BY
          season DESC,
          week DESC
      `)
      .all();

  return (
    result.results ||
    []
  ).map(
    (row) => ({
      id:
        Number(
          row.id
        ),

      season:
        Number(
          row.season
        ),

      week:
        Number(
          row.week
        ),

      leagueId:
        String(
          row.league_id
        ),

      title:
        row.published_title ||
        `Week ${row.week}`,

      subtitle:
        row.published_subtitle ||
        '',

      publishedAt:
        row.published_at == null
          ? null
          : Number(
              row.published_at
            )
    })
  );
}


export async function getPublishedWeeklyRecap(
  db,
  {
    season,
    week
  } = {}
) {
  const record =
    await getWeeklyRecap(
      db,
      {
        season,
        week
      }
    );

  if (
    !record ||
    !record.publishedRecap
  ) {
    return null;
  }

  return {
    id:
      record.id,

    season:
      record.season,

    week:
      record.week,

    leagueId:
      record.leagueId,

    recap:
      record.publishedRecap,

    aiMeta:
      record.publishedAiMeta,

    publishedAt:
      record.publishedAt,

    publishedBy:
      record.publishedBy
  };
}