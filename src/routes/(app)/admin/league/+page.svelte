<svelte:head>
	<title>
		League Control Room | Irving Champions League
	</title>
</svelte:head>

<div class="control-room">

	<!-- ======================================================
	     HERO
	     ====================================================== -->

	<header class="control-hero">
		<div class="hero-copy">
			<div class="eyebrow">
				League Admin
			</div>

			<h1>
				League Control Room
			</h1>

			<p>
				Commissioner tools for league operations,
				history, media, and general Irving nonsense.
			</p>
		</div>

		<div class="hero-status">
			<span class="status-dot"></span>

			<span>
				Commissioner Access
			</span>
		</div>
	</header>


	<!-- ======================================================
	     LEAGUE MEDIA
	     ====================================================== -->

	<section class="section">
		<div class="section-heading">
			<div>
				<div class="section-kicker">
					Newsroom
				</div>

				<h2>
					League Media
				</h2>
			</div>

			<a
				class="text-link"
				href="/league/weekly"
			>
				View Public Weekly →
			</a>
		</div>

		<div class="media-card">
			<div class="media-copy">
				<div class="card-icon media-icon">
					IW
				</div>

				<div>
					<h3>
						The Irving Weekly
					</h3>

					<p>
						Create manual stories, review automated
						recaps, and manage the league's weekly
						publication from one newsroom.
					</p>
				</div>
			</div>

			<div class="media-actions">
				<a
					class="action-button primary"
					href="/admin/league/irving-weekly"
				>
					<span class="button-label">
						Publication Desk
					</span>

					<span class="button-note">
						Manage articles & drafts
					</span>
				</a>

				<a
					class="action-button cyan"
					href="/admin/league/weekly-recap"
				>
					<span class="button-label">
						Weekly Recap Lab
					</span>

					<span class="button-note">
						Build, generate & publish
					</span>
				</a>
			</div>
		</div>
	</section>


	<!-- ======================================================
	     LEAGUE OPERATIONS
	     ====================================================== -->

	<section class="section">
		<div class="section-heading">
			<div>
				<div class="section-kicker">
					Commissioner Tools
				</div>

				<h2>
					League Operations
				</h2>
			</div>
		</div>

		<div class="tool-grid">

			<!-- DRAFT CAPITAL -->

			<a
				class="tool-card capital-card"
				href="/admin/league/draft-capital"
			>
				<div class="tool-top">
					<div class="card-icon">
						$
					</div>

					<div class="tool-arrow">
						→
					</div>
				</div>

				<div class="tool-copy">
					<div class="tool-label">
						Economy
					</div>

					<h3>
						Draft Capital
					</h3>

					<p>
						Manage capital transfers, trade reviews,
						ledger entries, voids, and historical
						draft-money movement.
					</p>
				</div>

				<div class="tool-footer">
					Open Draft Capital
				</div>
			</a>


			<!-- BADGES -->

			<a
				class="tool-card badge-card"
				href="/admin/league/badges"
			>
				<div class="tool-top">
					<div class="card-icon">
						★
					</div>

					<div class="tool-arrow">
						→
					</div>
				</div>

				<div class="tool-copy">
					<div class="tool-label">
						League History
					</div>

					<h3>
						Badge Control
					</h3>

					<p>
						Assign, review, and revoke weekly,
						legacy, persona, and commissioner-awarded
						league badges.
					</p>
				</div>

				<div class="tool-footer">
					Open Badge Control
				</div>
			</a>

		</div>
	</section>


	<!-- ======================================================
	     QUICK LINKS
	     ====================================================== -->

	<section class="quick-links">
		<div class="quick-label">
			Quick Access
		</div>

		<div class="quick-list">
			<a href="/league">
				League Home
			</a>

			<span></span>

			<a href="/league/weekly">
				The Irving Weekly
			</a>

			<span></span>

			<a href="/league/transactions">
				Transactions
			</a>

			<span></span>

			<a href="/league/standings">
				Standings
			</a>
		</div>
	</section>

</div>


<style>
	.control-room {
		display: grid;
		gap: 34px;
		max-width: 1450px;
		margin: 0 auto;
		padding-bottom: 60px;
	}


	/* ======================================================
	   HERO
	   ====================================================== */

	.control-hero {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 30px;
		overflow: hidden;

		padding: 25px 28px;

		border:
			2px solid #070808;

		border-radius:
			22px;

		background:
			radial-gradient(
				circle at 0% 100%,
				rgba(0, 190, 230, .17),
				transparent 32%
			),
			linear-gradient(
				180deg,
				#48514e,
				#222725 42%,
				#111413
			);

		box-shadow:
			var(--shadow-panel);
	}

	.control-hero::after {
		content:
			'';

		position:
			absolute;

		inset:
			0;

		pointer-events:
			none;

		background:
			linear-gradient(
				90deg,
				transparent,
				rgba(255,255,255,.025),
				transparent
			);
	}

	.hero-copy {
		position:
			relative;

		z-index:
			1;
	}

	.eyebrow,
	.section-kicker,
	.tool-label,
	.quick-label {
		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			.68rem;

		font-weight:
			950;

		letter-spacing:
			.14em;

		text-transform:
			uppercase;
	}

	.control-hero h1 {
		margin:
			7px 0 0;

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.5rem,
				5vw,
				4rem
			);

		line-height:
			.95;
	}

	.control-hero p {
		max-width:
			680px;

		margin:
			10px 0 0;

		color:
			var(--muted);

		line-height:
			1.5;
	}

	.hero-status {
		position:
			relative;

		z-index:
			1;

		display:
			flex;

		align-items:
			center;

		gap:
			8px;

		flex:
			0 0 auto;

		padding:
			9px 12px;

		border:
			1px solid
			rgba(255,255,255,.16);

		border-radius:
			999px;

		background:
			rgba(0,0,0,.25);

		font-family:
			var(--font-score);

		font-size:
			.66rem;

		font-weight:
			900;

		text-transform:
			uppercase;
	}

	.status-dot {
		width:
			8px;

		height:
			8px;

		border-radius:
			999px;

		background:
			#57dd86;

		box-shadow:
			0 0 10px
			rgba(87,221,134,.75);
	}


	/* ======================================================
	   SECTIONS
	   ====================================================== */

	.section {
		display:
			grid;

		gap:
			13px;
	}

	.section-heading {
		display:
			flex;

		align-items:
			end;

		justify-content:
			space-between;

		gap:
			20px;
	}

	.section-heading h2 {
		margin:
			3px 0 0;

		font-family:
			var(--font-display);

		font-size:
			1.65rem;

		line-height:
			1;
	}

	.text-link {
		color:
			#67dbe8;

		font-family:
			var(--font-score);

		font-size:
			.68rem;

		font-weight:
			900;

		text-decoration:
			none;

		text-transform:
			uppercase;
	}

	.text-link:hover {
		text-decoration:
			underline;
	}


	/* ======================================================
	   MEDIA CARD
	   ====================================================== */

	.media-card {
		display:
			grid;

		grid-template-columns:
			minmax(0, 1.15fr)
			minmax(400px, .85fr);

		gap:
			24px;

		align-items:
			center;

		padding:
			24px;

		border:
			2px solid #070808;

		border-radius:
			16px;

		background:
			linear-gradient(
				135deg,
				rgba(0, 210, 225, .09),
				transparent 42%
			),
			linear-gradient(
				180deg,
				#333b39,
				#171b1a
			);

		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.12),
			var(--shadow-panel);
	}

	.media-copy {
		display:
			grid;

		grid-template-columns:
			auto 1fr;

		gap:
			18px;

		align-items:
			start;
	}

	.card-icon {
		display:
			flex;

		align-items:
			center;

		justify-content:
			center;

		width:
			52px;

		height:
			52px;

		border:
			2px solid #070808;

		border-radius:
			12px;

		background:
			linear-gradient(
				180deg,
				#f4d66a,
				#c99122
			);

		color:
			#080908;

		font-family:
			var(--font-score);

		font-size:
			1rem;

		font-weight:
			950;

		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.35);
	}

	.media-icon {
		background:
			linear-gradient(
				180deg,
				#75e3ed,
				#2394aa
			);
	}

	.media-copy h3,
	.tool-copy h3 {
		margin:
			0;

		font-family:
			var(--font-display);

		font-size:
			1.7rem;

		line-height:
			1.05;
	}

	.media-copy p,
	.tool-copy p {
		margin:
			8px 0 0;

		color:
			var(--muted);

		line-height:
			1.55;
	}

	.media-actions {
		display:
			grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0, 1fr)
			);

		gap:
			10px;
	}

	.action-button {
		display:
			grid;

		gap:
			4px;

		padding:
			14px 16px;

		border:
			2px solid #070808;

		border-radius:
			10px;

		color:
			#080908;

		text-decoration:
			none;

		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.3);

		transition:
			transform .12s ease,
			filter .12s ease;
	}

	.action-button:hover {
		transform:
			translateY(-2px);

		filter:
			brightness(1.06);
	}

	.action-button.primary {
		background:
			linear-gradient(
				180deg,
				#f6c957,
				#d69a20
			);
	}

	.action-button.cyan {
		background:
			linear-gradient(
				180deg,
				#6adee8,
				#2598ab
			);
	}

	.button-label {
		font-family:
			var(--font-score);

		font-size:
			.78rem;

		font-weight:
			950;

		text-transform:
			uppercase;
	}

	.button-note {
		font-size:
			.72rem;

		font-weight:
			700;

		opacity:
			.75;
	}


	/* ======================================================
	   OPERATION CARDS
	   ====================================================== */

	.tool-grid {
		display:
			grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0, 1fr)
			);

		gap:
			14px;
	}

	.tool-card {
		display:
			grid;

		grid-template-rows:
			auto 1fr auto;

		gap:
			18px;

		min-height:
			250px;

		padding:
			22px;

		border:
			2px solid #070808;

		border-radius:
			16px;

		color:
			inherit;

		text-decoration:
			none;

		background:
			linear-gradient(
				180deg,
				#313735,
				#171a19
			);

		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.1);

		transition:
			transform .13s ease,
			border-color .13s ease;
	}

	.tool-card:hover {
		transform:
			translateY(-3px);
	}

	.capital-card:hover {
		border-color:
			rgba(244,198,74,.65);
	}

	.badge-card:hover {
		border-color:
			rgba(103,219,232,.6);
	}

	.tool-top {
		display:
			flex;

		align-items:
			start;

		justify-content:
			space-between;

		gap:
			15px;
	}

	.tool-arrow {
		color:
			var(--muted);

		font-family:
			var(--font-score);

		font-size:
			1.5rem;

		font-weight:
			900;
	}

	.badge-card .card-icon {
		background:
			linear-gradient(
				180deg,
				#70dae5,
				#268fa3
			);
	}

	.tool-label {
		margin-bottom:
			6px;
	}

	.tool-footer {
		padding-top:
			14px;

		border-top:
			1px solid
			rgba(255,255,255,.1);

		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			.7rem;

		font-weight:
			950;

		text-transform:
			uppercase;
	}


	/* ======================================================
	   QUICK LINKS
	   ====================================================== */

	.quick-links {
		display:
			flex;

		align-items:
			center;

		gap:
			20px;

		padding:
			14px 18px;

		border:
			1px solid
			rgba(255,255,255,.1);

		border-radius:
			10px;

		background:
			rgba(255,255,255,.025);
	}

	.quick-list {
		display:
			flex;

		flex-wrap:
			wrap;

		align-items:
			center;

		gap:
			12px;
	}

	.quick-list a {
		color:
			var(--muted);

		font-family:
			var(--font-score);

		font-size:
			.65rem;

		font-weight:
			900;

		text-decoration:
			none;

		text-transform:
			uppercase;
	}

	.quick-list a:hover {
		color:
			#67dbe8;
	}

	.quick-list span {
		width:
			3px;

		height:
			3px;

		border-radius:
			999px;

		background:
			rgba(255,255,255,.28);
	}


	/* ======================================================
	   RESPONSIVE
	   ====================================================== */

	@media (
		max-width: 950px
	) {
		.media-card {
			grid-template-columns:
				1fr;
		}

		.tool-grid {
			grid-template-columns:
				1fr;
		}
	}

	@media (
		max-width: 680px
	) {
		.control-hero,
		.section-heading {
			display:
				grid;
		}

		.hero-status {
			width:
				max-content;
		}

		.media-actions {
			grid-template-columns:
				1fr;
		}

		.media-copy {
			grid-template-columns:
				1fr;
		}

		.quick-links {
			display:
				grid;
		}

		.quick-list span {
			display:
				none;
		}
	}
</style>