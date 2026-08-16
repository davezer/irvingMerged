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

	function typeLabel(post) {
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
			post?.postType ||
			'Article'
		);
	}

	function publishedDate(value) {
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
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			}
		);
	}
</script>


<svelte:head>
	<title>
		The Irving Weekly | Irving Collective
	</title>

	<meta
		name="description"
		content="League news, weekly recaps, features, power rankings, and regrettable decisions from the Irving Collective."
	/>
</svelte:head>


<div class="weekly-page">

	<!-- ==================================================
	     MASTHEAD
	     ================================================== -->

	<header class="masthead">

		<div class="masthead-top">
			<span>
				Irving Collective
			</span>

			<span>
				Est. 2003
			</span>
		</div>


		<div class="masthead-title">

			<span class="publication-mark">
				ICL
			</span>

			<h1>
				The Irving Weekly
			</h1>

		</div>


		<div class="masthead-bottom">
			<span>
				League News
			</span>

			<i></i>

			<span>
				Recaps
			</span>

			<i></i>

			<span>
				Features
			</span>

			<i></i>

			<span>
				Power Rankings
			</span>

			<i></i>

			<span>
				Regrettable Decisions
			</span>
		</div>

	</header>


	<!-- ==================================================
	     LEAD STORY
	     ================================================== -->

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
						<time>
							{publishedDate(
								lead.publishedAt
							)}
						</time>
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
					lead.excerpt !==
						lead.subtitle}

					<p class="lead-excerpt">
						{lead.excerpt}
					</p>

				{/if}


				<div class="lead-footer">

					<div class="byline">
						By
						<strong>
							{lead.authorName ||
								'The Irving Weekly'}
						</strong>
					</div>

					<div class="read-more">
						Read the story →
					</div>

				</div>


				<div
					class="lead-watermark"
					aria-hidden="true"
				>
					WEEKLY
				</div>

			</a>

		</section>


		<!-- ==================================================
		     MORE STORIES
		     ================================================== -->

		{#if remaining.length}

			<section class="latest">

				<header class="section-heading">

					<div>
						<span>
							On the Desk
						</span>

						<h2>
							More from Irving
						</h2>
					</div>

					<div class="heading-rule"></div>

				</header>


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
									<time>
										{publishedDate(
											post.publishedAt
										)}
									</time>
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

			<div class="empty-mark">
				IW
			</div>

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
	/* ==================================================
	   THE IRVING WEEKLY
	   ================================================== */

	.weekly-page {
		width: 100%;
		max-width: 1180px;

		display: grid;
		gap: 26px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	/* ==================================================
	   MASTHEAD
	   ================================================== */

	.masthead {
		display: grid;

		padding:
			0 0 18px;

		border-top:
			1px solid
			var(--brand-gold);

		border-bottom:
			3px double
			var(--brand-gold);
	}


	.masthead-top {
		display: flex;

		justify-content:
			space-between;

		gap: 20px;

		padding:
			11px 4px 10px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.22
			);

		color:
			var(--brand-stone);

		font-size: .58rem;

		font-weight: 800;

		letter-spacing: .15em;

		text-transform: uppercase;
	}


	.masthead-title {
		position: relative;

		display: flex;

		align-items: center;

		justify-content: center;

		gap: 17px;

		padding:
			19px 0 12px;
	}


	.publication-mark {
		display: grid;
		place-items: center;

		width: 47px;
		height: 47px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.35rem;
	}


	.masthead h1 {
		margin: 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				9vw,
				7.4rem
			);

		font-weight: 400;

		line-height: .82;

		letter-spacing:
			-.02em;

		text-transform:
			uppercase;

		text-shadow: none;
	}


	.masthead-bottom {
		display: flex;

		justify-content: center;

		align-items: center;

		flex-wrap: wrap;

		gap: 10px;

		margin-top: 13px;

		color:
			var(--brand-gold);

		font-size: .57rem;

		font-weight: 800;

		letter-spacing: .13em;

		text-transform: uppercase;
	}


	.masthead-bottom i {
		width: 3px;
		height: 3px;

		border-radius: 50%;

		background:
			var(--brand-stone);
	}


	/* ==================================================
	   META
	   ================================================== */

	.story-meta {
		display: flex;

		flex-wrap: wrap;

		gap: 12px;

		color:
			var(--brand-gold);

		font-size: .58rem;

		font-weight: 800;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.story-meta time {
		color:
			var(--brand-stone);
	}


	/* ==================================================
	   LEAD STORY
	   ================================================== */

	.lead-story {
		overflow: hidden;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-md);

		background:
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);

		transition:
			border-color
			120ms ease,
			transform
			120ms ease;
	}


	.lead-story:hover {
		border-color:
			rgba(
				191,
				161,
				106,
				.52
			);
	}


	.lead-link {
		position: relative;

		display: grid;

		min-height: 390px;

		align-content: center;

		padding:
			clamp(
				28px,
				5vw,
				52px
			);

		overflow: hidden;

		color: inherit;

		text-decoration: none;

		background:
			linear-gradient(
				120deg,
				rgba(
					191,
					161,
					106,
					.065
				),
				transparent 52%
			);
	}


	.lead-link::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 3px;

		background:
			var(--brand-gold);
	}


	.lead-story h2 {
		position: relative;
		z-index: 2;

		max-width: 940px;

		margin:
			14px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				3rem,
				6.2vw,
				5.8rem
			);

		font-weight: 400;

		line-height:
			.9;

		letter-spacing:
			-.01em;

		text-wrap: balance;
	}


	.lead-subtitle {
		position: relative;
		z-index: 2;

		max-width: 820px;

		margin:
			21px 0 0;

		color:
			var(--brand-sand);

		font-size:
			1.12rem;

		font-weight: 600;

		line-height: 1.52;
	}


	.lead-excerpt {
		position: relative;
		z-index: 2;

		max-width: 760px;

		margin:
			13px 0 0;

		color:
			var(--muted);

		line-height: 1.6;
	}


	.lead-footer {
		position: relative;
		z-index: 2;

		display: flex;

		align-items: center;

		justify-content:
			space-between;

		flex-wrap: wrap;

		gap: 16px;

		margin-top: 27px;

		padding-top: 17px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.13
			);
	}


	.byline {
		color:
			var(--brand-stone);

		font-size: .58rem;

		font-weight: 750;

		letter-spacing:
			.08em;

		text-transform: uppercase;
	}


	.byline strong {
		margin-left: 4px;

		color:
			var(--brand-ivory);
	}


	.read-more {
		color:
			var(--brand-gold);

		font-size: .63rem;

		font-weight: 850;

		letter-spacing:
			.06em;

		text-transform: uppercase;
	}


	.lead-watermark {
		position: absolute;

		right: -25px;
		bottom: -37px;

		color:
			rgba(
				191,
				161,
				106,
				.025
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				6rem,
				12vw,
				10rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   SECTION HEADING
	   ================================================== */

	.section-heading {
		display: grid;

		grid-template-columns:
			auto
			1fr;

		gap: 18px;

		align-items: end;

		margin-bottom: 14px;
	}


	.section-heading span {
		color:
			var(--brand-gold);

		font-size: .57rem;

		font-weight: 800;

		letter-spacing: .14em;

		text-transform: uppercase;
	}


	.section-heading h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;
	}


	.heading-rule {
		height: 1px;

		margin-bottom: 5px;

		background:
			rgba(
				191,
				161,
				106,
				.23
			);
	}


	/* ==================================================
	   STORY GRID
	   ================================================== */

	.story-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 12px;
	}


	.story-card {
		min-height: 230px;

		display: grid;

		grid-template-rows:
			auto
			auto
			1fr
			auto;

		gap: 11px;

		padding: 20px;

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

		text-decoration: none;

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


	.story-card h3 {
		margin:
			3px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			1.75rem;

		font-weight: 400;

		line-height: 1;
	}


	.story-card p {
		margin: 0;

		color:
			var(--muted);

		line-height: 1.5;
	}


	.card-footer {
		display: flex;

		justify-content:
			space-between;

		align-items: center;

		gap: 15px;

		margin-top: auto;

		padding-top: 14px;

		border-top:
			1px solid
			rgba(
				191,
				161,
				106,
				.11
			);

		color:
			var(--brand-stone);

		font-size: .56rem;

		font-weight: 750;

		letter-spacing:
			.06em;

		text-transform: uppercase;
	}


	.card-footer strong {
		color:
			var(--brand-gold);
	}


	/* ==================================================
	   EMPTY
	   ================================================== */

	.empty {
		min-height: 300px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 10px;

		padding: 40px;

		border:
			1px solid
			var(--border);

		border-radius:
			var(--radius-md);

		background:
			var(--panel);

		text-align: center;
	}


	.empty-mark {
		display: grid;
		place-items: center;

		width: 62px;
		height: 62px;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.5rem;
	}


	.empty h2 {
		margin: 8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2rem;

		font-weight: 400;
	}


	.empty p {
		margin: 0;

		color:
			var(--muted);
	}


	/* ==================================================
	   MOBILE
	   ================================================== */

	@media (max-width: 760px) {

		.publication-mark {
			display: none;
		}


		.masthead h1 {
			font-size:
				clamp(
					3.5rem,
					17vw,
					5.5rem
				);
		}


		.masthead-bottom {
			gap: 7px;
		}


		.story-grid {
			grid-template-columns:
				1fr;
		}


		.lead-link {
			min-height: 0;

			padding: 25px;
		}


		.lead-story h2 {
			font-size:
				clamp(
					2.7rem,
					13vw,
					4.3rem
				);
		}

	}
</style>