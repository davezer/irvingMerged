<script>
	const documentUrl =
		'https://docs.google.com/document/d/e/2PACX-1vQrprI-QZtCpV4usAki6N1cTIvwEJLdDewAlJwJRpBu29qqS5iIg9l78D8ryO0Xc57fqEChNy6SuV3u/pub';

	const embeddedDocumentUrl =
		`${documentUrl}?embedded=true`;
</script>


<svelte:head>
	<title>
		League Constitution | Irving Collective
	</title>

	<meta
		name="description"
		content="The official rules, bylaws, procedures, and operating standards of the Irving Champions League."
	/>
</svelte:head>


<div class="constitution-page">

	<!-- ==================================================
	     HERO
	     ================================================== -->

	<section class="constitution-hero">

		<div class="hero-copy">

			<div class="eyebrow">
				League Governance
			</div>


			<h1>
				League Constitution
			</h1>


			<p>
				The official rules, procedures,
				and laws of the Irving Champions League.
			</p>


			<div class="hero-actions">

				<a
					class="document-button"
					href={documentUrl}
					target="_blank"
					rel="noreferrer"
				>
					Open Full Document →
				</a>

			</div>

		</div>


		<div
			class="hero-brand"
			aria-hidden="true"
		>

			<div class="hero-mark">
				ICL
			</div>

			<span>
				League Governance
			</span>

			<strong>
				Rulebook
			</strong>

			<small>
				Est. 2003
			</small>

		</div>


		<div
			class="hero-watermark"
			aria-hidden="true"
		>
			RULEBOOK
		</div>

	</section>


	<!-- ==================================================
	     DOCUMENT
	     ================================================== -->

	<section class="document-shell">

		<header class="document-bar">

			<div class="document-status">

				<span class="status-dot"></span>

				<strong>
					Official League Document
				</strong>

			</div>


			<div class="document-meta">
				Irving Collective
			</div>

		</header>


		<div class="document-frame">

			<iframe
				src={embeddedDocumentUrl}
				title="Irving Champions League Constitution"
				class="google-doc-iframe"
			></iframe>

		</div>

	</section>

</div>


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.constitution-page {
		width: 100%;
		max-width: 1450px;

		display: grid;
		gap: 20px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	.eyebrow {
		color:
			var(--brand-gold);

		font-size: .58rem;

		font-weight: 800;

		letter-spacing: .15em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.constitution-hero {
		position: relative;

		min-height: 255px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			250px;

		align-items: center;

		gap: 40px;

		overflow: hidden;

		padding:
			clamp(
				28px,
				4vw,
				44px
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


	.constitution-hero h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				6.5vw,
				6.5rem
			);

		font-weight: 400;

		line-height: .86;

		letter-spacing: -.02em;

		text-transform: uppercase;

		text-shadow: none;
	}


	.constitution-hero p {
		max-width: 62ch;

		margin:
			22px 0 0;

		color:
			var(--muted);

		font-size: 1rem;

		font-weight: 600;

		line-height: 1.55;
	}


	.hero-actions {
		display: flex;

		flex-wrap: wrap;

		gap: 8px;

		margin-top: 24px;
	}


	.document-button {
		min-height: 38px;

		display: inline-flex;

		align-items: center;

		justify-content: center;

		padding:
			8px 13px;

		border:
			1px solid
			var(--brand-gold);

		border-radius: 3px;

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);

		font-size: .61rem;

		font-weight: 850;

		letter-spacing: .06em;

		text-decoration: none;

		text-transform: uppercase;

		transition:
			background 120ms ease,
			border-color 120ms ease,
			transform 120ms ease;
	}


	.document-button:hover {
		transform:
			translateY(-1px);

		border-color:
			var(--brand-sand);

		background:
			var(--brand-sand);
	}


	/* ==================================================
	   HERO BRAND
	   ================================================== */

	.hero-brand {
		position: relative;

		z-index: 2;

		min-height: 175px;

		display: grid;

		justify-items: center;

		align-content: center;

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
				.36
			);

		text-align: center;
	}


	.hero-mark {
		width: 58px;
		height: 58px;

		display: grid;

		place-items: center;

		margin-bottom: 14px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.55rem;
	}


	.hero-brand > span {
		color:
			var(--brand-stone);

		font-size: .49rem;

		font-weight: 800;

		letter-spacing: .15em;

		text-transform: uppercase;
	}


	.hero-brand > strong {
		margin-top: 3px;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2.2rem;

		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}


	.hero-brand > small {
		margin-top: 11px;

		color:
			var(--brand-gold);

		font-size: .47rem;

		font-weight: 800;

		letter-spacing: .13em;

		text-transform: uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -30px;
		bottom: -40px;

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
				14vw,
				13rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   DOCUMENT SHELL
	   ================================================== */

	.document-shell {
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


	.document-bar {
		min-height: 44px;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 18px;

		padding:
			9px 14px;

		border-bottom:
			1px solid
			var(--border);

		background:
			rgba(
				8,
				11,
				10,
				.72
			);
	}


	.document-status {
		display: flex;

		align-items: center;

		gap: 8px;
	}


	.status-dot {
		width: 6px;
		height: 6px;

		flex: 0 0 auto;

		border-radius: 50%;

		background:
			#7fb48d;

		box-shadow:
			0 0 8px
			rgba(
				127,
				180,
				141,
				.42
			);
	}


	.document-status strong,
	.document-meta {
		color:
			var(--brand-stone);

		font-size: .54rem;

		font-weight: 800;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.document-status strong {
		color:
			var(--brand-ivory);
	}


	/* ==================================================
	   GOOGLE DOCUMENT
	   ================================================== */

	.document-frame {
		width: 100%;

		overflow: hidden;

		background: #fff;
	}


	.google-doc-iframe {
		width: 100%;
		height: 78vh;

		min-height: 720px;

		display: block;

		border: 0;

		background: #fff;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 850px) {

		.constitution-hero {
			grid-template-columns:
				1fr;
		}


		.hero-brand {
			display: none;
		}

	}


	@media (max-width: 700px) {

		.constitution-page {
			gap: 14px;
		}


		.constitution-hero {
			min-height: 0;

			padding:
				28px 22px;
		}


		.constitution-hero h1 {
			font-size:
				clamp(
					3.6rem,
					16vw,
					5.5rem
				);
		}


		.document-bar {
			align-items:
				flex-start;

			flex-direction:
				column;

			gap: 4px;
		}


		.document-meta {
			display: none;
		}


		.google-doc-iframe {
			height: 82vh;

			min-height: 600px;
		}

	}
</style>