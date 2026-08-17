<script>
	export let data;

	let activeLeague = 'All';


	const leagueOrder = [
		'All',
		'ICL',
		'Irving',
		'DTSP'
	];


	$: availableLeagues =
		leagueOrder.filter(
			(league) =>
				league === 'All' ||
				data.championships.some(
					(title) =>
						title.league === league
				)
		);


	$: filteredChampionships =
		activeLeague === 'All'
			? data.championships
			: data.championships.filter(
					(title) =>
						title.league ===
						activeLeague
				);


	$: filteredYears =
		[
			...new Set(
				filteredChampionships.map(
					(title) =>
						title.year
				)
			)
		];


	function leagueClass(
		league
	) {
		return String(
			league || 'legacy'
		)
			.toLowerCase()
			.replace(
				/[^a-z0-9]+/g,
				'-'
			);
	}


	function leagueBadge(
		league
	) {
		switch (
			String(
				league || ''
			).toLowerCase()
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
</script>


<svelte:head>
	<title>
		Championship Ledger | Irving Collective
	</title>
</svelte:head>


<div class="ledger-page">


	<!-- ================================================
	     HERO
	     ================================================ -->

	<section class="ledger-hero">

		<div class="hero-kicker">
			Irving Collective Archives
			<span>•</span>
			Exhibit 01
		</div>


		<div class="hero-main">

			<div>

				<div class="eyebrow">
					Awards
				</div>

				<h1>
					Championship
					<span>Ledger</span>
				</h1>

				<p>
					Every crown currently preserved
					in the Collective record.
				</p>

			</div>


			<div class="hero-mark">

				<strong>
					{data.stats.totalTitles}
				</strong>

				<span>
					Crowns on file
				</span>

			</div>

		</div>


		<div class="hero-stats">

			<div>
				<strong>
					{data.stats.totalTitles}
				</strong>

				<span>
					Championships
				</span>
			</div>


			<div>
				<strong>
					{data.stats.champions}
				</strong>

				<span>
					Champions
				</span>
			</div>


			<div>
				<strong>
					{data.stats.seasons}
				</strong>

				<span>
					Title seasons
				</span>
			</div>


			<div>
				<strong>
					{data.stats.firstYear}
					—
					{data.stats.latestYear}
				</strong>

				<span>
					Ledger range
				</span>
			</div>

		</div>

	</section>



	<!-- ================================================
	     LEAGUE FILTER / TOTALS
	     ================================================ -->

	<section class="league-index">

		<div class="index-heading">

			<div>

				<div class="section-kicker">
					Ledger Index
				</div>

				<h2>
					Crowns by League
				</h2>

			</div>


			<div class="filter-group">

				{#each availableLeagues as league}

					<button
						type="button"
						class:active={activeLeague === league}
						on:click={() =>
							activeLeague = league}
					>
						{league}
					</button>

				{/each}

			</div>

		</div>


		<div class="league-totals">

			{#each data.leagueTotals as item}

				<div
					class={`league-total ${leagueClass(item.league)}`}
				>

					{#if leagueBadge(item.league)}

						<img
							src={leagueBadge(item.league)}
							alt=""
						/>

					{/if}


					<div>

						<span>
							{item.league}
						</span>

						<strong>
							{item.count}
						</strong>

						<small>
							{item.count === 1
								? 'championship'
								: 'championships'}
						</small>

					</div>

				</div>

			{/each}

		</div>

	</section>



	<!-- ================================================
	     FULL LEDGER
	     ================================================ -->

	<section class="ledger-section">

		<header class="section-heading">

			<div>

				<div class="section-kicker">
					Permanent Record
				</div>

				<h2>
					The Ledger
				</h2>

			</div>


			<div class="ledger-filter-label">
				{activeLeague === 'All'
					? 'All championships'
					: `${activeLeague} championships`}
			</div>

		</header>



		<div class="year-ledger">

			{#each filteredYears as year}

				<div class="year-block">


					<div class="year-column">

						<strong>
							{year}
						</strong>

						<span>
							Season
						</span>

					</div>



					<div class="year-champions">

						{#each filteredChampionships.filter(
							(title) =>
								title.year === year
						) as title}


							<article
								class={`champion-row league-${leagueClass(title.league)}`}
							>


								<div class="league-badge">

									{#if leagueBadge(title.league)}

										<img
											src={leagueBadge(title.league)}
											alt=""
										/>

									{/if}

								</div>



								<div class="champion-team">

									{#if title.photo}

										<img
											src={title.photo}
											alt=""
										/>

									{/if}


									<div>

										<span>
											{title.league}
											Champion
										</span>

										<strong>
											{title.teamName}
										</strong>

										<small>
											{title.managerName}
										</small>

									</div>

								</div>



								<div class="champion-stamp">

									<span>
										Champion
									</span>

									<strong>
										{year}
									</strong>

								</div>


							</article>

						{/each}

					</div>

				</div>

			{/each}

		</div>

	</section>



	<!-- ================================================
	     TITLE LEADERS
	     ================================================ -->

	<section class="leaders-section">

		<header class="section-heading">

			<div>

				<div class="section-kicker">
					House Legends
				</div>

				<h2>
					Title Leaders
				</h2>

			</div>

		</header>


		<div class="leaders-board">

			{#each data.titleLeaders as manager, index}

				<div class="leader-row">


					<div class="leader-rank">
						{String(index + 1).padStart(2, '0')}
					</div>



					<div class="leader-manager">

						{#if manager.photo}

							<img
								src={manager.photo}
								alt=""
							/>

						{/if}


						<div>

							<strong>
								{manager.teamName}
							</strong>

							<span>
								{manager.managerName}
							</span>

						</div>

					</div>



					<div class="leader-years">

						{#each manager.titles as title}

							<span
								class={`title-chip league-${leagueClass(title.league)}`}
							>
								{title.year}
								<small>
									{title.league}
								</small>
							</span>

						{/each}

					</div>



					<div class="leader-count">

						<strong>
							{manager.count}
						</strong>

						<span>
							{manager.count === 1
								? 'title'
								: 'titles'}
						</span>

					</div>


				</div>

			{/each}

		</div>

	</section>


</div>



<style>

	:global(body) {
		--gold: #d6b15e;
		--gold-bright: #edcc7d;
		--cream: #f2eee4;
		--ink: #0b0e0d;
		--panel: #111513;
		--line: rgba(214, 177, 94, .27);
	}


	.ledger-page {
		display: grid;
		gap: 62px;

		padding-bottom: 70px;
	}


	.eyebrow,
	.section-kicker,
	.hero-kicker {
		color: var(--gold);

		font-size: 11px;
		font-weight: 900;

		letter-spacing: .2em;
		text-transform: uppercase;
	}



	/* ================================================
	   HERO
	   ================================================ */

	.ledger-hero {
		border-top:
			1px solid
			rgba(214,177,94,.55);

		border-bottom:
			1px solid
			rgba(214,177,94,.38);

		background:
			radial-gradient(
				circle at 82% 25%,
				rgba(214,177,94,.10),
				transparent 30%
			),
			linear-gradient(
				135deg,
				rgba(255,255,255,.035),
				rgba(255,255,255,.008)
			);

		padding:
			24px 28px 0;
	}


	.hero-kicker {
		padding-bottom: 18px;

		border-bottom:
			1px solid
			rgba(255,255,255,.09);
	}


	.hero-kicker span {
		margin: 0 8px;
	}


	.hero-main {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 40px;

		min-height: 275px;

		padding:
			35px 8px;
	}


	.hero-main h1 {
		margin:
			6px 0 14px;

		color:
			var(--cream);

		font-size:
			clamp(
				56px,
				7vw,
				105px
			);

		line-height: .88;

		letter-spacing: -.035em;

		text-transform: uppercase;
	}


	.hero-main h1 span {
		display: block;

		color:
			var(--gold);
	}


	.hero-main p {
		margin: 0;

		color:
			rgba(255,255,255,.58);

		font-size: 17px;
	}


	.hero-mark {
		display: grid;
		justify-items: center;

		min-width: 190px;

		padding: 25px;

		border:
			1px solid
			rgba(214,177,94,.23);

		text-align: center;
	}


	.hero-mark strong {
		color:
			var(--gold-bright);

		font-size: 62px;
		line-height: 1;
	}


	.hero-mark span {
		margin-top: 7px;

		color:
			rgba(255,255,255,.42);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: .13em;
		text-transform: uppercase;
	}


	.hero-stats {
		display: grid;
		grid-template-columns:
			repeat(
				4,
				minmax(0,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.09);
	}


	.hero-stats > div {
		display: flex;
		align-items: baseline;

		gap: 10px;

		padding:
			19px 16px;

		border-right:
			1px solid
			rgba(255,255,255,.08);
	}


	.hero-stats > div:last-child {
		border-right: 0;
	}


	.hero-stats strong {
		color:
			var(--gold-bright);

		font-size: 24px;
	}


	.hero-stats span {
		color:
			rgba(255,255,255,.38);

		font-size: 9px;
		font-weight: 800;

		letter-spacing: .09em;
		text-transform: uppercase;
	}



	/* ================================================
	   LEAGUE INDEX
	   ================================================ */

	.league-index {
		display: grid;
		gap: 22px;
	}


	.index-heading,
	.section-heading {
		display: flex;
		align-items: flex-end;
		justify-content:
			space-between;

		gap: 30px;

		padding-bottom: 16px;

		border-bottom:
			1px solid
			var(--line);
	}


	.index-heading h2,
	.section-heading h2 {
		margin:
			5px 0 0;

		color:
			var(--cream);

		font-size:
			clamp(
				32px,
				4vw,
				52px
			);

		line-height: .95;

		text-transform: uppercase;
	}


	.filter-group {
		display: flex;
		gap: 7px;
	}


	.filter-group button {
		padding:
			8px 13px;

		border:
			1px solid
			rgba(255,255,255,.13);

		background:
			transparent;

		color:
			rgba(255,255,255,.48);

		font: inherit;

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .08em;
		text-transform: uppercase;

		cursor: pointer;
	}


	.filter-group button:hover,
	.filter-group button.active {
		border-color:
			rgba(214,177,94,.65);

		background:
			rgba(214,177,94,.09);

		color:
			var(--gold-bright);
	}


	.league-totals {
		display: grid;

		grid-template-columns:
			repeat(
				auto-fit,
				minmax(220px,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.09);

		border-left:
			1px solid
			rgba(255,255,255,.09);
	}


	.league-total {
		position: relative;

		display: flex;
		align-items: center;

		gap: 18px;

		min-height: 145px;

		padding: 20px;

		border-right:
			1px solid
			rgba(255,255,255,.09);

		border-bottom:
			1px solid
			rgba(255,255,255,.09);

		overflow: hidden;
	}


	.league-total > img {
		width: 82px;
		height: 82px;

		object-fit: contain;

		opacity: .7;
	}


	.league-total > div {
		display: grid;
		gap: 2px;
	}


	.league-total span {
		color:
			var(--gold);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .13em;
		text-transform: uppercase;
	}


	.league-total strong {
		color:
			var(--cream);

		font-size: 42px;
		line-height: 1;
	}


	.league-total small {
		color:
			rgba(255,255,255,.35);

		font-size: 9px;

		text-transform: uppercase;
	}



	/* ================================================
	   LEDGER
	   ================================================ */

	.ledger-section,
	.leaders-section {
		display: grid;
		gap: 24px;
	}


	.ledger-filter-label {
		color:
			rgba(255,255,255,.35);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: .11em;
		text-transform: uppercase;
	}


	.year-ledger {
		border-top:
			1px solid
			rgba(255,255,255,.10);
	}


	.year-block {
		display: grid;

		grid-template-columns:
			145px
			minmax(0,1fr);

		border-bottom:
			1px solid
			rgba(255,255,255,.10);
	}


	.year-column {
		display: grid;
		align-content: start;
		gap: 4px;

		padding:
			25px 18px;

		border-right:
			1px solid
			rgba(255,255,255,.08);
	}


	.year-column strong {
		color:
			var(--cream);

		font-size: 36px;
		line-height: 1;
	}


	.year-column span {
		color:
			var(--gold);

		font-size: 9px;
		font-weight: 900;

		letter-spacing: .14em;
		text-transform: uppercase;
	}


	.year-champions {
		display: grid;
	}


	.champion-row {
		position: relative;

		display: grid;

		grid-template-columns:
			100px
			minmax(260px,1fr)
			auto;

		align-items: center;

		gap: 22px;

		min-height: 135px;

		padding:
			18px 22px;

		border-bottom:
			1px solid
			rgba(255,255,255,.065);

		background:
			linear-gradient(
				90deg,
				rgba(255,255,255,.02),
				transparent
			);
	}


	.year-champions
		.champion-row:last-child {
		border-bottom: 0;
	}


	.league-badge {
		display: grid;
		place-items: center;

		width: 90px;
		height: 90px;
	}


	.league-badge img {
		max-width: 100%;
		max-height: 100%;

		object-fit: contain;

		opacity: .22;
	}


	.champion-team {
		display: flex;
		align-items: center;

		gap: 15px;
	}


	.champion-team > img {
		width: 58px;
		height: 58px;

		object-fit: contain;
	}


	.champion-team > div {
		display: grid;
		gap: 2px;
	}


	.champion-team span {
		color:
			var(--gold);

		font-size: 9px;
		font-weight: 900;

		letter-spacing: .11em;
		text-transform: uppercase;
	}


	.champion-team strong {
		color:
			var(--cream);

		font-size: 17px;
	}


	.champion-team small {
		color:
			rgba(255,255,255,.47);

		font-size: 11px;
	}


	.champion-stamp {
		display: grid;

		text-align: right;
	}


	.champion-stamp span {
		color:
			rgba(255,255,255,.27);

		font-size: 8px;
		font-weight: 900;

		letter-spacing: .14em;
		text-transform: uppercase;
	}


	.champion-stamp strong {
		color:
			rgba(255,255,255,.18);

		font-size: 38px;
		line-height: 1;
	}



	/* ================================================
	   TITLE LEADERS
	   ================================================ */

	.leaders-board {
		border-top:
			2px solid
			var(--gold);
	}


	.leader-row {
		display: grid;

		grid-template-columns:
			55px
			minmax(250px,1fr)
			minmax(250px,1fr)
			90px;

		align-items: center;

		gap: 15px;

		min-height: 88px;

		padding:
			12px 18px;

		border-bottom:
			1px solid
			rgba(255,255,255,.08);
	}


	.leader-rank {
		color:
			rgba(214,177,94,.6);

		font-size: 14px;
		font-weight: 900;
	}


	.leader-manager {
		display: flex;
		align-items: center;

		gap: 13px;
	}


	.leader-manager img {
		width: 48px;
		height: 48px;

		object-fit: contain;
	}


	.leader-manager > div {
		display: grid;
		gap: 2px;
	}


	.leader-manager strong {
		color:
			var(--cream);

		font-size: 14px;
	}


	.leader-manager span {
		color:
			rgba(255,255,255,.38);

		font-size: 10px;
	}


	.leader-years {
		display: flex;
		flex-wrap: wrap;

		gap: 7px;
	}


	.title-chip {
		display: inline-flex;
		align-items: baseline;

		gap: 5px;

		padding:
			5px 7px;

		border:
			1px solid
			rgba(255,255,255,.10);

		color:
			rgba(255,255,255,.72);

		font-size: 11px;
		font-weight: 900;
	}


	.title-chip small {
		color:
			var(--gold);

		font-size: 7px;
		font-weight: 900;

		letter-spacing: .08em;
		text-transform: uppercase;
	}


	.leader-count {
		display: grid;

		text-align: right;
	}


	.leader-count strong {
		color:
			var(--gold-bright);

		font-size: 31px;
		line-height: 1;
	}


	.leader-count span {
		color:
			rgba(255,255,255,.32);

		font-size: 8px;
		font-weight: 900;

		letter-spacing: .1em;
		text-transform: uppercase;
	}



	/* ================================================
	   RESPONSIVE
	   ================================================ */

	@media (max-width: 900px) {

		.hero-main {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.hero-mark {
			justify-items:
				start;

			text-align: left;
		}


		.hero-stats {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.index-heading {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.year-block {
			grid-template-columns:
				100px
				minmax(0,1fr);
		}


		.leader-row {
			grid-template-columns:
				45px
				minmax(0,1fr)
				75px;
		}


		.leader-years {
			grid-column:
				2 / -1;

			padding-bottom:
				8px;
		}

	}


	@media (max-width: 600px) {

		.ledger-page {
			gap: 45px;
		}


		.ledger-hero {
			padding:
				20px 17px 0;
		}


		.hero-stats {
			grid-template-columns:
				1fr;
		}


		.hero-stats > div {
			border-right: 0;
		}


		.filter-group {
			flex-wrap: wrap;
		}


		.year-block {
			grid-template-columns:
				1fr;
		}


		.year-column {
			border-right: 0;

			border-bottom:
				1px solid
				rgba(255,255,255,.08);
		}


		.champion-row {
			grid-template-columns:
				65px
				minmax(0,1fr);
		}


		.league-badge {
			width: 60px;
			height: 60px;
		}


		.champion-stamp {
			display: none;
		}


		.leader-row {
			grid-template-columns:
				35px
				1fr
				55px;

			padding:
				12px 5px;
		}


		.leader-manager img {
			width: 40px;
			height: 40px;
		}

	}

</style>