<script>
	export let data;

	$: posts = Array.isArray(data?.posts) ? data.posts : [];

	$: publishedCount = posts.filter(
		(post) => String(post.status).toLowerCase() === 'published'
	).length;

	$: draftCount = posts.filter(
		(post) => String(post.status).toLowerCase() !== 'published' || post.hasPendingDraft
	).length;

	$: manualCount = posts.filter((post) => post.sourceType === 'manual').length;

	$: recapCount = posts.filter((post) => post.sourceType === 'weekly_recap').length;

	function dateLabel(post) {
		let date = null;

		let prefix = '';

		if (post.hasPendingDraft && post.pendingDraftGeneratedAt) {
			date = new Date(post.pendingDraftGeneratedAt * 1000);

			prefix = 'New draft ';
		} else if (post.publishedAt) {
			date = new Date(post.publishedAt);
		} else if (post.updatedAt) {
			date = new Date(post.updatedAt * 1000);
		}

		if (!date || Number.isNaN(date.getTime())) {
			return '—';
		}

		const formatted = date.toLocaleString('en-US', {
			month: 'short',

			day: 'numeric',

			year: 'numeric',

			hour: 'numeric',

			minute: '2-digit'
		});

		return prefix + formatted;
	}

	function typeLabel(post) {
		if (post.sourceType === 'weekly_recap') {
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

		return labels[post.postType] || String(post.postType || 'Article').replaceAll('_', ' ');
	}

	function statusLabel(post) {
		const status = String(post.status || 'draft').toLowerCase();

		if (status === 'published') {
			return 'Published';
		}

		return 'Draft';
	}

	function statusClass(post) {
		return String(post.status || 'draft').toLowerCase() === 'published' ? 'published' : 'draft';
	}
</script>

<svelte:head>
	<title>Irving Weekly Desk | Irving Collective</title>

	<meta
		name="description"
		content="Manage stories, automated weekly recaps, drafts, and published articles for The Irving Weekly."
	/>
</svelte:head>

<div class="weekly-admin">
	<!-- ==================================================
	     HERO
	     ================================================== -->

	<header class="weekly-hero">
		<div class="hero-main">
			<div class="eyebrow">League Media</div>

			<h1>The Irving Weekly</h1>

			<p>
				The league newsroom. Create stories, manage drafts, review automated recaps, and decide what
				actually makes print.
			</p>

			<div class="hero-actions">
				<a class="primary-action" href="/admin/league/irving-weekly/new">
					<span> + </span>

					New Article
				</a>

				<a class="secondary-action" href="/admin/league/weekly-recap"> Recap Lab </a>

				<a class="secondary-action" href="/league/weekly"> View Public Weekly → </a>
			</div>
		</div>

		<div class="publication-mark">
			<div class="iw-mark">IW</div>

			<div>
				<span> Irving Collective </span>

				<strong> Newsroom </strong>

				<small> League publication desk </small>
			</div>
		</div>

		<div class="hero-watermark" aria-hidden="true">WEEKLY</div>
	</header>

	<!-- ==================================================
	     PUBLICATION SUMMARY
	     ================================================== -->

	<section class="summary-strip" aria-label="Publication summary">
		<div>
			<span> Total Stories </span>

			<strong>
				{posts.length}
			</strong>
		</div>

		<div>
			<span> Published </span>

			<strong>
				{publishedCount}
			</strong>
		</div>

		<div>
			<span> Drafts </span>

			<strong>
				{draftCount}
			</strong>
		</div>

		<div>
			<span> Manual </span>

			<strong>
				{manualCount}
			</strong>
		</div>

		<div>
			<span> Recaps </span>

			<strong>
				{recapCount}
			</strong>
		</div>
	</section>

	<!-- ==================================================
	     STORY DESK
	     ================================================== -->

	<section class="story-desk">
		<header class="section-heading">
			<div>
				<div class="section-kicker">Publication Archive</div>

				<h2>Story Desk</h2>

				<p>Published stories, works in progress, and automated weekly recaps.</p>
			</div>

			<div class="story-count">
				{posts.length}
				stor{posts.length === 1 ? 'y' : 'ies'}
			</div>
		</header>

		{#if posts.length}
			<div class="post-list">
				{#each posts as post, index}
					<article class="post-row">
						<div class="story-number">
							{String(index + 1).padStart(2, '0')}
						</div>

						<div class="post-main">
							<div class="meta">
								<span class={`status ${statusClass(post)}`}>
									{statusLabel(post)}
								</span>

								{#if post.hasPendingDraft}
									<span class="pending-draft"> New Draft </span>
								{/if}

								<span class="story-type">
									{typeLabel(post)}
								</span>

								{#if post.sourceType === 'weekly_recap'}
									<span class="source-label"> Automated </span>
								{:else}
									<span class="source-label"> Manual </span>
								{/if}
							</div>

							<h3>
								{post.hasPendingDraft && post.pendingDraftTitle
									? post.pendingDraftTitle
									: post.title}
							</h3>

							{#if post.hasPendingDraft ? post.pendingDraftSubtitle : post.subtitle}
								<p>
									{post.hasPendingDraft ? post.pendingDraftSubtitle : post.subtitle}
								</p>
							{/if}

							<div class="post-date">
								{dateLabel(post)}
							</div>
						</div>

						<div class="post-actions">
							{#if post.sourceType === 'manual'}
								<a href={`/admin/league/irving-weekly/${post.id}`}>
									<span> Edit Story </span>

									<strong> → </strong>
								</a>
							{:else}
								<a
									href={`/admin/league/weekly-recap?season=${post.recapSeason}&week=${post.recapWeek}`}
								>
									<span>
	{post.hasPendingDraft
		? 'Review New Draft'
		: 'Open Recap Lab'}
</span>

									<strong> → </strong>
								</a>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="empty">
				<div class="empty-mark">IW</div>

				<div class="section-kicker">Newsroom</div>

				<h3>The presses are quiet.</h3>

				<p>No Irving Weekly stories exist yet.</p>

				<a href="/admin/league/irving-weekly/new"> Create the First Article → </a>
			</div>
		{/if}
	</section>
</div>

<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.weekly-admin {
		width: 100%;
		max-width: 1320px;

		display: grid;
		gap: 18px;

		margin: 0 auto;

		padding-bottom: 60px;
	}

	.eyebrow,
	.section-kicker {
		color: var(--brand-gold);

		font-size: 0.56rem;

		font-weight: 800;

		letter-spacing: 0.15em;

		text-transform: uppercase;
	}

	/* ==================================================
	   HERO
	   ================================================== */

	.weekly-hero {
		position: relative;

		min-height: 280px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			250px;

		align-items: center;

		gap: 40px;

		overflow: hidden;

		padding: clamp(30px, 5vw, 46px);

		border: 1px solid var(--border-strong);

		border-radius: var(--radius-lg);

		background:
			linear-gradient(120deg, rgba(191, 161, 106, 0.05), transparent 42%), var(--panel-strong);

		box-shadow: var(--shadow-panel);
	}

	.hero-main {
		position: relative;

		z-index: 2;

		min-width: 0;
	}

	.weekly-hero h1 {
		margin: 8px 0 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: clamp(4rem, 6.8vw, 6.7rem);

		font-weight: 400;

		line-height: 0.86;

		letter-spacing: -0.02em;

		text-transform: uppercase;
	}

	.weekly-hero p {
		max-width: 720px;

		margin: 22px 0 0;

		color: var(--muted);

		font-size: 0.96rem;

		font-weight: 600;

		line-height: 1.55;
	}

	/* ==================================================
	   HERO ACTIONS
	   ================================================== */

	.hero-actions {
		display: flex;

		flex-wrap: wrap;

		gap: 8px;

		margin-top: 25px;
	}

	.hero-actions a {
		min-height: 39px;

		display: inline-flex;

		align-items: center;

		justify-content: center;

		gap: 7px;

		padding: 8px 12px;

		border: 1px solid var(--border-strong);

		border-radius: 3px;

		font-size: 0.56rem;

		font-weight: 850;

		letter-spacing: 0.07em;

		text-decoration: none;

		text-transform: uppercase;

		transition:
			border-color 120ms ease,
			color 120ms ease,
			background 120ms ease,
			transform 120ms ease;
	}

	.hero-actions a:hover {
		transform: translateY(-1px);
	}

	.primary-action {
		border-color: var(--brand-gold) !important;

		background: var(--brand-gold);

		color: var(--brand-charcoal);
	}

	.primary-action:hover {
		background: var(--brand-sand);

		border-color: var(--brand-sand) !important;
	}

	.primary-action > span {
		font-size: 0.9rem;

		line-height: 0.5;
	}

	.secondary-action {
		background: rgba(8, 11, 10, 0.35);

		color: var(--brand-sand);
	}

	.secondary-action:hover {
		border-color: var(--brand-gold);

		color: var(--brand-gold);
	}

	/* ==================================================
	   NEWSROOM IDENTITY
	   ================================================== */

	.publication-mark {
		position: relative;

		z-index: 2;

		min-height: 180px;

		display: flex;

		align-items: center;

		justify-content: center;

		gap: 16px;

		padding: 20px;

		border: 1px solid rgba(191, 161, 106, 0.22);

		background: rgba(8, 11, 10, 0.38);
	}

	.iw-mark {
		flex: 0 0 auto;

		width: 62px;
		height: 62px;

		display: grid;

		place-items: center;

		border: 1px solid var(--brand-gold);

		color: var(--brand-gold);

		font-family: var(--font-display);

		font-size: 1.45rem;
	}

	.publication-mark > div:last-child {
		display: grid;

		gap: 2px;
	}

	.publication-mark span {
		color: var(--brand-stone);

		font-size: 0.48rem;

		font-weight: 800;

		letter-spacing: 0.14em;

		text-transform: uppercase;
	}

	.publication-mark strong {
		color: var(--brand-sand);

		font-family: var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}

	.publication-mark small {
		margin-top: 5px;

		color: var(--brand-gold);

		font-size: 0.45rem;

		font-weight: 750;

		letter-spacing: 0.08em;

		text-transform: uppercase;
	}

	.hero-watermark {
		position: absolute;

		right: -25px;
		bottom: -45px;

		color: rgba(191, 161, 106, 0.017);

		font-family: var(--font-display);

		font-size: clamp(8rem, 14vw, 13rem);

		line-height: 1;

		pointer-events: none;
	}

	/* ==================================================
	   SUMMARY
	   ================================================== */

	.summary-strip {
		display: grid;

		grid-template-columns: repeat(5, minmax(0, 1fr));

		border: 1px solid var(--border);

		background: rgba(8, 11, 10, 0.3);
	}

	.summary-strip > div {
		min-height: 80px;

		display: grid;

		align-content: center;

		gap: 4px;

		padding: 12px 15px;

		border-right: 1px solid var(--border);
	}

	.summary-strip > div:last-child {
		border-right: 0;
	}

	.summary-strip span {
		color: var(--brand-stone);

		font-size: 0.5rem;

		font-weight: 800;

		letter-spacing: 0.12em;

		text-transform: uppercase;
	}

	.summary-strip strong {
		color: var(--brand-gold);

		font-family: var(--font-display);

		font-size: 1.65rem;

		font-weight: 400;

		line-height: 1;
	}

	/* ==================================================
	   STORY DESK
	   ================================================== */

	.story-desk {
		overflow: hidden;

		border: 1px solid var(--border);

		border-radius: var(--radius-md);

		background: var(--panel);

		box-shadow: var(--shadow-panel);
	}

	.section-heading {
		min-height: 95px;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 25px;

		padding: 18px 20px;

		border-bottom: 1px solid rgba(191, 161, 106, 0.13);
	}

	.section-heading h2 {
		margin: 4px 0 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 2.35rem;

		font-weight: 400;

		line-height: 1;
	}

	.section-heading p {
		margin: 6px 0 0;

		color: var(--muted);

		font-size: 0.72rem;
	}

	.story-count {
		color: var(--brand-stone);

		font-size: 0.52rem;

		font-weight: 800;

		letter-spacing: 0.1em;

		text-transform: uppercase;
	}

	/* ==================================================
	   POSTS
	   ================================================== */

	.post-list {
		display: grid;
	}

	.post-row {
		position: relative;

		display: grid;

		grid-template-columns:
			54px
			minmax(0, 1fr)
			auto;

		align-items: center;

		gap: 17px;

		min-height: 135px;

		padding: 17px 20px;

		border-bottom: 1px solid rgba(191, 161, 106, 0.1);

		background: transparent;

		transition: background 100ms ease;
	}

	.post-row:last-child {
		border-bottom: 0;
	}

	.post-row:hover {
		background: rgba(191, 161, 106, 0.025);
	}

	.story-number {
		align-self: stretch;

		display: grid;

		place-items: start center;

		padding-top: 4px;

		border-right: 1px solid rgba(191, 161, 106, 0.14);

		color: rgba(191, 161, 106, 0.42);

		font-family: var(--font-display);

		font-size: 1.4rem;
	}

	.post-main {
		min-width: 0;

		display: grid;

		gap: 6px;
	}

	.meta {
		display: flex;

		flex-wrap: wrap;

		align-items: center;

		gap: 8px;
	}

	.meta > span {
		font-size: 0.5rem;

		font-weight: 800;

		letter-spacing: 0.1em;

		text-transform: uppercase;
	}

	.status {
		padding: 3px 5px;

		border: 1px solid var(--border);
	}

	.status.published {
		border-color: rgba(116, 160, 123, 0.45);

		color: #91b897;
	}

	.status.draft {
		border-color: rgba(191, 161, 106, 0.42);

		color: var(--brand-gold);
	}
	.pending-draft {
	padding:
		3px 5px;

	border:
		1px solid
		var(--brand-gold);

	background:
		rgba(
			191,
			161,
			106,
			.08
		);

	color:
		var(--brand-gold);
}

	.story-type {
		color: var(--brand-sand);
	}

	.source-label {
		color: var(--brand-stone);
	}

	.post-row h3 {
		max-width: 900px;

		margin: 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 1.55rem;

		font-weight: 400;

		line-height: 1.08;

		text-transform: uppercase;
	}

	.post-row p {
		max-width: 880px;

		margin: 0;

		color: var(--muted);

		font-size: 0.82rem;

		line-height: 1.45;
	}

	.post-date {
		color: var(--brand-stone);

		font-size: 0.62rem;
	}

	/* ==================================================
	   POST ACTIONS
	   ================================================== */

	.post-actions {
		display: flex;

		align-items: center;
	}

	.post-actions a {
		min-width: 140px;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 15px;

		padding: 10px 11px;

		border: 1px solid var(--border-strong);

		border-radius: 3px;

		color: var(--brand-sand);

		font-size: 0.52rem;

		font-weight: 800;

		letter-spacing: 0.07em;

		text-decoration: none;

		text-transform: uppercase;

		transition:
			border-color 120ms ease,
			color 120ms ease,
			background 120ms ease;
	}

	.post-actions a strong {
		color: var(--brand-gold);

		font-size: 0.9rem;
	}

	.post-actions a:hover {
		border-color: var(--brand-gold);

		background: rgba(191, 161, 106, 0.04);

		color: var(--brand-gold);
	}

	/* ==================================================
	   EMPTY
	   ================================================== */

	.empty {
		min-height: 300px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 7px;

		padding: 30px;

		text-align: center;
	}

	.empty-mark {
		width: 62px;
		height: 62px;

		display: grid;

		place-items: center;

		margin-bottom: 5px;

		border: 1px solid var(--brand-gold);

		color: var(--brand-gold);

		font-family: var(--font-display);

		font-size: 1.4rem;
	}

	.empty h3 {
		margin: 0;

		color: var(--brand-ivory);

		font-family: var(--font-display);

		font-size: 1.7rem;

		font-weight: 400;
	}

	.empty p {
		margin: 0;

		color: var(--muted);
	}

	.empty a {
		margin-top: 10px;

		color: var(--brand-gold);

		font-size: 0.58rem;

		font-weight: 800;

		letter-spacing: 0.07em;

		text-decoration: none;

		text-transform: uppercase;
	}

	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 900px) {
		.weekly-hero {
			grid-template-columns:
				1fr
				210px;
		}

		.summary-strip {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.summary-strip > div {
			border-bottom: 1px solid var(--border);
		}
	}

	@media (max-width: 700px) {
		.weekly-hero {
			grid-template-columns: 1fr;

			min-height: 0;

			padding: 28px 22px;
		}

		.publication-mark {
			display: none;
		}

		.weekly-hero h1 {
			font-size: clamp(3.4rem, 15vw, 5.3rem);
		}

		.summary-strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.section-heading {
			align-items: flex-start;

			flex-direction: column;
		}

		.post-row {
			grid-template-columns:
				36px
				minmax(0, 1fr);
		}

		.post-actions {
			grid-column: 2;
		}

		.post-actions a {
			width: fit-content;
		}
	}

	@media (max-width: 480px) {
		.summary-strip {
			grid-template-columns: 1fr;
		}

		.hero-actions {
			display: grid;
		}

		.hero-actions a {
			width: 100%;
		}

		.story-number {
			display: none;
		}

		.post-row {
			grid-template-columns: 1fr;
		}

		.post-actions {
			grid-column: auto;
		}
	}
</style>
