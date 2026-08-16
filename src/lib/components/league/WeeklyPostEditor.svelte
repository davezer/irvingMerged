<script>
	import {
		renderWeeklyMarkdown
	} from '$lib/weeklyMarkdown.js';

	export let post = null;
	export let user = null;
	export let isNew = false;
	export let message = null;


	let title =
		post?.title ||
		'';

	let subtitle =
		post?.subtitle ||
		'';

	let excerpt =
		post?.excerpt ||
		'';

	let slug =
		post?.slug ||
		'';

	let postType =
		post?.postType ||
		'feature';

	let authorName =
		post?.authorName ||
		user?.displayName ||
		'';

	let body =
		post?.body ||
		'';


	$: previewHtml =
		renderWeeklyMarkdown(
			body
		);


	$: status =
		post?.status ||
		'draft';


	function typeLabel(value) {
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
</script>


<div class="editor-shell">

	<!-- ==================================================
	     EDITOR HEADER
	     ================================================== -->

	<header class="editor-header">

		<div class="header-copy">

			<div class="eyebrow">
				The Irving Weekly
			</div>

			<h1>
				{isNew
					? 'New Article'
					: 'Edit Article'}
			</h1>

			<p>
				Write it. Preview it. Publish it.
				Try not to start a league incident.
			</p>

		</div>


		<div class="header-side">

			{#if post}

				<div
					class="status"
					class:published={
						status ===
						'published'
					}
				>

					<span class="status-dot"></span>

					{status}

				</div>

			{:else}

				<div class="status">

					<span class="status-dot"></span>

					New Draft

				</div>

			{/if}


			<a
				class="back-link"
				href="/admin/league/irving-weekly"
			>
				← Publication Desk
			</a>

		</div>


		<div
			class="header-watermark"
			aria-hidden="true"
		>
			WRITE
		</div>

	</header>


	<!-- ==================================================
	     MESSAGE
	     ================================================== -->

	{#if message}

		<div class="message">

			<div>
				!
			</div>

			<span>
				{message}
			</span>

		</div>

	{/if}


	<form
		method="POST"
		action={isNew
			? '?/create'
			: '?/save'}
	>

		<!-- ==================================================
		     STORY DETAILS
		     ================================================== -->

		<section class="meta-section">

			<header class="section-heading">

				<div>

					<div class="section-kicker">
						Story Setup
					</div>

					<h2>
						Article Details
					</h2>

				</div>


				<div class="section-number">
					01
				</div>

			</header>


			<div class="meta-grid">

				<label class="wide">

					<span>
						Title
					</span>

					<input
						name="title"
						bind:value={title}
						required
						placeholder="The Trade Deadline Is Going to Get Stupid"
					/>

				</label>


				<label class="wide">

					<span>
						Subtitle
					</span>

					<input
						name="subtitle"
						bind:value={subtitle}
						placeholder="Seven contenders, too much draft money..."
					/>

				</label>


				<label>

					<span>
						Article Type
					</span>

					<select
						name="postType"
						bind:value={postType}
					>

						<option value="feature">
							Feature
						</option>

						<option value="commissioner">
							Commissioner
						</option>

						<option value="league_news">
							League News
						</option>

						<option value="power_rankings">
							Power Rankings
						</option>

						<option value="announcement">
							Announcement
						</option>

						<option value="opinion">
							Opinion
						</option>

					</select>

				</label>


				<label>

					<span>
						Author
					</span>

					<input
						name="authorName"
						bind:value={authorName}
						placeholder="The Irving Weekly"
					/>

				</label>


				<label class="wide">

					<span>
						URL Slug
					</span>

					<input
						name="slug"
						bind:value={slug}
						placeholder="Leave blank to generate automatically from title"
					/>

					<small>
						Leave this blank unless you need a custom URL.
					</small>

				</label>


				<label class="wide">

					<div class="label-row">

						<span>
							Card Excerpt
						</span>

						<small>
							Front-page teaser
						</small>

					</div>

					<textarea
						name="excerpt"
						class="excerpt"
						bind:value={excerpt}
						rows="3"
						placeholder="Short description shown on The Irving Weekly front page."
					></textarea>

				</label>

			</div>

		</section>


		<!-- ==================================================
		     WRITING DESK
		     ================================================== -->

		<section class="writing-section">

			<header class="section-heading">

				<div>

					<div class="section-kicker">
						Editorial Desk
					</div>

					<h2>
						Write & Preview
					</h2>

				</div>


				<div class="section-number">
					02
				</div>

			</header>


			<div class="writing-grid">

				<!-- ==========================================
				     EDITOR
				     ========================================== -->

				<div class="writing-pane">

					<header class="pane-header">

						<div>

							<span>
								Article
							</span>

							<strong>
								Markdown Editor
							</strong>

						</div>


						<small>
							{body.length.toLocaleString()}
							characters
						</small>

					</header>


					<textarea
						name="body"
						class="article-editor"
						bind:value={body}
						placeholder={`## Buyers

**Dunedin Homers** have decided tomorrow is somebody else's problem.

- Christian McCaffrey
- $75 of draft capital
- absolutely no fear`}
					></textarea>


					<footer class="markdown-help">

						<span>
							Markdown:
						</span>

						<code>
							## Heading
						</code>

						<code>
							**bold**
						</code>

						<code>
							- list
						</code>

						<code>
							&gt; quote
						</code>

					</footer>

				</div>


				<!-- ==========================================
				     PREVIEW
				     ========================================== -->

				<div class="preview-pane">

					<header class="pane-header">

						<div>

							<span>
								Live Preview
							</span>

							<strong>
								The Irving Weekly
							</strong>

						</div>


						<small>
							Editorial Preview
						</small>

					</header>


					<div class="preview-scroll">

						<article class="markdown-preview">

							<div class="preview-masthead">

								<span>
									The Irving Weekly
								</span>

								<small>
									Irving Collective
								</small>

							</div>


							<div class="preview-type">
								{typeLabel(
									postType
								)}
							</div>


							{#if title}

								<h1>
									{title}
								</h1>

							{:else}

								<h1 class="preview-placeholder">
									Your Headline Goes Here
								</h1>

							{/if}


							{#if subtitle}

								<p class="subtitle">
									{subtitle}
								</p>

							{/if}


							<div class="byline">

								<span>
									By
									{authorName ||
										'The Irving Weekly'}
								</span>

							</div>


							<div class="preview-rule"></div>


							{#if body}

								<div class="markdown-body">
									{@html previewHtml}
								</div>

							{:else}

								<div class="preview-empty">

									<span>
										IW
									</span>

									<p>
										Start writing on the left.
										Your article will appear here.
									</p>

								</div>

							{/if}

						</article>

					</div>

				</div>

			</div>

		</section>


		<!-- ==================================================
		     ACTION BAR
		     ================================================== -->

		<div class="actions">

			<div class="action-context">

				<span>
					Publication Status
				</span>

				<strong>
					{isNew
						? 'New Draft'
						: status}
				</strong>

			</div>


			<div class="action-buttons">

				{#if isNew}

					<button
						type="submit"
						class="save"
					>
						Save Draft
					</button>

				{:else}

					<button
						type="submit"
						formaction="?/save"
						class="save"
					>
						Save Draft
					</button>


					<button
						type="submit"
						formaction="?/publish"
						class="publish"
					>
						{post?.status === 'published'
							? 'Update Published Article'
							: 'Publish Article'}
					</button>


					{#if post?.status === 'published'}

						<button
							type="submit"
							formaction="?/unpublish"
							class="unpublish"
						>
							Unpublish
						</button>

					{/if}

				{/if}

			</div>

		</div>

	</form>

</div>


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.editor-shell {
		width: 100%;
		max-width: 1500px;

		display: grid;
		gap: 18px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	.eyebrow,
	.section-kicker,
	label > span,
	.label-row > span {
		color:
			var(--brand-gold);

		font-size: .55rem;

		font-weight: 800;

		letter-spacing: .14em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HEADER
	   ================================================== */

	.editor-header {
		position: relative;

		min-height: 205px;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 35px;

		overflow: hidden;

		padding:
			30px
			clamp(
				26px,
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
				transparent 44%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.header-copy {
		position: relative;
		z-index: 2;

		min-width: 0;
	}


	.editor-header h1 {
		margin:
			7px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				3.6rem,
				6vw,
				6rem
			);

		font-weight: 400;

		line-height: .86;

		letter-spacing: -.02em;

		text-transform: uppercase;
	}


	.editor-header p {
		max-width: 620px;

		margin:
			18px 0 0;

		color:
			var(--muted);

		font-size: .9rem;

		line-height: 1.5;
	}


	.header-side {
		position: relative;
		z-index: 2;

		flex: 0 0 auto;

		display: grid;

		justify-items: end;

		gap: 11px;
	}


	.status {
		display: inline-flex;

		align-items: center;

		gap: 7px;

		padding:
			7px 10px;

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

		font-size: .52rem;

		font-weight: 850;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.status-dot {
		width: 6px;
		height: 6px;

		border-radius: 50%;

		background:
			var(--brand-gold);
	}


	.status.published {
		border-color:
			rgba(
				116,
				160,
				123,
				.42
			);

		color:
			#91b897;
	}


	.status.published .status-dot {
		background:
			#91b897;
	}


	.back-link {
		color:
			var(--brand-stone);

		font-size: .52rem;

		font-weight: 800;

		letter-spacing: .07em;

		text-decoration: none;

		text-transform: uppercase;
	}


	.back-link:hover {
		color:
			var(--brand-gold);
	}


	.header-watermark {
		position: absolute;

		right: -10px;
		bottom: -45px;

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
	   MESSAGE
	   ================================================== */

	.message {
		display: flex;

		align-items: center;

		gap: 10px;

		padding:
			11px 13px;

		border:
			1px solid
			rgba(
				180,
				115,
				91,
				.4
			);

		background:
			rgba(
				180,
				115,
				91,
				.06
			);

		color:
			var(--brand-sand);
	}


	.message > div {
		flex: 0 0 auto;

		width: 24px;
		height: 24px;

		display: grid;
		place-items: center;

		border:
			1px solid
			rgba(
				180,
				115,
				91,
				.48
			);

		font-weight: 900;
	}


	/* ==================================================
	   FORM
	   ================================================== */

	form {
		display: grid;
		gap: 18px;
	}


	.meta-section,
	.writing-section {
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


	/* ==================================================
	   SECTION HEADINGS
	   ================================================== */

	.section-heading {
		min-height: 78px;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 20px;

		padding:
			15px 18px;

		border-bottom:
			1px solid
			rgba(
				191,
				161,
				106,
				.13
			);
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


	.section-number {
		color:
			rgba(
				191,
				161,
				106,
				.4
			);

		font-family:
			var(--font-display);

		font-size: 1.5rem;
	}


	/* ==================================================
	   METADATA FORM
	   ================================================== */

	.meta-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 16px;

		padding: 20px;
	}


	label {
		min-width: 0;

		display: grid;

		align-content: start;

		gap: 7px;
	}


	.wide {
		grid-column:
			1 / -1;
	}


	label > small {
		color:
			var(--brand-stone);

		font-size: .6rem;
	}


	.label-row {
		display: flex;

		justify-content: space-between;

		align-items: center;

		gap: 12px;
	}


	.label-row small {
		color:
			var(--brand-stone);

		font-size: .5rem;

		font-weight: 700;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	input,
	select,
	textarea {
		width: 100%;

		box-sizing: border-box;

		border:
			1px solid
			var(--border-strong);

		border-radius: 3px;

		outline: 0;

		padding:
			10px 11px;

		background:
			#0b0f0e;

		color:
			var(--brand-ivory);

		font: inherit;

		transition:
			border-color 120ms ease,
			background 120ms ease,
			box-shadow 120ms ease;
	}


	input,
	select {
		min-height: 43px;
	}


	input::placeholder,
	textarea::placeholder {
		color:
			rgba(
				157,
				155,
				145,
				.6
			);
	}


	input:focus,
	select:focus,
	textarea:focus {
		border-color:
			var(--brand-gold);

		background:
			#0d1110;

		box-shadow:
			0 0 0 1px
			rgba(
				191,
				161,
				106,
				.12
			);
	}


	select option,
	select optgroup {
		color: #111;

		background: #fff;
	}


	.excerpt {
		min-height: 86px;

		line-height: 1.5;

		resize: vertical;
	}


	/* ==================================================
	   WRITING AREA
	   ================================================== */

	.writing-grid {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			minmax(0,1fr);

		gap: 1px;

		background:
			var(--border);
	}


	.writing-pane,
	.preview-pane {
		min-width: 0;

		display: grid;

		grid-template-rows:
			auto
			minmax(0,1fr)
			auto;

		background:
			#0b0f0e;
	}


	.preview-pane {
		grid-template-rows:
			auto
			minmax(0,1fr);
	}


	.pane-header {
		min-height: 59px;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 14px;

		padding:
			10px 14px;

		border-bottom:
			1px solid
			var(--border);
	}


	.pane-header > div {
		display: grid;

		gap: 2px;
	}


	.pane-header span {
		color:
			var(--brand-gold);

		font-size: .49rem;

		font-weight: 800;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.pane-header strong {
		color:
			var(--brand-ivory);

		font-size: .68rem;

		font-weight: 800;

		text-transform: uppercase;
	}


	.pane-header small {
		color:
			var(--brand-stone);

		font-size: .52rem;
	}


	/* ==================================================
	   ARTICLE EDITOR
	   ================================================== */

	.article-editor {
		min-height: 720px;

		border: 0;

		border-radius: 0;

		padding: 20px;

		background:
			#090c0b;

		color:
			#dedbd1;

		font-family:
			Consolas,
			Monaco,
			'Courier New',
			monospace;

		font-size: .88rem;

		line-height: 1.7;

		resize: vertical;
	}


	.article-editor:focus {
		border: 0;

		box-shadow:
			inset 3px 0 0
			var(--brand-gold);
	}


	.markdown-help {
		display: flex;

		flex-wrap: wrap;

		align-items: center;

		gap: 6px;

		padding:
			9px 13px;

		border-top:
			1px solid
			var(--border);

		background:
			rgba(
				255,
				255,
				255,
				.012
			);
	}


	.markdown-help > span {
		margin-right: 3px;

		color:
			var(--brand-stone);

		font-size: .49rem;

		font-weight: 800;

		text-transform: uppercase;
	}


	.markdown-help code {
		padding:
			3px 5px;

		border:
			1px solid
			rgba(
				191,
				161,
				106,
				.1
			);

		background:
			rgba(
				191,
				161,
				106,
				.025
			);

		color:
			var(--brand-sand);

		font-size: .56rem;
	}


	/* ==================================================
	   PREVIEW
	   ================================================== */

	.preview-scroll {
		min-height: 720px;

		max-height: 900px;

		overflow-y: auto;

		background:
			#101412;
	}


	.markdown-preview {
		max-width: 650px;

		margin: 0 auto;

		padding:
			32px
			clamp(
				22px,
				4vw,
				38px
			)
			60px;
	}


	.preview-masthead {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 14px;

		margin-bottom: 34px;

		padding:
			7px 0;

		border-top:
			2px solid
			var(--brand-ivory);

		border-bottom:
			1px solid
			var(--border);
	}


	.preview-masthead span {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.15rem;

		text-transform: uppercase;
	}


	.preview-masthead small {
		color:
			var(--brand-stone);

		font-size: .45rem;

		font-weight: 800;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.preview-type {
		color:
			var(--brand-gold);

		font-size: .52rem;

		font-weight: 800;

		letter-spacing: .13em;

		text-transform: uppercase;
	}


	.markdown-preview > h1 {
		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.8rem,
				4vw,
				4.5rem
			);

		font-weight: 400;

		line-height: .91;

		text-transform: uppercase;

		text-wrap: balance;
	}


	.preview-placeholder {
		color:
			rgba(
				238,
				234,
				222,
				.22
			) !important;
	}


	.subtitle {
		max-width: 600px;

		margin:
			16px 0 0;

		color:
			var(--brand-sand);

		font-size: 1rem;

		font-weight: 600;

		line-height: 1.5;
	}


	.byline {
		margin-top: 18px;

		color:
			var(--brand-stone);

		font-size: .51rem;

		font-weight: 800;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.preview-rule {
		height: 1px;

		margin:
			22px 0 0;

		background:
			rgba(
				191,
				161,
				106,
				.2
			);
	}


	.markdown-body {
		margin-top: 27px;
	}


	:global(.markdown-body h2) {
		margin:
			32px 0 10px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.75rem;

		font-weight: 400;

		line-height: 1.05;
	}


	:global(.markdown-body h3) {
		margin:
			27px 0 8px;

		color:
			var(--brand-sand);

		font-size: 1.15rem;
	}


	:global(.markdown-body p) {
		margin:
			0 0 17px;

		color:
			var(--brand-ivory);

		font-size: .94rem;

		line-height: 1.72;
	}


	:global(.markdown-body ul),
	:global(.markdown-body ol) {
		margin:
			0 0 20px;

		padding-left: 24px;
	}


	:global(.markdown-body li) {
		margin:
			6px 0;

		color:
			var(--brand-ivory);

		font-size: .92rem;

		line-height: 1.65;
	}


	:global(.markdown-body blockquote) {
		margin:
			24px 0;

		padding:
			14px 17px;

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

		line-height: 1.65;
	}


	:global(.markdown-body a) {
		color:
			var(--brand-gold);
	}


	:global(.markdown-body strong) {
		color:
			var(--brand-sand);
	}


	:global(.markdown-body code) {
		padding:
			2px 4px;

		background:
			rgba(
				191,
				161,
				106,
				.07
			);

		color:
			var(--brand-gold);
	}


	.preview-empty {
		min-height: 350px;

		display: grid;

		place-items: center;

		align-content: center;

		gap: 10px;

		color:
			var(--muted);

		text-align: center;
	}


	.preview-empty > span {
		width: 54px;
		height: 54px;

		display: grid;

		place-items: center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.25rem;
	}


	.preview-empty p {
		max-width: 250px;

		margin: 0;

		font-size: .75rem;

		line-height: 1.5;
	}


	/* ==================================================
	   ACTION BAR
	   ================================================== */

	.actions {
		position: sticky;

		bottom: 12px;

		z-index: 10;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 20px;

		padding:
			12px 14px;

		border:
			1px solid
			var(--border-strong);

		background:
			rgba(
				9,
				12,
				11,
				.96
			);

		box-shadow:
			0 10px 35px
			rgba(
				0,
				0,
				0,
				.42
			);

		backdrop-filter:
			blur(12px);
	}


	.action-context {
		display: grid;

		gap: 2px;
	}


	.action-context span {
		color:
			var(--brand-stone);

		font-size: .47rem;

		font-weight: 800;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.action-context strong {
		color:
			var(--brand-sand);

		font-size: .6rem;

		text-transform: uppercase;
	}


	.action-buttons {
		display: flex;

		flex-wrap: wrap;

		gap: 7px;
	}


	button {
		min-height: 39px;

		cursor: pointer;

		padding:
			8px 13px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 3px;

		font: inherit;

		font-size: .55rem;

		font-weight: 850;

		letter-spacing: .07em;

		text-transform: uppercase;

		transition:
			border-color 120ms ease,
			color 120ms ease,
			background 120ms ease,
			transform 120ms ease;
	}


	button:hover {
		transform:
			translateY(-1px);
	}


	.save {
		background:
			transparent;

		color:
			var(--brand-sand);
	}


	.save:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	.publish {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.publish:hover {
		border-color:
			var(--brand-sand);

		background:
			var(--brand-sand);
	}


	.unpublish {
		border-color:
			rgba(
				161,
				80,
				80,
				.5
			);

		background:
			rgba(
				130,
				54,
				54,
				.08
			);

		color:
			#cf8f8f;
	}


	.unpublish:hover {
		border-color:
			#cf8f8f;

		background:
			rgba(
				130,
				54,
				54,
				.14
			);
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1000px) {

		.writing-grid {
			grid-template-columns:
				1fr;
		}


		.preview-scroll {
			min-height: 600px;

			max-height: none;
		}

	}


	@media (max-width: 760px) {

		.editor-header {
			align-items:
				flex-start;

			flex-direction:
				column;

			min-height: 0;

			padding:
				27px 22px;
		}


		.header-side {
			justify-items: start;
		}


		.editor-header h1 {
			font-size:
				clamp(
					3.3rem,
					15vw,
					5rem
				);
		}


		.meta-grid {
			grid-template-columns:
				1fr;

			padding: 15px;
		}


		.wide {
			grid-column: auto;
		}


		.actions {
			position: static;

			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.action-buttons {
			width: 100%;
		}


		.action-buttons button {
			flex: 1;
		}

	}


	@media (max-width: 520px) {

		.action-buttons {
			display: grid;
		}


		.action-buttons button {
			width: 100%;
		}


		.preview-masthead {
			align-items:
				flex-start;

			flex-direction:
				column;
		}

	}
</style>