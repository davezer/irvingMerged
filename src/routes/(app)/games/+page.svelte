<script>
	export let data;

	const gamesNav = [
		{
			href: '/games',
			label: 'Games Floor',
			meta: 'Events',
			active: true
		},
		{
			href: '/leaderboard',
			label: 'Leaderboard',
			meta: 'Offseason Board',
			active: false
		}
	];

	const EVENT_DISPLAY = {
		daytona: {
			title: 'Race, Crash, Cash',
			subtitle: 'Daytona 500',
			format: 'NASCAR'
		},

		madness: {
			title: 'March Multiplier Madness',
			subtitle: 'March Madness',
			format: 'Bracket'
		},

		masters: {
			title: 'Masters Panic',
			subtitle: 'The Masters',
			format: 'Golf'
		},

		derby: {
			title: 'Derby Double Down',
			subtitle: 'Kentucky Derby',
			format: 'Horse Racing'
		},

		worldcup: {
			title: 'Final FIFA Frenzy',
			subtitle: 'World Cup',
			format: 'Survivor'
		}
	};

	$: events =
		Array.isArray(data?.events)
			? data.events
			: Array.isArray(data?.games)
				? data.games
				: [];

	$: openEvents =
		events.filter(
			(event) =>
				status(event).key === 'open'
		);

	$: lockedEvents =
		events.filter(
			(event) =>
				status(event).key === 'locked'
		);

	$: nextEvent =
		[...openEvents]
			.sort(
				(a, b) =>
					eventTimestamp(a) -
					eventTimestamp(b)
			)[0] || null;


	function eventTimestamp(event) {
		const raw =
			event?.lock_at ??
			event?.start_at ??
			0;

		const number =
			Number(raw);

		if (!Number.isFinite(number)) {
			return 0;
		}

		return number < 1_000_000_000_000
			? number * 1000
			: number;
	}


	function pretty(value) {
		const number =
			Number(value);

		if (
			!Number.isFinite(number) ||
			!number
		) {
			return 'TBD';
		}

		const timestamp =
			number < 1_000_000_000_000
				? number * 1000
				: number;

		return new Date(timestamp)
			.toLocaleString(
				'en-US',
				{
					month: 'short',
					day: 'numeric',
					year: 'numeric',
					hour: 'numeric',
					minute: '2-digit'
				}
			);
	}


	function eventDisplay(event) {
		const type =
			String(
				event?.type || ''
			).toLowerCase();

		const fallback =
			EVENT_DISPLAY[type] || {};

		return {
			title:
				event?.title ||
				fallback.title ||
				'ICL Event',

			subtitle:
				event?.subtitle ||
				fallback.subtitle ||
				'Offseason competition',

			format:
				event?.format ||
				fallback.format ||
				type ||
				'Event',

			/*
			 * IMPORTANT:
			 * no more fallback to the old ICL shield.
			 * If an event has no logo, the UI renders
			 * a clean Irving Collective monogram.
			 */
			logo:
				event?.logo ||
				event?.image ||
				event?.badge ||
				null
		};
	}


	function status(event) {
		const explicit =
			String(
				event?.status || ''
			).toLowerCase();

		if (
			explicit === 'locked' ||
			explicit === 'complete' ||
			explicit === 'completed' ||
			explicit === 'closed'
		) {
			return {
				key: 'locked',
				text: 'CLOSED'
			};
		}

		if (
			explicit === 'open' ||
			explicit === 'active'
		) {
			return {
				key: 'open',
				text: 'OPEN'
			};
		}

		const lockAt =
			eventTimestamp(event);

		if (
			lockAt &&
			Date.now() >= lockAt
		) {
			return {
				key: 'locked',
				text: 'CLOSED'
			};
		}

		return {
			key: 'open',
			text: 'OPEN'
		};
	}


	function renderEvent(event) {
		return {
			event,
			display:
				eventDisplay(event),
			state:
				status(event)
		};
	}
</script>


<svelte:head>
	<title>
		Games Floor | Irving Collective
	</title>

	<meta
		name="description"
		content="Offseason games, pools, brackets, races and deeply unnecessary competitions from the Irving Collective."
	/>
</svelte:head>


<div class="games-page">

	<!-- ==================================================
	     GAMES NAV
	     ================================================== -->

	<nav
		class="games-nav"
		aria-label="Games navigation"
	>

		<div class="games-nav-mark">
			ICL
		</div>


		{#each gamesNav as item}

			<a
				href={item.href}
				class:active={item.active}
			>

				<strong>
					{item.label}
				</strong>

				<span>
					{item.meta}
				</span>

			</a>

		{/each}

	</nav>


	<!-- ==================================================
	     HERO
	     ================================================== -->

	<section class="games-hero">

		<div class="hero-copy">

			<div class="eyebrow">
				Irving Collective Offseason
			</div>


			<h1>
				Games Floor
			</h1>


			<p class="hero-lede">
				Brackets, races, pools and other
				deeply unnecessary ways to compete
				when fantasy football isn't enough.
			</p>


			<div class="hero-stats">

				<div>
					<span>
						Events
					</span>

					<strong>
						{events.length}
					</strong>
				</div>


				<div>
					<span>
						Open
					</span>

					<strong>
						{openEvents.length}
					</strong>
				</div>


				<div>
					<span>
						Archive
					</span>

					<strong>
						{lockedEvents.length}
					</strong>
				</div>

			</div>

		</div>


		<div
			class="hero-brand"
			aria-hidden="true"
		>

			<div class="hero-brand-mark">
				ICL
			</div>

			<span>
				Offseason
			</span>

			<strong>
				Games
			</strong>

			<small>
				Bad ideas since 2003
			</small>

		</div>


		<div
			class="hero-watermark"
			aria-hidden="true"
		>
			PLAY
		</div>

	</section>


	<!-- ==================================================
	     OPEN EVENTS
	     ================================================== -->

	{#if openEvents.length}

		<section class="event-section">

			<header class="section-head">

				<div>

					<div class="eyebrow">
						Now Playing
					</div>

					<h2>
						Open Events
					</h2>

				</div>


				{#if nextEvent}

					<div class="next-lock">

						<span>
							Next Lock
						</span>

						<strong>
							{pretty(
								nextEvent.lock_at
							)}
						</strong>

					</div>

				{/if}

			</header>


			<div class="events-grid">

				{#each openEvents as e}

					{@const card = renderEvent(e)}

					<a
						class="event-card open"
						href={`/games/${e.slug}`}
					>

						<div class="event-card-top">

							<div class="event-identity">

								<div class="event-logo">

									{#if card.display.logo}

										<img
											src={card.display.logo}
											alt=""
											loading="lazy"
										/>

									{:else}

										<span>
											ICL
										</span>

									{/if}

								</div>


								<div class="event-copy">

									<div class="event-format">
										{card.display.format}
									</div>

									<h3>
										{card.display.title}
									</h3>

									<p>
										{card.display.subtitle}
									</p>

								</div>

							</div>


							<div class="status open">
								<span></span>
								Open
							</div>

						</div>


						<div class="event-details">

							<div>

								<span>
									Entry Locks
								</span>

								<strong>
									{pretty(
										e.lock_at
									)}
								</strong>

							</div>


							<div>

								<span>
									Competition
								</span>

								<strong>
									{card.display.format}
								</strong>

							</div>

						</div>


						<footer class="event-footer">

							<span>
								Entry window open
							</span>

							<strong>
								Enter Game →
							</strong>

						</footer>

					</a>

				{/each}

			</div>

		</section>

	{/if}


	<!-- ==================================================
	     ARCHIVE
	     ================================================== -->

	{#if lockedEvents.length}

		<section class="event-section archive-section">

			<header class="section-head">

				<div>

					<div class="eyebrow">
						Season Archive
					</div>

					<h2>
						Past Events
					</h2>

				</div>


				<span class="section-note">
					{lockedEvents.length}
					completed event{lockedEvents.length === 1 ? '' : 's'}
				</span>

			</header>


			<div class="events-grid">

				{#each lockedEvents as e}

					{@const card = renderEvent(e)}

					<a
						class="event-card locked"
						href={`/games/${e.slug}`}
					>

						<div class="event-card-top">

							<div class="event-identity">

								<div class="event-logo">

									{#if card.display.logo}

										<img
											src={card.display.logo}
											alt=""
											loading="lazy"
										/>

									{:else}

										<span>
											ICL
										</span>

									{/if}

								</div>


								<div class="event-copy">

									<div class="event-format">
										{card.display.format}
									</div>

									<h3>
										{card.display.title}
									</h3>

									<p>
										{card.display.subtitle}
									</p>

								</div>

							</div>


							<div class="status locked">
								Closed
							</div>

						</div>


						<div class="event-details">

							<div>

								<span>
									Locked
								</span>

								<strong>
									{pretty(
										e.lock_at
									)}
								</strong>

							</div>


							<div>

								<span>
									Competition
								</span>

								<strong>
									{card.display.format}
								</strong>

							</div>

						</div>


						<footer class="event-footer">

							<span>
								Event complete
							</span>

							<strong>
								View Event →
							</strong>

						</footer>

					</a>

				{/each}

			</div>

		</section>

	{/if}


	<!-- ==================================================
	     EMPTY
	     ================================================== -->

	{#if !events.length}

		<section class="games-empty">

			<div class="empty-mark">
				ICL
			</div>

			<div class="eyebrow">
				Games Floor
			</div>

			<h2>
				Nothing on the board.
			</h2>

			<p>
				Somebody needs to invent
				another stupid competition.
			</p>

		</section>

	{/if}

</div>


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.games-page {
		width: 100%;
		max-width: 1500px;

		display: grid;
		gap: 22px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	.eyebrow {
		color:
			var(--brand-gold);

		font-size:
			.59rem;

		font-weight:
			800;

		letter-spacing:
			.15em;

		text-transform:
			uppercase;
	}


	/* ==================================================
	   GAMES NAV
	   ================================================== */

	.games-nav {
		display: flex;

		align-items: stretch;

		min-height: 50px;

		overflow: hidden;

		border-top:
			1px solid
			var(--brand-gold);

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.25
			);

		background:
			rgba(
				8,
				11,
				10,
				.72
			);
	}


	.games-nav-mark {
		width: 50px;

		display: grid;
		place-items: center;

		margin:
			7px 13px 7px 0;

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


	.games-nav a {
		position: relative;

		min-width: 145px;

		display: grid;

		align-content: center;

		gap: 2px;

		padding:
			8px 15px;

		color:
			var(--brand-stone);

		text-decoration: none;
	}


	.games-nav a::after {
		content: '';

		position: absolute;

		left: 15px;
		right: 15px;
		bottom: 0;

		height: 1px;

		background:
			transparent;
	}


	.games-nav a strong {
		color:
			inherit;

		font-size:
			.63rem;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;
	}


	.games-nav a span {
		color:
			var(--muted);

		font-size:
			.5rem;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}


	.games-nav a:hover,
	.games-nav a.active {
		color:
			var(--brand-sand);
	}


	.games-nav a:hover::after,
	.games-nav a.active::after {
		background:
			var(--brand-gold);
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.games-hero {
		position: relative;

		min-height: 330px;

		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			280px;

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


	.games-hero h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4.5rem,
				7.5vw,
				7.5rem
			);

		font-weight: 400;

		line-height:
			.84;

		letter-spacing:
			-.02em;

		text-transform:
			uppercase;
	}


	.hero-lede {
		max-width: 57ch;

		margin:
			25px 0 0;

		color:
			var(--muted);

		font-size:
			1rem;

		font-weight:
			600;

		line-height:
			1.55;
	}


	.hero-stats {
		display: flex;

		flex-wrap: wrap;

		gap: 1px;

		width: fit-content;

		margin-top: 28px;

		overflow: hidden;

		border:
			1px solid
			var(--border);
	}


	.hero-stats > div {
		min-width: 105px;

		display: grid;

		gap: 4px;

		padding:
			11px 14px;

		background:
			rgba(
				8,
				11,
				10,
				.68
			);

		border-right:
			1px solid
			var(--border);
	}


	.hero-stats > div:last-child {
		border-right: 0;
	}


	.hero-stats span {
		color:
			var(--brand-stone);

		font-size:
			.5rem;

		font-weight:
			800;

		letter-spacing:
			.12em;

		text-transform:
			uppercase;
	}


	.hero-stats strong {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.6rem;

		font-weight: 400;
	}


	/* ==================================================
	   HERO BRAND
	   ================================================== */

	.hero-brand {
		position: relative;
		z-index: 2;

		display: grid;

		justify-items: center;

		align-content: center;

		min-height: 235px;

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


	.hero-brand-mark {
		width: 72px;
		height: 72px;

		display: grid;
		place-items: center;

		margin-bottom: 17px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			2rem;
	}


	.hero-brand > span {
		color:
			var(--brand-stone);

		font-size:
			.54rem;

		font-weight:
			800;

		letter-spacing:
			.17em;

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
			2.6rem;

		font-weight: 400;

		line-height: 1;

		text-transform:
			uppercase;
	}


	.hero-brand > small {
		margin-top: 14px;

		color:
			var(--brand-gold);

		font-size:
			.5rem;

		font-weight:
			750;

		letter-spacing:
			.11em;

		text-transform:
			uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -8px;
		bottom: -48px;

		color:
			rgba(
				191,
				161,
				106,
				.019
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				9rem,
				16vw,
				15rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   EVENT SECTION
	   ================================================== */

	.event-section {
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


	.section-head {
		min-height: 78px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 20px;

		padding:
			17px 20px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.13
			);
	}


	.section-head h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2.2rem;

		font-weight: 400;

		line-height: 1;
	}


	.section-note {
		color:
			var(--brand-stone);

		font-size:
			.58rem;

		font-weight:
			800;

		letter-spacing:
			.09em;

		text-transform:
			uppercase;
	}


	.next-lock {
		display: grid;

		justify-items: end;

		gap: 4px;
	}


	.next-lock span {
		color:
			var(--brand-gold);

		font-size:
			.52rem;

		font-weight:
			800;

		letter-spacing:
			.12em;

		text-transform:
			uppercase;
	}


	.next-lock strong {
		color:
			var(--brand-ivory);

		font-size:
			.72rem;
	}


	/* ==================================================
	   EVENT GRID
	   ================================================== */

	.events-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 12px;

		padding: 16px;
	}


	.event-card {
		position: relative;

		min-height: 245px;

		display: grid;

		grid-template-rows:
			auto
			1fr
			auto;

		gap: 18px;

		overflow: hidden;

		padding:
			18px 18px 0;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.12
			);

		border-radius:
			var(--radius-sm);

		background:
			rgba(
				255,
				255,
				255,
				.012
			);

		color: inherit;

		text-decoration: none;

		transition:
			transform
			120ms ease,
			border-color
			120ms ease,
			background
			120ms ease,
			opacity
			120ms ease;
	}


	.event-card::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.event-card:hover {
		transform:
			translateY(-2px);

		border-color:
			rgba(
				191,
				161,
				106,
				.42
			);

		background:
			rgba(
				191,
				161,
				106,
				.025
			);
	}


	.event-card.locked {
		opacity: .72;
	}


	.event-card.locked::before {
		background:
			var(--brand-stone);
	}


	.event-card.locked:hover {
		opacity: 1;
	}


	/* ==================================================
	   EVENT TOP
	   ================================================== */

	.event-card-top {
		display: flex;

		align-items:
			flex-start;

		justify-content:
			space-between;

		gap: 16px;
	}


	.event-identity {
		min-width: 0;

		display: flex;

		align-items: center;

		gap: 13px;
	}


	.event-logo {
		flex: 0 0 auto;

		width: 58px;
		height: 58px;

		display: grid;
		place-items: center;

		overflow: hidden;

		padding: 5px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.18
			);

		background:
			rgba(
				8,
				11,
				10,
				.8
			);
	}


	.event-logo img {
		width: 100%;
		height: 100%;

		object-fit: contain;
	}


	.event-logo > span {
		display: grid;
		place-items: center;

		width: 100%;
		height: 100%;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.1rem;
	}


	.event-copy {
		min-width: 0;
	}


	.event-format {
		margin-bottom: 5px;

		color:
			var(--brand-gold);

		font-size:
			.52rem;

		font-weight:
			800;

		letter-spacing:
			.12em;

		text-transform:
			uppercase;
	}


	.event-copy h3 {
		margin: 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.65rem;

		font-weight: 400;

		line-height:
			1;

		text-transform:
			uppercase;
	}


	.event-copy p {
		margin:
			5px 0 0;

		color:
			var(--muted);

		font-size:
			.72rem;
	}


	/* ==================================================
	   STATUS
	   ================================================== */

	.status {
		flex:
			0 0 auto;

		display:
			inline-flex;

		align-items:
			center;

		gap: 6px;

		padding:
			5px 7px;

		border:
			1px solid
			var(--border);

		color:
			var(--brand-stone);

		font-size:
			.5rem;

		font-weight:
			850;

		letter-spacing:
			.09em;

		text-transform:
			uppercase;
	}


	.status.open {
		border-color:
			rgba(
				191,
				161,
				106,
				.4
			);

		color:
			var(--brand-gold);
	}


	.status.open span {
		width: 5px;
		height: 5px;

		border-radius: 50%;

		background:
			var(--brand-gold);
	}


	.status.locked {
		color:
			var(--brand-stone);
	}


	/* ==================================================
	   DETAILS
	   ================================================== */

	.event-details {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 8px;

		align-content: end;
	}


	.event-details > div {
		display: grid;

		gap: 4px;

		padding:
			10px 11px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.09
			);

		background:
			rgba(
				8,
				11,
				10,
				.36
			);
	}


	.event-details span {
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


	.event-details strong {
		color:
			var(--brand-ivory);

		font-size:
			.72rem;

		line-height: 1.35;
	}


	/* ==================================================
	   FOOTER
	   ================================================== */

	.event-footer {
		margin:
			0 -18px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 12px;

		min-height: 46px;

		padding:
			10px 18px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.09
			);

		background:
			rgba(
				8,
				11,
				10,
				.3
			);
	}


	.event-footer > span {
		color:
			var(--muted);

		font-size:
			.62rem;
	}


	.event-footer > strong {
		color:
			var(--brand-sand);

		font-size:
			.57rem;

		font-weight:
			800;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;
	}


	.event-card:hover
	.event-footer > strong {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   EMPTY
	   ================================================== */

	.games-empty {
		min-height: 300px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 8px;

		padding: 34px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			var(--panel);

		text-align: center;

		box-shadow:
			var(--shadow-panel);
	}


	.empty-mark {
		display: grid;
		place-items: center;

		width: 70px;
		height: 70px;

		margin-bottom: 7px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.65rem;
	}


	.games-empty h2 {
		margin: 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2rem;

		font-weight: 400;
	}


	.games-empty p {
		margin: 0;

		color:
			var(--muted);
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 900px) {

		.games-hero {
			grid-template-columns:
				1fr
				220px;
		}


		.events-grid {
			grid-template-columns:
				1fr;
		}

	}


	@media (max-width: 700px) {

		.games-page {
			gap: 18px;
		}


		.games-nav {
			overflow-x: auto;
		}


		.games-nav a {
			min-width: 130px;
		}


		.games-hero {
			grid-template-columns:
				1fr;

			min-height: 0;

			padding:
				29px 22px;
		}


		.games-hero h1 {
			font-size:
				clamp(
					3.8rem,
					17vw,
					5.7rem
				);
		}


		.hero-brand {
			display: none;
		}


		.hero-stats {
			max-width: 100%;
		}


		.hero-stats > div {
			min-width: 82px;
		}


		.section-head {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.next-lock {
			justify-items: start;
		}


		.events-grid {
			padding: 11px;
		}


		.event-card {
			min-height: 0;

			padding:
				15px 15px 0;
		}


		.event-logo {
			width: 50px;
			height: 50px;
		}


		.event-copy h3 {
			font-size:
				1.35rem;
		}


		.event-details {
			grid-template-columns:
				1fr;
		}


		.event-footer {
			margin:
				0 -15px;

			padding:
				10px 15px;
		}

	}


	@media (max-width: 480px) {

		.event-card-top {
			display: grid;
		}


		.status {
			width: fit-content;
		}

	}
</style>