<svelte:head>
	<title>
		League Control Room | Irving Collective
	</title>

	<meta
		name="description"
		content="Commissioner administration for Irving Collective league operations, publishing, history, and draft capital."
	/>
</svelte:head>


<div class="control-room">

	<!-- ==================================================
	     HERO
	     ================================================== -->

	<header class="control-hero">

		<div class="hero-copy">

			<div class="eyebrow">
				League Administration
			</div>

			<h1>
				League Control Room
			</h1>

			<p>
				Commissioner tools for league operations,
				history, publishing, and the general upkeep
				of Irving nonsense.
			</p>

		</div>


		<div class="hero-command">

			<div class="command-mark">
				ICL
			</div>

			<div class="command-copy">

				<span>
					Commissioner
				</span>

				<strong>
					Control
				</strong>

				<small>
					Authorized access
				</small>

			</div>

		</div>


		<div
			class="hero-watermark"
			aria-hidden="true"
		>
			ADMIN
		</div>

	</header>


	<!-- ==================================================
	     NEWSROOM
	     ================================================== -->

	<section class="admin-section">

		<header class="section-heading">

			<div>

				<div class="section-kicker">
					Newsroom
				</div>

				<h2>
					League Media
				</h2>

				<p>
					Write, generate, review, and publish
					The Irving Weekly.
				</p>

			</div>


			<a
				class="public-link"
				href="/league/weekly"
			>
				View Public Weekly →
			</a>

		</header>


		<div class="newsroom-grid">

			<a
				class="admin-card publication-card"
				href="/admin/league/irving-weekly"
			>

				<div class="card-top">

					<div class="card-mark">
						IW
					</div>

					<span class="card-number">
						01
					</span>

				</div>


				<div class="card-copy">

					<div class="card-kicker">
						Publication
					</div>

					<h3>
						Publication Desk
					</h3>

					<p>
						Create manual stories, manage drafts,
						edit published articles, and control
						The Irving Weekly archive.
					</p>

				</div>


				<footer>
					<span>
						Open Publication Desk
					</span>

					<strong>
						→
					</strong>
				</footer>

			</a>


			<a
				class="admin-card recap-card"
				href="/admin/league/weekly-recap"
			>

				<div class="card-top">

					<div class="card-mark">
						WR
					</div>

					<span class="card-number">
						02
					</span>

				</div>


				<div class="card-copy">

					<div class="card-kicker">
						Automation
					</div>

					<h3>
						Weekly Recap Lab
					</h3>

					<p>
						Build the factual packet, generate the
						AI-written weekly recap, review the draft,
						and publish when it is ready.
					</p>

				</div>


				<footer>
					<span>
						Open Recap Lab
					</span>

					<strong>
						→
					</strong>
				</footer>

			</a>

		</div>

	</section>


	<!-- ==================================================
	     LEAGUE OPERATIONS
	     ================================================== -->

	<section class="admin-section">

		<header class="section-heading">

			<div>

				<div class="section-kicker">
					Commissioner Tools
				</div>

				<h2>
					League Operations
				</h2>

				<p>
					The machinery that keeps the league
					history and economy from becoming a crime scene.
				</p>

			</div>

		</header>


		<div class="operations-grid">

			<!-- DRAFT CAPITAL -->

			<a
				class="admin-card operation-card"
				href="/admin/league/draft-capital"
			>

				<div class="card-top">

					<div class="card-mark">
						$
					</div>

					<span class="card-number">
						03
					</span>

				</div>


				<div class="card-copy">

					<div class="card-kicker">
						League Economy
					</div>

					<h3>
						Draft Capital
					</h3>

					<p>
						Manage draft-capital transfers,
						trade reviews, ledger entries,
						voids, and historical money movement.
					</p>

				</div>


				<footer>
					<span>
						Open Draft Capital
					</span>

					<strong>
						→
					</strong>
				</footer>

			</a>


			<!-- BADGES -->

			<a
				class="admin-card operation-card"
				href="/admin/league/badges"
			>

				<div class="card-top">

					<div class="card-mark">
						★
					</div>

					<span class="card-number">
						04
					</span>

				</div>


				<div class="card-copy">

					<div class="card-kicker">
						League History
					</div>

					<h3>
						Badge Control
					</h3>

					<p>
						Assign, review, and revoke weekly,
						legacy, persona, stain, and
						commissioner-awarded league badges.
					</p>

				</div>


				<footer>
					<span>
						Open Badge Control
					</span>

					<strong>
						→
					</strong>
				</footer>

			</a>

		</div>

	</section>


	<!-- ==================================================
	     QUICK ACCESS
	     ================================================== -->

	<nav
		class="quick-access"
		aria-label="League admin quick access"
	>

		<div class="quick-heading">

			<span>
				ICL
			</span>

			<div>
				<small>
					Quick Access
				</small>

				<strong>
					Public League
				</strong>
			</div>

		</div>


		<div class="quick-links">

			<a href="/league">
				League Home
			</a>

			<a href="/league/weekly">
				The Irving Weekly
			</a>

			<a href="/league/transactions">
				Transactions
			</a>

			<a href="/league/standings">
				Standings
			</a>

			<a href="/league/teams">
				Franchises
			</a>

		</div>

	</nav>

</div>


<style>
	/* ==================================================
	   CONTROL ROOM
	   ================================================== */

	.control-room {
		width: 100%;
		max-width: 1450px;

		display: grid;
		gap: 38px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	.eyebrow,
	.section-kicker,
	.card-kicker {
		color:
			var(--brand-gold);

		font-size: .56rem;

		font-weight: 800;

		letter-spacing: .15em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.control-hero {
		position: relative;

		min-height: 230px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			250px;

		align-items: center;

		gap: 38px;

		overflow: hidden;

		padding:
			clamp(
				28px,
				4vw,
				42px
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
				transparent 40%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.hero-copy {
		position: relative;

		z-index: 2;

		min-width: 0;
	}


	.control-hero h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				3.8rem,
				6vw,
				6.2rem
			);

		font-weight: 400;

		line-height: .86;

		letter-spacing: -.02em;

		text-transform: uppercase;
	}


	.control-hero p {
		max-width: 690px;

		margin:
			21px 0 0;

		color:
			var(--muted);

		font-size: .97rem;

		font-weight: 600;

		line-height: 1.55;
	}


	/* ==================================================
	   COMMAND IDENTITY
	   ================================================== */

	.hero-command {
		position: relative;

		z-index: 2;

		min-height: 155px;

		display: flex;

		align-items: center;

		justify-content: center;

		gap: 17px;

		padding: 20px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.22
			);

		background:
			rgba(
				8,
				11,
				10,
				.4
			);
	}


	.command-mark {
		flex:
			0 0 auto;

		width: 60px;
		height: 60px;

		display: grid;

		place-items: center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.5rem;
	}


	.command-copy {
		display: grid;
		gap: 2px;
	}


	.command-copy > span {
		color:
			var(--brand-stone);

		font-size: .49rem;

		font-weight: 800;

		letter-spacing: .14em;

		text-transform: uppercase;
	}


	.command-copy > strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}


	.command-copy > small {
		margin-top: 6px;

		color:
			var(--brand-gold);

		font-size: .47rem;

		font-weight: 800;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -15px;
		bottom: -40px;

		color:
			rgba(
				191,
				161,
				106,
				.017
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				8rem,
				14vw,
				13rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   SECTIONS
	   ================================================== */

	.admin-section {
		display: grid;
		gap: 15px;
	}


	.section-heading {
		display: flex;

		align-items: end;

		justify-content:
			space-between;

		gap: 30px;
	}


	.section-heading h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2.2rem;

		font-weight: 400;

		line-height: 1;
	}


	.section-heading p {
		max-width: 620px;

		margin:
			7px 0 0;

		color:
			var(--muted);

		font-size: .76rem;

		line-height: 1.5;
	}


	.public-link {
		flex: 0 0 auto;

		padding-bottom: 3px;

		border-bottom:
			1px solid
			transparent;

		color:
			var(--brand-sand);

		font-size: .56rem;

		font-weight: 800;

		letter-spacing: .06em;

		text-decoration: none;

		text-transform: uppercase;
	}


	.public-link:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	/* ==================================================
	   CARD GRIDS
	   ================================================== */

	.newsroom-grid,
	.operations-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 12px;
	}


	/* ==================================================
	   ADMIN CARDS
	   ================================================== */

	.admin-card {
		position: relative;

		min-height: 270px;

		display: grid;

		grid-template-rows:
			auto
			1fr
			auto;

		gap: 20px;

		overflow: hidden;

		padding:
			21px 21px 0;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			linear-gradient(
				180deg,
				rgba(
					255,
					255,
					255,
					.015
				),
				transparent
			),
			var(--panel);

		color: inherit;

		text-decoration: none;

		box-shadow:
			var(--shadow-panel);

		transition:
			transform 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}


	.admin-card::before {
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
				.45
			);
	}


	.admin-card:hover {
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
			linear-gradient(
				180deg,
				rgba(
					191,
					161,
					106,
					.025
				),
				transparent
			),
			var(--panel);
	}


	.card-top {
		display: flex;

		align-items:
			flex-start;

		justify-content:
			space-between;

		gap: 20px;
	}


	.card-mark {
		width: 48px;
		height: 48px;

		display: grid;

		place-items: center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.2rem;

		line-height: 1;
	}


	.card-number {
		color:
			rgba(
				191,
				161,
				106,
				.36
			);

		font-family:
			var(--font-display);

		font-size: 1.35rem;
	}


	.card-copy {
		align-self: start;
	}


	.card-copy h3 {
		margin:
			6px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;
	}


	.card-copy p {
		max-width: 62ch;

		margin:
			12px 0 0;

		color:
			var(--muted);

		font-size: .84rem;

		line-height: 1.6;
	}


	.admin-card footer {
		min-height: 49px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 12px;

		margin:
			0 -21px;

		padding:
			11px 21px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.1
			);

		background:
			rgba(
				8,
				11,
				10,
				.28
			);
	}


	.admin-card footer span {
		color:
			var(--brand-sand);

		font-size: .57rem;

		font-weight: 800;

		letter-spacing: .07em;

		text-transform: uppercase;
	}


	.admin-card footer strong {
		color:
			var(--brand-gold);

		font-size: 1rem;
	}


	.admin-card:hover footer span {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   SUBTLE CARD DISTINCTION
	   ================================================== */

	.publication-card .card-mark {
		color:
			var(--brand-ivory);

		border-color:
			var(--brand-ivory);
	}


	.recap-card .card-mark {
		color:
			var(--brand-sand);

		border-color:
			var(--brand-sand);
	}


	/* ==================================================
	   QUICK ACCESS
	   ================================================== */

	.quick-access {
		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 30px;

		padding:
			13px 16px;

		border-top:
			1px solid
			var(--border);

		border-bottom:
			1px solid
			var(--border);

		background:
			rgba(
				8,
				11,
				10,
				.28
			);
	}


	.quick-heading {
		flex: 0 0 auto;

		display: flex;

		align-items: center;

		gap: 10px;
	}


	.quick-heading > span {
		width: 32px;
		height: 32px;

		display: grid;

		place-items: center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: .82rem;
	}


	.quick-heading > div {
		display: grid;
		gap: 1px;
	}


	.quick-heading small {
		color:
			var(--brand-stone);

		font-size: .46rem;

		font-weight: 800;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.quick-heading strong {
		color:
			var(--brand-ivory);

		font-size: .61rem;

		font-weight: 800;

		text-transform: uppercase;
	}


	.quick-links {
		display: flex;

		align-items: center;

		justify-content:
			flex-end;

		flex-wrap: wrap;

		gap: 8px 18px;
	}


	.quick-links a {
		position: relative;

		color:
			var(--brand-stone);

		font-size: .55rem;

		font-weight: 800;

		letter-spacing: .06em;

		text-decoration: none;

		text-transform: uppercase;
	}


	.quick-links a::after {
		content: '';

		position: absolute;

		left: 0;
		right: 100%;
		bottom: -4px;

		height: 1px;

		background:
			var(--brand-gold);

		transition:
			right 120ms ease;
	}


	.quick-links a:hover {
		color:
			var(--brand-sand);
	}


	.quick-links a:hover::after {
		right: 0;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 900px) {

		.control-hero {
			grid-template-columns:
				1fr
				210px;
		}


		.newsroom-grid,
		.operations-grid {
			grid-template-columns:
				1fr;
		}

	}


	@media (max-width: 700px) {

		.control-room {
			gap: 28px;
		}


		.control-hero {
			grid-template-columns:
				1fr;

			min-height: 0;

			padding:
				28px 22px;
		}


		.control-hero h1 {
			font-size:
				clamp(
					3.4rem,
					15vw,
					5rem
				);
		}


		.hero-command {
			display: none;
		}


		.section-heading {
			align-items:
				flex-start;

			flex-direction:
				column;

			gap: 10px;
		}


		.admin-card {
			min-height: 240px;
		}


		.quick-access {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.quick-links {
			justify-content:
				flex-start;
		}

	}
</style>