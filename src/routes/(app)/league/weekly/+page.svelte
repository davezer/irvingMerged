<script>
	export let data;

	$: posts =
		data.posts ||
		[];

	$: lead =
		posts[0] ||
		null;

	$: remaining =
		posts.slice(1);

	function typeLabel(
		post
	) {
		if (
			post.sourceType ===
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
				post.postType
			] ||
			post.postType ||
			'Article'
		);
	}

	function publishedDate(
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
					'short',

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
		The Irving Weekly | Irving Champions League
	</title>

	<meta
		name="description"
		content="The latest stories, recaps, trades, power rankings, league news, and general nonsense from the Irving Champions League."
	/>
</svelte:head>

<div class="weekly-page">
	<header class="masthead">
		<div class="masthead-rule">
			<span>
				Irving Champions League
			</span>

			<span>
				Est. 2004
			</span>
		</div>

		<h1>
			The Irving Weekly
		</h1>

		<div class="masthead-bottom">
			League news, recaps, features,
			power rankings, and regrettable decisions.
		</div>
	</header>

	{#if lead}
		<section class="lead-story">
			<a
				href={`/league/weekly/${lead.slug}`}
				class="lead-link"
			>
				<div class="story-meta">
					<span>
						{typeLabel(lead)}
					</span>

					{#if lead.publishedAt}
						<span>
							{publishedDate(
								lead.publishedAt
							)}
						</span>
					{/if}
				</div>

				<h2>
					{lead.title}
				</h2>

				{#if lead.subtitle}
					<p class="lead-subtitle">
						{lead.subtitle}
					</p>
				{/if}

				{#if lead.excerpt &&
				lead.excerpt !== lead.subtitle}
					<p class="lead-excerpt">
						{lead.excerpt}
					</p>
				{/if}

				<div class="byline">
					{lead.authorName ||
						'The Irving Weekly'}
				</div>

				<div class="read-more">
					Read the story →
				</div>
			</a>
		</section>

		{#if remaining.length}
			<section class="latest">
				<div class="section-heading">
					<span>
						Latest
					</span>

					<div></div>
				</div>

				<div class="story-grid">
					{#each remaining as post}
						<a
							class="story-card"
							href={`/league/weekly/${post.slug}`}
						>
							<div class="story-meta">
								<span>
									{typeLabel(post)}
								</span>

								{#if post.publishedAt}
									<span>
										{publishedDate(
											post.publishedAt
										)}
									</span>
								{/if}
							</div>

							<h3>
								{post.title}
							</h3>

							{#if post.subtitle}
								<p>
									{post.subtitle}
								</p>
							{:else if post.excerpt}
								<p>
									{post.excerpt}
								</p>
							{/if}

							<div class="card-footer">
								<span>
									{post.authorName ||
										'The Irving Weekly'}
								</span>

								<strong>
									Read →
								</strong>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{:else}
		<section class="empty">
			<h2>
				The presses are quiet.
			</h2>

			<p>
				Nothing has been published yet.
			</p>
		</section>
	{/if}
</div>

<style>
	.weekly-page {
		display: grid;
		gap: 24px;
		max-width: 1180px;
		margin: 0 auto;
		padding-bottom: 56px;
	}

	.masthead {
		display: grid;
		text-align: center;
		border-top: 4px solid #efeee5;
		border-bottom: 4px double #efeee5;
		padding: 12px 0 16px;
	}

	.masthead-rule {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		padding: 0 4px 9px;
		border-bottom:
			1px solid
			rgba(255,255,255,.22);
		color: var(--muted);
		font-family:
			var(--font-score);
		font-size: .66rem;
		font-weight: 900;
		letter-spacing: .12em;
		text-transform: uppercase;
	}

	.masthead h1 {
		margin: 12px 0 4px;
		font-family:
			var(--font-display);
		font-size:
			clamp(
				4rem,
				10vw,
				7.5rem
			);
		line-height: .82;
		letter-spacing: -.02em;
	}

	.masthead-bottom {
		margin-top: 11px;
		color: var(--bug-yellow);
		font-family:
			var(--font-score);
		font-size: .7rem;
		font-weight: 950;
		letter-spacing: .13em;
		text-transform: uppercase;
	}

	.lead-story {
		border: 2px solid #070808;
		border-radius: 15px;
		overflow: hidden;
		background:
			linear-gradient(
				135deg,
				rgba(0,231,236,.07),
				transparent 45%
			),
			linear-gradient(
				180deg,
				#3a4240,
				#161918
			);
		box-shadow:
			var(--shadow-panel);
	}

	.lead-link {
		display: grid;
		padding: 32px;
		color: inherit;
		text-decoration: none;
	}

	.story-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		color: #67dbe8;
		font-family:
			var(--font-score);
		font-size: .67rem;
		font-weight: 950;
		letter-spacing: .11em;
		text-transform: uppercase;
	}

	.story-meta span + span {
		color: var(--muted);
	}

	.lead-story h2 {
		max-width: 950px;
		margin: 12px 0 0;
		font-family:
			var(--font-display);
		font-size:
			clamp(
				2.8rem,
				6vw,
				5.2rem
			);
		line-height: .93;
		text-wrap: balance;
	}

	.lead-subtitle {
		max-width: 820px;
		margin: 15px 0 0;
		color: #eee9de;
		font-size: 1.16rem;
		line-height: 1.45;
	}

	.lead-excerpt {
		max-width: 760px;
		margin: 12px 0 0;
		color: var(--muted);
		line-height: 1.55;
	}

	.byline {
		margin-top: 20px;
		color: var(--muted);
		font-family:
			var(--font-score);
		font-size: .7rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.read-more {
		margin-top: 22px;
		color: var(--bug-yellow);
		font-family:
			var(--font-score);
		font-weight: 950;
		text-transform: uppercase;
	}

	.section-heading {
		display: grid;
		grid-template-columns:
			auto 1fr;
		gap: 14px;
		align-items: center;
		margin-bottom: 12px;
		color: var(--bug-yellow);
		font-family:
			var(--font-score);
		font-size: .72rem;
		font-weight: 950;
		letter-spacing: .13em;
		text-transform: uppercase;
	}

	.section-heading div {
		height: 1px;
		background:
			rgba(255,255,255,.18);
	}

	.story-grid {
		display: grid;
		grid-template-columns:
			repeat(
				2,
				minmax(0, 1fr)
			);
		gap: 12px;
	}

	.story-card {
		display: grid;
		align-content: start;
		gap: 10px;
		min-height: 220px;
		padding: 20px;
		border: 2px solid #070808;
		border-radius: 13px;
		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.07),
				rgba(0,0,0,.09)
			),
			linear-gradient(
				180deg,
				#303735,
				#151817
			);
		color: inherit;
		text-decoration: none;
		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.11);
		transition:
			transform .13s ease,
			border-color .13s ease;
	}

	.story-card:hover,
	.lead-story:hover {
		border-color:
			rgba(103,219,232,.52);
	}

	.story-card:hover {
		transform:
			translateY(-2px);
	}

	.story-card h3 {
		margin: 1px 0 0;
		font-size: 1.55rem;
		line-height: 1.1;
	}

	.story-card p {
		margin: 0;
		color: var(--muted);
		line-height: 1.5;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		gap: 15px;
		align-items: center;
		margin-top: auto;
		padding-top: 14px;
		border-top:
			1px solid
			rgba(255,255,255,.09);
		color: var(--muted);
		font-family:
			var(--font-score);
		font-size: .66rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.card-footer strong {
		color: #67dbe8;
	}

	.empty {
		padding: 40px;
		border:
			1px solid
			rgba(255,255,255,.13);
		border-radius: 14px;
		text-align: center;
	}

	.empty h2,
	.empty p {
		margin: 0;
	}

	.empty p {
		margin-top: 8px;
		color: var(--muted);
	}

	@media (max-width: 760px) {
		.story-grid {
			grid-template-columns: 1fr;
		}

		.lead-link {
			padding: 22px;
		}

		.masthead-rule {
			font-size: .58rem;
		}
	}
</style>