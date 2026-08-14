<script>
	export let data;


	const initials = (
		value = ''
	) =>
		String(
			value
		)
			.split(
				/\s+/
			)
			.filter(
				Boolean
			)
			.slice(
				0,
				2
			)
			.map(
				(part) =>
					part[0]
						?.toUpperCase()
			)
			.join('') ||
		'ICL';


	const points = (
		value
	) =>
		Number(
			value ||
			0
		).toFixed(
			2
		);


	const fmtUnix = (
		unix
	) => {
		if (!unix) {
			return 'TBD';
		}

		return new Date(
			Number(
				unix
			) *
				1000
		).toLocaleString(
			'en-US',
			{
				month:
					'short',

				day:
					'numeric',

				hour:
					'numeric',

				minute:
					'2-digit'
			}
		);
	};


	const postTypeLabel = (
		post
	) => {
		if (
			post?.sourceType ===
			'weekly_recap'
		) {
			return `Week ${post.recapWeek} Recap`;
		}

		const labels = {
			feature:
				'Feature',

			commissioner:
				'Commissioner',

			league_news:
				'League News',

			power_rankings:
				'Power Rankings',

			announcement:
				'Announcement',

			opinion:
				'Opinion'
		};

		return (
			labels[
				post?.postType
			] ||
			post?.tag ||
			'Irving Weekly'
		);
	};


	$: who =
		data?.user
			?.displayName ||
		'Member';


	$: topStandings =
		(
			data?.topBoard ||
			data?.standings ||
			[]
		).slice(
			0,
			5
		);


	$: managers =
		data?.managers ||
		[];


	$: posts =
		data?.posts ||
		[];


	$: collective =
		data?.collective ||
		{};


	$: nextEvent =
		collective
			?.nextEvent ||
		null;


	$: latestPosts =
		posts.slice(
			0,
			3
		);
</script>
<svelte:head>
	<title>Irving Champions League</title>

	<meta name="description" content="The home of the Irving Champions League." />
</svelte:head>

<div class="home-page">
	<!-- =================================================
	     HERO
	================================================== -->

	<section class="home-hero">
		<div class="hero-watermark">
			<img src="/badge.png" alt="" aria-hidden="true" />
		</div>

		<div class="hero-content">
			<div class="hero-season">
				<span>ICL</span>
				<strong>2026 CLUBHOUSE</strong>
			</div>

			<div class="eyebrow">Irving Champions League</div>

			<h1>
				Welcome back,
				{who}.
			</h1>

			<p class="hero-lede">
				Fourteen franchises. One increasingly questionable fantasy football league.
			</p>

			<div class="hero-actions">
				<a class="home-button primary" href="/league"> Enter League </a>

				<a class="home-button" href="/league/keepers"> Keeper Calculator </a>
			</div>
		</div>
	</section>

		<!-- =================================================
     THE IRVING WEEKLY
================================================== -->

{#if latestPosts.length}
	<section class="blog-section">
		<div class="section-heading">
			<div>
				<span class="eyebrow">
					From The Irving Weekly
				</span>

				<h2>
					Latest from Irving
				</h2>
			</div>

			<a href="/league/weekly">
				View The Irving Weekly →
			</a>
		</div>

		<div class="blog-grid">
			{#each latestPosts as post}
				<a
					class="blog-card"
					href={`/league/weekly/${post.slug}`}
				>
					<span>
						{postTypeLabel(post)}
					</span>

					<strong>
						{post.title}
					</strong>

					<p>
						{post.subtitle ||
							post.excerpt ||
							'Read the latest from The Irving Weekly.'}
					</p>

					<em>
						Read story →
					</em>
				</a>
			{/each}
		</div>
	</section>
{/if}


	<!-- =================================================
	     QUICK ACCESS
	================================================== -->

	<section class="quick-section">
		<div class="section-heading">
			<div>
				<span class="eyebrow"> League HQ </span>

				<h2>Quick access</h2>
			</div>

			<p>Get where you're going. No pregame show required.</p>
		</div>

		<div class="quick-grid">
			<a class="quick-card" href="/league/standings">
				<span>01</span>

				<strong> Standings </strong>

				<small> Records, points and current league order. </small>

				<em> Open standings → </em>
			</a>

			<a class="quick-card" href="/league/rosters">
				<span>02</span>

				<strong> Rosters </strong>

				<small> Every franchise. Every player. </small>

				<em> View rosters → </em>
			</a>

			<a class="quick-card" href="/league/drafts">
				<span>03</span>

				<strong> Drafts </strong>

				<small> Auction results, prices and history. </small>

				<em> Open draft room → </em>
			</a>

			<a class="quick-card" href="/league/keepers">
				<span>04</span>

				<strong> Keeper Desk </strong>

				<small> Prices, tenure and eligibility. </small>

				<em> Run the numbers → </em>
			</a>
		</div>
	</section>

	<!-- =================================================
	     LEAGUE PULSE
	================================================== -->

	<section class="pulse-grid">
		<!-- STANDINGS -->

		<article class="home-panel standings-panel">
	<header class="panel-head">
		<div>
			<span class="eyebrow">
				League table
			</span>

			<h2>
				Top of the board
			</h2>
		</div>

		<a href={`/league/standings?season=${data.season}`}>
			Full standings →
		</a>
	</header>

	{#if topStandings.length}

		<div class="standings-list">

			{#each topStandings as row}

				<a
					class="standing-row"
					href={
						row.slug
							? `/league/teams/${row.slug}?season=${data.season}`
							: `/league/standings?season=${data.season}`
					}
				>

					<div class="standing-rank">
						#{row.rank}
					</div>


					<div class="standing-team">

						{#if row.teamPhoto}

							<img
								src={row.teamPhoto}
								alt={row.teamName}
								loading="lazy"
							/>

						{:else}

							<div class="team-fallback">
								{row.initials || initials(row.teamName)}
							</div>

						{/if}


						<div>
							<strong>
								{row.teamName}
							</strong>

							<small>
								{row.managerName}
							</small>
						</div>

					</div>


					<div class="standing-record">

						<strong>
							{row.recordLabel || `${row.wins}-${row.losses}`}
						</strong>

						<small>
							{points(row.points)} PF
						</small>

					</div>

				</a>

			{/each}

		</div>

	{:else}

		<div class="empty-state">
			Standings will appear once league data is available.
		</div>

	{/if}
</article>

		<!-- NEXT EVENT -->

		<article class="home-panel next-panel">
			<header class="panel-head">
				<div>
					<span class="eyebrow"> Next up </span>

					<h2>Offseason action</h2>
				</div>
			</header>

			{#if nextEvent}
				<div class="next-event">
					<div class="next-event-art">
						{#if nextEvent.logo}
							<img src={nextEvent.logo} alt="" loading="lazy" />
						{:else}
							<img src="/badge.png" alt="" />
						{/if}
					</div>

					<div class="next-event-copy">
						<span> Upcoming </span>

						<strong>
							{nextEvent.title}
						</strong>

						<p>
							{nextEvent.subtitle}
						</p>

						<small>
							{fmtUnix(nextEvent.start_at || nextEvent.lock_at)}
						</small>

						<a class="home-button primary small" href={`/games/${nextEvent.slug}`}>
							Make Your Pick
						</a>
					</div>
				</div>
			{:else}
				<div class="quiet-state">
					<img src="/badge.png" alt="" />

					<strong> No event queued. </strong>

					<p>The offseason lounge is quiet. Suspiciously quiet.</p>

					<a href="/games"> Visit the games floor → </a>
				</div>
			{/if}
		</article>
	</section>


	<!-- =================================================
	     FRANCHISE STRIP
	================================================== -->

	{#if managers.length}
		<section class="franchise-section">
			<div class="section-heading compact">
				<div>
					<span class="eyebrow"> The league </span>

					<h2>14 franchises</h2>
				</div>

				<a href="/league/teams"> View all teams → </a>
			</div>

			<div class="franchise-strip">
				{#each managers as manager}
					<a
						class="franchise-token"
						href={`/league/teams/${manager.slug}`}
						title={manager.teamName}
					>
						<img src={manager.photo} alt={manager.teamName} loading="lazy" />

						<span>
							{manager.teamName}
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	/* ==================================================
	   PAGE
	================================================== */

	.home-page {
		display: grid;

		gap: 34px;

		padding-top: 6px;
		padding-bottom: 64px;
	}

	/* ==================================================
	   HERO
	================================================== */

	.home-hero {
		position: relative;

		min-height: 370px;

		display: flex;
		align-items: center;

		overflow: hidden;

		border: 2px solid #050708;

		border-radius: 16px;

		background: linear-gradient(90deg, rgba(17, 133, 200, 0.14), transparent 44%), #111619;

		box-shadow: var(--shadow-panel);
	}

	.home-hero::before {
		content: '';

		position: absolute;
		inset: 0;

		pointer-events: none;

		background: linear-gradient(90deg, rgba(199, 25, 47, 0.13), transparent 24%);
	}

	.hero-content {
		position: relative;

		z-index: 2;

		width: min(760px, 72%);

		padding: clamp(32px, 5vw, 64px);
	}

	.hero-season {
		display: inline-flex;

		align-items: stretch;

		margin-bottom: 18px;

		border: 1px solid #040505;

		border-radius: 5px;

		overflow: hidden;

		font-family: var(--font-score);

		font-size: 0.7rem;

		text-transform: uppercase;

		letter-spacing: 0.1em;
	}

	.hero-season span {
		padding: 7px 9px;

		background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));

		color: white;
	}

	.hero-season strong {
		padding: 7px 11px;

		background: #080a0c;

		color: var(--bug-yellow);
	}

	.hero-content h1 {
		max-width: 12ch;

		margin: 5px 0 12px;

		font-family: var(--font-display);

		font-size: clamp(3.1rem, 6.4vw, 6rem);

		line-height: 0.89;

		letter-spacing: -0.055em;
	}

	.hero-lede {
		max-width: 48ch;

		margin: 0;

		color: rgba(255, 255, 255, 0.75);

		font-size: 1rem;

		font-weight: 700;

		line-height: 1.55;
	}

	.hero-actions {
		display: flex;

		flex-wrap: wrap;

		gap: 10px;

		margin-top: 26px;
	}

	.hero-watermark {
		position: absolute;

		right: 4%;
		top: 50%;

		width: min(330px, 29vw);

		transform: translateY(-50%);

		opacity: 0.1;

		filter: grayscale(0.15);

		pointer-events: none;
	}

	.hero-watermark img {
		width: 100%;
		display: block;
	}

	/* ==================================================
	   BUTTONS
	================================================== */

	.home-button {
		display: inline-flex;

		align-items: center;
		justify-content: center;

		min-height: 40px;

		padding: 9px 14px;

		border: 1px solid #050606;

		border-radius: 5px;

		background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);

		color: #101111;

		font-family: var(--font-score);

		font-size: 0.76rem;

		font-weight: 950;

		text-transform: uppercase;

		text-decoration: none;

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.75),
			inset 0 -2px 0 rgba(0, 0, 0, 0.3);
	}

	.home-button:hover {
		color: #111;
	}

	.home-button.primary {
		background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));

		color: white;
	}

	.home-button.primary:hover {
		color: white;

		filter: brightness(1.08);
	}

	.home-button.small {
		width: fit-content;

		margin-top: 12px;
	}

	/* ==================================================
	   SECTION HEADINGS
	================================================== */

	.section-heading,
	.panel-head {
		display: flex;

		align-items: flex-end;
		justify-content: space-between;

		gap: 18px;
	}

	.section-heading {
		margin-bottom: 16px;
	}

	.section-heading h2,
	.panel-head h2 {
		margin: 4px 0 0;

		font-size: clamp(1.45rem, 2.3vw, 2rem);
	}

	.section-heading > p {
		max-width: 34ch;

		margin: 0;

		color: var(--muted);

		text-align: right;

		line-height: 1.45;
	}

	.section-heading > a,
	.panel-head > a {
		color: var(--icl-blue);

		font-size: 0.8rem;

		font-weight: 900;

		text-decoration: none;
	}

	.section-heading > a:hover,
	.panel-head > a:hover {
		color: white;
	}

	/* ==================================================
	   QUICK ACCESS
	================================================== */

	.quick-grid {
		display: grid;

		grid-template-columns: repeat(4, minmax(0, 1fr));

		gap: 12px;
	}

	.quick-card {
		min-height: 165px;

		display: grid;

		grid-template-rows: auto auto 1fr auto;

		gap: 7px;

		padding: 17px;

		border: 1px solid #050708;

		border-radius: 10px;

		background: #151a1d;

		color: inherit;

		text-decoration: none;

		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);

		transition:
			transform 140ms ease,
			border-color 140ms ease,
			background 140ms ease;
	}

	.quick-card:hover {
		transform: translateY(-2px);

		border-color: var(--icl-blue);

		background: #192127;
	}

	.quick-card > span {
		color: var(--bug-yellow);

		font-family: var(--font-score);

		font-size: 0.66rem;
	}

	.quick-card > strong {
		font-family: var(--font-score);

		font-size: 1.2rem;

		text-transform: uppercase;
	}

	.quick-card > small {
		color: var(--muted);

		line-height: 1.4;
	}

	.quick-card > em {
		color: var(--icl-blue);

		font-size: 0.72rem;

		font-style: normal;

		font-weight: 900;

		text-transform: uppercase;
	}

	/* ==================================================
	   LEAGUE PULSE
	================================================== */

	.pulse-grid {
		display: grid;

		grid-template-columns:
			minmax(0, 1.35fr)
			minmax(300px, 0.65fr);

		gap: 16px;
	}

	.home-panel {
		border: 2px solid #050708;

		border-radius: 13px;

		background: #111617;

		box-shadow: var(--shadow-panel);

		overflow: hidden;
	}

	.home-panel .panel-head {
		padding: 17px 18px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		background: #181e1e;
	}

	/* ==================================================
	   STANDINGS
	================================================== */

	.standings-list {
		display: grid;
	}

	.standing-row {
		display: grid;

		grid-template-columns:
			56px
			minmax(0, 1fr)
			auto;

		align-items: center;

		gap: 12px;

		min-height: 70px;

		padding: 8px 15px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.07);

		color: inherit;

		text-decoration: none;

		transition: background 120ms ease;
	}

	.standing-row:last-child {
		border-bottom: 0;
	}

	.standing-row:hover {
		background: rgba(17, 133, 200, 0.08);
	}

	.standing-rank {
		display: grid;

		place-items: center;

		width: 42px;
		height: 34px;

		border: 1px solid #050606;

		border-radius: 5px;

		background: linear-gradient(180deg, #f5f4ea, #aeb2ac);

		color: #111;

		font-family: var(--font-score);

		font-size: 0.74rem;
	}

	.standing-team {
		min-width: 0;

		display: flex;

		align-items: center;

		gap: 11px;
	}

	.standing-team img,
	.team-fallback {
		width: 46px;
		height: 46px;

		flex: 0 0 auto;

		border-radius: 8px;

		object-fit: cover;

		border: 1px solid #050606;
	}

	.team-fallback {
		display: grid;

		place-items: center;

		background: var(--bug-silver);

		color: #111;

		font-family: var(--font-score);
	}

	.standing-team > div:last-child {
		min-width: 0;

		display: grid;

		gap: 2px;
	}

	.standing-team strong {
		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	.standing-team small {
		color: var(--muted);
	}

	.standing-record {
		text-align: right;
	}

	.standing-record strong {
		display: block;

		color: var(--bug-yellow);

		font-family: var(--font-score);

		font-size: 1rem;
	}

	.standing-record small {
		color: var(--muted);
	}

	/* ==================================================
	   NEXT EVENT
	================================================== */

	.next-panel {
		min-height: 100%;
	}

	.next-event {
		display: grid;

		grid-template-columns:
			130px
			1fr;

		align-items: center;

		gap: 18px;

		padding: 22px;
	}

	.next-event-art {
		display: grid;

		place-items: center;

		aspect-ratio: 1;

		padding: 14px;

		border: 1px solid rgba(255, 255, 255, 0.08);

		border-radius: 12px;

		background: #090d10;
	}

	.next-event-art img {
		width: 100%;
		height: 100%;

		object-fit: contain;
	}

	.next-event-copy {
		display: grid;

		gap: 5px;
	}

	.next-event-copy > span {
		color: var(--bug-yellow);

		font-family: var(--font-score);

		font-size: 0.62rem;

		text-transform: uppercase;

		letter-spacing: 0.12em;
	}

	.next-event-copy > strong {
		font-family: var(--font-score);

		font-size: 1.25rem;
	}

	.next-event-copy p {
		margin: 0;

		color: var(--muted);

		line-height: 1.4;
	}

	.next-event-copy small {
		color: var(--icl-blue);

		font-weight: 900;
	}

	.quiet-state {
		min-height: 270px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 7px;

		padding: 28px;

		text-align: center;
	}

	.quiet-state img {
		width: 78px;

		margin-bottom: 7px;

		opacity: 0.7;
	}

	.quiet-state p {
		max-width: 28ch;

		margin: 0;

		color: var(--muted);
	}

	.quiet-state a {
		margin-top: 7px;

		font-weight: 900;

		text-decoration: none;
	}

	/* ==================================================
	   BLOG
	================================================== */

	.blog-grid {
		display: grid;

		grid-template-columns: repeat(3, minmax(0, 1fr));

		gap: 12px;
	}

	.blog-card {
		min-height: 190px;

		display: grid;

		grid-template-rows: auto auto 1fr auto;

		gap: 9px;

		padding: 18px;

		border: 1px solid #050708;

		border-radius: 10px;

		background: #13181b;

		color: inherit;

		text-decoration: none;

		transition:
			border-color 140ms ease,
			transform 140ms ease;
	}

	.blog-card:hover {
		transform: translateY(-2px);

		border-color: var(--icl-blue);
	}

	.blog-card > span {
		color: var(--bug-yellow);

		font-family: var(--font-score);

		font-size: 0.62rem;

		text-transform: uppercase;

		letter-spacing: 0.11em;
	}

	.blog-card > strong {
		font-size: 1.05rem;
	}

	.blog-card p {
		margin: 0;

		color: var(--muted);

		line-height: 1.45;
	}

	.blog-card em {
		color: var(--icl-blue);

		font-size: 0.72rem;

		font-style: normal;

		font-weight: 900;

		text-transform: uppercase;
	}

	/* ==================================================
	   FRANCHISE STRIP
	================================================== */

	.franchise-section {
		padding-top: 4px;
	}

	.section-heading.compact {
		margin-bottom: 12px;
	}

	.franchise-strip {
		display: grid;

		grid-template-columns: repeat(14, minmax(58px, 1fr));

		gap: 7px;

		overflow-x: auto;

		padding-bottom: 6px;
	}

	.franchise-token {
		min-width: 66px;

		display: grid;

		justify-items: center;

		gap: 6px;

		padding: 8px 4px;

		border: 1px solid transparent;

		border-radius: 8px;

		color: inherit;

		text-align: center;

		text-decoration: none;
	}

	.franchise-token:hover {
		border-color: rgba(17, 133, 200, 0.45);

		background: rgba(17, 133, 200, 0.06);
	}

	.franchise-token img {
		width: 48px;
		height: 48px;

		object-fit: cover;

		border: 1px solid #050606;

		border-radius: 50%;
	}

	.franchise-token span {
		max-width: 88px;

		overflow: hidden;

		color: var(--muted);

		font-size: 0.61rem;

		text-overflow: ellipsis;

		white-space: nowrap;
	}

	/* ==================================================
	   EMPTY
	================================================== */

	.empty-state {
		padding: 28px;

		color: var(--muted);
	}

	/* ==================================================
	   RESPONSIVE
	================================================== */

	@media (max-width: 1050px) {
		.quick-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.pulse-grid {
			grid-template-columns: 1fr;
		}

		.blog-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 700px) {
		.home-page {
			gap: 26px;
		}

		.home-hero {
			min-height: 390px;
		}

		.hero-content {
			width: 100%;

			padding: 28px 22px;
		}

		.hero-watermark {
			right: -40px;

			width: 260px;

			opacity: 0.055;
		}

		.hero-content h1 {
			font-size: clamp(3rem, 15vw, 4.8rem);
		}

		.section-heading {
			align-items: flex-start;

			flex-direction: column;
		}

		.section-heading > p {
			text-align: left;
		}

		.quick-grid,
		.blog-grid {
			grid-template-columns: 1fr;
		}

		.quick-card {
			min-height: 140px;
		}

		.next-event {
			grid-template-columns: 95px 1fr;

			padding: 16px;
		}

		.standing-row {
			grid-template-columns:
				48px
				minmax(0, 1fr);
		}

		.standing-record {
			grid-column: 2;

			text-align: left;
		}
	}
</style>
