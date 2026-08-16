<script>
	import WeeklyRecapArticle
		from '$lib/components/league/WeeklyRecapArticle.svelte';

	import {
		renderWeeklyMarkdown
	} from '$lib/weeklyMarkdown.js';

	export let data;

	$: post =
		data.post;

	$: publishedRecap =
		data.publishedRecap ||
		null;

	$: manualHtml =
		post?.sourceType !==
			'weekly_recap'
			? renderWeeklyMarkdown(
					post?.body ||
						''
				)
			: '';

	function typeLabel(value) {
		const labels = {
			feature: 'Feature',
			commissioner: 'Commissioner',
			league_news: 'League News',
			power_rankings: 'Power Rankings',
			announcement: 'Announcement',
			opinion: 'Opinion'
		};

		return (
			labels[value] ||
			value ||
			'Article'
		);
	}

	function dateLabel(value) {
		if (!value) {
			return '';
		}

		const date =
			new Date(value);

		if (
			Number.isNaN(
				date.getTime()
			)
		) {
			return '';
		}

		return date.toLocaleDateString(
			'en-US',
			{
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			}
		);
	}
</script>


<svelte:head>
	<title>
		{post.title} | The Irving Weekly
	</title>

	{#if post.subtitle ||
		post.excerpt}

		<meta
			name="description"
			content={
				post.subtitle ||
				post.excerpt
			}
		/>

	{/if}
</svelte:head>


<div class="article-page">

	<!-- ==================================================
	     MINI MASTHEAD
	     ================================================== -->

	<header class="article-masthead">

		<a
			class="publication"
			href="/league/weekly"
		>
			<span>
				ICL
			</span>

			<strong>
				The Irving Weekly
			</strong>
		</a>


		<div class="publication-meta">

			<span>
				Irving Collective
			</span>

			<i></i>

			<span>
				Est. 2003
			</span>

		</div>

	</header>


	<nav class="article-nav">

		<a href="/league/weekly">
			← Back to The Irving Weekly
		</a>


		<span>
			{post.sourceType ===
			'weekly_recap'
				? `${post.recapSeason} · Week ${post.recapWeek}`
				: typeLabel(
						post.postType
					)}
		</span>

	</nav>


	<!-- ==================================================
	     WEEKLY RECAP
	     ================================================== -->

	{#if post.sourceType ===
		'weekly_recap'}

		{#if publishedRecap?.recap}

			<div class="recap-shell">

				<WeeklyRecapArticle
					recap={
						publishedRecap.recap
					}
				/>

			</div>

		{:else}

			<div class="article-empty">

				<strong>
					This recap is unavailable.
				</strong>

				<p>
					The publication record exists,
					but its recap snapshot could not
					be loaded.
				</p>

			</div>

		{/if}


	<!-- ==================================================
	     MANUAL ARTICLE
	     ================================================== -->

	{:else}

		<article class="manual-article">

			<header class="story-header">

				<div class="article-type">
					{typeLabel(
						post.postType
					)}
				</div>


				<h1>
					{post.title}
				</h1>


				{#if post.subtitle}

					<p class="subtitle">
						{post.subtitle}
					</p>

				{/if}


				<div class="byline">

					<span>
						By
						<strong>
							{post.authorName ||
								'The Irving Weekly'}
						</strong>
					</span>

					{#if post.publishedAt}

						<span>
							{dateLabel(
								post.publishedAt
							)}
						</span>

					{/if}

				</div>

			</header>


			<div class="story-body">
				{@html manualHtml}
			</div>

		</article>

	{/if}

</div>


<style>
	/* ==================================================
	   ARTICLE PAGE
	   ================================================== */

	.article-page {
		width: 100%;
		max-width: 1180px;

		display: grid;

		gap: 14px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	/* ==================================================
	   MINI MASTHEAD
	   ================================================== */

	.article-masthead {
		display: flex;

		align-items: center;

		justify-content:
			space-between;

		gap: 20px;

		padding:
			10px 0;

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
	}


	.publication {
		display: flex;

		align-items: center;

		gap: 11px;

		color: inherit;

		text-decoration: none;
	}


	.publication > span {
		display: grid;
		place-items: center;

		width: 32px;
		height: 32px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			.9rem;
	}


	.publication strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.35rem;

		font-weight: 400;

		text-transform:
			uppercase;
	}


	.publication-meta {
		display: flex;

		align-items: center;

		gap: 8px;

		color:
			var(--brand-stone);

		font-size: .53rem;

		font-weight: 800;

		letter-spacing:
			.11em;

		text-transform:
			uppercase;
	}


	.publication-meta i {
		width: 3px;
		height: 3px;

		border-radius: 50%;

		background:
			var(--brand-gold);
	}


	/* ==================================================
	   ARTICLE NAV
	   ================================================== */

	.article-nav {
		display: flex;

		justify-content:
			space-between;

		align-items: center;

		gap: 16px;

		padding:
			3px 0 10px;

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


	.article-nav a {
		color:
			var(--brand-sand);

		text-decoration: none;
	}


	.article-nav a:hover {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   RECAP WRAPPER
	   ================================================== */

	.recap-shell {
		width: 100%;
	}


	/* ==================================================
	   MANUAL ARTICLE
	   ================================================== */

	.manual-article {
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
					.035
				),
				transparent 35%
			),
			var(--panel);

		box-shadow:
			var(--shadow-panel);
	}


	.story-header {
		position: relative;

		max-width: 980px;

		margin: 0 auto;

		padding:
			clamp(
				30px,
				5vw,
				54px
			)
			clamp(
				24px,
				5vw,
				48px
			)
			30px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.15
			);
	}


	.story-header::after {
		content:
			'WEEKLY';

		position: absolute;

		right: -10px;

		bottom: -24px;

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
				5rem,
				10vw,
				8rem
			);

		line-height: 1;

		pointer-events: none;
	}


	.article-type {
		position: relative;

		z-index: 1;

		color:
			var(--brand-gold);

		font-size:
			.59rem;

		font-weight:
			800;

		letter-spacing:
			.14em;

		text-transform:
			uppercase;
	}


	.manual-article h1 {
		position: relative;

		z-index: 1;

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
				6.5vw,
				6rem
			);

		font-weight: 400;

		line-height:
			.9;

		letter-spacing:
			-.01em;

		text-wrap:
			balance;
	}


	.subtitle {
		position: relative;

		z-index: 1;

		max-width: 820px;

		margin:
			19px 0 0;

		color:
			var(--brand-sand);

		font-size:
			1.15rem;

		font-weight: 600;

		line-height:
			1.5;
	}


	.byline {
		position: relative;

		z-index: 1;

		display: flex;

		flex-wrap: wrap;

		gap: 15px;

		margin-top: 23px;

		color:
			var(--brand-stone);

		font-size:
			.58rem;

		font-weight: 750;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;
	}


	.byline strong {
		margin-left: 3px;

		color:
			var(--brand-ivory);
	}


	.byline span + span {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   STORY BODY
	   ================================================== */

	.story-body {
		max-width: 820px;

		margin: 0 auto;

		padding:
			34px
			26px
			55px;
	}


	:global(.story-body h2) {
		margin:
			38px 0 12px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2.2rem;

		font-weight: 400;

		line-height:
			1.05;
	}


	:global(.story-body h3) {
		margin:
			29px 0 9px;

		color:
			var(--brand-sand);

		font-size:
			1.25rem;
	}


	:global(.story-body p) {
		margin:
			0 0 19px;

		color:
			var(--brand-ivory);

		font-size:
			1.04rem;

		line-height:
			1.78;
	}


	:global(.story-body strong) {
		color:
			var(--brand-sand);
	}


	:global(.story-body ul),
	:global(.story-body ol) {
		margin:
			0 0 22px;

		padding-left:
			26px;
	}


	:global(.story-body li) {
		margin:
			7px 0;

		color:
			var(--brand-ivory);

		line-height:
			1.7;
	}


	:global(.story-body blockquote) {
		margin:
			29px 0;

		padding:
			18px 20px;

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(
				191,
				161,
				106,
				.035
			);

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size:
			1.55rem;

		line-height:
			1.25;
	}


	:global(.story-body a) {
		color:
			var(--brand-gold);

		text-decoration-color:
			rgba(
				191,
				161,
				106,
				.4
			);

		text-underline-offset:
			3px;
	}


	:global(.story-body code) {
		padding:
			2px 5px;

		border:
			1px solid
			var(--border);

		border-radius:
			3px;

		background:
			rgba(
				0,
				0,
				0,
				.28
			);

		color:
			var(--brand-gold);
	}


	:global(.story-body hr) {
		margin:
			34px 0;

		border: 0;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.2
			);
	}


	/* ==================================================
	   ERROR
	   ================================================== */

	.article-empty {
		min-height: 260px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 8px;

		padding: 30px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			var(--panel);

		text-align: center;
	}


	.article-empty strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.8rem;

		font-weight: 400;
	}


	.article-empty p {
		max-width: 44ch;

		margin: 0;

		color:
			var(--muted);
	}


	/* ==================================================
	   MOBILE
	   ================================================== */

	@media (max-width: 700px) {

		.article-masthead {
			display: grid;
		}


		.publication-meta {
			display: none;
		}


		.article-nav {
			display: grid;

			gap: 6px;
		}


		.story-header {
			padding:
				27px 21px;
		}


		.manual-article h1 {
			font-size:
				clamp(
					3rem,
					14vw,
					4.5rem
				);
		}


		.story-body {
			padding:
				28px 21px
				44px;
		}

	}
</style>