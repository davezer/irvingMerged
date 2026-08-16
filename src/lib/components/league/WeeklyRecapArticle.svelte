<script>
	export let recap;
	export let aiMeta = null;
	export let preview = false;

	$: matchupRecaps =
		recap?.matchupRecaps || [];

	$: featuredMatchup =
		matchupRecaps.find(
			(matchup) =>
				matchup.featured
		) || null;

	$: otherMatchups =
		matchupRecaps.filter(
			(matchup) =>
				!matchup.featured
		);
</script>


{#if recap}

	<article class="weekly-recap">

		<!-- ==================================================
		     ARTICLE HEADER
		     ================================================== -->

		<header class="recap-header">

			<div class="recap-heading">

				<div class="recap-kicker">
					The Irving Weekly
				</div>

				<h1 class="recap-title">
					{recap.title}
				</h1>

				{#if recap.subtitle}

					<p class="recap-subtitle">
						{recap.subtitle}
					</p>

				{/if}

			</div>


			{#if aiMeta || preview}

				<div class="ai-meta">

					{#if preview}

						<span>
							Editorial Draft
						</span>

						<small>
							Preview only
						</small>

					{/if}


					{#if aiMeta?.model}

						<small class="model-label">
							{aiMeta.model}
						</small>

					{/if}

				</div>

			{/if}


			<div
				class="header-watermark"
				aria-hidden="true"
			>
				WEEKLY
			</div>

		</header>


		<div class="recap-body">

			<!-- ==================================================
			     OPENING
			     ================================================== -->

			<div class="recap-opening">

				<p>
					{recap.opening}
				</p>

			</div>


			<!-- ==================================================
			     MATCHUPS
			     ================================================== -->

			<section class="recap-section">

				<header class="section-heading">

					<div class="section-number">
						01
					</div>

					<div>
						<div class="section-label">
							Matchups
						</div>

						<h2>
							Around the League
						</h2>
					</div>

				</header>


				<div class="recap-matchups">

	{#if featuredMatchup}

		<article
			class="recap-matchup featured-matchup"
		>

			<div class="featured-label">
				Game of the Week
			</div>


			<h3>
				{featuredMatchup.headline}
			</h3>


			<p>
				{featuredMatchup.body}
			</p>

		</article>

	{/if}


	{#each otherMatchups as matchup}

		<article class="recap-matchup">

			<h3>
				{matchup.headline}
			</h3>


			<p>
				{matchup.body}
			</p>

		</article>

	{/each}

</div>
			</section>


			<!-- ==================================================
			     WAIVER WIRE
			     ================================================== -->

			<section class="recap-section">

				<header class="section-heading">

					<div class="section-number">
						02
					</div>

					<div>
						<div class="section-label">
							Waiver Wire
						</div>

						<h2>
							{recap.waiverWire?.headline}
						</h2>
					</div>

				</header>


				{#if recap.waiverWire?.body}

					<p class="section-copy">
						{recap.waiverWire.body}
					</p>

				{/if}


				{#if recap.waiverWire?.notableClaims?.length}

					<div class="recap-mini-grid">

						{#each recap.waiverWire.notableClaims as claim}

							<article class="recap-mini-card">

								<div class="mini-kicker">
									{claim.teamName}
								</div>


								<strong>
									{claim.players?.join(', ')}
								</strong>


								<div class="mini-stat">
									${claim.faab}
									<span>
										FAAB
									</span>
								</div>


								{#if claim.commentary}

									<p>
										{claim.commentary}
									</p>

								{/if}

							</article>

						{/each}

					</div>

				{/if}

			</section>


			<!-- ==================================================
			     TRADE DESK
			     ================================================== -->

			<section class="recap-section">

				<header class="section-heading">

					<div class="section-number">
						03
					</div>

					<div>
						<div class="section-label">
							Trade Desk
						</div>

						<h2>
							{recap.tradeDesk?.headline}
						</h2>
					</div>

				</header>


				{#if recap.tradeDesk?.body}

					<p class="section-copy">
						{recap.tradeDesk.body}
					</p>

				{/if}


				{#if recap.tradeDesk?.items?.length}

					<div class="recap-list">

						{#each recap.tradeDesk.items as trade}

							<article>

								<h3>
									{trade.headline}
								</h3>

								<p>
									{trade.body}
								</p>

							</article>

						{/each}

					</div>

				{/if}

			</section>


			<!-- ==================================================
			     STANDINGS
			     ================================================== -->

			<section class="recap-section">

				<header class="section-heading">

					<div class="section-number">
						04
					</div>

					<div>
						<div class="section-label">
							Standings Watch
						</div>

						<h2>
							{recap.standings?.headline}
						</h2>
					</div>

				</header>


				{#if recap.standings?.body}

					<p class="section-copy">
						{recap.standings.body}
					</p>

				{/if}

			</section>


			<!-- ==================================================
			     BADGES
			     ================================================== -->

			<section class="recap-section">

				<header class="section-heading">

					<div class="section-number">
						05
					</div>

					<div>
						<div class="section-label">
							Badge Cabinet
						</div>

						<h2>
							{recap.awards?.headline}
						</h2>
					</div>

				</header>


				{#if recap.awards?.items?.length}

					<div class="recap-mini-grid awards-grid">

						{#each recap.awards.items as award}

							<article class="recap-mini-card award-card">

								<div class="mini-kicker">
									{award.title}
								</div>

								<strong>
									{award.teamName}
								</strong>

								<p>
									{award.body}
								</p>

							</article>

						{/each}

					</div>

				{/if}

			</section>


			<!-- ==================================================
			     CLOSING
			     ================================================== -->

			<footer class="recap-closing">

				<div class="closing-mark">
					IW
				</div>

				<p>
					{recap.closing}
				</p>

			</footer>

		</div>

	</article>

{/if}


<style>
	/* =========================================================
	   THE IRVING WEEKLY — WEEKLY RECAP
	   ========================================================= */

	.weekly-recap {
		width: 100%;

		overflow: hidden;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-md);

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.03
				),
				transparent 32%
			),
			var(--panel);

		box-shadow:
			var(--shadow-panel);
	}


	/* =========================================================
	   HEADER
	   ========================================================= */

	.recap-header {
		position: relative;

		display: flex;

		justify-content:
			space-between;

		align-items:
			flex-start;

		gap: 28px;

		overflow: hidden;

		padding:
			clamp(
				30px,
				5vw,
				52px
			);

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.17
			);

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.055
				),
				transparent 55%
			);
	}


	.recap-heading {
		position: relative;

		z-index: 2;

		min-width: 0;

		max-width: 930px;
	}


	.recap-kicker {
		color:
			var(--brand-gold);

		font-size:
			.6rem;

		font-weight:
			800;

		letter-spacing:
			.16em;

		text-transform:
			uppercase;
	}


	.recap-title {
		max-width: 920px;

		margin:
			11px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				3.2rem,
				6vw,
				5.9rem
			);

		font-weight:
			400;

		line-height:
			.9;

		letter-spacing:
			-.012em;

		text-wrap:
			balance;

		text-shadow:
			none;
	}


	.recap-subtitle {
		max-width: 800px;

		margin:
			20px 0 0;

		color:
			var(--brand-sand);

		font-size:
			1.1rem;

		font-weight:
			600;

		line-height:
			1.5;
	}


	.header-watermark {
		position: absolute;

		right: -17px;

		bottom: -31px;

		color:
			rgba(
				191,
				161,
				106,
				.022
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				7rem,
				13vw,
				11rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* =========================================================
	   AI / PREVIEW META
	   ========================================================= */

	.ai-meta {
		position: relative;

		z-index: 2;

		flex:
			0 0 auto;

		display: grid;

		justify-items: end;

		gap: 5px;

		padding:
			8px 10px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.15
			);

		background:
			rgba(
				8,
				11,
				10,
				.55
			);
	}


	.ai-meta span {
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


	.ai-meta small {
		color:
			var(--brand-stone);

		font-size:
			.55rem;
	}


	.model-label {
		opacity: .65;
	}


	/* =========================================================
	   BODY
	   ========================================================= */

	.recap-body {
		max-width: 900px;

		margin: 0 auto;

		padding:
			0
			clamp(
				24px,
				5vw,
				42px
			)
			52px;
	}


	/* =========================================================
	   OPENING
	   ========================================================= */

	.recap-opening {
		padding:
			34px 0 8px;
	}


	.recap-opening p {
		margin: 0;

		color:
			var(--brand-ivory);

		font-size:
			1.08rem;

		font-weight:
			500;

		line-height:
			1.78;
	}


	.recap-opening p::first-letter {
		float: left;

		margin:
			6px 8px 0 0;

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			4.2rem;

		line-height:
			.72;
	}


	/* =========================================================
	   SECTIONS
	   ========================================================= */

	.recap-section {
		display: grid;

		gap: 17px;

		margin-top:
			34px;

		padding-top:
			28px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.15
			);
	}


	.section-heading {
		display: grid;

		grid-template-columns:
			42px
			minmax(0,1fr);

		gap: 13px;

		align-items:
			start;
	}


	.section-number {
		display: grid;

		place-items: center;

		width: 42px;
		height: 42px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.38
			);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1rem;
	}


	.section-label,
	.featured-label,
	.mini-kicker {
		color:
			var(--brand-gold);

		font-size:
			.56rem;

		font-weight:
			800;

		letter-spacing:
			.13em;

		text-transform:
			uppercase;
	}


	.section-heading h2 {
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
				2.35rem
			);

		font-weight:
			400;

		line-height:
			1.02;
	}


	.section-copy {
		margin: 0;

		color:
			var(--brand-ivory);

		font-size:
			1rem;

		line-height:
			1.72;
	}


	/* =========================================================
	   MATCHUPS
	   ========================================================= */

	.recap-matchups {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 10px;
	}


	.recap-matchup {
		display: grid;

		align-content:
			start;

		gap: 9px;

		padding:
			15px 16px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
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
	}


	.recap-matchup h3 {
		margin: 0;

		color:
			var(--brand-ivory);

		font-size:
			.92rem;

		line-height:
			1.25;
	}


	.recap-matchup p {
		margin: 0;

		color:
			var(--muted);

		font-size:
			.89rem;

		line-height:
			1.62;
	}


	.featured-matchup {
		grid-column:
			1 / -1;

		padding:
			20px;

		border-color:
			rgba(
				191,
				161,
				106,
				.42
			);

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.05
				),
				transparent 65%
			);
	}


	.featured-matchup h3 {
		max-width: 760px;

		font-family:
			var(--font-display);

		font-size:
			1.75rem;

		font-weight:
			400;

		line-height:
			1.05;
	}


	.featured-matchup p {
		color:
			var(--brand-ivory);

		font-size:
			.98rem;

		line-height:
			1.7;
	}


	.featured-label {
		width: fit-content;

		padding:
			4px 6px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.3
			);
	}


	/* =========================================================
	   MINI CARDS
	   ========================================================= */

	.recap-mini-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 10px;

		margin-top: 2px;
	}


	.recap-mini-card {
		display: grid;

		align-content:
			start;

		gap: 8px;

		padding:
			15px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
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
	}


	.recap-mini-card strong {
		color:
			var(--brand-ivory);

		font-size:
			.94rem;

		line-height:
			1.3;
	}


	.recap-mini-card p {
		margin: 0;

		color:
			var(--muted);

		font-size:
			.86rem;

		line-height:
			1.6;
	}


	.mini-stat {
		width: fit-content;

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.45rem;

		line-height: 1;
	}


	.mini-stat span {
		margin-left:
			3px;

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size:
			.48rem;

		font-weight:
			800;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}


	/* =========================================================
	   TRADE LIST
	   ========================================================= */

	.recap-list {
		display: grid;

		gap: 9px;
	}


	.recap-list article {
		position: relative;

		display: grid;

		gap: 7px;

		padding:
			14px 16px
			14px 18px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.1
			);

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(
				255,
				255,
				255,
				.01
			);
	}


	.recap-list h3 {
		margin: 0;

		color:
			var(--brand-ivory);

		font-size:
			.92rem;

		line-height:
			1.3;
	}


	.recap-list p {
		margin: 0;

		color:
			var(--muted);

		font-size:
			.88rem;

		line-height:
			1.62;
	}


	/* =========================================================
	   AWARDS
	   ========================================================= */

	.award-card {
		border-top:
			2px solid
			rgba(
				191,
				161,
				106,
				.3
			);
	}


	/* =========================================================
	   CLOSING
	   ========================================================= */

	.recap-closing {
		display: grid;

		grid-template-columns:
			52px
			minmax(0,1fr);

		gap: 18px;

		align-items:
			start;

		margin-top:
			42px;

		padding-top:
			28px;

		border-top:
			2px solid
			var(--brand-gold);
	}


	.closing-mark {
		display: grid;

		place-items: center;

		width: 52px;
		height: 52px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.3rem;
	}


	.recap-closing p {
		margin: 0;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size:
			1.5rem;

		font-weight:
			400;

		line-height:
			1.35;
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (max-width: 760px) {

		.recap-header {
			display: grid;

			padding:
				27px 22px;
		}


		.ai-meta {
			width: fit-content;

			justify-items:
				start;
		}


		.recap-title {
			font-size:
				clamp(
					3rem,
					14vw,
					4.6rem
				);
		}


		.recap-body {
			padding:
				0 20px
				40px;
		}


		.recap-matchups,
		.recap-mini-grid {
			grid-template-columns:
				1fr;
		}


		.featured-matchup {
			grid-column: auto;
		}


		.recap-closing {
			grid-template-columns:
				1fr;
		}

	}


	@media (max-width: 480px) {

		.section-heading {
			grid-template-columns:
				34px
				minmax(0,1fr);
		}


		.section-number {
			width: 34px;
			height: 34px;

			font-size:
				.85rem;
		}


		.recap-opening p::first-letter {
			font-size:
				3.5rem;
		}

	}
</style>