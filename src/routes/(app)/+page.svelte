<script>
	export let data;


	const initials = (value = '') =>
		String(value)
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') ||
		'ICL';


	const points = (value) =>
		Number(value || 0).toFixed(2);


	const fmtUnix = (unix) => {
		if (!unix) return 'TBD';

		return new Date(
			Number(unix) * 1000
		).toLocaleString(
			'en-US',
			{
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			}
		);
	};


	const postTypeLabel = (post) => {
		if (
			post?.sourceType ===
			'weekly_recap'
		) {
			return `Week ${post.recapWeek} Recap`;
		}

		const labels = {
			feature: 'Feature',
			commissioner: 'Commissioner',
			league_news: 'League News',
			power_rankings: 'Power Rankings',
			announcement: 'Announcement',
			opinion: 'Opinion'
		};

		return (
			labels[post?.postType] ||
			post?.tag ||
			'Irving Weekly'
		);
	};


	$: who =
		data?.user?.displayName ||
		'Member';


	$: season =
		Number(
			data?.season ||
			new Date().getFullYear()
		);


	$: topStandings =
		(
			data?.topBoard ||
			data?.standings ||
			[]
		).slice(0, 5);


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
		collective?.nextEvent ||
		null;


	$: latestPosts =
		posts.slice(0, 3);
</script>


<svelte:head>
	<title>
		Irving Collective
	</title>

	<meta
		name="description"
		content="The clubhouse for the Irving Collective."
	/>
</svelte:head>


<div class="home-page">

	<!-- ==================================================
	     HERO
	     ================================================== -->

	<section class="clubhouse-hero">

		<div class="hero-copy">

			<div class="hero-kicker">
				<span class="hero-monogram">
					ICL
				</span>

				<span>
					Irving Collective
				</span>

				<small>
					Est. 2003
				</small>
			</div>


			<div class="eyebrow">
				2026 Clubhouse
			</div>


			<h1>
				Welcome back,
				<span>{who}.</span>
			</h1>


			<p class="hero-lede">
				Fourteen franchises.
				One increasingly questionable
				fantasy football institution.
			</p>


			<div class="hero-actions">

				<a
					class="button button-primary"
					href="/league"
				>
					Enter League
				</a>

				<a
					class="button"
					href={`/league/keepers?season=${season}`}
				>
					Keeper Calculator
				</a>

			</div>

		</div>


		<div
			class="hero-brand"
			aria-hidden="true"
		>
			<div class="brand-frame">
				<div class="brand-mark">
					ICL
				</div>

				<strong>
					Irving
				</strong>

				<span>
					Collective
				</span>

				<small>
					Est. 2003
				</small>
			</div>
		</div>


		<div
			class="hero-wordmark"
			aria-hidden="true"
		>
			IRVING
		</div>

	</section>


	<!-- ==================================================
	     THE IRVING WEEKLY
	     ================================================== -->

	{#if latestPosts.length}

		<section class="weekly-section">

			<header class="section-heading">

				<div>
					<div class="eyebrow">
						From The Irving Weekly
					</div>

					<h2>
						Latest from Irving
					</h2>
				</div>


				<a href="/league/weekly">
					View The Irving Weekly →
				</a>

			</header>


			<div
				class:single={latestPosts.length === 1}
				class="weekly-grid"
			>

				{#each latestPosts as post, index}

					<a
						class:lead={index === 0}
						class="story-card"
						href={`/league/weekly/${post.slug}`}
					>

						<div class="story-meta">

							<span>
								{postTypeLabel(post)}
							</span>

							{#if index === 0}
								<em>
									Latest
								</em>
							{/if}

						</div>


						<strong>
							{post.title}
						</strong>


						<p>
							{post.subtitle ||
								post.excerpt ||
								'Read the latest from The Irving Weekly.'}
						</p>


						<span class="story-link">
							Read story →
						</span>

					</a>

				{/each}

			</div>

		</section>

	{/if}


	<!-- ==================================================
	     QUICK ACCESS
	     ================================================== -->

	<section class="quick-section">

		<header class="section-heading">

			<div>
				<div class="eyebrow">
					League HQ
				</div>

				<h2>
					Quick Access
				</h2>
			</div>


			<p>
				The four doors most likely
				to ruin your afternoon.
			</p>

		</header>


		<div class="quick-grid">

			<a
				class="quick-card"
				href={`/league/standings?season=${season}`}
			>
				<span class="quick-number">
					01
				</span>

				<div>
					<strong>
						Standings
					</strong>

					<small>
						Records, points and
						current league order.
					</small>
				</div>

				<em>
					Open standings →
				</em>
			</a>


			<a
				class="quick-card"
				href={`/league/rosters?season=${season}`}
			>
				<span class="quick-number">
					02
				</span>

				<div>
					<strong>
						Rosters
					</strong>

					<small>
						Every franchise.
						Every player.
					</small>
				</div>

				<em>
					View rosters →
				</em>
			</a>


			<a
				class="quick-card"
				href={`/league/drafts?season=${season}`}
			>
				<span class="quick-number">
					03
				</span>

				<div>
					<strong>
						Draft Room
					</strong>

					<small>
						Auction results,
						prices and history.
					</small>
				</div>

				<em>
					Open draft room →
				</em>
			</a>


			<a
				class="quick-card"
				href={`/league/keepers?season=${season}`}
			>
				<span class="quick-number">
					04
				</span>

				<div>
					<strong>
						Keeper Desk
					</strong>

					<small>
						Prices, tenure
						and eligibility.
					</small>
				</div>

				<em>
					Run the numbers →
				</em>
			</a>

		</div>

	</section>


	<!-- ==================================================
	     LEAGUE PULSE
	     ================================================== -->

	<section class="pulse-grid">

		<!-- STANDINGS -->

		<article class="home-panel">

			<header class="panel-head">

				<div>
					<div class="eyebrow">
						League Table
					</div>

					<h2>
						Top of the Board
					</h2>
				</div>


				<a
					href={`/league/standings?season=${season}`}
				>
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
									? `/league/teams/${row.slug}?season=${season}`
									: `/league/standings?season=${season}`
							}
						>

							<div class="standing-rank">
								#{row.rank}
							</div>


							<div class="standing-logo">

								{#if row.teamPhoto}

									<img
										src={row.teamPhoto}
										alt={row.teamName}
										loading="lazy"
									/>

								{:else}

									<span>
										{row.initials ||
											initials(
												row.teamName
											)}
									</span>

								{/if}

							</div>


							<div class="standing-copy">

								<strong>
									{row.teamName}
								</strong>

								<small>
									{row.managerName}
								</small>

							</div>


							<div class="standing-record">

								<strong>
									{row.recordLabel ||
										`${row.wins}-${row.losses}`}
								</strong>

								<small>
									{points(
										row.points
									)} PF
								</small>

							</div>

						</a>

					{/each}

				</div>

			{:else}

				<div class="empty-state">
					Standings will appear once
					league data is available.
				</div>

			{/if}

		</article>


		<!-- NEXT EVENT -->

		<article class="home-panel next-panel">

			<header class="panel-head">

				<div>
					<div class="eyebrow">
						Next Up
					</div>

					<h2>
						Offseason Action
					</h2>
				</div>

				<a href="/games">
					Games floor →
				</a>

			</header>


			{#if nextEvent}

				<div class="next-event">

					<div class="next-event-art">

						{#if nextEvent.logo}

							<img
								src={nextEvent.logo}
								alt=""
								loading="lazy"
							/>

						{:else}

							<div class="event-fallback">
								ICL
							</div>

						{/if}

					</div>


					<div class="next-event-copy">

						<span>
							Upcoming
						</span>

						<strong>
							{nextEvent.title}
						</strong>

						<p>
							{nextEvent.subtitle}
						</p>

						<small>
							{fmtUnix(
								nextEvent.start_at ||
								nextEvent.lock_at
							)}
						</small>

						<a
							class="button button-primary small"
							href={`/games/${nextEvent.slug}`}
						>
							Make Your Pick
						</a>

					</div>

				</div>

			{:else}

				<div class="quiet-state">

					<div class="quiet-mark">
						ICL
					</div>

					<strong>
						No event queued.
					</strong>

					<p>
						The offseason lounge is quiet.
						Suspiciously quiet.
					</p>

					<a href="/games">
						Visit the games floor →
					</a>

				</div>

			{/if}

		</article>

	</section>


	<!-- ==================================================
	     FRANCHISES
	     ================================================== -->

	{#if managers.length}

		<section class="franchise-section">

			<header class="section-heading compact">

				<div>
					<div class="eyebrow">
						The League
					</div>

					<h2>
						14 Franchises
					</h2>
				</div>


				<a
					href={`/league/teams?season=${season}`}
				>
					View all teams →
				</a>

			</header>


			<div class="franchise-grid">

				{#each managers as manager}

					<a
						class="franchise-token"
						href={`/league/teams/${manager.slug}?season=${season}`}
						title={manager.teamName}
					>

						<div class="franchise-logo">
							<img
								src={manager.photo}
								alt={manager.teamName}
								loading="lazy"
							/>
						</div>

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
	   IRVING COLLECTIVE — CLUBHOUSE
	   ================================================== */

	.home-page {
		width: 100%;
		max-width: 1500px;

		display: grid;
		gap: 38px;

		margin: 0 auto;

		padding:
			6px 0
			64px;
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


	/* ==================================================
	   HERO
	   ================================================== */

	.clubhouse-hero {
		position: relative;

		min-height: 430px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			340px;

		align-items: center;

		gap: 50px;

		overflow: hidden;

		padding:
			clamp(
				34px,
				5vw,
				64px
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
					.055
				),
				transparent 36%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.clubhouse-hero::before {
		content: '';

		position: absolute;
		inset: 0;

		pointer-events: none;

		background:
			radial-gradient(
				circle at 0% 0%,
				rgba(
					96,
					110,
					121,
					.09
				),
				transparent 36%
			);
	}


	.hero-copy,
	.hero-brand {
		position: relative;
		z-index: 2;
	}


	.hero-copy {
		max-width: 760px;
	}


	.hero-kicker {
		width: fit-content;

		display: flex;
		align-items: center;

		gap: 9px;

		margin-bottom: 27px;

		color:
			var(--brand-ivory);

		font-size:
			.64rem;

		font-weight:
			800;

		letter-spacing:
			.09em;

		text-transform:
			uppercase;
	}


	.hero-kicker small {
		padding-left: 9px;

		border-left:
			1px solid
			var(--border-strong);

		color:
			var(--brand-gold);

		font-size:
			.52rem;

		letter-spacing:
			.15em;
	}


	.hero-monogram {
		display: grid;
		place-items: center;

		width: 34px;
		height: 34px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1rem;
	}


	.hero-copy h1 {
		max-width: 10ch;

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
				8rem
			);

		font-weight: 400;

		line-height:
			.82;

		letter-spacing:
			-.02em;

		text-transform:
			uppercase;

		text-shadow:
			none;
	}


	.hero-copy h1 span {
		color:
			var(--brand-sand);
	}


	.hero-lede {
		max-width: 50ch;

		margin:
			24px 0 0;

		color:
			var(--muted);

		font-size:
			1rem;

		font-weight:
			650;

		line-height:
			1.55;
	}


	.hero-actions {
		display: flex;
		flex-wrap: wrap;

		gap: 8px;

		margin-top:
			28px;
	}


	/* ==================================================
	   HERO BRAND MARK
	   ================================================== */

	.hero-brand {
		display: grid;
		place-items: center;
	}


	.brand-frame {
		width:
			min(
				280px,
				100%
			);

		aspect-ratio:
			.9;

		display: grid;
		place-items: center;
		align-content: center;

		gap: 4px;

		padding: 28px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.28
			);

		color:
			var(--brand-gold);

		text-align: center;

		background:
			rgba(
				8,
				11,
				10,
				.36
			);
	}


	.brand-mark {
		display: grid;
		place-items: center;

		width: 86px;
		height: 86px;

		margin-bottom: 18px;

		border:
			1px solid
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			2.5rem;
	}


	.brand-frame strong,
	.brand-frame > span {
		font-family:
			var(--font-display);

		font-weight: 400;

		line-height:
			.85;

		text-transform:
			uppercase;
	}


	.brand-frame strong {
		color:
			var(--brand-sand);

		font-size:
			3rem;
	}


	.brand-frame > span {
		font-size:
			2rem;
	}


	.brand-frame small {
		margin-top: 15px;

		color:
			var(--brand-stone);

		font-size:
			.56rem;

		font-weight:
			750;

		letter-spacing:
			.19em;

		text-transform:
			uppercase;
	}


	.hero-wordmark {
		position: absolute;

		right: -25px;
		bottom: -52px;

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
				10rem,
				17vw,
				17rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   BUTTONS
	   ================================================== */

	.button {
		min-height: 38px;

		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding:
			8px 13px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			3px;

		background:
			transparent;

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size:
			.65rem;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-decoration:
			none;

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


	.button:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	.button-primary {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.button-primary:hover {
		background:
			var(--brand-sand);

		color:
			var(--brand-charcoal);
	}


	.button.small {
		width: fit-content;

		min-height: 34px;

		margin-top: 10px;

		padding:
			7px 10px;
	}


	/* ==================================================
	   SECTION HEADINGS
	   ================================================== */

	.section-heading,
	.panel-head {
		display: flex;

		align-items: flex-end;

		justify-content:
			space-between;

		gap: 18px;
	}


	.section-heading {
		margin-bottom: 16px;
	}


	.section-heading h2,
	.panel-head h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				1.8rem,
				3vw,
				2.5rem
			);

		font-weight:
			400;

		line-height:
			.95;
	}


	.section-heading > p {
		max-width: 36ch;

		margin: 0;

		color:
			var(--muted);

		font-size:
			.8rem;

		text-align: right;

		line-height:
			1.45;
	}


	.section-heading > a,
	.panel-head > a {
		color:
			var(--brand-sand);

		font-size:
			.69rem;

		font-weight:
			800;

		text-decoration:
			none;
	}


	.section-heading > a:hover,
	.panel-head > a:hover {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   IRVING WEEKLY
	   ================================================== */

	.weekly-grid {
		display: grid;

		grid-template-columns:
			minmax(0,1.55fr)
			repeat(
				2,
				minmax(0,.72fr)
			);

		gap: 12px;
	}


	.weekly-grid.single {
		grid-template-columns:
			minmax(
				0,
				1fr
			);
	}


	.story-card {
		position: relative;

		min-height: 210px;

		display: grid;

		grid-template-rows:
			auto
			auto
			1fr
			auto;

		gap: 10px;

		padding: 19px;

		overflow: hidden;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			linear-gradient(
				180deg,
				rgba(
					255,
					255,
					255,
					.018
				),
				transparent
			),
			var(--panel);

		color: inherit;

		text-decoration:
			none;

		transition:
			transform
			120ms ease,
			border-color
			120ms ease;
	}


	.story-card:hover {
		transform:
			translateY(-2px);

		border-color:
			rgba(
				191,
				161,
				106,
				.45
			);
	}


	.story-card.lead {
		min-height:
			240px;

		padding:
			24px;

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.045
				),
				transparent 60%
			),
			var(--panel);
	}


	.story-card.lead::after {
		content:
			'WEEKLY';

		position:
			absolute;

		right:
			-14px;

		bottom:
			-18px;

		color:
			rgba(
				191,
					161,
					106,
					.024
				);

		font-family:
			var(--font-display);

		font-size:
			5.5rem;

		pointer-events:
			none;
	}


	.story-meta {
		position: relative;
		z-index: 1;

		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 10px;
	}


	.story-meta span {
		color:
			var(--brand-gold);

		font-size:
			.57rem;

		font-weight:
			800;

		letter-spacing:
			.12em;

		text-transform:
			uppercase;
	}


	.story-meta em {
		padding:
			3px 6px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.32
			);

		color:
			var(--brand-stone);

		font-size:
			.49rem;

		font-style:
			normal;

		font-weight:
			800;

		letter-spacing:
			.1em;

		text-transform:
			uppercase;
	}


	.story-card > strong {
		position: relative;
		z-index: 1;

		color:
			var(--brand-ivory);

		font-size:
			1.05rem;

		line-height:
			1.2;
	}


	.story-card.lead > strong {
		max-width: 22ch;

		font-family:
			var(--font-display);

		font-size:
			clamp(
				1.8rem,
				3vw,
				2.7rem
			);

		font-weight: 400;

		line-height:
			.95;
	}


	.story-card p {
		position: relative;
		z-index: 1;

		max-width: 62ch;

		margin: 0;

		color:
			var(--muted);

		line-height:
			1.5;
	}


	.story-link {
		position: relative;
		z-index: 1;

		color:
			var(--brand-gold);

		font-size:
			.61rem;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;
	}


	/* ==================================================
	   QUICK ACCESS
	   ================================================== */

	.quick-grid {
		display: grid;

		grid-template-columns:
			repeat(
				4,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.quick-card {
		position: relative;

		min-height: 160px;

		display: grid;

		grid-template-rows:
			auto
			1fr
			auto;

		gap: 14px;

		padding:
			16px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			var(--panel);

		color: inherit;

		text-decoration:
			none;

		transition:
			transform
			120ms ease,
			border-color
			120ms ease,
			background
			120ms ease;
	}


	.quick-card:hover {
		transform:
			translateY(-2px);

		border-color:
			var(--brand-gold);

		background:
			var(--panel-strong);
	}


	.quick-number {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.15rem;
	}


	.quick-card div {
		display: grid;
		align-content: start;
		gap: 6px;
	}


	.quick-card strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.55rem;

		font-weight: 400;
	}


	.quick-card small {
		max-width: 30ch;

		color:
			var(--muted);

		line-height:
			1.4;
	}


	.quick-card em {
		color:
			var(--brand-sand);

		font-size:
			.59rem;

		font-style:
			normal;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;
	}


	.quick-card:hover em {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   LEAGUE PULSE
	   ================================================== */

	.pulse-grid {
		display: grid;

		grid-template-columns:
			minmax(0,1.3fr)
			minmax(330px,.7fr);

		gap: 16px;
	}


	.home-panel {
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


	.panel-head {
		padding:
			18px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
			);
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
			38px
			46px
			minmax(0,1fr)
			auto;

		align-items: center;

		gap: 11px;

		min-height: 70px;

		padding:
			9px 15px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.09
			);

		color: inherit;

		text-decoration:
			none;

		transition:
			background
			120ms ease;
	}


	.standing-row:last-child {
		border-bottom: 0;
	}


	.standing-row:hover {
		background:
			rgba(
				191,
				161,
				106,
				.025
			);
	}


	.standing-rank {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.12rem;

		text-align:
			center;
	}


	.standing-logo {
		width: 46px;
		height: 46px;

		display: grid;
		place-items: center;

		overflow: hidden;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.18
			);

		border-radius:
			4px;

		background:
			var(--brand-ivory);
	}


	.standing-logo img {
		width: 100%;
		height: 100%;

		object-fit: cover;
	}


	.standing-logo span {
		color:
			var(--brand-charcoal);

		font-size:
			.57rem;

		font-weight:
			900;
	}


	.standing-copy {
		min-width: 0;

		display: grid;

		gap: 3px;
	}


	.standing-copy strong {
		overflow: hidden;

		color:
			var(--brand-ivory);

		font-size:
			.8rem;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	.standing-copy small {
		color:
			var(--muted);

		font-size:
			.67rem;
	}


	.standing-record {
		text-align: right;
	}


	.standing-record strong {
		display: block;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.2rem;

		font-weight: 400;

		font-variant-numeric:
			tabular-nums;
	}


	.standing-record small {
		display: block;

		margin-top: 2px;

		color:
			var(--brand-stone);

		font-size:
			.61rem;
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
			120px
			minmax(0,1fr);

		align-items: center;

		gap: 19px;

		padding:
			23px;
	}


	.next-event-art {
		aspect-ratio: 1;

		display: grid;
		place-items: center;

		overflow: hidden;

		padding: 12px;

		border:
			1px solid
			var(--border);

		background:
			rgba(
				8,
				11,
				10,
				.7
			);
	}


	.next-event-art img {
		width: 100%;
		height: 100%;

		object-fit: contain;
	}


	.event-fallback,
	.quiet-mark {
		display: grid;
		place-items: center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);
	}


	.event-fallback {
		width: 68px;
		height: 68px;

		font-size:
			1.6rem;
	}


	.next-event-copy {
		min-width: 0;

		display: grid;
		gap: 6px;
	}


	.next-event-copy > span {
		color:
			var(--brand-gold);

		font-size:
			.56rem;

		font-weight:
			800;

		letter-spacing:
			.12em;

		text-transform:
			uppercase;
	}


	.next-event-copy > strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.65rem;

		font-weight: 400;

		line-height: 1;
	}


	.next-event-copy p {
		margin: 0;

		color:
			var(--muted);

		line-height:
			1.45;
	}


	.next-event-copy small {
		color:
			var(--brand-sand);

		font-size:
			.65rem;

		font-weight:
			750;
	}


	.quiet-state {
		min-height: 265px;

		display: grid;
		place-items: center;
		align-content: center;

		gap: 9px;

		padding: 28px;

		text-align: center;
	}


	.quiet-mark {
		width: 70px;
		height: 70px;

		margin-bottom: 8px;

		font-size:
			1.6rem;
	}


	.quiet-state strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.45rem;

		font-weight: 400;
	}


	.quiet-state p {
		max-width: 30ch;

		margin: 0;

		color:
			var(--muted);
	}


	.quiet-state a {
		margin-top: 4px;

		color:
			var(--brand-gold);

		font-size:
			.67rem;

		font-weight:
			800;

		text-decoration:
			none;
	}


	/* ==================================================
	   FRANCHISES
	   ================================================== */

	.franchise-section {
		padding-top: 2px;
	}


	.section-heading.compact {
		margin-bottom: 13px;
	}


	.franchise-grid {
		display: grid;

		grid-template-columns:
			repeat(
				7,
				minmax(0,1fr)
			);

		gap: 8px;
	}


	.franchise-token {
		min-width: 0;

		display: grid;
		justify-items: center;

		gap: 8px;

		padding:
			13px 7px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-sm);

		background:
			var(--panel);

		color: inherit;

		text-align:
			center;

		text-decoration:
			none;

		transition:
			transform
			120ms ease,
			border-color
			120ms ease;
	}


	.franchise-token:hover {
		transform:
			translateY(-2px);

		border-color:
			var(--brand-gold);
	}


	.franchise-logo {
		width: 62px;
		height: 62px;

		display: grid;
		place-items: center;

		overflow: hidden;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.17
			);

		border-radius:
			4px;

		background:
			var(--brand-ivory);
	}


	.franchise-logo img {
		width: 100%;
		height: 100%;

		object-fit: cover;
	}


	.franchise-token span {
		max-width: 100%;

		overflow: hidden;

		color:
			var(--brand-stone);

		font-size:
			.57rem;

		font-weight:
			700;

		line-height:
			1.15;

		text-overflow:
			ellipsis;

		white-space:
			nowrap;
	}


	/* ==================================================
	   EMPTY
	   ================================================== */

	.empty-state {
		padding: 28px;

		color:
			var(--muted);
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1100px) {

		.clubhouse-hero {
			grid-template-columns:
				minmax(0,1fr)
				260px;
		}


		.brand-frame strong {
			font-size:
				2.4rem;
		}


		.brand-frame > span {
			font-size:
				1.6rem;
		}


		.weekly-grid {
			grid-template-columns:
				1fr
				1fr;
		}


		.story-card.lead {
			grid-column:
				1 / -1;
		}


		.quick-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.pulse-grid {
			grid-template-columns:
				1fr;
		}


		.franchise-grid {
			grid-template-columns:
				repeat(
					4,
					minmax(0,1fr)
				);
		}

	}


	@media (max-width: 760px) {

		.home-page {
			gap: 30px;
		}


		.clubhouse-hero {
			grid-template-columns:
				1fr;

			min-height: 0;

			padding:
				28px 22px;
		}


		.hero-brand {
			display: none;
		}


		.hero-wordmark {
			right: -45px;

			opacity: .8;
		}


		.hero-copy h1 {
			font-size:
				clamp(
					3.8rem,
					16vw,
					6rem
				);
		}


		.section-heading {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.section-heading > p {
			text-align: left;
		}


		.weekly-grid,
		.quick-grid {
			grid-template-columns:
				1fr;
		}


		.story-card.lead {
			grid-column:
				auto;
		}


		.franchise-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}

	}


	@media (max-width: 520px) {

		.hero-kicker {
			flex-wrap: wrap;
		}


		.hero-kicker small {
			flex-basis: 100%;

			padding:
				4px 0 0 43px;

			border-left: 0;
		}


		.standing-row {
			grid-template-columns:
				32px
				40px
				minmax(0,1fr);
		}


		.standing-logo {
			width: 40px;
			height: 40px;
		}


		.standing-record {
			grid-column: 3;

			text-align: left;
		}


		.next-event {
			grid-template-columns:
				90px
				minmax(0,1fr);

			padding: 16px;
		}


		.franchise-grid {
			grid-template-columns:
				1fr
				1fr;
		}

	}
</style>