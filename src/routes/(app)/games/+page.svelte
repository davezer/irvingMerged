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

			logo:
				event?.logo ||
				event?.image ||
				event?.badge ||
				'/badge.png'
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
				text: 'LOCKED'
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
				text: 'LOCKED'
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
		Games Floor · Irving Champions League
	</title>

	<meta
		name="description"
		content="Irving Champions League offseason games, pools and competitions."
	/>
</svelte:head>


<div class="games-page">

	<!-- ===============================================
	     GAMES SUBNAV
	=============================================== -->

	<nav
		class="games-nav"
		aria-label="Games navigation"
	>
		<div class="games-nav-bug">
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


	<!-- ===============================================
	     HERO
	=============================================== -->

	<section class="games-hero icl-hero-shell">

		<div class="hero-copy">

			<div class="eyebrow">
				ICL Offseason
			</div>

			<h1>
				Games Floor
			</h1>

			<p>
				Brackets, races, pools and
				other deeply unnecessary ways
				to compete when fantasy football
				isn't enough.
			</p>


			<div class="hero-stats">

				<div>
					<span>Events</span>
					<strong>
						{events.length}
					</strong>
				</div>

				<div>
					<span>Open</span>
					<strong>
						{openEvents.length}
					</strong>
				</div>

				<div>
					<span>Archive</span>
					<strong>
						{lockedEvents.length}
					</strong>
				</div>

			</div>

		</div>


		<div
			class="hero-shield"
			aria-hidden="true"
		>
			<img
				src="/badge.png"
				alt=""
			/>
		</div>

	</section>


	<!-- ===============================================
	     OPEN / UPCOMING EVENTS
	=============================================== -->

	{#if openEvents.length}

		<section class="event-section">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						Now playing
					</div>

					<h2>
						Open Events
					</h2>
				</div>


				{#if nextEvent}
					<div class="next-lock">
						<span>
							Next lock
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

						<div class="event-top">

							<div class="event-identity">

								<div class="event-logo">
									<img
										src={card.display.logo}
										alt=""
										loading="lazy"
									/>
								</div>


								<div class="event-copy">

									<span class="event-format">
										{card.display.format}
									</span>

									<h3>
										{card.display.title}
									</h3>

									<p>
										{card.display.subtitle}
									</p>

								</div>

							</div>


							<div
								class="status-pill open"
							>
								<span></span>
								OPEN
							</div>

						</div>


						<div class="event-details">

							<div>
								<span>
									Entry locks
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
								Enter game →
							</strong>

						</footer>

					</a>

				{/each}

			</div>

		</section>

	{/if}


	<!-- ===============================================
	     EVENT ARCHIVE
	=============================================== -->

	{#if lockedEvents.length}

		<section class="event-section archive-section">

			<header class="section-head">

				<div>
					<div class="eyebrow">
						Season archive
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

						<div class="event-top">

							<div class="event-identity">

								<div class="event-logo">
									<img
										src={card.display.logo}
										alt=""
										loading="lazy"
									/>
								</div>


								<div class="event-copy">

									<span class="event-format">
										{card.display.format}
									</span>

									<h3>
										{card.display.title}
									</h3>

									<p>
										{card.display.subtitle}
									</p>

								</div>

							</div>


							<div
								class="status-pill locked"
							>
								LOCKED
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
								View event →
							</strong>

						</footer>

					</a>

				{/each}

			</div>

		</section>

	{/if}


	<!-- ===============================================
	     EMPTY STATE
	=============================================== -->

	{#if !events.length}

		<section class="games-empty">

			<img
				src="/badge.png"
				alt=""
			/>

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
		display: grid;

		gap: 24px;

		max-width: 1500px;

		margin: 0 auto;

		padding-bottom: 56px;
	}


	/* ==================================================
	   SUBNAV
	================================================== */

	.games-nav {
		display: flex;

		align-items: stretch;

		min-height: 54px;

		overflow: hidden;

		border:
			2px solid
			#050708;

		border-radius: 13px;

		background:
			#0c1012;

		box-shadow:
			var(--shadow-bug);
	}


	.games-nav-bug {
		display: grid;

		place-items: center;

		min-width: 60px;

		padding:
			0 14px;

		border-right:
			2px solid
			#050708;

		background:
			linear-gradient(
				180deg,
				var(--bug-red),
				var(--bug-red-dark)
			);

		color: white;

		font-family:
			var(--font-score);

		font-size:
			1rem;

		font-weight:
			950;
	}


	.games-nav a {
		min-width: 160px;

		display: grid;

		align-content: center;

		gap: 1px;

		padding:
			8px 14px;

		border-right:
			1px solid
			#050708;

		background:
			linear-gradient(
				180deg,
				#404744,
				#161a19
			);

		color:
			var(--bug-white);

		text-decoration: none;
	}


	.games-nav a strong {
		font-family:
			var(--font-score);

		font-size:
			.72rem;

		line-height: 1;

		text-transform:
			uppercase;
	}


	.games-nav a span {
		color:
			var(--muted);

		font-size:
			.58rem;

		text-transform:
			uppercase;

		letter-spacing:
			.05em;
	}


	.games-nav a:hover,
	.games-nav a.active {
		background:
			linear-gradient(
				180deg,
				#f5f4ea,
				#b8bbb4 52%,
				#6b716d
			);

		color:
			#101111;
	}


	.games-nav a:hover span,
	.games-nav a.active span {
		color:
			rgba(
				0,
				0,
				0,
				.6
			);
	}


	/* ==================================================
	   HERO
	================================================== */

	.games-hero {
		position: relative;

		min-height: 280px;

		display: flex;

		align-items: center;

		overflow: hidden;

		padding:
			40px 44px;
	}


	.hero-copy {
		position: relative;

		z-index: 2;

		max-width: 760px;
	}


	.games-hero h1 {
		margin:
			6px 0 10px;

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				7vw,
				6.5rem
			);

		line-height: .88;

		letter-spacing:
			-.06em;
	}


	.games-hero p {
		max-width: 56ch;

		margin: 0;

		color:
			var(--muted);

		font-size:
			1rem;

		font-weight: 700;

		line-height: 1.5;
	}


	.hero-stats {
		display: flex;

		flex-wrap: wrap;

		gap: 8px;

		margin-top: 24px;
	}


	.hero-stats > div {
		min-width: 94px;

		display: grid;

		gap: 3px;

		padding:
			9px 12px;

		border:
			1px solid
			rgba(
				255,
				255,
				255,
				.08
			);

		border-radius:
			6px;

		background:
			rgba(
				0,
				0,
				0,
				.26
			);
	}


	.hero-stats span {
		color:
			var(--muted-2);

		font-family:
			var(--font-score);

		font-size:
			.55rem;

		text-transform:
			uppercase;

		letter-spacing:
			.11em;
	}


	.hero-stats strong {
		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			1.25rem;
	}


	.hero-shield {
		position: absolute;

		right: 6%;

		top: 50%;

		width:
			min(
				245px,
				23vw
			);

		transform:
			translateY(-50%);

		opacity:
			.075;

		pointer-events:
			none;
	}


	.hero-shield img {
		display: block;

		width: 100%;
	}


	/* ==================================================
	   SECTION
	================================================== */

	.event-section {
		overflow: hidden;

		border:
			2px solid
			#050708;

		border-radius:
			15px;

		background:
			#101517;

		box-shadow:
			var(--shadow-panel);
	}


	.section-head {
		min-height: 76px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 20px;

		padding:
			16px 20px;

		border-bottom:
			1px solid
			rgba(
				255,
				255,
				255,
				.09
			);

		background:
			#171d1f;
	}


	.section-head h2 {
		margin:
			4px 0 0;

		font-family:
			var(--font-display);

		font-size:
			2rem;

		line-height: 1;
	}


	.section-note {
		color:
			var(--muted);

		font-size:
			.72rem;

		font-weight:
			800;

		text-transform:
			uppercase;
	}


	.next-lock {
		display: grid;

		justify-items: end;

		gap: 3px;
	}


	.next-lock span {
		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			.57rem;

		text-transform:
			uppercase;

		letter-spacing:
			.11em;
	}


	.next-lock strong {
		font-size:
			.78rem;
	}


	/* ==================================================
	   EVENT GRID
	================================================== */

	.events-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(
					0,
					1fr
				)
			);

		gap: 14px;

		padding: 18px;
	}


	.event-card {
		position: relative;

		min-height: 240px;

		display: grid;

		grid-template-rows:
			auto 1fr auto;

		gap: 18px;

		overflow: hidden;

		padding:
			19px 20px 0;

		border:
			1px solid
			rgba(
				255,
				255,
				255,
				.11
			);

		border-radius:
			12px;

		background:
			linear-gradient(
				135deg,
				rgba(
					17,
					133,
					200,
					.09
				),
				transparent 42%
			),
			#111719;

		color:
			var(--bug-white);

		text-decoration:
			none;

		box-shadow:
			inset 0 1px 0
			rgba(
				255,
				255,
				255,
				.05
			);

		transition:
			transform 140ms ease,
			border-color 140ms ease,
			background 140ms ease,
			opacity 140ms ease;
	}


	.event-card::before {
		content: '';

		position: absolute;

		left: 0;
		top: 0;
		bottom: 0;

		width: 4px;

		background:
			var(--icl-blue);
	}


	.event-card:hover {
		transform:
			translateY(-2px);

		border-color:
			rgba(
				17,
				133,
				200,
				.72
			);

		background:
			linear-gradient(
				135deg,
				rgba(
					17,
					133,
					200,
					.15
				),
				transparent 46%
			),
			#151c20;

		color:
			var(--bug-white);
	}


	.event-card.locked {
		opacity:
			.72;
	}


	.event-card.locked::before {
		background:
			#666d69;
	}


	.event-card.locked:hover {
		opacity: 1;
	}


	/* ==================================================
	   EVENT TOP
	================================================== */

	.event-top {
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

		gap: 14px;
	}


	.event-logo {
		width: 62px;

		height: 62px;

		flex:
			0 0 auto;

		display: grid;

		place-items: center;

		padding: 6px;

		border:
			1px solid
			rgba(
				255,
				255,
				255,
				.1
			);

		border-radius:
			11px;

		background:
			#090d10;
	}


	.event-logo img {
		width: 100%;

		height: 100%;

		object-fit:
			contain;
	}


	.event-copy {
		min-width: 0;
	}


	.event-format {
		display: block;

		margin-bottom: 4px;

		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			.57rem;

		font-weight:
			950;

		text-transform:
			uppercase;

		letter-spacing:
			.12em;
	}


	.event-copy h3 {
		margin: 0;

		color:
			var(--bug-white);

		font-family:
			var(--font-score);

		font-size:
			1.25rem;

		line-height:
			1.08;

		text-transform:
			uppercase;
	}


	.event-copy p {
		margin:
			5px 0 0;

		color:
			var(--muted);

		font-size:
			.76rem;
	}


	/* ==================================================
	   STATUS
	================================================== */

	.status-pill {
		flex: 0 0 auto;

		display:
			inline-flex;

		align-items:
			center;

		gap: 5px;

		padding:
			6px 8px;

		border:
			1px solid
			#050606;

		border-radius:
			5px;

		font-family:
			var(--font-score);

		font-size:
			.61rem;

		font-weight:
			950;

		text-transform:
			uppercase;

		box-shadow:
			inset 0 1px 0
			rgba(
				255,
				255,
				255,
				.4
			);
	}


	.status-pill.open {
		background:
			linear-gradient(
				180deg,
				#45b875,
				#23683f
			);

		color: white;
	}


	.status-pill.open span {
		width: 6px;

		height: 6px;

		border-radius:
			50%;

		background:
			#86ffae;

		box-shadow:
			0 0 7px
			rgba(
				134,
				255,
				174,
				.8
			);
	}


	.status-pill.locked {
		background:
			linear-gradient(
				180deg,
				#f0efe6,
				#a5aaa5 54%,
				#666c68
			);

		color:
			#111;
	}


	/* ==================================================
	   DETAILS
	================================================== */

	.event-details {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(
					0,
					1fr
				)
			);

		gap: 12px;

		align-content: end;
	}


	.event-details > div {
		display: grid;

		gap: 4px;

		padding:
			11px 12px;

		border:
			1px solid
			rgba(
				255,
				255,
				255,
				.07
			);

		border-radius:
			7px;

		background:
			rgba(
				0,
				0,
				0,
				.17
			);
	}


	.event-details span {
		color:
			var(--muted-2);

		font-family:
			var(--font-score);

		font-size:
			.55rem;

		text-transform:
			uppercase;

		letter-spacing:
			.1em;
	}


	.event-details strong {
		color:
			var(--bug-white);

		font-size:
			.78rem;

		line-height: 1.3;
	}


	/* ==================================================
	   FOOTER
	================================================== */

	.event-footer {
		margin:
			0 -20px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 12px;

		min-height: 48px;

		padding:
			11px 20px;

		border-top:
			1px solid
			rgba(
				255,
				255,
				255,
				.07
			);

		background:
			rgba(
				0,
				0,
				0,
				.18
			);
	}


	.event-footer > span {
		color:
			var(--muted);

		font-size:
			.68rem;
	}


	.event-footer > strong {
		color:
			var(--icl-blue);

		font-family:
			var(--font-score);

		font-size:
			.69rem;

		text-transform:
			uppercase;
	}


	.event-card:hover
	.event-footer > strong {
		color: white;
	}


	/* ==================================================
	   EMPTY
	================================================== */

	.games-empty {
		min-height: 300px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 7px;

		padding: 34px;

		border:
			2px solid
			#050708;

		border-radius:
			15px;

		background:
			#111719;

		text-align: center;

		box-shadow:
			var(--shadow-panel);
	}


	.games-empty img {
		width: 90px;

		margin-bottom: 8px;

		opacity: .65;
	}


	.games-empty h2 {
		margin: 0;

		font-family:
			var(--font-display);

		font-size: 2rem;
	}


	.games-empty p {
		margin: 0;

		color:
			var(--muted);
	}


	/* ==================================================
	   RESPONSIVE
	================================================== */

	@media (
		max-width: 900px
	) {
		.events-grid {
			grid-template-columns:
				1fr;
		}

		.hero-shield {
			right: -20px;

			width: 220px;

			opacity: .05;
		}
	}


	@media (
		max-width: 650px
	) {
		.games-page {
			gap: 18px;
		}


		.games-nav {
			overflow-x: auto;
		}


		.games-nav a {
			min-width: 135px;
		}


		.games-hero {
			min-height: 330px;

			padding:
				30px 22px;
		}


		.games-hero h1 {
			font-size:
				clamp(
					3.4rem,
					17vw,
					5rem
				);
		}


		.hero-stats {
			max-width: 320px;
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
			padding: 12px;
		}


		.event-card {
			min-height: 0;

			padding:
				15px 15px 0;
		}


		.event-top {
			align-items:
				flex-start;
		}


		.event-logo {
			width: 50px;

			height: 50px;
		}


		.event-copy h3 {
			font-size:
				1rem;
		}


		.event-details {
			grid-template-columns:
				1fr;
		}


		.event-footer {
			margin:
				0 -15px;

			padding:
				11px 15px;
		}
	}
</style>