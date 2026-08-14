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

	function typeLabel(
		value
	) {
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
			labels[value] ||
			value ||
			'Article'
		);
	}

	function dateLabel(
		value
	) {
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
				month:
					'long',

				day:
					'numeric',

				year:
					'numeric'
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
	<div class="article-nav">
		<a href="/league/weekly">
			← The Irving Weekly
		</a>

		<span>
			{post.sourceType ===
			'weekly_recap'
				? `${post.recapSeason} · Week ${post.recapWeek}`
				: typeLabel(
						post.postType
					)}
		</span>
	</div>

	{#if post.sourceType ===
		'weekly_recap'}
		<WeeklyRecapArticle
			recap={
				publishedRecap.recap
			}
		/>
	{:else}
		<article class="manual-article">
			<header>
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
						{post.authorName ||
							'The Irving Weekly'}
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
	.article-page {
		display: grid;
		gap: 14px;
		max-width: 1180px;
		margin: 0 auto;
		padding-bottom: 56px;
	}

	.article-nav {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		align-items: center;
		color: var(--muted);
		font-family:
			var(--font-score);
		font-size: .68rem;
		font-weight: 900;
		letter-spacing: .09em;
		text-transform: uppercase;
	}

	.article-nav a {
		color: #67dbe8;
		text-decoration: none;
	}

	.manual-article {
		border: 2px solid #070808;
		border-radius: 16px;
		padding: 34px;
		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.05),
				rgba(0,0,0,.13)
			),
			linear-gradient(
				180deg,
				var(--bug-gray),
				var(--bug-charcoal) 38%,
				var(--bug-black)
			);
		box-shadow:
			var(--shadow-panel);
	}

	.manual-article header {
		max-width: 980px;
		margin: 0 auto;
		padding-bottom: 25px;
		border-bottom:
			1px solid
			rgba(255,255,255,.12);
	}

	.article-type {
		color: var(--bug-yellow);
		font-family:
			var(--font-score);
		font-size: .68rem;
		font-weight: 950;
		letter-spacing: .13em;
		text-transform: uppercase;
	}

	.manual-article h1 {
		max-width: 920px;
		margin: 9px 0 0;
		font-family:
			var(--font-display);
		font-size:
			clamp(
				2.8rem,
				6vw,
				5rem
			);
		line-height: .94;
		text-wrap: balance;
	}

	.subtitle {
		max-width: 800px;
		margin: 14px 0 0;
		color: #e5e0d6;
		font-size: 1.15rem;
		line-height: 1.45;
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		margin-top: 18px;
		color: #67dbe8;
		font-family:
			var(--font-score);
		font-size: .68rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.byline span + span {
		color: var(--muted);
	}

	.story-body {
		max-width: 880px;
		margin: 0 auto;
		padding-top: 22px;
	}

	:global(.story-body h2) {
		margin: 32px 0 10px;
		font-size: 1.85rem;
		line-height: 1.12;
	}

	:global(.story-body h3) {
		margin: 26px 0 8px;
		font-size: 1.35rem;
	}

	:global(.story-body p) {
		margin: 0 0 17px;
		color: #eee9de;
		font-size: 1.05rem;
		line-height: 1.75;
	}

	:global(.story-body ul),
	:global(.story-body ol) {
		margin: 0 0 20px;
		padding-left: 26px;
	}

	:global(.story-body li) {
		margin: 6px 0;
		color: #eee9de;
		line-height: 1.65;
	}

	:global(.story-body blockquote) {
		margin: 24px 0;
		padding: 15px 18px;
		border-left:
			4px solid
			var(--bug-yellow);
		background:
			rgba(244,220,123,.05);
		color: #e7e0d3;
		font-size: 1.05rem;
		line-height: 1.65;
	}

	:global(.story-body a) {
		color: #67dbe8;
	}

	:global(.story-body code) {
		padding: 2px 5px;
		border-radius: 4px;
		background:
			rgba(0,0,0,.35);
		color: #efc86a;
	}

	@media (max-width: 700px) {
		.article-nav {
			display: grid;
		}

		.manual-article {
			padding: 20px;
		}
	}
</style>