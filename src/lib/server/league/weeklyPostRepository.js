function assertDb(db) {
  if (!db) {
    throw new Error(
      'Cloudflare D1 binding is unavailable.'
    );
  }
}


function clean(value) {
  return String(
    value ?? ''
  ).trim();
}


export function slugifyWeeklyPost(
  value
) {
  return clean(value)
    .normalize('NFKD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .replace(
      /&/g,
      ' and '
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    )
    .slice(
      0,
      100
    );
}


function normalizePost(row) {
  if (!row) {
    return null;
  }

  return {
    id:
      String(row.id),

    slug:
      row.slug,

    title:
      row.title,

    subtitle:
      row.subtitle ||
      '',

    excerpt:
      row.excerpt ||
      '',

    body:
      row.body ||
      '',

    tag:
      row.tag ||
      '',

    postType:
      row.post_type ||
      'feature',

    status:
      row.status ||
      'draft',

    authorName:
      row.author_name ||
      '',

    authorUserId:
      row.author_user_id ||
      null,

    sourceType:
      row.source_type ||
      'manual',

    recapSeason:
      row.recap_season == null
        ? null
        : Number(
            row.recap_season
          ),

    recapWeek:
      row.recap_week == null
        ? null
        : Number(
            row.recap_week
          ),

    featured:
      Boolean(
        Number(
          row.featured ||
          0
        )
      ),

    publishedAt:
      row.published_at ||
      null,

    createdAt:
      Number(
        row.created_at ||
        0
      ),

    updatedAt:
      Number(
        row.updated_at ||
        row.created_at ||
        0
      )
  };
}


async function uniqueSlug(
  db,
  desiredSlug,
  excludeId = null
) {
  let base =
    slugifyWeeklyPost(
      desiredSlug
    );

  if (!base) {
    base =
      'irving-weekly';
  }

  let candidate =
    base;

  let suffix =
    2;

  while (true) {
    let query = `
      SELECT id
      FROM posts
      WHERE slug = ?
    `;

    const bindings = [
      candidate
    ];

    if (excludeId) {
      query += `
        AND id <> ?
      `;

      bindings.push(
        String(excludeId)
      );
    }

    query += `
      LIMIT 1
    `;

    const row =
      await db
        .prepare(query)
        .bind(
          ...bindings
        )
        .first();

    if (!row) {
      return candidate;
    }

    candidate =
      `${base}-${suffix}`;

    suffix += 1;
  }
}


/*
 * ============================================================
 * ADMIN LIST
 * ============================================================
 */

export async function listWeeklyPostsAdmin(
  db
) {
  assertDb(db);

  const result =
    await db
      .prepare(`
        SELECT *
        FROM posts

        ORDER BY
          CASE
            WHEN status = 'draft'
              THEN 0
            ELSE 1
          END,

          COALESCE(
            updated_at,
            created_at
          ) DESC
      `)
      .all();

  return (
    result.results ||
    []
  ).map(
    normalizePost
  );
}


export async function getWeeklyPostById(
  db,
  id
) {
  assertDb(db);

  const row =
    await db
      .prepare(`
        SELECT *
        FROM posts
        WHERE id = ?
        LIMIT 1
      `)
      .bind(
        String(id)
      )
      .first();

  return normalizePost(
    row
  );
}


/*
 * ============================================================
 * MANUAL ARTICLE SAVE
 * ============================================================
 */

export async function saveManualWeeklyPost(
  db,
  {
    id = null,
    title,
    subtitle = '',
    excerpt = '',
    body = '',
    slug = '',
    postType = 'feature',
    authorName = '',
    authorUserId = null
  } = {}
) {
  assertDb(db);

  const cleanTitle =
    clean(title);

  if (!cleanTitle) {
    throw new Error(
      'Article title is required.'
    );
  }

  const postId =
    id
      ? String(id)
      : crypto.randomUUID();

  const finalSlug =
    await uniqueSlug(
      db,
      slug ||
      cleanTitle,
      id
    );

  const existing =
    id
      ? await getWeeklyPostById(
          db,
          id
        )
      : null;

  if (existing) {
    if (
      existing.sourceType !==
      'manual'
    ) {
      throw new Error(
        'AI recap posts cannot be edited as manual articles.'
      );
    }

    await db
      .prepare(`
        UPDATE posts

        SET
          slug = ?,
          title = ?,
          subtitle = ?,
          excerpt = ?,
          body = ?,
          tag = ?,
          post_type = ?,
          author_name = ?,
          author_user_id = ?,
          updated_at = unixepoch()

        WHERE id = ?
      `)
      .bind(
        finalSlug,
        cleanTitle,
        clean(subtitle),
        clean(excerpt),
        String(body ?? ''),
        clean(postType),
        clean(postType),
        clean(authorName),
        authorUserId
          ? String(
              authorUserId
            )
          : null,
        postId
      )
      .run();
  } else {
    await db
      .prepare(`
        INSERT INTO posts (
          id,
          slug,
          title,
          subtitle,
          excerpt,
          body,
          tag,
          post_type,

          status,
          author_name,
          author_user_id,
          source_type,

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

          'draft',
          ?,
          ?,
          'manual',

          unixepoch(),
          unixepoch()
        )
      `)
      .bind(
        postId,
        finalSlug,
        cleanTitle,
        clean(subtitle),
        clean(excerpt),
        String(body ?? ''),
        clean(postType),
        clean(postType),

        clean(authorName),
        authorUserId
          ? String(
              authorUserId
            )
          : null
      )
      .run();
  }

  return getWeeklyPostById(
    db,
    postId
  );
}


/*
 * ============================================================
 * PUBLISH / UNPUBLISH MANUAL ARTICLE
 * ============================================================
 */

export async function publishWeeklyPost(
  db,
  id
) {
  assertDb(db);

  await db
    .prepare(`
      UPDATE posts

      SET
        status = 'published',
        published_at = ?,
        updated_at = unixepoch()

      WHERE id = ?
    `)
    .bind(
      new Date()
        .toISOString(),

      String(id)
    )
    .run();

  return getWeeklyPostById(
    db,
    id
  );
}


export async function unpublishWeeklyPost(
  db,
  id
) {
  assertDb(db);

  await db
    .prepare(`
      UPDATE posts

      SET
        status = 'draft',
        published_at = NULL,
        updated_at = unixepoch()

      WHERE id = ?
    `)
    .bind(
      String(id)
    )
    .run();

  return getWeeklyPostById(
    db,
    id
  );
}

/*
 * ============================================================
 * DELETE MANUAL DRAFT
 * ============================================================
 */

export async function deleteManualWeeklyDraft(
  db,
  id
) {
  assertDb(db);

  const post =
    await getWeeklyPostById(
      db,
      id
    );

  if (!post) {
    throw new Error(
      'Article not found.'
    );
  }

  if (
    post.sourceType !==
    'manual'
  ) {
    throw new Error(
      'Only manual Irving Weekly drafts can be deleted here.'
    );
  }

  if (
    post.status !==
    'draft'
  ) {
    throw new Error(
      'Published articles must be unpublished before they can be deleted.'
    );
  }

  await db
    .prepare(`
      DELETE FROM posts

      WHERE
        id = ?
        AND source_type = 'manual'
        AND status = 'draft'
    `)
    .bind(
      String(id)
    )
    .run();

  return true;
}
/*
 * ============================================================
 * AI WEEKLY RECAP → IRVING WEEKLY POST
 * ============================================================
 */

export async function upsertWeeklyRecapPost(
  db,
  {
    season,
    week,
    title,
    subtitle = '',
    publishedAt = null,
    publishedBy = null
  } = {}
) {
  assertDb(db);

  const cleanSeason =
    Number(season);

  const cleanWeek =
    Number(week);

  if (
    !Number.isInteger(
      cleanSeason
    ) ||
    !Number.isInteger(
      cleanWeek
    )
  ) {
    throw new Error(
      'Season and week are required.'
    );
  }

  const existing =
    await db
      .prepare(`
        SELECT *
        FROM posts

        WHERE
          source_type =
            'weekly_recap'

          AND recap_season = ?
          AND recap_week = ?

        LIMIT 1
      `)
      .bind(
        cleanSeason,
        cleanWeek
      )
      .first();

  const existingPost =
    normalizePost(
      existing
    );

  const id =
    existingPost?.id ||
    `recap-${cleanSeason}-${cleanWeek}`;

  const slug =
    existingPost?.slug ||
    await uniqueSlug(
      db,
      `${cleanSeason}-week-${cleanWeek}`
    );

  const publishDate =
    publishedAt
      ? new Date(
          Number(
            publishedAt
          ) * 1000
        ).toISOString()
      : new Date()
          .toISOString();

  if (existingPost) {
    await db
      .prepare(`
        UPDATE posts

        SET
          title = ?,
          subtitle = ?,
          excerpt = ?,

          post_type =
            'weekly_recap',

          tag =
            'Weekly Recap',

          status =
            'published',

          author_name =
            'The Irving Weekly',

          author_user_id = ?,

          published_at = ?,
          updated_at =
            unixepoch()

        WHERE id = ?
      `)
      .bind(
        clean(title),
        clean(subtitle),
        clean(subtitle),

        publishedBy
          ? String(
              publishedBy
            )
          : null,

        publishDate,
        id
      )
      .run();
  } else {
    await db
      .prepare(`
        INSERT INTO posts (
          id,
          slug,

          title,
          subtitle,
          excerpt,

          body,
          tag,
          post_type,

          status,
          author_name,
          author_user_id,
          source_type,

          recap_season,
          recap_week,

          published_at,
          created_at,
          updated_at
        )

        VALUES (
          ?,
          ?,

          ?,
          ?,
          ?,

          NULL,
          'Weekly Recap',
          'weekly_recap',

          'published',
          'The Irving Weekly',
          ?,
          'weekly_recap',

          ?,
          ?,

          ?,
          unixepoch(),
          unixepoch()
        )
      `)
      .bind(
        id,
        slug,

        clean(title),
        clean(subtitle),
        clean(subtitle),

        publishedBy
          ? String(
              publishedBy
            )
          : null,

        cleanSeason,
        cleanWeek,

        publishDate
      )
      .run();
  }

  return getWeeklyPostById(
    db,
    id
  );
}

/*
 * ============================================================
 * PUBLIC IRVING WEEKLY
 * ============================================================
 */

export async function listPublishedWeeklyPosts(
	db,
	{
		limit = 100
	} = {}
) {
	assertDb(db);

	const cleanLimit =
		Math.min(
			Math.max(
				Number(limit) || 100,
				1
			),
			250
		);

	const result =
		await db
			.prepare(`
				SELECT *
				FROM posts

				WHERE
					status = 'published'
					AND published_at IS NOT NULL

				ORDER BY
					published_at DESC,
					updated_at DESC

				LIMIT ?
			`)
			.bind(
				cleanLimit
			)
			.all();

	return (
		result.results ||
		[]
	).map(
		normalizePost
	);
}


export async function getPublishedWeeklyPostBySlug(
	db,
	slug
) {
	assertDb(db);

	const cleanSlug =
		clean(slug);

	if (!cleanSlug) {
		return null;
	}

	const row =
		await db
			.prepare(`
				SELECT *
				FROM posts

				WHERE
					slug = ?
					AND status = 'published'

				LIMIT 1
			`)
			.bind(
				cleanSlug
			)
			.first();

	return normalizePost(
		row
	);
}


export async function getPublishedWeeklyRecapPost(
	db,
	{
		season,
		week
	} = {}
) {
	assertDb(db);

	const cleanSeason =
		Number(season);

	const cleanWeek =
		Number(week);

	if (
		!Number.isInteger(cleanSeason) ||
		!Number.isInteger(cleanWeek)
	) {
		return null;
	}

	const row =
		await db
			.prepare(`
				SELECT *
				FROM posts

				WHERE
					source_type = 'weekly_recap'
					AND recap_season = ?
					AND recap_week = ?
					AND status = 'published'

				LIMIT 1
			`)
			.bind(
				cleanSeason,
				cleanWeek
			)
			.first();

	return normalizePost(
		row
	);
}

/*
 * ============================================================
 * AI WEEKLY RECAP DRAFT → PUBLICATION DESK
 *
 * Creates/updates the publication index entry without
 * publishing it.
 *
 * IMPORTANT:
 * If an older version is already published, regenerating a
 * draft must NOT change the public post title/subtitle/status.
 * ============================================================
 */

export async function upsertWeeklyRecapDraftPost(
  db,
  {
    season,
    week,
    title,
    subtitle = ''
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
    throw new Error(
      'Season and week are required.'
    );
  }

  const existing =
    await db
      .prepare(`
        SELECT *
        FROM posts

        WHERE
          source_type = 'weekly_recap'
          AND recap_season = ?
          AND recap_week = ?

        LIMIT 1
      `)
      .bind(
        cleanSeason,
        cleanWeek
      )
      .first();

  const existingPost =
    normalizePost(
      existing
    );

  /*
   * Do NOT mutate an already-published
   * publication record just because a
   * newer draft was generated.
   */
  if (
    existingPost?.status ===
    'published'
  ) {
    return existingPost;
  }

  const id =
    existingPost?.id ||
    `recap-${cleanSeason}-${cleanWeek}`;

  const slug =
    existingPost?.slug ||
    await uniqueSlug(
      db,
      `${cleanSeason}-week-${cleanWeek}`
    );

  if (existingPost) {
    await db
      .prepare(`
        UPDATE posts

        SET
          title = ?,
          subtitle = ?,
          excerpt = ?,

          tag = 'Weekly Recap',
          post_type = 'weekly_recap',

          status = 'draft',

          author_name = 'The Irving Weekly',
          source_type = 'weekly_recap',

          recap_season = ?,
          recap_week = ?,

          updated_at = unixepoch()

        WHERE id = ?
      `)
      .bind(
        clean(
          title
        ),

        clean(
          subtitle
        ),

        clean(
          subtitle
        ),

        cleanSeason,
        cleanWeek,

        id
      )
      .run();
  } else {
    await db
      .prepare(`
        INSERT INTO posts (
          id,
          slug,

          title,
          subtitle,
          excerpt,

          body,
          tag,
          post_type,

          status,
          author_name,
          source_type,

          recap_season,
          recap_week,

          created_at,
          updated_at
        )

        VALUES (
          ?,
          ?,

          ?,
          ?,
          ?,

          NULL,
          'Weekly Recap',
          'weekly_recap',

          'draft',
          'The Irving Weekly',
          'weekly_recap',

          ?,
          ?,

          unixepoch(),
          unixepoch()
        )
      `)
      .bind(
        id,
        slug,

        clean(
          title
        ),

        clean(
          subtitle
        ),

        clean(
          subtitle
        ),

        cleanSeason,
        cleanWeek
      )
      .run();
  }

  return getWeeklyPostById(
    db,
    id
  );
}