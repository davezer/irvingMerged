<script>
	export let data;

	let query = '';
	let teamFilter = '';
	let resultFilter = '';
	let categoryFilter = '';
	let pageSize = '50';
	let page = 1;

	$: rows =
		data?.rows ||
		[];

	$: normalizedQuery =
		query
			.trim()
			.toLowerCase();

	$: filteredRows =
		rows.filter((row) => {
			if (
				teamFilter &&
				row.team !== teamFilter
			) {
				return false;
			}

			if (
				resultFilter &&
				row.result !== resultFilter
			) {
				return false;
			}

			if (
				categoryFilter &&
				row.category !== categoryFilter
			) {
				return false;
			}

			if (normalizedQuery) {
				const haystack =
					`${row.team} ${row.date} ${row.bet} ${row.result} ${row.category}`
						.toLowerCase();

				if (
					!haystack.includes(
						normalizedQuery
					)
				) {
					return false;
				}
			}

			return true;
		});

	$: numericPageSize =
		pageSize === 'all'
			? Math.max(
					filteredRows.length,
					1
				)
			: Number(pageSize);

	$: totalPages =
		Math.max(
			1,
			Math.ceil(
				filteredRows.length /
					numericPageSize
			)
		);

	$: if (page > totalPages) {
		page = totalPages;
	}

	$: startIndex =
		(page - 1) *
		numericPageSize;

	$: visibleRows =
		pageSize === 'all'
			? filteredRows
			: filteredRows.slice(
					startIndex,
					startIndex +
						numericPageSize
				);


	function resultClass(result) {
		const value =
			String(
				result ||
				''
			).toLowerCase();

		if (value === 'win') {
			return 'win';
		}

		if (value === 'loss') {
			return 'loss';
		}

		if (value === 'push') {
			return 'push';
		}

		if (value === 'pending') {
			return 'pending';
		}

		return 'neutral';
	}


	function resetFilters() {
		query = '';
		teamFilter = '';
		resultFilter = '';
		categoryFilter = '';
		page = 1;
	}


	function filterChanged() {
		page = 1;
	}
</script>


<svelte:head>
	<title>
		The Parlay Ledger | Irving Collective
	</title>

	<meta
		name="description"
		content="The complete archive of Irving Collective group parlay picks, wins, losses, pushes, and questionable betting decisions."
	/>
</svelte:head>


<div class="parlay-page">

	<!-- ==================================================
	     HERO
	     ================================================== -->

	<section class="parlay-hero">

		<div class="hero-copy">

			<div class="eyebrow">
				Group Action Archive
			</div>


			<h1>
				The Parlay Ledger
			</h1>


			<p>
				Every pick. Every win.
				Every bad beat. Every receipt.
			</p>

		</div>


		<div
			class="hero-brand"
			aria-hidden="true"
		>

			<div class="hero-mark">
				ICL
			</div>

			<span>
				Group Action
			</span>

			<strong>
				Parlay
			</strong>

			<small>
				Receipts preserved
			</small>

		</div>


		<div
			class="hero-watermark"
			aria-hidden="true"
		>
			PARLAY
		</div>

	</section>


	<!-- ==================================================
	     STAT STRIP
	     ================================================== -->

	<section
		class="stat-strip"
		aria-label="Parlay summary"
	>

		<article>

			<span>
				Total Picks
			</span>

			<strong>
				{data.stats.total}
			</strong>

			<small>
				{data.stats.pushes}
				push{data.stats.pushes === 1 ? '' : 'es'}

				{#if data.stats.pending}
					· {data.stats.pending} pending
				{/if}
			</small>

		</article>


		<article>

			<span>
				Wins
			</span>

			<strong>
				{data.stats.wins}
			</strong>

			<small>
				graded winners
			</small>

		</article>


		<article>

			<span>
				Losses
			</span>

			<strong>
				{data.stats.losses}
			</strong>

			<small>
				graded losses
			</small>

		</article>


		<article class="hit-rate">

			<span>
				Hit Rate
			</span>

			<strong>
				{data.stats.hitRate.toFixed(1)}%
			</strong>

			<small>
				pushes excluded
			</small>

		</article>

	</section>


	<!-- ==================================================
	     LEDGER
	     ================================================== -->

	<section class="ledger">

		<header class="ledger-head">

			<div>

				<div class="eyebrow">
					Historical Ledger
				</div>

				<h2>
					{data.requestedSeason || 'All-Time'}
					Parlay Board
				</h2>

			</div>


			<div class="ledger-count">

				<strong>
					{rows.length}
				</strong>

				<span>
					Archived Picks
				</span>

			</div>

		</header>


		{#if data.error}

			<div class="signal-error">

				<div class="signal-mark">
					!
				</div>

				<strong>
					Parlay feed unavailable
				</strong>

				<span>
					{data.error}
				</span>

			</div>

		{:else}

			<!-- ==========================================
			     FILTER BAR
			     ========================================== -->

			<div class="filter-panel">

				<label class="search-filter">

					<span>
						Search Ledger
					</span>

					<input
						type="search"
						bind:value={query}
						on:input={filterChanged}
						placeholder="Pick, team, category…"
						autocomplete="off"
					/>

				</label>


				<label>

					<span>
						Franchise
					</span>

					<select
						bind:value={teamFilter}
						on:change={filterChanged}
					>

						<option value="">
							All franchises
						</option>

						{#each data.teamOptions as team}
							<option value={team}>
								{team}
							</option>
						{/each}

					</select>

				</label>


				<label>

					<span>
						Result
					</span>

					<select
						bind:value={resultFilter}
						on:change={filterChanged}
					>

						<option value="">
							All results
						</option>

						{#each data.resultOptions as result}
							<option value={result}>
								{result}
							</option>
						{/each}

					</select>

				</label>


				<label>

					<span>
						Category
					</span>

					<select
						bind:value={categoryFilter}
						on:change={filterChanged}
					>

						<option value="">
							All categories
						</option>

						{#each data.categoryOptions as category}
							<option value={category}>
								{category}
							</option>
						{/each}

					</select>

				</label>

			</div>


			<!-- ==========================================
			     TOOLBAR
			     ========================================== -->

			<div class="table-toolbar">

				<div class="shown-count">

					<strong>
						{filteredRows.length}
					</strong>

					<span>
						of {rows.length}
						picks shown
					</span>

				</div>


				<div class="toolbar-actions">

					{#if query ||
						teamFilter ||
						resultFilter ||
						categoryFilter}

						<button
							type="button"
							on:click={resetFilters}
						>
							Clear Filters
						</button>

					{/if}


					<label>

						<span>
							Show
						</span>

						<select
							bind:value={pageSize}
							on:change={() =>
								(page = 1)}
						>

							<option value="25">
								25
							</option>

							<option value="50">
								50
							</option>

							<option value="100">
								100
							</option>

							<option value="all">
								All
							</option>

						</select>

					</label>

				</div>

			</div>


			<!-- ==========================================
			     EMPTY STATES
			     ========================================== -->

			{#if !data.hasData}

				<div class="empty-state">

					<div class="empty-mark">
						ICL
					</div>

					<strong>
						No parlay picks found
						for this season.
					</strong>

					<span>
						Try another season or
						switch the season feed
						to All.
					</span>

				</div>


			{:else if !filteredRows.length}

				<div class="empty-state">

					<div class="empty-mark">
						0
					</div>

					<strong>
						No picks match
						those filters.
					</strong>

					<button
						type="button"
						on:click={resetFilters}
					>
						Clear Filters
					</button>

				</div>


			{:else}

				<!-- ======================================
				     TABLE
				     ====================================== -->

				<div class="table-shell">

					<table>

						<thead>

							<tr>
								<th>
									Franchise
								</th>

								<th>
									Date
								</th>

								<th>
									Group Parlay Bet
								</th>

								<th>
									Result
								</th>

								<th>
									Category
								</th>
							</tr>

						</thead>


						<tbody>

							{#each visibleRows as row (row.id)}

								<tr>

									<td class="team-cell">
										{row.team}
									</td>

									<td class="date-cell">
										{row.date || '—'}
									</td>

									<td class="bet-cell">
										{row.bet}
									</td>

									<td>

										<span
											class={`result-pill ${resultClass(row.result)}`}
										>
											{row.result}
										</span>

									</td>

									<td class="category-cell">
										{row.category}
									</td>

								</tr>

							{/each}

						</tbody>

					</table>

				</div>


				<!-- ======================================
				     PAGINATION
				     ====================================== -->

				{#if pageSize !== 'all' &&
					totalPages > 1}

					<div class="pagination">

						<button
							type="button"
							disabled={page <= 1}
							on:click={() =>
								(page -= 1)}
						>
							← Previous
						</button>


						<span>
							Page
							<strong>
								{page}
							</strong>
							of
							{totalPages}
						</span>


						<button
							type="button"
							disabled={page >= totalPages}
							on:click={() =>
								(page += 1)}
						>
							Next →
						</button>

					</div>

				{/if}

			{/if}

		{/if}

	</section>

</div>


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.parlay-page {
		width: 100%;
		max-width: 1500px;

		display: grid;
		gap: 20px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	.eyebrow,
	.filter-panel label > span,
	.toolbar-actions label > span,
	.stat-strip article > span {
		color:
			var(--brand-gold);

		font-size:
			.56rem;

		font-weight:
			800;

		letter-spacing:
			.14em;

		text-transform:
			uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.parlay-hero {
		position: relative;

		min-height: 300px;

		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			270px;

		align-items: center;

		gap: 40px;

		overflow: hidden;

		padding:
			clamp(
				30px,
				5vw,
				48px
			);

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.05
				),
				transparent 38%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.hero-copy {
		position: relative;
		z-index: 2;

		max-width: 780px;
	}


	.parlay-hero h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4.4rem,
				7.4vw,
				7.4rem
			);

		font-weight: 400;

		line-height:
			.84;

		letter-spacing:
			-.02em;

		text-transform:
			uppercase;
	}


	.parlay-hero p {
		max-width: 52ch;

		margin:
			24px 0 0;

		color:
			var(--muted);

		font-size:
			1rem;

		font-weight:
			600;

		line-height:
			1.55;
	}


	/* ==================================================
	   HERO BRAND
	   ================================================== */

	.hero-brand {
		position: relative;
		z-index: 2;

		min-height: 210px;

		display: grid;

		justify-items: center;
		align-content: center;

		padding: 22px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.24
			);

		background:
			rgba(
				8,
				11,
				10,
				.38
			);

		text-align: center;
	}


	.hero-mark {
		width: 68px;
		height: 68px;

		display: grid;
		place-items: center;

		margin-bottom: 16px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.8rem;
	}


	.hero-brand > span {
		color:
			var(--brand-stone);

		font-size:
			.52rem;

		font-weight:
			800;

		letter-spacing:
			.16em;

		text-transform:
			uppercase;
	}


	.hero-brand > strong {
		margin-top: 4px;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size:
			2.7rem;

		font-weight: 400;

		line-height: 1;

		text-transform:
			uppercase;
	}


	.hero-brand > small {
		margin-top: 13px;

		color:
			var(--brand-gold);

		font-size:
			.48rem;

		font-weight:
			750;

		letter-spacing:
			.11em;

		text-transform:
			uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -28px;
		bottom: -42px;

		color:
			rgba(
				191,
				161,
				106,
				.018
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				8rem,
				15vw,
				14rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   STATS
	   ================================================== */

	.stat-strip {
		display: grid;

		grid-template-columns:
			repeat(
				4,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.stat-strip article {
		position: relative;

		min-height: 104px;

		display: grid;

		align-content: center;

		gap: 4px;

		padding:
			15px 17px;

		overflow: hidden;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			var(--panel);

		box-shadow:
			var(--shadow-panel);
	}


	.stat-strip article::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 2px;

		background:
			rgba(
				191,
				161,
				106,
				.4
			);
	}


	.stat-strip strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2rem;

		font-weight: 400;

		line-height: 1;
	}


	.stat-strip small {
		color:
			var(--muted);

		font-size:
			.68rem;
	}


	.stat-strip .hit-rate strong {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   LEDGER
	   ================================================== */

	.ledger {
		overflow: hidden;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			var(--panel);

		box-shadow:
			var(--shadow-panel);
	}


	.ledger-head {
		min-height: 90px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 20px;

		padding:
			18px 20px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.13
			);
	}


	.ledger-head h2 {
		margin:
			5px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2.3rem;

		font-weight: 400;

		line-height: 1;
	}


	.ledger-count {
		display: grid;

		justify-items: end;

		gap: 2px;
	}


	.ledger-count strong {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.65rem;

		font-weight: 400;
	}


	.ledger-count span {
		color:
			var(--brand-stone);

		font-size:
			.5rem;

		font-weight:
			800;

		letter-spacing:
			.1em;

		text-transform:
			uppercase;
	}


	/* ==================================================
	   FILTERS
	   ================================================== */

	.filter-panel {
		display: grid;

		grid-template-columns:
			minmax(260px,1.4fr)
			repeat(
				3,
				minmax(160px,.7fr)
			);

		gap: 10px;

		margin:
			16px 16px 0;

		padding: 14px;

		border:
			1px solid
			var(--border);

		background:
			rgba(
				8,
				11,
				10,
				.36
			);
	}


	.filter-panel label,
	.toolbar-actions label {
		display: grid;

		gap: 6px;
	}


	.filter-panel input,
	.filter-panel select,
	.toolbar-actions select {
		width: 100%;

		min-height: 40px;

		padding:
			8px 10px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			3px;

		outline: 0;

		background:
			var(--brand-charcoal);

		color:
			var(--brand-ivory);

		font: inherit;

		transition:
			border-color
			120ms ease;
	}


	.filter-panel input:focus,
	.filter-panel select:focus,
	.toolbar-actions select:focus {
		border-color:
			var(--brand-gold);
	}


	.filter-panel input::placeholder {
		color:
			var(--muted);
	}


	select option,
	select optgroup {
		color:
			#111;

		background:
			#fff;
	}


	/* ==================================================
	   TOOLBAR
	   ================================================== */

	.table-toolbar {
		display: flex;

		justify-content:
			space-between;

		align-items: end;

		gap: 14px;

		padding:
			14px 16px 10px;
	}


	.shown-count {
		display: flex;

		align-items: baseline;

		gap: 6px;

		color:
			var(--muted);
	}


	.shown-count strong {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.3rem;

		font-weight: 400;
	}


	.shown-count span {
		font-size:
			.72rem;
	}


	.toolbar-actions {
		display: flex;

		align-items: end;

		gap: 9px;
	}


	.toolbar-actions label {
		min-width: 88px;
	}


	button {
		min-height: 39px;

		cursor: pointer;

		padding:
			8px 11px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			3px;

		background:
			transparent;

		color:
			var(--brand-sand);

		font-size:
			.58rem;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;

		transition:
			border-color
			120ms ease,
			color
			120ms ease,
			background
			120ms ease;
	}


	button:hover:not(:disabled) {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	button:disabled {
		cursor: default;

		opacity: .3;
	}


	/* ==================================================
	   TABLE
	   ================================================== */

	.table-shell {
		margin:
			0 16px 16px;

		overflow-x: auto;

		border:
			1px solid
			var(--border);

		background:
			rgba(
				8,
				11,
				10,
				.26
			);
	}


	table {
		width: 100%;

		min-width: 900px;

		border-collapse:
			collapse;
	}


	thead th {
		position: sticky;

		top: 0;

		z-index: 2;

		padding:
			10px 13px;

		border-bottom:
			1px solid
			var(--brand-gold);

		background:
			#090c0b;

		color:
			var(--brand-stone);

		font-size:
			.55rem;

		font-weight:
			800;

		letter-spacing:
			.11em;

		text-align: left;

		text-transform:
			uppercase;
	}


	tbody tr {
		background:
			transparent;

		transition:
			background
			100ms ease;
	}


	tbody tr:nth-child(even) {
		background:
			rgba(
				255,
				255,
				255,
				.009
			);
	}


	tbody tr:hover {
		background:
			rgba(
				191,
				161,
				106,
				.035
			);
	}


	td {
		padding:
			11px 13px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.09
			);

		color:
			var(--brand-ivory);

		vertical-align:
			middle;
	}


	tbody tr:last-child td {
		border-bottom: 0;
	}


	.team-cell {
		min-width: 220px;

		color:
			var(--brand-ivory);

		font-weight:
			750;
	}


	.date-cell {
		width: 130px;

		white-space: nowrap;

		color:
			var(--brand-stone);

		font-size:
			.78rem;
	}


	.bet-cell {
		min-width: 260px;

		font-weight:
			700;
	}


	.category-cell {
		min-width: 170px;

		color:
			var(--muted);
	}


	/* ==================================================
	   RESULTS
	   ================================================== */

	.result-pill {
		min-width: 62px;

		display: inline-grid;

		place-items: center;

		padding:
			5px 7px;

		border:
			1px solid
			var(--border);

		border-radius:
			2px;

		font-size:
			.51rem;

		font-weight:
			850;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}


	.result-pill.win {
		border-color:
			rgba(
				92,
				150,
				107,
				.52
			);

		color:
			#8fc69e;

		background:
			rgba(
				70,
				121,
				82,
				.11
			);
	}


	.result-pill.loss {
		border-color:
			rgba(
				161,
				80,
				80,
				.52
			);

		color:
			#cf8f8f;

		background:
			rgba(
				130,
				54,
				54,
				.11
			);
	}


	.result-pill.push {
		border-color:
			rgba(
				191,
				161,
				106,
				.52
			);

		color:
			var(--brand-gold);

		background:
			rgba(
				191,
				161,
				106,
				.08
			);
	}


	.result-pill.pending {
		border-color:
			rgba(
				139,
				151,
				158,
				.42
			);

		color:
			var(--brand-stone);
	}


	.result-pill.neutral {
		color:
			var(--muted);
	}


	/* ==================================================
	   PAGINATION
	   ================================================== */

	.pagination {
		display: flex;

		justify-content: center;

		align-items: center;

		gap: 12px;

		padding:
			2px 16px
			18px;
	}


	.pagination span {
		color:
			var(--muted);

		font-size:
			.72rem;
	}


	.pagination strong {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   EMPTY / ERROR
	   ================================================== */

	.empty-state,
	.signal-error {
		min-height: 190px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 8px;

		margin:
			16px;

		padding: 24px;

		border:
			1px solid
			var(--border);

		color:
			var(--muted);

		text-align: center;
	}


	.empty-mark,
	.signal-mark {
		width: 54px;
		height: 54px;

		display: grid;

		place-items: center;

		margin-bottom: 4px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.25rem;
	}


	.empty-state strong,
	.signal-error strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.4rem;

		font-weight: 400;
	}


	.signal-error strong {
		color:
			#cf8f8f;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1050px) {

		.parlay-hero {
			grid-template-columns:
				1fr
				220px;
		}


		.filter-panel {
			grid-template-columns:
				repeat(
					2,
						minmax(0,1fr)
				);
		}


		.search-filter {
			grid-column:
				1 / -1;
		}

	}


	@media (max-width: 760px) {

		.parlay-page {
			gap: 14px;
		}


		.parlay-hero {
			grid-template-columns:
				1fr;

			min-height: 0;

			padding:
				28px 22px;
		}


		.parlay-hero h1 {
			font-size:
				clamp(
					3.7rem,
					17vw,
					5.8rem
				);
		}


		.hero-brand {
			display: none;
		}


		.stat-strip {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.ledger-head,
		.table-toolbar {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.ledger-count {
			justify-items: start;
		}


		.filter-panel {
			grid-template-columns:
				1fr;
		}


		.search-filter {
			grid-column: auto;
		}


		.toolbar-actions {
			width: 100%;

			justify-content:
				space-between;
		}

	}


	@media (max-width: 480px) {

		.stat-strip {
			grid-template-columns:
				1fr;
		}


		.toolbar-actions {
			align-items:
				stretch;

			flex-direction:
				column;
		}

	}
</style>