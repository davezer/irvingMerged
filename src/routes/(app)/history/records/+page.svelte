<script>
	export let data;


	let activeSeason = 'all';


	$: allGames =
		data?.games ?? [];

	$: seasons =
		data?.seasons ?? [];


	$: filteredGames =
		activeSeason === 'all'
			? allGames
			: allGames.filter(
					(game) =>
						Number(game.season) ===
						Number(activeSeason)
				);


	$: book =
		buildRecordBook(
			filteredGames
		);


	function numberValue(value) {
		const number =
			Number(value);

		return Number.isFinite(number)
			? number
			: 0;
	}


	function score(value) {
		return numberValue(value)
			.toFixed(2);
	}


	function pct(value) {
		return `${(
			numberValue(value) * 100
		).toFixed(1)}%`;
	}


	function identityKey(side) {
		return String(
			side?.managerId ||
			side?.teamName ||
			'unknown'
		);
	}


	function gameLabel(game) {
		if (!game) {
			return '—';
		}

		return `${game.season} · Week ${game.week}`;
	}


	function buildManagerStats(
		games
	) {
		const managers =
			new Map();


		function ensure(side) {
			const key =
				identityKey(side);

			if (!managers.has(key)) {
				managers.set(
					key,
					{
						managerId:
							side?.managerId ||
							null,

						managerName:
							side?.managerName ||
							'Unknown',

						teamName:
							side?.teamName ||
							'Unknown',

						photo:
							side?.teamPhoto ||
							null,
						teamChiclet:
							side?.teamChiclet ||
							null,

						games: 0,

						wins: 0,

						losses: 0,

						ties: 0,

						pointsFor: 0,

						pointsAgainst: 0,

						results: []
					}
				);
			}

			return managers.get(
				key
			);
		}


		const sortedGames =
			[...games].sort(
				(a, b) =>
					Number(a.season) -
						Number(b.season) ||
					Number(a.week) -
						Number(b.week)
			);


		for (
			const game of
			sortedGames
		) {
			const left =
				ensure(game.left);

			const right =
				ensure(game.right);


			const leftScore =
				numberValue(
					game.left?.score
				);

			const rightScore =
				numberValue(
					game.right?.score
				);


			left.games += 1;
			right.games += 1;

			left.pointsFor +=
				leftScore;

			left.pointsAgainst +=
				rightScore;

			right.pointsFor +=
				rightScore;

			right.pointsAgainst +=
				leftScore;


			if (
				leftScore >
				rightScore
			) {
				left.wins += 1;
				right.losses += 1;

				left.results.push('W');
				right.results.push('L');

			} else if (
				rightScore >
				leftScore
			) {
				right.wins += 1;
				left.losses += 1;

				right.results.push('W');
				left.results.push('L');

			} else {
				left.ties += 1;
				right.ties += 1;

				left.results.push('T');
				right.results.push('T');
			}
		}


		return [
			...managers.values()
		]
			.map((manager) => {

				const denominator =
					manager.games || 1;


				return {
					...manager,

					pointsFor:
						Number(
							manager.pointsFor
								.toFixed(2)
						),

					pointsAgainst:
						Number(
							manager.pointsAgainst
								.toFixed(2)
						),

					pointDiff:
						Number(
							(
								manager.pointsFor -
								manager.pointsAgainst
							).toFixed(2)
						),

					averagePoints:
						Number(
							(
								manager.pointsFor /
								denominator
							).toFixed(2)
						),

					winPct:
						manager.games
							? (
									manager.wins +
									manager.ties * .5
								) /
								manager.games
							: 0
				};
			})
			.sort(
				(a, b) =>
					b.wins - a.wins ||
					b.winPct -
						a.winPct ||
					b.pointsFor -
						a.pointsFor
			);
	}


	function longestStreak(
		managers,
		target
	) {
		let best =
			null;


		for (
			const manager of
			managers
		) {
			let current =
				0;

			let longest =
				0;


			for (
				const result of
				manager.results
			) {
				if (
					result === target
				) {
					current += 1;

					longest =
						Math.max(
							longest,
							current
						);
				} else {
					current = 0;
				}
			}


			if (
				longest > 0 &&
				(
					!best ||
					longest >
						best.count
				)
			) {
				best = {
					...manager,
					count: longest
				};
			}
		}


		return best;
	}


	function allPerformances(
		games
	) {
		return games.flatMap(
			(game) => [
				{
					season:
						game.season,

					week:
						game.week,

					team:
						game.left,

					opponent:
						game.right,

					score:
						numberValue(
							game.left?.score
						),

					opponentScore:
						numberValue(
							game.right?.score
						)
				},

				{
					season:
						game.season,

					week:
						game.week,

					team:
						game.right,

					opponent:
						game.left,

					score:
						numberValue(
							game.right?.score
						),

					opponentScore:
						numberValue(
							game.left?.score
						)
				}
			]
		);
	}


	function buildRecordBook(
		games
	) {
		const managers =
			buildManagerStats(
				games
			);


		const performances =
			allPerformances(
				games
			);


		const highestScore =
			performances.length
				? [...performances]
						.sort(
							(a, b) =>
								b.score -
								a.score
						)[0]
				: null;


		const lowestScore =
			performances.length
				? [...performances]
						.sort(
							(a, b) =>
								a.score -
								b.score
						)[0]
				: null;


		const losses =
			performances.filter(
				(item) =>
					item.score <
					item.opponentScore
			);


		const mostPointsLoss =
			losses.length
				? [...losses]
						.sort(
							(a, b) =>
								b.score -
								a.score
						)[0]
				: null;


		const gamesByMargin =
			games.map(
				(game) => ({
					...game,

					margin:
						Math.abs(
							numberValue(
								game.left?.score
							) -
							numberValue(
								game.right?.score
							)
						)
				})
			);


		const biggestBlowout =
			gamesByMargin.length
				? [...gamesByMargin]
						.sort(
							(a, b) =>
								b.margin -
								a.margin
						)[0]
				: null;


		const nonTies =
			gamesByMargin.filter(
				(game) =>
					game.margin > 0
			);


		const closestGame =
			nonTies.length
				? [...nonTies]
						.sort(
							(a, b) =>
								a.margin -
								b.margin
						)[0]
				: null;


		const highestCombined =
			games.length
				? [...games]
						.map(
							(game) => ({
								...game,

								combined:
									numberValue(
										game.left?.score
									) +
									numberValue(
										game.right?.score
									)
							})
						)
						.sort(
							(a, b) =>
								b.combined -
								a.combined
						)[0]
				: null;


		const totalPoints =
			performances.reduce(
				(sum, item) =>
					sum +
					item.score,
				0
			);


		return {
			managers,

			games:
				games.length,

			totalPoints:
				Number(
					totalPoints.toFixed(2)
				),

			franchises:
				managers.length,

			highestScore,

			lowestScore,

			mostPointsLoss,

			biggestBlowout,

			closestGame,

			highestCombined,

			longestWinStreak:
				longestStreak(
					managers,
					'W'
				),

			longestLossStreak:
				longestStreak(
					managers,
					'L'
				)
		};
	}


	function winnerOf(game) {
		if (!game) {
			return null;
		}


		const leftScore =
			numberValue(
				game.left?.score
			);

		const rightScore =
			numberValue(
				game.right?.score
			);


		if (
			leftScore >
			rightScore
		) {
			return game.left;
		}


		if (
			rightScore >
			leftScore
		) {
			return game.right;
		}


		return null;
	}
</script>


<svelte:head>
	<title>
		Record Book | Irving Collective
	</title>
</svelte:head>


<div class="record-page">


	<!-- ==================================================
	     HERO
	     ================================================== -->

	<section class="record-hero">

		<div class="hero-topline">

			<div class="section-kicker">
				Irving Collective Archives
			</div>

			<div class="hero-doc">
				Merged Era
				<span>•</span>
				{data.mergerStartYear}–Present
			</div>

		</div>


		<div class="hero-main">

			<div>

				<div class="eyebrow">
					Records
				</div>

				<h1>
					The
					<span>
						Record Book
					</span>
				</h1>

				<p>
					The official statistical
					receipts of the Irving
					Collective era.
				</p>

			</div>


			<div class="hero-record">

				<span>
					Games on File
				</span>

				<strong>
					{book.games}
				</strong>

				<small>
					Completed head-to-head
					matchups
				</small>

			</div>

		</div>


		<div class="hero-stats">

			<div>
				<strong>
					{book.games}
				</strong>

				<span>
					Games
				</span>
			</div>


			<div>
				<strong>
					{book.franchises}
				</strong>

				<span>
					Franchises
				</span>
			</div>


			<div>
				<strong>
					{score(
						book.totalPoints
					)}
				</strong>

				<span>
					Points scored
				</span>
			</div>


			<div>
				<strong>
					{activeSeason === 'all'
						? `${data.mergerStartYear}—`
						: activeSeason}
				</strong>

				<span>
					Record scope
				</span>
			</div>

		</div>

	</section>



	<!-- ==================================================
	     SEASON FILTER
	     ================================================== -->

	<section class="record-filter">

		<div>

			<div class="section-kicker">
				Record Scope
			</div>

			<span>
				Show records from
			</span>

		</div>


		<div class="filter-buttons">

			<button
				type="button"
				class:active={activeSeason === 'all'}
				on:click={() =>
					activeSeason = 'all'}
			>
				All Merged Era
			</button>


			{#each seasons as season}

				<button
					type="button"
					class:active={Number(activeSeason) === Number(season)}
					on:click={() =>
						activeSeason = season}
				>
					{season}
				</button>

			{/each}

		</div>

	</section>



	{#if book.games > 0}


		<!-- ==============================================
		     CAREER BOARD
		     ============================================== -->

		<section class="record-section">

			<header class="section-heading">

				<div>

					<div class="section-kicker">
						Ledger 01
					</div>

					<h2>
						Career Board
					</h2>

					<p>
						Official head-to-head
						results from the selected
						record scope.
					</p>

				</div>

			</header>


			<div class="career-table">


				<div class="career-head">

					<span>#</span>

					<span>
						Franchise
					</span>

					<span>
						Record
					</span>

					<span>
						Win %
					</span>

					<span>
						Points
					</span>

					<span>
						Avg
					</span>

					<span>
						Diff
					</span>

				</div>



				{#each book.managers as manager, index}

					<div class="career-row">


						<div class="career-rank">
							{String(
								index + 1
							).padStart(
								2,
								'0'
							)}
						</div>


						<div class="career-team">

							{#if manager.teamChiclet || manager.photo}

	<img
		src={manager.teamChiclet || manager.photo}
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


						<div class="career-record">

							<strong>
								{manager.wins}
								—
								{manager.losses}

								{#if manager.ties}
									—
									{manager.ties}
								{/if}
							</strong>

						</div>


						<div class="career-number">
							{pct(
								manager.winPct
							)}
						</div>


						<div class="career-number">
							{score(
								manager.pointsFor
							)}
						</div>


						<div class="career-number">
							{score(
								manager.averagePoints
							)}
						</div>


						<div
							class:positive={manager.pointDiff > 0}
							class:negative={manager.pointDiff < 0}
							class="career-number diff"
						>
							{manager.pointDiff > 0
								? '+'
								: ''}
							{score(
								manager.pointDiff
							)}
						</div>

					</div>

				{/each}

			</div>

		</section>



		<!-- ==============================================
		     SINGLE GAME RECORDS
		     ============================================== -->

		<section class="record-section">

			<header class="section-heading">

				<div>

					<div class="section-kicker">
						Ledger 02
					</div>

					<h2>
						Single-Game Records
					</h2>

					<p>
						The best, worst and most
						ridiculous Sundays currently
						on file.
					</p>

				</div>

			</header>


			<div class="record-grid">


				<!-- HIGHEST SCORE -->

				<article
					class="record-card marquee"
				>

					<div class="record-index">
						R-01
					</div>

					<span class="record-label">
						Highest Score
					</span>

					<strong class="record-value">
						{score(
							book.highestScore?.score
						)}
					</strong>

					<h3>
						{book.highestScore
							?.team
							?.teamName ||
							'—'}
					</h3>

					<p>
						{gameLabel(
							book.highestScore
						)}
						against
						{book.highestScore
							?.opponent
							?.teamName ||
							'—'}
					</p>

				</article>



				<!-- LOWEST SCORE -->

				<article class="record-card">

					<div class="record-index">
						R-02
					</div>

					<span class="record-label">
						Lowest Score
					</span>

					<strong class="record-value">
						{score(
							book.lowestScore?.score
						)}
					</strong>

					<h3>
						{book.lowestScore
							?.team
							?.teamName ||
							'—'}
					</h3>

					<p>
						{gameLabel(
							book.lowestScore
						)}
					</p>

				</article>



				<!-- BIGGEST BLOWOUT -->

				<article class="record-card">

					<div class="record-index">
						R-03
					</div>

					<span class="record-label">
						Biggest Blowout
					</span>

					<strong class="record-value">
						{score(
							book.biggestBlowout
								?.margin
						)}
					</strong>

					<h3>
						{winnerOf(
							book.biggestBlowout
						)?.teamName ||
							'—'}
					</h3>

					<p>
						{score(
							book.biggestBlowout
								?.left
								?.score
						)}
						—
						{score(
							book.biggestBlowout
								?.right
								?.score
						)}
						·
						{gameLabel(
							book.biggestBlowout
						)}
					</p>

				</article>



				<!-- CLOSEST -->

				<article class="record-card">

					<div class="record-index">
						R-04
					</div>

					<span class="record-label">
						Closest Finish
					</span>

					<strong class="record-value">
						{score(
							book.closestGame
								?.margin
						)}
					</strong>

					<h3>
						{book.closestGame
							?.left
							?.teamName ||
							'—'}
						vs
						{book.closestGame
							?.right
							?.teamName ||
							'—'}
					</h3>

					<p>
						{score(
							book.closestGame
								?.left
								?.score
						)}
						—
						{score(
							book.closestGame
								?.right
								?.score
						)}
						·
						{gameLabel(
							book.closestGame
						)}
					</p>

				</article>



				<!-- POINTS IN LOSS -->

				<article class="record-card">

					<div class="record-index">
						R-05
					</div>

					<span class="record-label">
						Most Points in a Loss
					</span>

					<strong class="record-value">
						{score(
							book.mostPointsLoss
								?.score
						)}
					</strong>

					<h3>
						{book.mostPointsLoss
							?.team
							?.teamName ||
							'—'}
					</h3>

					<p>
						Lost
						{score(
							book.mostPointsLoss
								?.score
						)}
						—
						{score(
							book.mostPointsLoss
								?.opponentScore
						)}
						·
						{gameLabel(
							book.mostPointsLoss
						)}
					</p>

				</article>



				<!-- COMBINED SCORE -->

				<article class="record-card">

					<div class="record-index">
						R-06
					</div>

					<span class="record-label">
						Highest Combined Score
					</span>

					<strong class="record-value">
						{score(
							book.highestCombined
								?.combined
						)}
					</strong>

					<h3>
						{book.highestCombined
							?.left
							?.teamName ||
							'—'}
						vs
						{book.highestCombined
							?.right
							?.teamName ||
							'—'}
					</h3>

					<p>
						{score(
							book.highestCombined
								?.left
								?.score
						)}
						—
						{score(
							book.highestCombined
								?.right
								?.score
						)}
						·
						{gameLabel(
							book.highestCombined
						)}
					</p>

				</article>

			</div>

		</section>



		<!-- ==============================================
		     STREAKS
		     ============================================== -->

		<section class="record-section">

			<header class="section-heading">

				<div>

					<div class="section-kicker">
						Ledger 03
					</div>

					<h2>
						Streak Board
					</h2>

				</div>

			</header>


			<div class="streak-board">


				<div class="streak-row">

					<div class="streak-label">
						Longest Winning Streak
					</div>

					<strong>
						{book.longestWinStreak
							?.teamName ||
							'—'}
					</strong>

					<div class="streak-number">
						{book.longestWinStreak
							?.count ||
							0}
						<span>
							WINS
						</span>
					</div>

				</div>



				<div class="streak-row">

					<div class="streak-label">
						Longest Losing Streak
					</div>

					<strong>
						{book.longestLossStreak
							?.teamName ||
							'—'}
					</strong>

					<div class="streak-number">
						{book.longestLossStreak
							?.count ||
							0}
						<span>
							LOSSES
						</span>
					</div>

				</div>

			</div>

		</section>


	{:else}


		<div class="empty-book">

			<div class="section-kicker">
				No Entries
			</div>

			<h2>
				Nothing on the books yet.
			</h2>

			<p>
				There are no completed matchups
				in this record scope.
			</p>

		</div>


	{/if}


</div>



<style>

	:global(body) {
		--record-gold: #d6b15e;
		--record-gold-bright: #edcc7d;
		--record-cream: #f2eee4;
		--record-ink: #0b0e0d;
		--record-line: rgba(214,177,94,.27);
	}


	.record-page {
		display: grid;
		gap: 60px;

		padding-bottom: 70px;
	}


	.section-kicker,
	.eyebrow,
	.record-index,
	.record-label {
		color:
			var(--record-gold);

		font-size: 11px;
		font-weight: 900;

		letter-spacing: .18em;
		text-transform: uppercase;
	}



	/* ==================================================
	   HERO
	   ================================================== */

	.record-hero {
		padding:
			24px 28px 0;

		border-top:
			1px solid
			rgba(214,177,94,.55);

		border-bottom:
			1px solid
			rgba(214,177,94,.38);

		background:
			radial-gradient(
				circle at 80% 30%,
				rgba(214,177,94,.10),
				transparent 32%
			),
			linear-gradient(
				135deg,
				rgba(255,255,255,.035),
				rgba(255,255,255,.008)
			);
	}


	.hero-topline {
		display: flex;
		justify-content:
			space-between;
		align-items: center;

		padding-bottom: 18px;

		border-bottom:
			1px solid
			rgba(255,255,255,.09);
	}


	.hero-doc {
		color:
			rgba(255,255,255,.38);

		font-size: 9px;
		font-weight: 800;

		letter-spacing: .14em;
		text-transform: uppercase;
	}


	.hero-doc span {
		margin: 0 8px;

		color:
			var(--record-gold);
	}


	.hero-main {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 40px;

		min-height: 280px;

		padding:
			36px 8px;
	}


	.hero-main h1 {
		margin:
			6px 0 14px;

		color:
			var(--record-cream);

		font-size:
			clamp(
				58px,
				7vw,
				104px
			);

		line-height: .88;

		letter-spacing: -.04em;

		text-transform: uppercase;
	}


	.hero-main h1 span {
		display: block;

		color:
			var(--record-gold);
	}


	.hero-main p {
		max-width: 650px;

		margin: 0;

		color:
			rgba(255,255,255,.58);

		font-size: 17px;
		line-height: 1.5;
	}


	.hero-record {
		display: grid;

		min-width: 220px;

		padding:
			25px;

		border:
			1px solid
			rgba(214,177,94,.23);
	}


	.hero-record > span {
		color:
			var(--record-gold);

		font-size: 9px;
		font-weight: 900;

		letter-spacing: .14em;
		text-transform: uppercase;
	}


	.hero-record strong {
		margin-top: 5px;

		color:
			var(--record-gold-bright);

		font-size: 64px;
		line-height: 1;
	}


	.hero-record small {
		margin-top: 7px;

		color:
			rgba(255,255,255,.35);

		font-size: 10px;
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
			var(--record-gold-bright);

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



	/* ==================================================
	   FILTER
	   ================================================== */

	.record-filter {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 25px;

		padding-bottom: 17px;

		border-bottom:
			1px solid
			var(--record-line);
	}


	.record-filter > div:first-child {
		display: grid;
		gap: 4px;
	}


	.record-filter > div:first-child > span {
		color:
			rgba(255,255,255,.42);

		font-size: 11px;
	}


	.filter-buttons {
		display: flex;
		gap: 7px;
		flex-wrap: wrap;
	}


	.filter-buttons button {
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

		letter-spacing: .07em;
		text-transform: uppercase;

		cursor: pointer;
	}


	.filter-buttons button:hover,
	.filter-buttons button.active {
		border-color:
			rgba(214,177,94,.65);

		background:
			rgba(214,177,94,.09);

		color:
			var(--record-gold-bright);
	}



	/* ==================================================
	   SECTIONS
	   ================================================== */

	.record-section {
		display: grid;
		gap: 24px;
	}


	.section-heading {
		padding-bottom: 17px;

		border-bottom:
			1px solid
			var(--record-line);
	}


	.section-heading h2 {
		margin:
			5px 0 6px;

		color:
			var(--record-cream);

		font-size:
			clamp(
				34px,
				4.5vw,
				58px
			);

		line-height: .95;

		text-transform: uppercase;
	}


	.section-heading p {
		margin: 0;

		color:
			rgba(255,255,255,.42);

		font-size: 11px;
	}



	/* ==================================================
	   CAREER BOARD
	   ================================================== */

	.career-table {
		border-top:
			2px solid
			var(--record-gold);
	}


	.career-head,
	.career-row {
		display: grid;

		grid-template-columns:
			52px
			minmax(250px,1fr)
			110px
			90px
			130px
			90px
			100px;

		gap: 12px;

		align-items: center;
	}


	.career-head {
		min-height: 42px;

		padding:
			0 15px;

		border-bottom:
			1px solid
			rgba(255,255,255,.10);

		color:
			rgba(255,255,255,.34);

		font-size: 8px;
		font-weight: 900;

		letter-spacing: .12em;
		text-transform: uppercase;
	}


	.career-row {
		min-height: 77px;

		padding:
			10px 15px;

		border-bottom:
			1px solid
			rgba(255,255,255,.075);
	}


	.career-rank {
		color:
			rgba(214,177,94,.55);

		font-size: 13px;
		font-weight: 900;
	}


	.career-team {
		display: flex;
		align-items: center;

		gap: 12px;

		min-width: 0;
	}


	.career-team img {
		width: 46px;
		height: 46px;

		object-fit: contain;
	}


	.career-team > div {
		display: grid;
		gap: 2px;
	}


	.career-team strong {
		color:
			var(--record-cream);

		font-size: 14px;
	}


	.career-team span {
		color:
			rgba(255,255,255,.38);

		font-size: 10px;
	}


	.career-record strong {
		color:
			var(--record-cream);

		font-size: 14px;
	}


	.career-number {
		color:
			rgba(255,255,255,.66);

		font-size: 12px;
		font-weight: 700;
	}


	.career-number.positive {
		color:
			var(--record-gold-bright);
	}


	.career-number.negative {
		color:
			rgba(255,255,255,.38);
	}



	/* ==================================================
	   RECORD CARDS
	   ================================================== */

	.record-grid {
		display: grid;

		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.09);

		border-left:
			1px solid
			rgba(255,255,255,.09);
	}


	.record-card {
		position: relative;

		display: grid;
		align-content: start;

		min-height: 245px;

		padding:
			22px;

		border-right:
			1px solid
			rgba(255,255,255,.09);

		border-bottom:
			1px solid
			rgba(255,255,255,.09);

		background:
			linear-gradient(
				145deg,
				rgba(255,255,255,.025),
				rgba(255,255,255,.006)
			);

		overflow: hidden;
	}


	.record-card.marquee {
		background:
			linear-gradient(
				145deg,
				rgba(214,177,94,.11),
				rgba(255,255,255,.01)
			);
	}


	.record-index {
		margin-bottom: 25px;
	}


	.record-label {
		color:
			rgba(255,255,255,.38);

		font-size: 9px;
	}


	.record-value {
		margin-top: 3px;

		color:
			var(--record-gold-bright);

		font-size:
			46px;

		line-height: 1;
	}


	.record-card h3 {
		margin:
			20px 0 5px;

		color:
			var(--record-cream);

		font-size: 15px;
	}


	.record-card p {
		margin: 0;

		color:
			rgba(255,255,255,.40);

		font-size: 10px;
		line-height: 1.45;
	}



	/* ==================================================
	   STREAKS
	   ================================================== */

	.streak-board {
		border-top:
			2px solid
			var(--record-gold);
	}


	.streak-row {
		display: grid;

		grid-template-columns:
			minmax(200px,.7fr)
			minmax(250px,1fr)
			130px;

		align-items: center;
		gap: 20px;

		min-height: 95px;

		padding:
			15px 18px;

		border-bottom:
			1px solid
			rgba(255,255,255,.08);
	}


	.streak-label {
		color:
			var(--record-gold);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .12em;
		text-transform: uppercase;
	}


	.streak-row > strong {
		color:
			var(--record-cream);

		font-size: 16px;
	}


	.streak-number {
		display: flex;
		align-items: baseline;
		justify-content:
			flex-end;

		gap: 7px;

		color:
			var(--record-gold-bright);

		font-size: 34px;
		font-weight: 900;
	}


	.streak-number span {
		color:
			rgba(255,255,255,.31);

		font-size: 8px;

		letter-spacing: .10em;
	}



	/* ==================================================
	   EMPTY
	   ================================================== */

	.empty-book {
		padding:
			45px 0;

		border-top:
			1px solid
			var(--record-line);

		border-bottom:
			1px solid
			var(--record-line);
	}


	.empty-book h2 {
		margin:
			7px 0;

		color:
			var(--record-cream);

		font-size: 36px;

		text-transform: uppercase;
	}


	.empty-book p {
		margin: 0;

		color:
			rgba(255,255,255,.42);
	}



	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1100px) {

		.career-head,
		.career-row {
			grid-template-columns:
				42px
				minmax(220px,1fr)
				100px
				80px
				110px;
		}


		.career-head
			:nth-child(n) {
		}


		.career-head span:nth-child(6),
		.career-head span:nth-child(7),
		.career-row
			.career-number:nth-child(6),
		.career-row
			.career-number:nth-child(7) {
			display: none;
		}


		.record-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}

	}


	@media (max-width: 780px) {

		.hero-main {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.hero-stats {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.record-filter {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.career-table {
			overflow-x: auto;
		}


		.career-head,
		.career-row {
			min-width: 700px;
		}


		.streak-row {
			grid-template-columns:
				1fr auto;
		}


		.streak-label {
			grid-column:
				1 / -1;
		}

	}


	@media (max-width: 560px) {

		.record-page {
			gap: 44px;
		}


		.record-hero {
			padding:
				20px 17px 0;
		}


		.hero-topline {
			align-items:
				flex-start;

			gap: 15px;
		}


		.hero-doc {
			text-align: right;
		}


		.hero-stats {
			grid-template-columns:
				1fr;
		}


		.hero-stats > div {
			border-right: 0;
		}


		.record-grid {
			grid-template-columns:
				1fr;
		}


		.streak-row {
			grid-template-columns:
				1fr;
		}


		.streak-number {
			justify-content:
				flex-start;
		}

	}

</style>