<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const PREVIEW_LIMIT = 5;
  const FALLBACK_SEASONS = [2026, 2025];

  const fmt = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : Number(0).toFixed(digits);
  };

  const upper = (value) => String(value || '—').toUpperCase();

  function pct(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return number.toFixed(3).replace(/^0/, '');
  }

  function moneyNumber(value) {
    if (value == null || value === '—') return null;

    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : null;
  }

  function moneyLabel(value) {
    const amount = moneyNumber(value);
    if (amount == null) return '—';

    return `$${amount.toLocaleString('en-US', {
      maximumFractionDigits: amount % 1 ? 2 : 0
    })}`;
  }

  function draftDollarClass(value) {
    const amount = moneyNumber(value);

    if (amount == null) return 'draft-money-neutral';
    if (amount < 100) return 'draft-money-low';
    if (amount > 200) return 'draft-money-high';

    return 'draft-money-mid';
  }

  function nflLabel(code) {
    const labels = {
      nyg: 'New York Giants',
      mia: 'Miami Dolphins',
      pit: 'Pittsburgh Steelers',
      ne: 'New England Patriots',
      gb: 'Green Bay Packers',
      cle: 'Cleveland Browns',
      tb: 'Tampa Bay Buccaneers',
      kc: 'Kansas City Chiefs'
    };

    return labels[String(code || '').toLowerCase()] || upper(code);
  }

  function personaIcon(persona) {
    return persona ? `/${persona}.png` : '/managers/question.jpg';
  }

  function serviceIcon(value) {
    return value ? `/${value}.png` : '/RookieWatch.png';
  }

  function legacyChampionshipIcon(league) {
  switch (
    String(league || '')
      .trim()
      .toLowerCase()
  ) {
    case 'dtsp':
      return '/badges/DTSP.png';

    case 'irving':
      return '/badges/Irving.png';

    case 'icl':
      return '/badges/ICLChamp.png';

    default:
      return null;
  }
}

  function serviceTitle(value) {
    if (!value) return 'Rookie Watch';

    const text = String(value).trim();
    return text.toLowerCase().includes('year') ? text : `${text} Years`;
  }

  function gameScore(row) {
    return `${fmt(row?.score)} – ${fmt(row?.oppScore)}`;
  }

  function moveCounterparties(move) {
    return move?.counterparties?.length ? move.counterparties.join(' • ') : 'Solo move';
  }

  function abbr(value) {
    const words = String(value || '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    if (!words.length) return 'IC';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  function seasonHref(option) {
    return `?season=${Number(option)}`;
  }

  $: season = Number(data.season || new Date().getFullYear());
  $: availableSeasons = (Array.isArray(data.seasons) && data.seasons.length
    ? data.seasons
    : FALLBACK_SEASONS
  )
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  $: manager = data.manager || {};
  $: franchise = data.franchise || {};
  $: career = data.career || {};
  $: draftMoney = data.draftMoney || {};
  $: allTime = data.allTime || {};
  $: rival = data.rival || null;
  $: sections = data.sections || {};
  $: lineupAnalytics = data.lineupAnalytics || {};
  $: tradeProfile = data.tradeProfile || {};
  $: moveProfile = data.moveProfile || {};

  $: teamName = franchise.teamName || manager.liveTeamName || 'Franchise';
  $: teamLogo = franchise.teamPhoto || manager.photo || '/managers/question.jpg';
  $: teamSlug = franchise.slug || manager.slug || data.slug || '';
  $: managerName = franchise.managerName || manager.name || 'Unknown manager';
  $: teamBio = franchise.bio || manager.bio || 'No franchise bio loaded yet.';
  $: teamPhilosophy = manager.philosophy || franchise.philosophy || 'Win first. Explain later.';
  $: teamAbbr = abbr(teamName);

  $: futureDraftLabel = moneyLabel(draftMoney.value);
  $: futureDraftClass = draftDollarClass(draftMoney.value);
  $: careerTitleYears = allTime.titleYears || [];
  $: careerTitleCount = allTime.totalTitles ?? career.titles ?? 0;
  $: legacyTitleYears = allTime.legacyTitleYears || career.historicalTitleYears || [];
  $: badgeCase =
  data.badgeCase || {
    totalAwards: 0,
    uniqueBadges: 0,
    badges: []
  };

  $: championshipHistory =
  String(
    manager?.championship?.years ||
    ''
  )
    .split(',')
    .map((value) =>
      Number(value.trim())
    )
    .filter(Number.isInteger)
    .map((year) => {
      const league =
        championshipLeagueForYear(
          manager,
          year
        );

      return {
        year,
        league,
        image:
          championshipIcon(
            league
          )
      };
    })
    .sort(
      (a, b) =>
        b.year - a.year
    );

/*
 * Persona, Service, and Legacy already live
 * in the identity shelf directly above this.
 *
 * The Trophy Case is for actual weekly/luck/stain
 * awards so we don't display the same thing twice.
 */
$: managerBadges =
  (badgeCase.badges || []).filter(
    (badge) =>
      [
        'weekly',
        'luck',
        'stains'
      ].includes(
        badge.category
      )
  );

$: visibleAwardCount =
  managerBadges.reduce(
    (total, badge) =>
      total +
      Number(badge.count || 0),
    0
  );

$: visibleUniqueBadgeCount =
  managerBadges.length;

let selectedBadge = null;

  $: identityCards = [
    {
      label: 'Persona',
      title: manager.persona || 'Unclassified',
      meta: 'Manager archetype',
      image: personaIcon(manager.persona)
    },
    {
      label: 'Service',
      title: serviceTitle(manager.yearsOfService),
      meta: manager.fantasyStart ? `Since ${manager.fantasyStart}` : 'No start year',
      image: serviceIcon(manager.yearsOfService)
    },
    {
  label: 'Championship',

  title:
    championshipHistory.length
      ? `${championshipHistory.length} ${
          championshipHistory.length === 1
            ? 'Title'
            : 'Titles'
        }`
      : 'No Titles',

  championships:
    championshipHistory,

  meta:
    championshipHistory.length
      ? championshipHistory
          .map(
            (title) =>
              `${title.year} ${title.league}`
          )
          .join(' • ')
      : 'No championship history'
},
    {
      label: 'Rival',
      title: rival?.name || manager.rival?.name || 'TBD',
      meta: rival?.teamName || 'Circle the matchup',
      image: rival?.image || manager.rival?.image || '/managers/question.jpg',
      href: rival?.href
    }
  ];

  $: allTimeOfficial = allTime.official || {};
  $: allTimeH2h = allTime.h2h || {};
  $: allTimeCards = [
    {
      label: 'Official record',
      value: allTimeOfficial.recordLabel || '—',
      note: allTimeOfficial.recordLabel ? `${pct(allTimeOfficial.pct)} win pct` : 'Sleeper ledger'
    },
    {
      label: 'All-time PF',
      value: fmt(allTimeOfficial.pointsFor),
      note: `${fmt(allTimeOfficial.pointsAgainst)} PA`
    },
    {
      label: 'Point diff',
      value: fmt(allTimeOfficial.pointDiff),
      note: `${allTimeOfficial.seasons || 0} Sleeper season${Number(allTimeOfficial.seasons || 0) === 1 ? '' : 's'}`
    },
    {
      label: 'H2H record',
      value: allTimeH2h.recordLabel || '—',
      note: `${allTimeH2h.gamesPlayed || 0} weekly matchups`
    },
    {
      label: 'Career titles',
      value: String(careerTitleCount),
      note: careerTitleYears.length ? careerTitleYears.join(', ') : 'Legacy + Sleeper ledger'
    }
  ];

  $: allTimeMoments = [
    { label: 'Best week', game: allTimeH2h.bestScore },
    { label: 'Biggest win', game: allTimeH2h.biggestWin },
    { label: 'Worst week', game: allTimeH2h.worstScore },
    { label: 'Worst loss', game: allTimeH2h.worstLoss }
  ];

  $: topStats = [
    { label: 'Rank', value: manager.currentRank ? `#${manager.currentRank}` : '—', note: 'Live Sleeper' },
    { label: 'Record', value: manager.recordLabel || '—', note: `Season ${season}` },
    { label: 'PF', value: fmt(manager.pointsFor), note: `${fmt(manager.pointsAgainst)} PA` }
  ];

  $: recentMatchups = data.recentMatchups || [];
  $: recentMoves = data.recentMoves || [];
  $: visibleRecentMatchups = recentMatchups.slice(0, PREVIEW_LIMIT);
  $: extraRecentMatchups = recentMatchups.slice(PREVIEW_LIMIT);
  $: visibleRecentMoves = recentMoves.slice(0, PREVIEW_LIMIT);
  $: extraRecentMoves = recentMoves.slice(PREVIEW_LIMIT);

  function badgeCategoryLabel(
  category
) {
  const labels = {
    personas:
      'Persona',

    weekly:
      'Weekly Honor',

    luck:
      'Luck',

    stains:
      'Stain',

    yearly:
      'Service',

    legacy:
      'Legacy'
  };

  return (
    labels[category] ||
    'Badge'
  );
}
function championshipLeagueForYear(
  manager,
  year
) {
  return (
    manager?.championship
      ?.leagueByYear?.[year] ||
    manager?.championship?.league ||
    null
  );
}


function championshipIcon(
  league
) {
  switch (
    String(league || '')
      .trim()
      .toLowerCase()
  ) {
    case 'icl':
      return '/badges/ICLChamp.png';

    case 'dtsp':
      return '/badges/DTSP.png';

    case 'irving':
      return '/badges/Irving.png';

    default:
      return null;
  }
}

function badgeAwardWhen(
  award
) {
  if (!award) {
    return '';
  }

  if (
    award.season ===
    'career'
  ) {
    return 'Career';
  }

  const parts = [];

  if (award.season) {
    parts.push(
      String(
        award.season
      )
    );
  }

  if (
    award.week != null
  ) {
    parts.push(
      `Week ${award.week}`
    );
  }

  return parts.join(
    ' · '
  );
}

function capitalMoney(
	value
) {
	const amount =
		Number(
			value ||
			0
		);

	return `$${amount.toLocaleString(
		'en-US',
		{
			minimumFractionDigits:
				0,

			maximumFractionDigits:
				2
		}
	)}`;
}


function signedCapitalMoney(
	value
) {
	const amount =
		Number(
			value ||
			0
		);

	if (amount > 0) {
		return `+$${amount.toLocaleString(
			'en-US',
			{
				maximumFractionDigits:
					2
			}
		)}`;
	}

	if (amount < 0) {
		return `-$${Math.abs(
			amount
		).toLocaleString(
			'en-US',
			{
				maximumFractionDigits:
					2
			}
		)}`;
	}

	return '$0';
}


function badgeAwardDetail(
  award
) {
  if (!award) {
    return '';
  }

  if (award.reason) {
    return award.reason;
  }

  if (
    award.metadata?.awardYear
  ) {
    return `Champion · ${award.metadata.awardYear}`;
  }

  return badgeAwardWhen(
    award
  );
}

function openBadge(
  badge
) {
  selectedBadge =
    badge;
}


function closeBadge() {
  selectedBadge =
    null;
}


function handleBadgeKeydown(
  event
) {
  if (
    event.key === 'Escape' &&
    selectedBadge
  ) {
    closeBadge();
  }
}


function badgeSeasonLabel(
  award
) {
  if (!award) {
    return '';
  }

  if (
    award.season ===
    'career'
  ) {
    return 'Career';
  }

  const season =
    award.season
      ? String(
          award.season
        )
      : '';

  const week =
    award.week != null
      ? `Week ${award.week}`
      : '';

  return [
    season,
    week
  ]
    .filter(Boolean)
    .join(' · ');
}


function badgeScoreLabel(
  award
) {
  if (
    award?.score == null
  ) {
    return null;
  }

  return `${Number(
    award.score
  ).toFixed(2)} pts`;
}
</script>
<svelte:window
  on:keydown={handleBadgeKeydown}
/>

<div class="page-stack">
  <LeagueSubnav season={season} active="teams" />

<section class="franchise-hero">
	<div class="franchise-hero-top">
		<div>
			<div class="eyebrow">
				Franchise dossier
			</div>

			<div class="manager-kicker">
				{managerName}
			</div>
		</div>

		<nav
			class="franchise-season"
			aria-label="Season selector"
		>
			<span>
				Season feed
			</span>

			<div class="season-pills">
				{#each availableSeasons as option}
					<a
						class:active={
							Number(option) ===
							Number(season)
						}
						href={seasonHref(option)}
					>
						{option}
					</a>
				{/each}
			</div>
		</nav>
	</div>


	<div class="franchise-hero-grid">
		<div class="logo-bay">
			<img
				class="team-logo"
				src={teamLogo}
				alt={teamName}
			/>
		</div>


		<div class="franchise-copy">
			<div>
				<div class="eyebrow">
					Irving franchise
				</div>

				<h1>
					{teamName}
				</h1>

				<p class="philosophy">
					{teamPhilosophy}
				</p>
			</div>

			<p class="franchise-bio">
				{teamBio}
			</p>


			<div
				class="season-stat-strip"
				aria-label="Current season summary"
			>
				<div>
					<span>
						Rank
					</span>

					<strong>
						{manager.currentRank
							? `#${manager.currentRank}`
							: '—'}
					</strong>
				</div>

				<div>
					<span>
						Record
					</span>

					<strong>
						{manager.recordLabel ||
							'0-0'}
					</strong>
				</div>

				<div>
					<span>
						Points for
					</span>

					<strong>
						{fmt(
							manager.pointsFor
						)}
					</strong>
				</div>

				<div>
					<span>
						Points against
					</span>

					<strong>
						{fmt(
							manager.pointsAgainst
						)}
					</strong>
				</div>
			</div>


			<dl class="mini-facts">
				<div class="future-dollars">
					<dt>
						Future Draft $
					</dt>

					<dd
						class={`draft-money-pill ${futureDraftClass}`}
					>
						{futureDraftLabel}
					</dd>
				</div>

				<div>
					<dt>
						Fantasy start
					</dt>

					<dd>
						{manager.fantasyStart ||
							'—'}
					</dd>
				</div>

				<div>
					<dt>
						NFL tie
					</dt>

					<dd>
						{nflLabel(
							manager.favoriteTeam
						)}
					</dd>
				</div>

				<div>
					<dt>
						Location
					</dt>

					<dd>
						{manager.location ||
							'—'}
					</dd>
				</div>
			</dl>
		</div>
	</div>


	<div class="quick-links">
		{#if sections.moves}
			<a href={sections.moves}>
				Move log
			</a>
		{/if}

		{#if sections.games}
			<a href={sections.games}>
				Games
			</a>
		{/if}

		{#if sections.drafts}
			<a href={sections.drafts}>
				Draft archive
			</a>
		{/if}

		{#if sections.standings}
			<a href={sections.standings}>
				Standings
			</a>
		{/if}

		{#if data.managerNav?.all}
			<a href={data.managerNav.all}>
				All franchises
			</a>
		{/if}
	</div>
</section>

  <section
  class="identity-shelf"
  aria-label="Franchise identity"
>
  {#each identityCards as identityCard}

    {#if identityCard.href}

      <a
        class="identity-card"
        href={identityCard.href}
      >

        <span>
          {identityCard.label}
        </span>


        {#if identityCard.championships?.length}

          <div class="championship-badges">

            {#each identityCard.championships as title}

              <div class="championship-badge">

                {#if title.image}

                  <img
                    src={title.image}
                    alt={`${title.league} Champion`}
                  />

                {/if}

                <span>
                  {title.year}
                </span>

              </div>

            {/each}

          </div>

        {:else if identityCard.image}

          <img
            src={identityCard.image}
            alt={identityCard.title}
          />

        {/if}


        <strong>
          {identityCard.title}
        </strong>

        <small>
          {identityCard.meta}
        </small>

      </a>


    {:else}

      <article class="identity-card">

        <span>
          {identityCard.label}
        </span>


        {#if identityCard.championships?.length}

          <div class="championship-badges">

            {#each identityCard.championships as title}

              <div class="championship-badge">

                {#if title.image}

                  <img
                    src={title.image}
                    alt={`${title.league} Champion`}
                  />

                {/if}

                <span>
                  {title.year}
                </span>

              </div>

            {/each}

          </div>

        {:else if identityCard.image}

          <img
            src={identityCard.image}
            alt={identityCard.title}
          />

        {/if}


        <strong>
          {identityCard.title}
        </strong>

        <small>
          {identityCard.meta}
        </small>

      </article>

    {/if}

  {/each}
</section>

  <section
  class="card badge-case-card"
  aria-labelledby="badge-case-title"
>
  <div class="card-head badge-case-head">
    <div>
      <div class="eyebrow">
        Trophy case & rap sheet
      </div>

      <h3 id="badge-case-title">
        Badges
      </h3>
    </div>

    <div class="badge-case-summary">
      <strong>
        {visibleAwardCount}
      </strong>

      <span>
        awards ·
        {visibleUniqueBadgeCount}
        unique
      </span>
    </div>
  </div>


  {#if managerBadges.length}

    <div class="manager-badge-grid">

      {#each managerBadges as badge}

        <button
          type="button"
          class={`manager-badge manager-badge-${badge.category}`}
          on:click={() =>
            openBadge(badge)
          }
          aria-label={`View ${badge.title} award history`}
        >

          <div class="manager-badge-top">

            <div class="manager-badge-icon-wrap">

              <img
                class="manager-badge-icon"
                src={badge.icon}
                alt=""
              />

              {#if badge.count > 1}
                <span
                  class="manager-badge-count"
                >
                  ×{badge.count}
                </span>
              {/if}

            </div>


            <div class="manager-badge-title">

              <span>
                {badgeCategoryLabel(
                  badge.category
                )}
              </span>

              <strong>
                {badge.title}
              </strong>

            </div>

          </div>


          {#if badge.description}
            <p class="manager-badge-description">
              {badge.description}
            </p>
          {/if}


          {#if badge.awards?.length}
            <div class="manager-badge-latest">

              <span>
                Latest award
              </span>

              <strong>
                {badgeAwardWhen(
                  badge.awards[0]
                )}
              </strong>

              {#if badge.awards[0].reason}
                <small>
                  {badge.awards[0].reason}
                </small>
              {/if}

            </div>
          {/if}


          <div class="manager-badge-click">
            View award history →
          </div>

        </button>

      {/each}

    </div>


    <div class="badge-case-footer">
      <a href="/history/badges">
        View league badge cabinet
      </a>
    </div>

  {:else}

    <div class="empty">
      No weekly honors, luck awards,
      or stains yet.
    </div>

  {/if}
</section>

  <section class="card all-time-card">
    <div class="card-head">
      <div>
        <div class="eyebrow">Franchise ledger</div>
        <h3>All-time records</h3>
      </div>
      <!-- <small>{allTime.source || 'Sleeper career rollup'}</small> -->
    </div>

    <div class="all-time-grid">
      {#each allTimeCards as stat}
        <article class="mini-stat">
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <small>{stat.note}</small>
        </article>
      {/each}
    </div>

    <div class="grid two-up all-time-lower">
      <article class="ledger-panel">
        <h4>Season ledger</h4>
        <div class="history-table compact">
          <div class="history-head">
            <span>Season</span>
            <span>Finish</span>
            <span>Record</span>
            <span>PF</span>
          </div>
          {#each allTime.seasons || [] as seasonRow}
            <div class="history-row">
              <span>{seasonRow.season}</span>
              <span>#{seasonRow.rank}</span>
              <span>{seasonRow.recordLabel}</span>
              <span>{fmt(seasonRow.points)}</span>
            </div>
          {/each}
          {#if !(allTime.seasons || []).length}<div class="empty">No linked Sleeper seasons found yet.</div>{/if}
        </div>
      </article>

      <article class="ledger-panel">
        <h4>All-time moments</h4>
        <div class="stack">
          {#each allTimeMoments as item}
            <div class="moment-row">
              <span>{item.label}</span>
              {#if item.game}
                <strong>{fmt(item.game.score)} vs {item.game.opponentTeam}</strong>
                <small>
                  {item.game.season} Week {item.game.week} · {item.game.result}{item.game.result !== 'Tie' && item.game.result !== 'Bye' ? ` by ${Math.abs(item.game.margin).toFixed(2)}` : ''}
                </small>
              {:else}
                <strong>—</strong>
                <small>No matchup data yet</small>
              {/if}
            </div>
          {/each}
        </div>
      </article>
    </div>
  </section>

  <section class="grid two-up">
    <article class="card">
      <div class="card-head">
        <div>
          <div class="eyebrow">Command center</div>
          <h3>Lineup audit</h3>
        </div>
        <strong>{fmt(lineupAnalytics.averageLineupIQ, 1)}%</strong>
      </div>
      <dl class="facts">
        <div><dt>Average lineup IQ</dt><dd>{fmt(lineupAnalytics.averageLineupIQ, 1)}%</dd></div>
        <div><dt>Average hit rate</dt><dd>{fmt(lineupAnalytics.averageHitRate, 1)}%</dd></div>
        <div><dt>Bench points lost</dt><dd>{fmt(lineupAnalytics.totalBenchPoints)}</dd></div>
        <div><dt>Worst efficiency week</dt><dd>{lineupAnalytics.worstWeek ? `Week ${lineupAnalytics.worstWeek.week}` : '—'}</dd></div>
      </dl>
    </article>

    <article class="card">
	<div class="card-head">
		<div>
			<div class="eyebrow">
				All-Time Market Profile
			</div>

			<h3>
				Trades & Waivers
			</h3>
		</div>

		<strong>
			{moveProfile.totalMoves || 0}
		</strong>
	</div>

	<dl class="facts">
		<div>
			<dt>
				Trade style
			</dt>

			<dd>
				{tradeProfile.marketStyle ||
					'Quiet market'}
			</dd>
		</div>

		<div>
			<dt>
				Career trades
			</dt>

			<dd>
				{tradeProfile.tradeCount || 0}
			</dd>
		</div>

		<div>
			<dt>
				Favorite partner
			</dt>

			<dd>
				{tradeProfile.favoritePartner
					? `${tradeProfile.favoritePartner} (${tradeProfile.favoritePartnerCount})`
					: '—'}
			</dd>
		</div>
<div>
	<dt>
		Draft capital sent
	</dt>

	<dd>
		{capitalMoney(
			tradeProfile.draftCapitalSent
		)}
	</dd>
</div>

<div>
	<dt>
		Draft capital acquired
	</dt>

	<dd>
		{capitalMoney(
			tradeProfile.draftCapitalAcquired
		)}
	</dd>
</div>

<div>
	<dt>
		Net capital
	</dt>

	<dd
		class:capital-positive={
			Number(
				tradeProfile.draftCapitalNet ||
				0
			) > 0
		}
		class:capital-negative={
			Number(
				tradeProfile.draftCapitalNet ||
				0
			) < 0
		}
	>
		{signedCapitalMoney(
			tradeProfile.draftCapitalNet
		)}
	</dd>
</div>
		<div>
			<dt>
				Waiver claims
			</dt>

			<dd>
				{moveProfile.waivers || 0}
			</dd>
		</div>

		<div>
			<dt>
				Free-agent moves
			</dt>

			<dd>
				{moveProfile.freeAgents || 0}
			</dd>
		</div>

		<div>
			<dt>
				Transaction tape
			</dt>

			<dd>
				{moveProfile.totalMoves || 0} moves ·
				{moveProfile.adds || 0} adds ·
				{moveProfile.drops || 0} drops
			</dd>
		</div>

		<dd>
	{#if moveProfile.seasonsTracked}

		{#if moveProfile.firstSeason ===
			moveProfile.lastSeason}

			{moveProfile.firstSeason}
			·
			{moveProfile.seasonsTracked}
			season{moveProfile.seasonsTracked === 1
				? ''
				: 's'}

		{:else}

			{moveProfile.firstSeason}–{moveProfile.lastSeason}
			·
			{moveProfile.seasonsTracked}
			seasons

		{/if}

	{:else}
		—
	{/if}
</dd>
	</dl>
</article>
  </section>

  <section class="grid two-up">
    <article class="card">
      <div class="card-title-row">
        <h3>Recent games</h3>
        {#if recentMatchups.length}<small>{recentMatchups.length} sampled</small>{/if}
      </div>
      <div class="stack">
        {#each visibleRecentMatchups as row}
          <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${season}`}>
            <strong>Week {row.week} · {row.result}</strong>
            <small>{row.opponentTeam}</small>
            <span>{gameScore(row)}</span>
          </a>
        {/each}

        {#if extraRecentMatchups.length}
          <details class="more-list">
            <summary>Show {extraRecentMatchups.length} more game{extraRecentMatchups.length === 1 ? '' : 's'}</summary>
            <div class="overflow-stack">
              {#each extraRecentMatchups as row}
                <a class="line-item" href={`/league/teams/${teamSlug}/weeks/${row.week}?season=${season}`}>
                  <strong>Week {row.week} · {row.result}</strong>
                  <small>{row.opponentTeam}</small>
                  <span>{gameScore(row)}</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMatchups.length}<div class="empty">No recent matchup data available.</div>{/if}
      </div>
    </article>

    <article class="card">
      <div class="card-title-row">
        <h3>Recent moves</h3>
        {#if recentMoves.length}<small>{recentMoves.length} sampled</small>{/if}
      </div>
      <div class="stack">
        {#each visibleRecentMoves as move}
          <a class="line-item" href={sections.moves || '#'}>
            <strong>Week {move.week} · {move.type}</strong>
            <small>{moveCounterparties(move)}</small>
            <span>{move.addCount || 0} add / {move.dropCount || 0} drop</span>
          </a>
        {/each}

        {#if extraRecentMoves.length}
          <details class="more-list">
            <summary>Show {extraRecentMoves.length} more move{extraRecentMoves.length === 1 ? '' : 's'}</summary>
            <div class="overflow-stack">
              {#each extraRecentMoves as move}
                <a class="line-item" href={sections.moves || '#'}>
                  <strong>Week {move.week} · {move.type}</strong>
                  <small>{moveCounterparties(move)}</small>
                  <span>{move.addCount || 0} add / {move.dropCount || 0} drop</span>
                </a>
              {/each}
            </div>
          </details>
        {/if}

        {#if !recentMoves.length}<div class="empty">No recent move data available.</div>{/if}
      </div>
    </article>
  </section>
</div>

{#if selectedBadge}

  <div
    class="badge-modal-backdrop"
    role="presentation"
    on:click={closeBadge}
  >

    <section
      class="badge-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-modal-title"
      on:click|stopPropagation
    >

      <button
        type="button"
        class="badge-modal-close"
        on:click={closeBadge}
        aria-label="Close badge details"
      >
        ×
      </button>


      <header class="badge-modal-header">

        <div class="badge-modal-icon-wrap">

          <img
            src={selectedBadge.icon}
            alt=""
          />

          {#if selectedBadge.count > 1}
            <span>
              ×{selectedBadge.count}
            </span>
          {/if}

        </div>


        <div>

          <div class="eyebrow">
            {badgeCategoryLabel(
              selectedBadge.category
            )}
          </div>

          <h2 id="badge-modal-title">
            {selectedBadge.title}
          </h2>

          <p>
            {selectedBadge.description}
          </p>

        </div>

      </header>


      <div class="badge-modal-divider">
        <span>
          Award history
        </span>

        <strong>
          {selectedBadge.awards?.length || 0}
          total
        </strong>
      </div>


      <div class="badge-modal-history">

        {#each selectedBadge.awards || [] as award, index}

          <article class="badge-modal-award">

            <div class="badge-modal-award-number">
              #{selectedBadge.awards.length - index}
            </div>


            <div class="badge-modal-award-body">

              <div class="badge-modal-award-head">

                <strong>
                  {badgeSeasonLabel(
                    award
                  )}
                </strong>

                {#if badgeScoreLabel(award)}
                  <span>
                    {badgeScoreLabel(
                      award
                    )}
                  </span>
                {/if}

              </div>


              {#if award.reason}

                <p class="badge-modal-reason">
                  {award.reason}
                </p>

              {:else}

                <p class="badge-modal-reason badge-modal-muted">
                  No additional explanation
                  was recorded for this award.
                </p>

              {/if}


              {#if
                award.opponentTeamName ||
                award.opponentName
              }

                <div class="badge-modal-detail">

                  <span>
                    Opponent
                  </span>

                  <strong>
                    {award.opponentTeamName ||
                      award.opponentName}
                  </strong>

                  {#if award.opponentScore != null}
                    <small>
                      {Number(
                        award.opponentScore
                      ).toFixed(2)}
                      pts
                    </small>
                  {/if}

                </div>

              {/if}


              {#if
                award.nominatedByTeamName ||
                award.nominatedByName
              }

                <div class="badge-modal-detail">

                  <span>
                    Nominated by
                  </span>

                  <strong>
                    {award.nominatedByTeamName ||
                      award.nominatedByName}
                  </strong>

                </div>

              {/if}


              {#if award.metadata?.zeroStarters?.length}

                <div class="badge-modal-detail">

                  <span>
                    Zero Hour victim
                  </span>

                  <strong>
                    {award.metadata.zeroStarters
                      .map(
                        (player) =>
                          player.name
                      )
                      .join(', ')}
                  </strong>

                </div>

              {/if}


              {#if award.metadata?.byeStarters?.length}

                <div class="badge-modal-detail">

                  <span>
                    Bye-week starter
                  </span>

                  <strong>
                    {award.metadata.byeStarters
                      .map(
                        (player) =>
                          player.name
                      )
                      .join(', ')}
                  </strong>

                </div>

              {/if}


              {#if
                award.metadata?.hindsightBenchPlayerName
              }

                <div class="badge-modal-swap">

                  <div>
                    <span>
                      Should've started
                    </span>

                    <strong>
                      {award.metadata
                        .hindsightBenchPlayerName}
                    </strong>

                    {#if
                      award.metadata
                        .hindsightBenchScore != null
                    }
                      <small>
                        {Number(
                          award.metadata
                            .hindsightBenchScore
                        ).toFixed(2)}
                        pts
                      </small>
                    {/if}
                  </div>


                  <div class="badge-modal-arrow">
                    →
                  </div>


                  <div>
                    <span>
                      Instead of
                    </span>

                    <strong>
                      {award.metadata
                        .hindsightReplacedPlayerName}
                    </strong>

                    {#if
                      award.metadata
                        .hindsightReplacedPlayerScore != null
                    }
                      <small>
                        {Number(
                          award.metadata
                            .hindsightReplacedPlayerScore
                        ).toFixed(2)}
                        pts
                      </small>
                    {/if}
                  </div>

                </div>

              {/if}

            </div>

          </article>

        {/each}

      </div>

    </section>

  </div>

{/if}

<style>
  .page-stack {
    display: grid;
    gap: 20px;
    max-width: 1180px;
    margin: 0 auto;
    padding-bottom: 44px;
  }

  .franchise-broadcast {
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 16px;
    background: linear-gradient(180deg, #5f6763, #252b2a 48%, #101313);
    box-shadow: var(--shadow-bug);
  }

  .broadcast-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: stretch;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #070808);
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .network-label {
    display: inline-flex;
    align-items: center;
    padding: 9px 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    white-space: nowrap;
  }

  .broadcast-header > strong {
    min-width: 0;
    display: flex;
    align-items: center;
    padding: 9px 12px;
    overflow: hidden;
    color: var(--bug-yellow);
    letter-spacing: 0.1em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .season-switcher {
    align-self: stretch;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-left: 2px solid #070808;
    background: linear-gradient(180deg, #d9d9cf, #777d78 48%, #222826);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.45),
      inset 0 -2px 0 rgba(0,0,0,0.55);
  }

  .season-box-label {
    color: #111;
    font-family: var(--font-score);
    font-size: 0.64rem;
    font-weight: 950;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    white-space: nowrap;
  }

  .season-pills {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
  }

  .season-pills a {
    min-width: 54px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border: 2px solid #070808;
    border-radius: 5px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-size: 0.74rem;
    font-weight: 950;
    line-height: 1;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.65),
      inset 0 -2px 0 rgba(0,0,0,0.34);
  }

  .season-pills a:hover,
  .season-pills a.active {
    color: #fff;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    text-shadow: 0 2px 0 #000;
  }

  .main-bug {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 22px;
    padding: 22px;
  }

  .logo-bay {
    display: grid;
    place-items: center;
  }

  .team-logo {
    width: 220px;
    height: 220px;
    object-fit: cover;
    border-radius: 9px;
    
  }

  .scorebug-body,
  .story-box,
  .mini-facts,
  .stack,
  .facts {
    display: grid;
    gap: 12px;
  }

  .score-lines {
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 8px;
    box-shadow: var(--shadow-bug);
  }

  .score-line {
    min-height: 55px;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 96px;
    align-items: stretch;
    border-bottom: 2px solid #070808;
    background: #0b0d0d;
    font-family: var(--font-score);
  }

  .score-line:last-child {
    border-bottom: 0;
  }

  .score-line span {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
  }

  .score-line.away span {
    background: linear-gradient(180deg, var(--bug-blue), #0b315e);
  }

  .score-line strong {
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 0 12px;
    color: white;
    font-size: clamp(1rem, 2vw, 1.4rem);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score-line em {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111;
    font-size: 1.35rem;
    font-style: normal;
  }

  .meta-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 7px;
    background: linear-gradient(180deg, #f5f4ea, #c9cac1 50%, #818782);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-transform: uppercase;
  }

  .meta-strip span {
    overflow: hidden;
    padding: 8px 10px;
    border-right: 1px solid rgba(0,0,0,0.34);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta-strip span:last-child {
    border-right: 0;
  }

  .story-box h1 {
    margin: 3px 0 0;
    font-size: clamp(2.4rem, 5vw, 4.8rem);
    line-height: 0.92;
  }

  .story-box p {
    margin: 0;
    color: rgba(247,245,235,0.82);
    line-height: 1.48;
    
  }

  .philosophy {
    color: white !important;
    font-weight: 900;
    padding-top: 13px;
  }

  .mini-facts,
  .facts {
    gap: 0;
  }

  .mini-facts div,
  .facts div {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(247,245,235,0.15);
  }

  .mini-facts dt,
  .facts dt {
    color: var(--muted);
  }

  .mini-facts dd,
  .facts dd {
    margin: 0;
    color: white;
    font-weight: 850;
  }

  .future-dollars .draft-money-pill {
    width: fit-content;
    min-width: 76px;
    padding: 4px 10px;
    border: 2px solid #050606;
    border-radius: 5px;
    background: linear-gradient(180deg, #fffef2 0%, #daded5 48%, #8c948e 100%);
    color: #080909;
    font-family: var(--font-score);
    font-size: 0.86rem;
    font-weight: 950;
    line-height: 1;
    text-align: center;
    text-shadow: none;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55);
  }

  .future-dollars .draft-money-low {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(200,16,46,0.55),
      0 0 12px rgba(200,16,46,0.75);
  }

  .future-dollars .draft-money-mid {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(247,201,72,0.65),
      0 0 12px rgba(247,201,72,0.75);
  }

  .future-dollars .draft-money-high {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 0 1px rgba(47,157,89,0.65),
      0 0 12px rgba(47,157,89,0.8);
  }

  .future-dollars .draft-money-neutral {
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.85),
      inset 0 -2px 0 rgba(0,0,0,0.32),
      0 2px 0 rgba(0,0,0,0.55),
      0 0 8px rgba(180,185,178,0.38);
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 0 22px 18px;
  }

  .stat-card,
  .identity-card,
  .card {
    border-radius: 12px;
    padding: 16px;
  }

  .stat-card strong,
  .card-head strong {
    display: block;
    margin: 7px 0 3px;
    font-family: var(--font-score);
    font-size: 1.75rem;
    line-height: 1;
  }

  .quick-links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    padding: 0 22px 22px;
  }

  .quick-links a {
    border: 1px solid #070808;
    border-radius: 5px;
    padding: 8px 10px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111 !important;
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-decoration: none;
    text-transform: uppercase;
  }

  .identity-shelf,
  .grid.two-up {
    display: grid;
    gap: 18px;
  }

  .identity-shelf {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .identity-card {
    min-height: 168px;
    display: grid;
    justify-items: center;
    gap: 9px;
    color: inherit;
    text-align: center;
    text-decoration: none;
  }

  .identity-card img {
    width: 78px;
    height: 78px;
    object-fit: contain;
    border-radius: 50%;
    filter: drop-shadow(0 12px 18px rgba(0,0,0,0.42));
  }

  .identity-card strong {
    font-size: 1rem;
  }

  .identity-card small {
    max-width: 22ch;
  }

  .badge-case-card {
  overflow: hidden;
}

.badge-case-head {
  align-items: center;
}

.badge-case-summary {
  display: grid;
  justify-items: end;
  gap: 2px;
}

.badge-case-summary strong {
  color: var(--bug-yellow);
  font-family: var(--font-score);
  font-size: 1.55rem;
  line-height: 1;
}

.badge-case-summary span {
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}


.manager-badge-grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(245px, 1fr)
    );

  gap: 12px;
}


.manager-badge {
   width: 100%;
  appearance: none;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  position: relative;
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border:
    2px solid
    #070808;
  border-radius:
    9px;
  background:
    linear-gradient(
      180deg,
      #343a37,
      #171b19 52%,
      #0b0d0d
    );

  box-shadow:
    inset 0 1px 0
      rgba(255, 255, 255, 0.10),

    0 10px 24px
      rgba(0, 0, 0, 0.26);
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;

}
.manager-badge:hover {
  transform:
    translateY(-2px);

  border-color:
    var(--bug-yellow);

  box-shadow:
    inset 0 1px 0
      rgba(255, 255, 255, 0.12),

    0 14px 30px
      rgba(0, 0, 0, 0.38);
}


.manager-badge:focus-visible {
  outline:
    2px solid
    #18b7ff;

  outline-offset:
    3px;
}


.manager-badge-click {
  margin-top: auto;

  color:
    #18b7ff;

  font-family:
    var(--font-score);

  font-size:
    0.66rem;

  font-weight:
    950;

  letter-spacing:
    0.08em;

  text-transform:
    uppercase;
}


.manager-badge-latest small {
  color:
    rgba(
      255,
      255,
      255,
      0.55
    );

  font-size:
    0.72rem;

  line-height:
    1.35;
}

.manager-badge-top {
  display: grid;
  grid-template-columns:
    70px
    minmax(0, 1fr);

  gap: 12px;
  align-items: center;
}


.manager-badge-icon-wrap {
  position: relative;

  width: 70px;
  height: 70px;
}


.manager-badge-icon {
  width: 70px;
  height: 70px;

  object-fit:
    contain;

  filter:
    drop-shadow(
      0 8px 10px
      rgba(0, 0, 0, 0.45)
    );
}


.manager-badge-count {
  position: absolute;
  right: -5px;
  bottom: -5px;

  display: grid;
  place-items: center;

  min-width: 27px;
  height: 27px;

  padding:
    0 6px;

  border:
    2px solid
    #070808;

  border-radius:
    999px;

  background:
    linear-gradient(
      180deg,
      var(--bug-red),
      var(--bug-red-dark)
    );

  color:
    white;

  font-family:
    var(--font-score);

  font-size:
    0.72rem;

  font-weight:
    950;

  box-shadow:
    0 5px 10px
    rgba(0, 0, 0, 0.45);
}


.manager-badge-title {
  min-width: 0;

  display: grid;
  gap: 4px;
}


.manager-badge-title span {
  color:
    var(--bug-yellow);

  font-family:
    var(--font-score);

  font-size:
    0.63rem;

  font-weight:
    950;

  letter-spacing:
    0.12em;

  text-transform:
    uppercase;
}


.manager-badge-title strong {
  overflow: hidden;

  color:
    white;

  font-family:
    var(--font-score);

  font-size:
    1rem;

  line-height:
    1.05;

  text-overflow:
    ellipsis;
}


.manager-badge-description {
  margin: 0;

  color:
    rgba(
      255,
      255,
      255,
      0.58
    );

  font-size:
    0.78rem;

  line-height:
    1.35;
}


.manager-badge-latest {
  display: grid;
  gap: 4px;

  padding:
    10px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  border-radius:
    6px;

  background:
    rgba(
      0,
      0,
      0,
      0.22
    );
}


.manager-badge-latest span,
.badge-history-row span {
  color:
    #8d9691;

  font-family:
    var(--font-score);

  font-size:
    0.65rem;

  font-weight:
    900;

  letter-spacing:
    0.06em;

  text-transform:
    uppercase;
}


.manager-badge-latest strong,
.badge-history-row strong {
  color:
    #f2f0e6;

  font-size:
    0.78rem;

  line-height:
    1.35;
}


.badge-history {
  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  padding-top:
    10px;
}


.badge-history summary {
  cursor:
    pointer;

  color:
    #18b7ff;

  font-family:
    var(--font-score);

  font-size:
    0.7rem;

  font-weight:
    950;

  letter-spacing:
    0.08em;

  text-transform:
    uppercase;

  list-style:
    none;
}


.badge-history summary::-webkit-details-marker {
  display:
    none;
}


.badge-history summary::after {
  content:
    ' +';

  color:
    var(--bug-yellow);
}


.badge-history[open]
summary::after {
  content:
    ' −';
}


.badge-history-list {
  display:
    grid;

  gap:
    8px;

  margin-top:
    10px;
}

.capital-positive {
	color: #78e49b;
}

.capital-negative {
	color: #ff7e7e;
}
.badge-history-row {
  display:
    grid;

  gap:
    3px;

  padding:
    9px 10px;

  border-radius:
    5px;

  background:
    rgba(
      0,
      0,
      0,
      0.23
    );
}


.badge-history-row small {
  color:
    rgba(
      255,
      255,
      255,
      0.43
    );

  font-size:
    0.68rem;
}


.badge-case-footer {
  display:
    flex;

  justify-content:
    flex-end;

  margin-top:
    14px;
}


.badge-case-footer a {
  color:
    #18b7ff;

  font-family:
    var(--font-score);

  font-size:
    0.72rem;

  font-weight:
    950;

  letter-spacing:
    0.08em;

  text-transform:
    uppercase;
}


.manager-badge-stains {
  border-color:
    rgba(
      193,
      49,
      39,
      0.68
    );
}


.manager-badge-legacy {
  border-color:
    rgba(
      219,
      184,
      72,
      0.58
    );
}


.manager-badge-personas {
  border-color:
    rgba(
      41,
      126,
      187,
      0.52
    );
}


@media (
  max-width: 620px
) {
  .manager-badge-grid {
    grid-template-columns:
      1fr;
  }

  .badge-case-summary {
    justify-items:
      start;
  }
}

  .card-head,
  .card-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 14px;
  }

  .card-head h3,
  .card-title-row h3 {
    margin: 0;
  }

  .card-head > small {
    max-width: 52ch;
    text-align: right;
  }

  .all-time-card,
  .history-table,
  .stack {
    display: grid;
    gap: 10px;
  }

  .all-time-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .mini-stat {
    border-radius: 9px;
    padding: 14px;
  }

  .mini-stat strong {
    display: block;
    margin: 8px 0 4px;
    font-family: var(--font-score);
    font-size: 1.35rem;
  }

  .all-time-lower {
    margin-top: 8px;
  }

  .grid.two-up {
    grid-template-columns: 1fr 1fr;
  }

  .ledger-panel {
    border: 1px solid #070808;
    border-radius: 10px;
    padding: 14px;
    background: linear-gradient(180deg, #303735, #111313);
  }

  .ledger-panel h4 {
    margin: 0 0 12px;
  }

  .history-head,
  .history-row {
    display: grid;
    grid-template-columns: 90px 110px 1fr auto;
    align-items: center;
    gap: 12px;
    border-radius: 7px;
    padding: 10px 12px;
  }

  .moment-row,
  .line-item,
  .empty {
    border-radius: 8px;
    padding: 12px;
  }

  .moment-row {
    display: grid;
    gap: 4px;
  }

  .line-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 14px;
    color: inherit;
    text-decoration: none;
  }

  .line-item small {
    grid-column: 1;
  }

  .line-item span {
    grid-column: 2;
    grid-row: 1 / 3;
    align-self: center;
    white-space: nowrap;
  }

  .more-list summary {
    cursor: pointer;
    list-style: none;
    border: 1px solid #070808;
    border-radius: 7px;
    padding: 10px 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .more-list summary::-webkit-details-marker {
    display: none;
  }

  .overflow-stack {
    display: grid;
    gap: 10px;
    max-height: 360px;
    overflow-y: auto;
    margin-top: 10px;
    padding-right: 6px;
  }

  @media (max-width: 1080px) {
    .identity-shelf {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .all-time-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .main-bug,
    .grid.two-up,
    .mini-facts div,
    .facts div,
    .history-head,
    .history-row {
      grid-template-columns: 1fr;
    }

    .logo-bay {
      justify-items: start;
    }

    .team-logo {
      width: min(220px, 100%);
      height: auto;
      aspect-ratio: 1;
    }

    .meta-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stat-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .card-head > small {
      text-align: left;
    }

    .line-item {
      grid-template-columns: 1fr;
    }

    .line-item span {
      grid-column: auto;
      grid-row: auto;
    }
  }

  @media (max-width: 620px) {
    .broadcast-header {
      grid-template-columns: 1fr;
    }

    .season-switcher {
      border-top: 2px solid #070808;
      border-left: 0;
      justify-content: space-between;
    }

    .main-bug,
    .franchise-broadcast .stat-grid,
    .quick-links {
      padding: 14px;
    }

    .stat-grid,
    .all-time-grid,
    .identity-shelf {
      grid-template-columns: 1fr;
    }

    .score-line {
      grid-template-columns: 48px minmax(0, 1fr) 72px;
    }

    .story-box h1 {
      font-size: clamp(2.2rem, 14vw, 3.4rem);
    }
  }

  .badge-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: grid;
  place-items: center;

  padding: 24px;

  background:
    rgba(
      0,
      0,
      0,
      0.78
    );

  backdrop-filter:
    blur(5px);
}


.badge-modal {
  position: relative;

  width:
    min(
      720px,
      100%
    );

  max-height:
    min(
      820px,
      90vh
    );

  overflow-y: auto;

  border:
    2px solid
    #050606;

  border-radius:
    12px;

  background:
    linear-gradient(
      180deg,
      #363d39 0%,
      #171b19 18%,
      #090b0a 100%
    );

  box-shadow:
    0 30px 90px
      rgba(
        0,
        0,
        0,
        0.8
      );
}


.badge-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;

  width: 34px;
  height: 34px;

  display: grid;
  place-items: center;

  border:
    2px solid
    #050606;

  border-radius:
    6px;

  background:
    linear-gradient(
      180deg,
      #d8d8ce,
      #727975
    );

  color:
    #101111;

  font-family:
    var(--font-score);

  font-size:
    1.35rem;

  font-weight:
    950;

  cursor:
    pointer;
}


.badge-modal-header {
  display: grid;

  grid-template-columns:
    104px
    minmax(
      0,
      1fr
    );

  gap:
    18px;

  align-items:
    center;

  padding:
    26px;
}


.badge-modal-header h2 {
  margin:
    3px 0 7px;

  color:
    white;

  font-family:
    var(--font-score);

  font-size:
    clamp(
      1.4rem,
      4vw,
      2rem
    );

  line-height:
    1;
}


.badge-modal-header p {
  max-width:
    520px;

  margin:
    0;

  color:
    rgba(
      255,
      255,
      255,
      0.64
    );

  line-height:
    1.45;
}


.badge-modal-icon-wrap {
  position:
    relative;

  width:
    104px;

  height:
    104px;
}


.badge-modal-icon-wrap img {
  width:
    104px;

  height:
    104px;

  object-fit:
    contain;

  filter:
    drop-shadow(
      0 10px 14px
      rgba(
        0,
        0,
        0,
        0.5
      )
    );
}


.badge-modal-icon-wrap span {
  position:
    absolute;

  right:
    -5px;

  bottom:
    -4px;

  padding:
    4px 8px;

  border:
    2px solid
    #070808;

  border-radius:
    999px;

  background:
    var(--bug-red);

  color:
    white;

  font-family:
    var(--font-score);

  font-size:
    0.78rem;

  font-weight:
    950;
}


.badge-modal-divider {
  display:
    flex;

  justify-content:
    space-between;

  align-items:
    center;

  padding:
    10px 26px;

  border-top:
    2px solid
    #050606;

  border-bottom:
    2px solid
    #050606;

  background:
    linear-gradient(
      180deg,
      #d9d9cf,
      #737a76
    );

  color:
    #111;

  font-family:
    var(--font-score);

  font-size:
    0.72rem;

  font-weight:
    950;

  letter-spacing:
    0.09em;

  text-transform:
    uppercase;
}


.badge-modal-history {
  display:
    grid;

  gap:
    12px;

  padding:
    18px;
}


.badge-modal-award {
  display:
    grid;

  grid-template-columns:
    42px
    minmax(
      0,
      1fr
    );

  overflow:
    hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      0.11
    );

  border-radius:
    8px;

  background:
    rgba(
      0,
      0,
      0,
      0.28
    );
}


.badge-modal-award-number {
  display:
    flex;

  justify-content:
    center;

  align-items:
    flex-start;

  padding-top:
    14px;

  border-right:
    1px solid
    rgba(
      255,
      255,
      255,
      0.08
    );

  color:
    var(--bug-yellow);

  font-family:
    var(--font-score);

  font-size:
    0.68rem;

  font-weight:
    950;
}


.badge-modal-award-body {
  display:
    grid;

  gap:
    12px;

  padding:
    14px;
}


.badge-modal-award-head {
  display:
    flex;

  justify-content:
    space-between;

  gap:
    16px;

  align-items:
    center;
}


.badge-modal-award-head strong {
  color:
    var(--bug-yellow);

  font-family:
    var(--font-score);

  font-size:
    0.82rem;

  letter-spacing:
    0.04em;
}


.badge-modal-award-head span {
  color:
    white;

  font-family:
    var(--font-score);

  font-size:
    0.82rem;

  font-weight:
    950;

  white-space:
    nowrap;
}


.badge-modal-reason {
  margin:
    0;

  color:
    #f4f2e8;

  font-size:
    0.86rem;

  line-height:
    1.48;
}


.badge-modal-muted {
  color:
    rgba(
      255,
      255,
      255,
      0.45
    );
}


.badge-modal-detail {
  display:
    grid;

  grid-template-columns:
    minmax(
      90px,
      auto
    )
    minmax(
      0,
      1fr
    )
    auto;

  gap:
    10px;

  align-items:
    center;

  padding:
    9px 10px;

  border-radius:
    5px;

  background:
    rgba(
      255,
      255,
      255,
      0.045
    );
}


.badge-modal-detail span,
.badge-modal-swap span {
  color:
    #8d9691;

  font-family:
    var(--font-score);

  font-size:
    0.62rem;

  font-weight:
    950;

  letter-spacing:
    0.08em;

  text-transform:
    uppercase;
}


.badge-modal-detail strong,
.badge-modal-swap strong {
  color:
    white;
}


.badge-modal-detail small,
.badge-modal-swap small {
  color:
    rgba(
      255,
      255,
      255,
      0.56
    );
}


.badge-modal-swap {
  display:
    grid;

  grid-template-columns:
    1fr
    auto
    1fr;

  gap:
    12px;

  align-items:
    center;

  padding:
    12px;

  border:
    1px solid
    rgba(
      255,
      204,
      0,
      0.22
    );

  border-radius:
    6px;

  background:
    rgba(
      255,
      204,
      0,
      0.05
    );
}


.badge-modal-swap > div:not(
  .badge-modal-arrow
) {
  display:
    grid;

  gap:
    3px;
}


.badge-modal-arrow {
  color:
    var(--bug-yellow);

  font-family:
    var(--font-score);

  font-size:
    1.35rem;

  font-weight:
    950;
}


@media (
  max-width: 620px
) {
  .badge-modal-backdrop {
    padding:
      10px;
  }

  .badge-modal-header {
    grid-template-columns:
      72px
      minmax(
        0,
        1fr
      );

    padding:
      20px 52px
      20px 18px;
  }

  .badge-modal-icon-wrap,
  .badge-modal-icon-wrap img {
    width:
      72px;

    height:
      72px;
  }

  .badge-modal-swap {
    grid-template-columns:
      1fr;
  }

  .badge-modal-arrow {
    transform:
      rotate(90deg);

    justify-self:
      start;
  }
}

/* =========================================================
   IRVING COLLECTIVE — FRANCHISE DOSSIER REBRAND
   ========================================================= */

.page-stack {
	max-width: 1500px;
	gap: 18px;
}


/* =========================================================
   COMMON SURFACES
   ========================================================= */

.card,
.identity-card,
.ledger-panel,
.mini-stat,
.line-item,
.moment-row,
.empty {
	border:
		1px solid
		var(--border) !important;

	border-radius:
		var(--radius-md) !important;

	background:
		linear-gradient(
			180deg,
			rgba(255,255,255,.018),
			transparent 24%
		),
		var(--panel) !important;

	box-shadow:
		var(--shadow-panel) !important;
}


.eyebrow {
	color:
		var(--brand-gold);

	font-family:
		var(--font-body);

	font-size:
		.61rem;

	font-weight:
		800;

	letter-spacing:
		.16em;

	text-transform:
		uppercase;
}


/* =========================================================
   FRANCHISE HERO
   ========================================================= */

.franchise-hero {
	position: relative;

	overflow: hidden;

	border:
		1px solid
		var(--border-strong);

	border-radius:
		var(--radius-lg);

	background:
		linear-gradient(
			120deg,
			rgba(191,161,106,.055),
			transparent 38%
		),
		var(--panel-strong);

	box-shadow:
		var(--shadow-panel);
}


.franchise-hero::after {
	content: 'FRANCHISE';

	position: absolute;

	right: 24px;

	bottom: -22px;

	color:
		rgba(191,161,106,.024);

	font-family:
		var(--font-display);

	font-size:
		clamp(
			5rem,
			11vw,
			10rem
		);

	line-height: 1;

	pointer-events: none;
}


.franchise-hero-top {
	position: relative;

	z-index: 1;

	display: flex;

	align-items: start;

	justify-content:
		space-between;

	gap: 24px;

	padding:
		22px 24px 0;
}


.manager-kicker {
	margin-top: 4px;

	color:
		var(--brand-stone);

	font-size:
		.72rem;

	font-weight:
		700;

	letter-spacing:
		.08em;

	text-transform:
		uppercase;
}


/* =========================================================
   SEASON SELECTOR
   ========================================================= */

.franchise-season {
	display: grid;

	gap: 9px;

	min-width: 180px;

	padding:
		12px 14px;

	border:
		1px solid
		var(--border-strong);

	border-radius:
		var(--radius-sm);

	background:
		rgba(8,11,10,.78);
}


.franchise-season > span {
	color:
		var(--brand-gold);

	font-size:
		.61rem;

	font-weight:
		800;

	letter-spacing:
		.15em;

	text-transform:
		uppercase;
}


.franchise-season .season-pills {
	justify-content:
		flex-start;
}


.franchise-season .season-pills a {
	min-width: 54px;

	padding:
		7px 10px;

	border:
		1px solid
		rgba(191,161,106,.18);

	border-radius:
		3px;

	background:
		transparent;

	color:
		var(--brand-stone);

	font-family:
		var(--font-body);

	font-size:
		.67rem;

	font-weight:
		700;

	text-shadow:
		none;

	box-shadow:
		none;
}


.franchise-season .season-pills a:hover {
	border-color:
		var(--brand-gold);

	color:
		var(--brand-ivory);

	background:
		transparent;

	text-shadow:
		none;
}


.franchise-season .season-pills a.active {
	border-color:
		var(--brand-gold);

	background:
		var(--brand-gold);

	color:
		var(--brand-charcoal);

	text-shadow:
		none;
}


/* =========================================================
   HERO BODY
   ========================================================= */

.franchise-hero-grid {
	position: relative;

	z-index: 1;

	display: grid;

	grid-template-columns:
		230px
		minmax(0,1fr);

	gap: 28px;

	align-items: start;

	padding:
		22px 24px 24px;
}


.logo-bay {
	display: grid;

	place-items: start center;
}


.franchise-hero .team-logo {
	width: 210px;

	height: 210px;

	object-fit: cover;




}


.franchise-copy {
	min-width: 0;

	display: grid;

	gap: 16px;
}


.franchise-copy h1 {
	margin:
		5px 0 0;

	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		clamp(
			3.4rem,
			6vw,
			6.2rem
		);

	font-weight: 400;

	line-height: .86;

	letter-spacing:
		-.015em;

	text-shadow:
		none;
}


.franchise-copy .philosophy {
	margin-top: 13px;

	padding: 0;

	color:
		var(--brand-sand) !important;

	font-size:
		1rem;

	font-weight:
		800;

	line-height:
		1.35;
}


.franchise-bio {
	max-width: 80ch;

	margin: 0;

	color:
		var(--muted);

	line-height:
		1.58;
}


/* =========================================================
   CURRENT SEASON STRIP
   ========================================================= */

.season-stat-strip {
	display: grid;

	grid-template-columns:
		repeat(
			4,
			minmax(0,1fr)
		);

	overflow: hidden;

	border:
		1px solid
		var(--border);

	border-radius:
		var(--radius-sm);

	background:
		var(--border);
}


.season-stat-strip > div {
	display: grid;

	gap: 5px;

	padding:
		11px 13px;

	background:
		rgba(8,11,10,.92);
}


.season-stat-strip span {
	color:
		var(--brand-stone);

	font-size:
		.56rem;

	font-weight:
		800;

	letter-spacing:
		.11em;

	text-transform:
		uppercase;
}


.season-stat-strip strong {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.35rem;

	font-weight:
		400;

	font-variant-numeric:
		tabular-nums;
}


/* =========================================================
   FACTS
   ========================================================= */

.franchise-hero .mini-facts {
	gap: 0;
}


.franchise-hero .mini-facts div {
	grid-template-columns:
		170px
		minmax(0,1fr);

	padding:
		9px 0;

	border-bottom:
		1px solid
		rgba(191,161,106,.11);
}


.franchise-hero .mini-facts dt {
	color:
		var(--brand-stone);
}


.franchise-hero .mini-facts dd {
	color:
		var(--brand-ivory);
}


.future-dollars .draft-money-pill {
	min-width: 0;

	padding:
		2px 0;

	border: 0;

	background:
		transparent;

	color:
		var(--brand-gold);

	font-family:
		var(--font-display);

	font-size:
		1.25rem;

	text-align:
		left;

	box-shadow:
		none !important;

	text-shadow:
		none;
}


/* preserve the semantic budget colors */

.future-dollars .draft-money-low {
	color:
		#d98585;
}

.future-dollars .draft-money-mid {
	color:
		var(--brand-gold);
}

.future-dollars .draft-money-high {
	color:
		#91b69c;
}


/* =========================================================
   QUICK LINKS
   ========================================================= */

.quick-links {
	position: relative;

	z-index: 1;

	justify-content:
		flex-start;

	gap: 6px;

	padding:
		0 24px 22px;
}


.quick-links a {
	padding:
		7px 10px;

	border:
		1px solid
		rgba(191,161,106,.17);

	border-radius:
		3px;

	background:
		transparent;

	color:
		var(--brand-sand) !important;

	font-family:
		var(--font-body);

	font-size:
		.61rem;

	font-weight:
		750;

	letter-spacing:
		.06em;

	text-transform:
		uppercase;

	text-shadow:
		none;
}


.quick-links a:hover {
	border-color:
		var(--brand-gold);

	color:
		var(--brand-gold) !important;
}


/* =========================================================
   IDENTITY SHELF
   ========================================================= */

.identity-shelf {
	gap: 12px;
}


.identity-card {
	min-height: 178px;

	align-content: start;

	padding:
		16px !important;

	border-color:
		var(--border) !important;

	text-align:
		center;
}


.identity-card > span {
	color:
		var(--brand-gold);

	font-size:
		.57rem;

	font-weight:
		800;

	letter-spacing:
		.14em;

	text-transform:
		uppercase;
}


.identity-card img {
	width: 76px;

	height: 76px;

	object-fit:
		contain;

	border-radius: 0;

	filter:
		drop-shadow(
			0 9px 15px
			rgba(0,0,0,.32)
		);
}


.identity-card strong {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.35rem;

	font-weight:
		400;
}


.identity-card small {
	color:
		var(--muted);
}


/* =========================================================
   SECTION CARDS
   ========================================================= */

.card {
	padding:
		18px !important;
}


.card-head h3,
.card-title-row h3 {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.8rem;

	font-weight:
		400;

	line-height: 1;
}


.card-head > strong,
.badge-case-summary strong {
	color:
		var(--brand-gold);

	font-family:
		var(--font-display);

	font-weight:
		400;
}


.badge-case-summary span,
.card-head small,
.card-title-row small {
	color:
		var(--brand-stone);
}


/* =========================================================
   BADGES
   ========================================================= */

.manager-badge {
	border:
		1px solid
		var(--border) !important;

	border-radius:
		var(--radius-sm);

	background:
		linear-gradient(
			180deg,
			rgba(255,255,255,.018),
			transparent
		),
		#121615;

	box-shadow:
		none;

	transform:
		none;
}


.manager-badge:hover {
	transform:
		translateY(-1px);

	border-color:
		var(--brand-gold) !important;

	box-shadow:
		var(--shadow-panel);
}


.manager-badge:focus-visible {
	outline:
		2px solid
		var(--brand-gold);
}


.manager-badge-title span,
.manager-badge-click,
.badge-case-footer a,
.badge-history summary {
	color:
		var(--brand-gold);
}


.manager-badge-title strong {
	color:
		var(--brand-ivory);
}


.manager-badge-description,
.manager-badge-latest small {
	color:
		var(--muted);
}


.manager-badge-count {
	border:
		1px solid
		var(--brand-charcoal);

	background:
		var(--brand-gold);

	color:
		var(--brand-charcoal);

	box-shadow:
		0 5px 12px
		rgba(0,0,0,.3);
}


/* stains can still look like stains */

.manager-badge-stains {
	border-color:
		rgba(193,49,39,.48) !important;
}

.championship-badges {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 14px;

  min-height: 82px;
}


.championship-badge {
  display: grid;
  justify-items: center;
  gap: 4px;
}


.championship-badge img {
  width: 70px;
  height: 70px;

  object-fit: contain;
}


.championship-badge span {
  color: #d6b15e;

  font-size: 10px;
  font-weight: 900;

  letter-spacing: .08em;
}
/* =========================================================
   ALL-TIME
   ========================================================= */

.all-time-grid {
	gap: 8px;
}


.mini-stat {
	padding:
		13px !important;

	background:
		#121615 !important;
}


.mini-stat span {
	color:
		var(--brand-gold);

	font-size:
		.57rem;

	font-weight:
		800;

	letter-spacing:
		.11em;

	text-transform:
		uppercase;
}


.mini-stat strong {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.65rem;
}


.mini-stat small {
	color:
		var(--muted);
}


.ledger-panel {
	border-color:
		var(--border) !important;

	background:
		#121615 !important;
}


.ledger-panel h4 {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.35rem;

	font-weight:
		400;
}


/* =========================================================
   FACT TABLES
   ========================================================= */

.facts div {
	border-bottom:
		1px solid
		rgba(191,161,106,.11);
}


.facts dt {
	color:
		var(--brand-stone);
}


.facts dd {
	color:
		var(--brand-ivory);
}


/* =========================================================
   RECENT GAMES / MOVES
   ========================================================= */

.line-item {
	border-color:
		rgba(191,161,106,.11) !important;

	background:
		#121615 !important;
}


.line-item:hover {
	border-color:
		rgba(191,161,106,.36) !important;
}


.line-item strong {
	color:
		var(--brand-ivory);
}


.line-item small {
	color:
		var(--muted);
}


.line-item span {
	color:
		var(--brand-gold);

	font-variant-numeric:
		tabular-nums;
}


.more-list summary {
	border:
		1px solid
		rgba(191,161,106,.18);

	background:
		transparent;

	color:
		var(--brand-sand);

	font-family:
		var(--font-body);

	font-size:
		.62rem;

	font-weight:
		800;

	letter-spacing:
		.08em;
}


.more-list summary:hover {
	border-color:
		var(--brand-gold);

	color:
		var(--brand-gold);
}


/* =========================================================
   RESPONSIVE
   ========================================================= */

@media (max-width: 900px) {
	.franchise-hero-grid {
		grid-template-columns:
			1fr;
	}

	.logo-bay {
		justify-items:
			start;
	}

	.season-stat-strip {
		grid-template-columns:
			repeat(2,minmax(0,1fr));
	}
}


@media (max-width: 680px) {
	.franchise-hero-top {
		display: grid;
	}

	.franchise-season {
		width: 100%;
		min-width: 0;
	}

	.franchise-hero-grid {
		padding:
			18px;
	}

	.franchise-hero .team-logo {
		width: 160px;
		height: 160px;
	}

	.quick-links {
		padding:
			0 18px 18px;
	}

	.season-stat-strip,
	.identity-shelf,
	.all-time-grid {
		grid-template-columns:
			1fr;
	}
}
</style>
