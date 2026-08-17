<script>
	import { page } from '$app/stores';

	import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

	export let data;


	const FALLBACK_SEASONS = [
		2026,
		2025
	];


	let teamSelectValue = '';


	function formatTime(
		epoch
	) {
		if (!epoch) {
			return 'Unknown time';
		}

		return new Date(
			Number(epoch)
		).toLocaleString();
	}


	function normalize(
		value = ''
	) {
		return String(value)
			.toLowerCase()
			.replace(
				/[_-]+/g,
				' '
			)
			.trim();
	}


	function txnKind(
		txn = {}
	) {
		const label =
			normalize(
				txn.typeLabel ||
				txn.type ||
				txn.transactionType ||
				txn.status ||
				''
			);

		if (
			label.includes(
				'trade'
			)
		) {
			return 'trade';
		}

		if (
			label.includes(
				'waiver'
			)
		) {
			return 'waiver';
		}

		if (
			label.includes(
				'free'
			)
		) {
			return 'free-agent';
		}

		if (
			label.includes(
				'commish'
			) ||
			label.includes(
				'commissioner'
			)
		) {
			return 'commish';
		}

		return 'other';
	}


	function matchesType(
		txn,
		type
	) {
		if (
			!type ||
			type === 'all'
		) {
			return true;
		}

		return (
			txnKind(txn) ===
			type
		);
	}


	function countType(
		type
	) {
		return allTransactions
			.filter(
				(txn) =>
					matchesType(
						txn,
						type
					)
			)
			.length;
	}


	function deriveTeamOptions(
		weeks = []
	) {
		const teams =
			new Map();

		for (
			const bucket of
			weeks || []
		) {
			for (
				const txn of
				bucket.items || []
			) {
				for (
					const team of
					txn.rosterCards ||
					[]
				) {
					const key =
						team.managerSlug ||
						String(
							team.rosterId ||
								team.teamName ||
								''
						);

					if (
						!key ||
						teams.has(key)
					) {
						continue;
					}

					teams.set(
						key,
						{
							rosterId:
								team.rosterId,

							teamName:
								team.teamName,

							managerName:
								team.managerName,

							teamPhoto:
								team.teamPhoto,

							initials:
								team.initials,

							managerSlug:
								team.managerSlug
						}
					);
				}
			}
		}

		return [
			...teams.values()
		].sort(
			(a, b) =>
				a.teamName.localeCompare(
					b.teamName
				)
		);
	}


	/*
	 * ========================================================
	 * CURRENT PAGE STATE
	 * ========================================================
	 *
	 * IMPORTANT:
	 *
	 * The season in the ADDRESS BAR wins.
	 *
	 * This means:
	 *
	 * ?season=2025
	 *
	 * is ALWAYS treated as 2025 on the client.
	 * ========================================================
	 */

	$: seasonFromUrl =
		Number(
			$page.url.searchParams.get(
				'season'
			)
		);


	$: season =
		Number.isFinite(
			seasonFromUrl
		) &&
		seasonFromUrl > 0
			? seasonFromUrl
			: Number(
					data.season ||
						FALLBACK_SEASONS[0]
				);


	$: availableWeeks =
		Array.isArray(
			data.availableWeeks
		)
			? data.availableWeeks
			: [];


	$: selectedWeeks =
		Array.isArray(
			data.selectedWeeks
		)
			? data.selectedWeeks
			: [];


	$: selectedWeeksParam =
		selectedWeeks.length
			? selectedWeeks.join(',')
			: '';


	$: filterTeamSlug =
		data.filterTeam
			?.managerSlug ||
		'';


	$: selectedType =
		normalize(
			$page.url.searchParams.get(
				'type'
			) ||
				'all'
		);


	$: teamSelectValue =
		filterTeamSlug;


	$: availableSeasons =
		(
			Array.isArray(
				data.seasons
			) &&
			data.seasons.length
				? data.seasons
				: FALLBACK_SEASONS
		)
			.map(Number)
			.filter(
				Number.isFinite
			)
			.sort(
				(a, b) =>
					b - a
			);


	$: rawWeeks =
		Array.isArray(
			data.weeks
		)
			? data.weeks
			: [];


	$: allTransactions =
		rawWeeks.flatMap(
			(bucket) =>
				bucket.items ||
				[]
		);


	$: teamOptions =
		Array.isArray(
			data.teamOptions
		) &&
		data.teamOptions.length
			? data.teamOptions
			: deriveTeamOptions(
					rawWeeks
				);


	$: filteredWeeks =
		rawWeeks
			.map(
				(bucket) => ({
					...bucket,

					items:
						(
							bucket.items ||
							[]
						).filter(
							(txn) =>
								matchesType(
									txn,
									selectedType
								)
						)
				})
			)
			.filter(
				(bucket) =>
					bucket.items.length
			);


	$: filteredMoveCount =
		filteredWeeks.reduce(
			(
				total,
				bucket
			) =>
				total +
				bucket.items.length,
			0
		);


	$: totalMoveCount =
		allTransactions.length;


	$: typeOptions = [
		{
			key: 'all',
			label: 'All',
			meta: 'Full feed',
			count:
				countType('all')
		},

		{
			key: 'waiver',
			label: 'Waivers',
			meta: 'Claims',
			count:
				countType(
					'waiver'
				)
		},

		{
			key:
				'free-agent',

			label:
				'Free agency',

			meta:
				'FA adds',

			count:
				countType(
					'free-agent'
				)
		},

		{
			key: 'trade',
			label: 'Trades',
			meta: 'Deals',
			count:
				countType(
					'trade'
				)
		}
	];


	$: activeTypeLabel =
		selectedType === 'all'
			? 'All transaction types'
			: typeOptions.find(
					(option) =>
						option.key ===
						selectedType
				)?.label ||
				'Filtered feed';


	/*
	 * ========================================================
	 * TRANSACTION URL BUILDER
	 * ========================================================
	 *
	 * PURE FUNCTION.
	 *
	 * It knows NOTHING about $page,
	 * data.season, or hidden component state.
	 *
	 * Everything necessary to build the URL
	 * must be explicitly handed to it.
	 * ========================================================
	 */

	function transactionsHref({
		season,
		weeks = '',
		team = '',
		type = 'all',
		rosterId = ''
	}) {
		const params =
			new URLSearchParams();


		/*
		 * Season is REQUIRED.
		 */
		params.set(
			'season',
			String(season)
		);


		if (weeks) {
			params.set(
				'weeks',
				Array.isArray(
					weeks
				)
					? weeks.join(',')
					: String(weeks)
			);
		}


		if (team) {
			params.set(
				'team',
				String(team)
			);
		} else if (rosterId) {
			params.set(
				'rosterId',
				String(rosterId)
			);
		}


		if (
			type &&
			type !== 'all'
		) {
			params.set(
				'type',
				String(type)
			);
		}


		return (
			`/league/transactions?` +
			params.toString()
		);
	}


	/*
	 * ========================================================
	 * SEASON LINKS
	 * ========================================================
	 *
	 * Changing seasons intentionally clears
	 * week selection because 2025 and 2026
	 * don't necessarily share the same useful
	 * week context.
	 *
	 * Team/type may remain.
	 * ========================================================
	 */

	function seasonHref(
		nextSeason,
		team,
		type
	) {
		return transactionsHref({
			season:
				Number(
					nextSeason
				),

			weeks:
				'',

			team:
				team ||
				'',

			type:
				type ||
				'all'
		});
	}


	/*
	 * ========================================================
	 * WEEK LINKS
	 * ========================================================
	 *
	 * Notice season is an EXPLICIT argument.
	 *
	 * This is the important fix.
	 * ========================================================
	 */

	function weekHref(
		activeSeason,
		week,
		team,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks:
				week,

			team:
				team ||
				'',

			type:
				type ||
				'all'
		});
	}


	function allWeeksHref(
		activeSeason,
		weeks,
		team,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks:
				weeks,

			team:
				team ||
				'',

			type:
				type ||
				'all'
		});
	}


	/*
	 * ========================================================
	 * TYPE LINKS
	 * ========================================================
	 */

	function typeHref(
		activeSeason,
		weeks,
		team,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks:
				weeks,

			team:
				team ||
				'',

			type
		});
	}


	/*
	 * ========================================================
	 * TEAM LINKS
	 * ========================================================
	 */

	function teamTransactionsHref(
		activeSeason,
		weeks,
		team,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks:
				weeks,

			team:
				team
					?.managerSlug ||
				'',

			type:
				type ||
				'all'
		});
	}


	function rosterTransactionsHref(
		activeSeason,
		weeks,
		rosterId,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks:
				weeks,

			rosterId,

			type:
				type ||
				'all'
		});
	}


	function clearTeamHref(
		activeSeason,
		weeks,
		type
	) {
		return transactionsHref({
			season:
				activeSeason,

			weeks,

			team:
				'',

			type:
				type ||
				'all'
		});
	}


	/*
	 * ========================================================
	 * TEAM DROPDOWN
	 * ========================================================
	 */

	function teamDropdownChange(
		event
	) {
		const value =
			event.currentTarget.value;


		window.location.href =
			transactionsHref({
				season,

				weeks:
					selectedWeeksParam,

				team:
					value ||
					'',

				type:
					selectedType
			});
	}
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="transactions" />

  <section class="page-head  icl-hero-shell pad-md" aria-label="Transaction feed controls">
    <div class="head-copy">
      <div class="eyebrow">
	League Transactions
</div>

<h1>
	The Wire Room
</h1>

<p>
	Trades, claims, free-agent moves, and draft capital.
	Every transaction leaves a paper trail.
</p>
    </div>

    <aside class="season-box" aria-label="Season selector">
      <span>Season feed</span>
      <div class="season-pills">
        {#each availableSeasons as option}
          <a
	class:active={
		Number(option) ===
		Number(season)
	}
	href={seasonHref(
		option,
		filterTeamSlug,
		selectedType
	)}
>
	{option}
</a>
        {/each}
      </div>
    </aside>

    <div class="filter-panel type-filter" aria-label="Transaction type filter">
      <div class="filter-label">Transaction type</div>
      <div class="type-pills">
        {#each typeOptions as option}
          <a
            class:selected={selectedType === option.key}
            class:zero={option.count === 0 && option.key !== 'all'}
            href={typeHref(
	season,
	selectedWeeksParam,
	filterTeamSlug,
	option.key
)}
          >
            <strong>{option.label}</strong>
            <small>{option.count}</small>
          </a>
        {/each}
      </div>
    </div>

    <div class="filter-panel team-filter compact-team-filter" aria-label="Team filter">
      <div class="filter-row">
        <div>
          <div class="filter-label">Team feed</div>
          <p class="filter-hint">Choose one franchise or keep the full wire room open.</p>
        </div>

        {#if data.filterTeam}
          <a
	class="clear-filter"
	href={clearTeamHref(
		season,
		selectedWeeksParam,
		selectedType
	)}
>
	Clear team
</a>
        {/if}
      </div>

      <div class="team-select-row">
        <label class="select-label" for="team-feed-select">Franchise</label>
        <div class="select-wrap">
          <select id="team-feed-select" bind:value={teamSelectValue} on:change={teamDropdownChange}>
            <option value="">All teams</option>
            {#each teamOptions as team (team.managerSlug || team.rosterId)}
              <option value={team.managerSlug}>{team.teamName}</option>
            {/each}
          </select>
        </div>

        {#if data.filterTeam}
          <div class="selected-team-pill" aria-label="Selected team">
            <span class="team-photo mini">
              {#if data.filterTeam.teamPhoto}
                <img src={data.filterTeam.teamPhoto} alt={data.filterTeam.teamName} />
              {:else}
                <span>{data.filterTeam.initials}</span>
              {/if}
            </span>
            <strong>{data.filterTeam.teamName}</strong>
          </div>
        {:else}
          <div class="selected-team-pill all-teams-pill" aria-label="Selected team">
            <span class="team-photo mini">IC</span>
            <strong>All teams</strong>
          </div>
        {/if}
      </div>
    </div>

    <div class="filter-panel week-filter" aria-label="Week filter">
      <div class="filter-label">Week feed</div>
      <div class="week-pills">
	{#each availableWeeks as week}
		<a
			class:selected={
				selectedWeeks.includes(
					week
				)
			}
			href={weekHref(
				season,
				week,
				filterTeamSlug,
				selectedType
			)}
		>
			W{week}
		</a>
	{/each}

	{#if availableWeeks.length}
		<a
			class:selected={
				selectedWeeks.length ===
				availableWeeks.length
			}
			href={allWeeksHref(
				season,
				availableWeeks,
				filterTeamSlug,
				selectedType
			)}
		>
			All
		</a>
	{/if}
</div>
    </div>
  </section>

  {#if data.filterTeam}
    <section class="card filter-banner">
      <div class="team-pill big">
        <div class="team-photo">
          {#if data.filterTeam.teamPhoto}
            <img src={data.filterTeam.teamPhoto} alt={data.filterTeam.teamName} />
          {:else}
            <span>{data.filterTeam.initials}</span>
          {/if}
        </div>
        <div>
          <strong>{data.filterTeam.teamName}</strong>
          <small>{data.filterTeam.managerName}</small>
        </div>
      </div>

      <div class="link-row">
        <a href={`/league/teams/${data.filterTeam.managerSlug}?season=${season}`}>Open franchise</a>
        <a href={`/league/matchups?season=${season}&team=${data.filterTeam.managerSlug}`}>Recent games</a>
        <a
	href={clearTeamHref(
		season,
		selectedWeeksParam,
		selectedType
	)}
>
	Clear filter
</a>
      </div>
    </section>
  {/if}

  {#if !data.hasData}
    <section class="card empty">
      <div class="eyebrow">No signal</div>
      <h2>No transaction data yet</h2>
      <p>We could not pull transaction data for this season/week/team selection.</p>
    </section>
  {:else if !filteredMoveCount}
    <section class="card empty">
      <div class="eyebrow">No matching moves</div>
      <h2>No transactions match this filter</h2>
      <p>{totalMoveCount} move{totalMoveCount === 1 ? '' : 's'} loaded, but none match the selected transaction type.</p>
    </section>
  {:else}
    <div class="feed-summary">
      <div>
        <div class="eyebrow">Live feed</div>
        <h2>{filteredMoveCount} move{filteredMoveCount === 1 ? '' : 's'}</h2>
      </div>
      <span>{data.filterTeam ? `${data.filterTeam.teamName} · ${activeTypeLabel}` : activeTypeLabel}</span>
    </div>

    {#each filteredWeeks as bucket (bucket.week)}
      <section class="week-stack">
        <div class="section-head">
          <div>
            <div class="eyebrow">Week {bucket.week}</div>
            <h2>{bucket.items.length} move{bucket.items.length === 1 ? '' : 's'}</h2>
          </div>
        </div>

        <div class="stack">
          {#each bucket.items as txn (txn.id)}
            <article class="card txn">
              <div class="txn-head">
                <div class="txn-title">
                  <div class={`type-pill type-${txnKind(txn)}`}>{txn.typeLabel}</div>
                  <h3>{txn.summaryLine}</h3>
                </div>
                <time class="timestamp" datetime={txn.createdAt ? new Date(Number(txn.createdAt)).toISOString() : undefined}>{formatTime(txn.createdAt)}</time>
              </div>

              <div class="meta-row">
                {#each txn.rosterCards as team (team.rosterId)}
                  <a
	class="team-pill"
	href={team.managerSlug
		? `/league/teams/${team.managerSlug}?season=${season}`
		: rosterTransactionsHref(team.rosterId)}
>
                    <div class="team-photo">
                      {#if team.teamPhoto}
                        <img src={team.teamPhoto} alt={team.teamName} />
                      {:else}
                        <span>{team.initials}</span>
                      {/if}
                    </div>
                    <span>{team.teamName}</span>
                  </a>
                {/each}
              </div>

              <div class="link-row compact">
                {#each txn.rosterCards as team (team.rosterId)}
                  <a
	href={
		team.managerSlug
			? teamTransactionsHref(
					season,
					selectedWeeksParam,
					team,
					selectedType
				)
			: rosterTransactionsHref(
					season,
					selectedWeeksParam,
					team.rosterId,
					selectedType
				)
	}
>
	Only {team.teamName}
</a>
                {/each}
              </div>

              <div class="txn-grid">
                <div class="panel">
                  <div class="label">Adds</div>
                  {#if txn.addGroups.length}
                    {#each txn.addGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={
	group.managerSlug
		? transactionsHref({
				season,

				weeks:
					selectedWeeksParam,

				team:
					group.managerSlug,

				type:
					selectedType
			})
		: rosterTransactionsHref(
				season,
				selectedWeeksParam,
				group.rosterId,
				selectedType
			)
}>
                            <div class="team-photo small">
                              {#if group.teamPhoto}
                                <img src={group.teamPhoto} alt={group.teamName} />
                              {:else}
                                <span>{group.initials}</span>
                              {/if}
                            </div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div
	class="player-chip"
	data-player-id={player.id}
	data-player-season={data.season}
	role="button"
	tabindex="0"
	aria-label={`Open ${player.name} player card`}
>
	<img
		src={player.photoUrl}
		alt={player.name}
	/>

	<div>
		<strong>{player.name}</strong>

		<small>
			{player.position || '—'} ·
			{player.teamLabel || player.team || 'FA'}
		</small>
	</div>
</div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>

                <div class="panel">
                  <div class="label">Drops</div>
                  {#if txn.dropGroups.length}
                    {#each txn.dropGroups as group (group.rosterId)}
                      <div class="club-group">
                        <div class="club-head">
                          <a class="team-link" href={
	group.managerSlug
		? transactionsHref({
				season,

				weeks:
					selectedWeeksParam,

				team:
					group.managerSlug,

				type:
					selectedType
			})
		: rosterTransactionsHref(
				season,
				selectedWeeksParam,
				group.rosterId,
				selectedType
			)
}>
                            <div class="team-photo small">
                              {#if group.teamPhoto}
                                <img src={group.teamPhoto} alt={group.teamName} />
                              {:else}
                                <span>{group.initials}</span>
                              {/if}
                            </div>
                            <strong>{group.teamName}</strong>
                          </a>
                        </div>
                        <div class="player-grid">
                          {#each group.players as player (player.id)}
                            <div
	class="player-chip"
	data-player-id={player.id}
	data-player-season={data.season}
	role="button"
	tabindex="0"
	aria-label={`Open ${player.name} player card`}
>
	<img
		src={player.photoUrl}
		alt={player.name}
	/>

	<div>
		<strong>{player.name}</strong>

		<small>
			{player.position || '—'} ·
			{player.teamLabel || player.team || 'FA'}
		</small>
	</div>
</div>
        
                          {/each}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <p>None</p>
                  {/if}
                </div>
              </div>
              {#if txnKind(txn) === 'trade'}
  <div class="capital-panel">
    <div class="label">
      Draft capital movement
    </div>

    {#if txn.draftCapitalReview?.capital}
      <div class="capital-transfer">
        <div class="capital-year">
          {txn.draftCapitalReview.capital.futuresYear}
          Draft
        </div>

        <div class="capital-route">
          <strong>
            {txn.draftCapitalReview.capital.from?.teamName ||
              txn.draftCapitalReview.capital.fromManagerId}
          </strong>

          <span>
            sent
          </span>

          <strong class="capital-amount">
            ${txn.draftCapitalReview.capital.amount}
          </strong>

          <span>
            to
          </span>

          <strong>
            {txn.draftCapitalReview.capital.to?.teamName ||
              txn.draftCapitalReview.capital.toManagerId}
          </strong>
        </div>

        {#if txn.draftCapitalReview.source === 'legacy_sheet'}
          <small>
            Historical ledger match
          </small>
        {:else if txn.draftCapitalReview.status === 'posted'}
          <small>
            Posted to draft-capital ledger
          </small>
        {/if}

        {#if txn.draftCapitalReview.capital.note}
          <p>
            {txn.draftCapitalReview.capital.note}
          </p>
        {/if}
      </div>

    {:else if txn.draftCapitalReview?.status === 'no_capital'}
      <div class="capital-none">
        Reviewed — no draft capital exchanged.
      </div>

    {:else if txn.draftCapitalReview?.status === 'ambiguous'}
      <div class="capital-pending">
        Historical capital exists, but the ledger match is ambiguous.
      </div>

    {:else}
      <div class="capital-pending">
        Draft-capital status has not been confirmed for this trade.
      </div>
    {/if}
  </div>
{/if}
              {#if txn.draftPicks.length || txn.faabRows.length}
                <div class="txn-grid secondary">
                  <div class="panel compact-panel">
                    <div class="label">Draft assets</div>
                    {#if txn.draftPicks.length}
                      <div class="stack small-gap">
                        {#each txn.draftPicks as pick (pick.id)}
                          <div class="simple-row">
                            <strong>{pick.label}</strong>
                            <span>{pick.lineage}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>

                  <div class="panel compact-panel">
                    <div class="label">FAAB movement</div>
                    {#if txn.faabRows.length}
                      <div class="stack small-gap">
                        {#each txn.faabRows as row (row.rosterId)}
                          <div class="simple-row">
                            <strong>{row.teamName}</strong>
                            <span>${row.amount}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <p>None</p>
                    {/if}
                  </div>
                </div>
              {/if}
            </article>
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>

<style>
	/* =========================================================
	   IRVING COLLECTIVE — TRANSACTIONS
	   ========================================================= */

	.page-stack,
	.stack,
	.week-stack {
		display: grid;
		gap: 16px;
	}


	.page-stack {
		max-width: 1500px;

		margin: 0 auto;

		padding-bottom: 48px;
	}


	/* =========================================================
	   COMMON
	   ========================================================= */

	.card {
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


	.eyebrow,
	.label,
	.filter-label,
	.season-box > span {
		color:
			var(--brand-gold) !important;

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .16em;

		text-transform: uppercase;

		text-shadow: none;
	}


	h1,
	h2,
	h3,
	p {
		margin: 0;
	}


	h1,
	h2 {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-weight: 400;

		letter-spacing: .02em;

		text-shadow: none;
	}


	/* =========================================================
	   HERO
	   ========================================================= */

	.page-head {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			auto;

		gap:
			18px 28px;

		overflow: hidden;

		padding:
			27px 28px 24px !important;

		border:
			1px solid
			var(--border-strong) !important;

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.055),
				transparent 38%
			),
			var(--panel-strong) !important;

		box-shadow:
			var(--shadow-panel) !important;
	}


	.page-head::after {
		content: 'WIRE ROOM';

		position: absolute;

		right: 26px;

		top: 54px;

		color:
			rgba(191,161,106,.023);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				5rem,
				11vw,
				9rem
			);

		line-height: 1;

		letter-spacing: .04em;

		pointer-events: none;
	}


	.head-copy,
	.season-box,
	.filter-panel {
		position: relative;

		z-index: 1;
	}


	.head-copy {
		min-width: 0;
	}


	h1 {
		margin-top: 8px;

		font-size:
			clamp(
				3.8rem,
				7vw,
				6.5rem
			);

		line-height: .88;
	}


	.page-head .head-copy p {
		max-width: 65ch;

		margin-top: 13px;

		color:
			var(--muted);

		font-size: .94rem;

		line-height: 1.55;
	}


	.source {
		display: none;
	}


	/* =========================================================
	   SEASON
	   ========================================================= */

	.season-box {
		align-self: start;

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
			rgba(13,16,15,.78);

		box-shadow: none;
	}


	.season-pills,
	.week-pills,
	.type-pills,
	.link-row,
	.meta-row {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;
	}


	.season-pills a,
	.week-pills a,
	.type-pills a {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-height: 31px;

		padding:
			5px 9px;

		border:
			1px solid
			rgba(191,161,106,.18);

		border-radius: 3px;

		background:
			transparent;

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .64rem;

		font-weight: 700;

		line-height: 1;

		letter-spacing: .04em;

		text-decoration: none;

		text-shadow: none;

		box-shadow: none;

		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}


	.season-pills a {
		min-width: 54px;
	}


	.season-pills a:hover,
	.week-pills a:hover,
	.type-pills a:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-ivory);
	}


	.season-pills a.active,
	.week-pills a.selected,
	.type-pills a.selected {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	/* =========================================================
	   FILTERS
	   ========================================================= */

	.filter-panel {
		grid-column:
			1 / -1;

		display: grid;

		gap: 10px;

		padding:
			13px 15px;

		border:
			1px solid
			rgba(191,161,106,.16);

		border-radius:
			var(--radius-md);

		background:
			rgba(0,0,0,.11);
	}


	.type-filter {
		margin-top: 6px;
	}


	.type-pills a {
		gap: 7px;
	}


	.type-pills a small {
		color: inherit;

		opacity: .58;

		font-size: .55rem;
	}


	.type-pills a.zero {
		opacity: .42;
	}


	.filter-row {
		display: flex;

		justify-content:
			space-between;

		align-items: center;

		gap: 12px;
	}


	.filter-hint {
		margin-top: 4px;

		color:
			var(--muted);

		font-size: .78rem;
	}


	.clear-filter {
		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .62rem;

		font-weight: 700;

		letter-spacing: .08em;

		text-decoration: none;

		text-transform: uppercase;
	}


	.clear-filter:hover {
		color:
			var(--brand-gold);
	}


	/* =========================================================
	   TEAM SELECT
	   ========================================================= */

	.team-select-row {
		display: grid;

		grid-template-columns:
			auto
			minmax(240px,420px)
			minmax(0,1fr);

		gap: 10px;

		align-items: center;
	}


	.select-label {
		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .60rem;

		font-weight: 700;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.select-wrap {
		position: relative;

		min-width: 0;
	}


	.select-wrap::after {
		content: '▾';

		position: absolute;

		top: 50%;
		right: 11px;

		transform:
			translateY(-50%);

		color:
			var(--brand-gold);

		font-size: .68rem;

		pointer-events: none;
	}


	.select-wrap select {
		width: 100%;

		min-height: 36px;

		appearance: none;

		padding:
			0 36px 0 11px;

		border:
			1px solid
			rgba(191,161,106,.24);

		border-radius: 3px;

		background:
			var(--brand-charcoal);

		color:
			var(--brand-ivory);

		font-family:
			var(--font-body);

		font-size: .68rem;

		font-weight: 700;

		cursor: pointer;

		color-scheme: dark;
	}


	.select-wrap select:focus {
		outline:
			1px solid
			var(--brand-gold);

		outline-offset: 2px;
	}


	/* =========================================================
	   SELECTED TEAM
	   ========================================================= */

	.selected-team-pill {
		justify-self: start;

		max-width: 100%;

		display: inline-flex;

		align-items: center;

		gap: 8px;

		min-height: 36px;

		padding:
			4px 9px 4px 5px;

		border:
			1px solid
			rgba(191,161,106,.17);

		border-radius: 3px;

		background:
			rgba(255,255,255,.015);
	}


	.selected-team-pill strong {
		min-width: 0;

		overflow: hidden;

		color:
			var(--brand-sand);

		font-size: .72rem;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	/* =========================================================
	   WEEK FILTER
	   ========================================================= */

	.week-pills {
		overflow-x: auto;

		padding-bottom: 2px;
	}


	.week-pills a {
		min-width: 42px;

		white-space: nowrap;
	}


	/* =========================================================
	   SELECTED TEAM BANNER
	   ========================================================= */

	.filter-banner {
		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 16px;

		padding: 14px !important;
	}


	/* =========================================================
	   FEED HEADERS
	   ========================================================= */

	.feed-summary,
	.section-head {
		display: flex;

		justify-content:
			space-between;

		align-items: end;

		gap: 12px;
	}


	.feed-summary h2,
	.section-head h2 {
		margin-top: 4px;

		font-size: 2rem;

		line-height: 1;
	}


	.feed-summary > span {
		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		text-transform: uppercase;

		letter-spacing: .10em;
	}


	/* =========================================================
	   TRANSACTION CARD
	   ========================================================= */

	.txn {
		display: grid;

		gap: 13px;

		padding: 17px !important;
	}


	.txn-head {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			auto;

		gap: 14px;

		align-items: start;

		padding-bottom: 11px;

		border-bottom:
			1px solid
			rgba(191,161,106,.11);
	}


	.txn-title {
		min-width: 0;
	}


	.type-pill {
		display: inline-flex;

		align-items: center;

		min-height: 22px;

		padding:
			4px 7px;

		border:
			1px solid
			rgba(191,161,106,.25);

		border-radius: 3px;

		background:
			rgba(191,161,106,.045);

		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size: .57rem;

		font-weight: 700;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.txn h3 {
		margin-top: 8px;

		color:
			var(--brand-ivory);

		font-size: 1.5rem;

		line-height: 1.3;
	}


	.timestamp,
	p,
	small {
		color:
			var(--muted);
	}


	.timestamp {
		white-space: nowrap;

		color:
			var(--brand-stone);

		font-size: .68rem;

		text-align: right;
	}


	/* =========================================================
	   TEAMS
	   ========================================================= */

	.team-pill,
	.team-link {
		display: inline-flex;

		align-items: center;

		gap: 8px;

		min-width: 0;

		color: inherit;

		text-decoration: none;
	}


	.team-pill {
		padding:
			5px 8px;

		border:
			1px solid
			rgba(191,161,106,.14);

		border-radius: 3px;

		background:
			rgba(255,255,255,.015);
	}


	.team-pill:hover {
		border-color:
			rgba(191,161,106,.34);
	}


	.team-pill.big {
		padding:
			7px 10px;
	}


	.team-pill span {
		min-width: 0;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.team-photo {
		width: 30px;

		height: 30px;

		flex:
			0 0 30px;

		display: grid;

		place-items: center;

		overflow: hidden;


		border-radius: 3px;

		

		color:
			var(--brand-charcoal);

		font-family:
			var(--font-body);

		font-size: .62rem;

		font-weight: 800;
	}


	.team-photo.small,
	.team-photo.mini {
		width: 24px;

		height: 24px;

		flex-basis: 24px;
	}


	.team-photo img {
		width: 100%;

		height: 100%;

		object-fit: cover;
	}


	.link-row a,
	.team-link {
		color:
			var(--brand-sand) !important;

		font-family:
			var(--font-body);

		font-size: .64rem;

		font-weight: 700;

		text-decoration: none;
	}


	.link-row a:hover,
	.team-link:hover {
		color:
			var(--brand-gold) !important;

		text-decoration: none;
	}


	.link-row.compact {
		margin-top: -2px;
	}


	/* =========================================================
	   ADDS / DROPS
	   ========================================================= */

	.txn-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.txn-grid.secondary {
		margin-top: -2px;
	}


	.panel {
		display: grid;

		gap: 10px;

		align-content: start;

		min-height: 0;

		padding: 12px;

		border:
			1px solid
			rgba(191,161,106,.13) !important;

		border-radius:
			var(--radius-sm);

		background:
			rgba(0,0,0,.11) !important;

		box-shadow: none !important;
	}


	.compact-panel {
		padding: 10px;
	}


	.club-group,
	.player-grid {
		display: grid;

		gap: 7px;
	}


	.club-head {
		display: flex;

		align-items: center;

		gap: 10px;
	}


	.player-chip {
		display: grid;

		grid-template-columns:
			34px
			minmax(0,1fr);

		gap: 9px;

		align-items: center;

		min-width: 0;

		padding: 7px;

		border:
			1px solid
			rgba(191,161,106,.10);

		border-radius: 3px;

		background:
			rgba(255,255,255,.014);

		cursor: pointer;
	}


	.player-chip:hover {
		border-color:
			rgba(191,161,106,.30);

		background:
			rgba(191,161,106,.035);
	}


	.player-chip img {
		width: 34px;

		height: 34px;

		object-fit: contain;

		background: transparent;
	}


	.player-chip div {
		min-width: 0;
	}


	.player-chip strong,
	.player-chip small {
		display: block;

		min-width: 0;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	.player-chip strong {
		color:
			var(--brand-ivory);

		font-size: .72rem;
	}


	.player-chip small {
		margin-top: 2px;

		color:
			var(--brand-stone);

		font-size: .61rem;
	}


	/* =========================================================
	   DRAFT CAPITAL
	   ========================================================= */

	.capital-panel {
		position: relative;

		display: grid;

		gap: 10px;

		padding: 13px;

		border:
			1px solid
			rgba(191,161,106,.28);

		border-radius:
			var(--radius-sm);

		background:
			linear-gradient(
				90deg,
				rgba(191,161,106,.055),
				transparent 50%
			),
			rgba(0,0,0,.10);
	}


	.capital-panel::before {
		content: '';

		position: absolute;

		top: 10px;
		bottom: 10px;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.capital-transfer {
		display: grid;

		gap: 7px;
	}


	.capital-year {
		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .62rem;

		font-weight: 700;

		letter-spacing: .11em;

		text-transform: uppercase;
	}


	.capital-route {
		display: flex;

		flex-wrap: wrap;

		gap: 7px;

		align-items: baseline;
	}


	.capital-route span {
		color:
			var(--brand-stone);
	}


	.capital-amount {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.6rem;

		font-weight: 400;
	}


	.capital-none {
		color:
			var(--brand-stone);
	}


	.capital-pending {
		color:
			var(--brand-gold);
	}


	/* =========================================================
	   SIMPLE DATA ROW
	   ========================================================= */

	.simple-row {
		display: flex;

		justify-content:
			space-between;

		gap: 12px;

		padding:
			7px 0;

		border-bottom:
			1px solid
			rgba(191,161,106,.09);
	}


	.simple-row:last-child {
		border-bottom: 0;
	}


	.simple-row span {
		color:
			var(--brand-stone);

		text-align: right;
	}


	.small-gap {
		gap: 5px;
	}


	/* =========================================================
	   EMPTY
	   ========================================================= */

	.empty {
		padding: 20px !important;

		border-left:
			2px solid
			var(--brand-gold) !important;
	}


	.empty h2 {
		margin-top: 6px;

		font-size: 2rem;
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (
		max-width: 1080px
	) {
		.team-select-row {
			grid-template-columns:
				1fr;
		}


		.selected-team-pill {
			justify-self: start;
		}
	}


	@media (
		max-width: 960px
	) {
		.page-head,
		.txn-head,
		.txn-grid {
			grid-template-columns:
				1fr;
		}


		.page-head::after {
			display: none;
		}


		.season-box {
			width: 100%;

			min-width: 0;
		}


		.timestamp {
			text-align: left;

			white-space: normal;
		}


		.filter-banner,
		.feed-summary,
		.section-head {
			display: grid;
		}
	}


	@media (
		max-width: 640px
	) {
		.page-stack {
			gap: 14px;
		}


		.page-head,
		.txn,
		.filter-banner,
		.empty {
			padding: 14px !important;
		}


		.type-pills a {
			flex:
				1 1 120px;
		}


		.selected-team-pill {
			justify-self: stretch;
		}
	}
</style>