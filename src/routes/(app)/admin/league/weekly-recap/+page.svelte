<script>
  import WeeklyRecapArticle
  from '$lib/components/league/WeeklyRecapArticle.svelte';
  export let data;
  export let form;

  function pretty(value) {
    if (value == null) {
      return '';
    }

    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(value);
    }
  }

$: savedRecap =
  form?.savedRecap ||
  data.savedRecap ||
  null;

$: packet =
  form?.packet ||
  savedRecap?.draftPacket ||
  null;

$: summary =
  packet?.summary ||
  null;

$: recap =
  form?.recap ||
  savedRecap?.draftRecap ||
  null;

$: aiMeta =
  form?.aiMeta ||
  savedRecap?.draftAiMeta ||
  null;

$: isPublished =
  Boolean(
    savedRecap?.publishedRecap
  );

  let generatingDraft = false;
let generationStage = '';
let generationError = '';


async function readApiResponse(
	response,
	label
) {
	const text =
		await response.text();

	let body =
		null;

	try {
		body =
			text
				? JSON.parse(text)
				: null;
	} catch {
		body =
			null;
	}

	if (!response.ok) {
		throw new Error(
			body?.error ||
			`${label} failed (${response.status}).`
		);
	}

	if (!body) {
		throw new Error(
			`${label} returned an unreadable response.`
		);
	}

	return body;
}


async function generateDraft(
	event
) {
	if (generatingDraft) {
		return;
	}

	const formElement =
		event.currentTarget?.form;

	if (!formElement) {
		generationError =
			'Could not read the recap controls.';

		return;
	}

	const values =
		new FormData(
			formElement
		);

	const season =
		Number(
			values.get(
				'season'
			)
		);

	const week =
		Number(
			values.get(
				'week'
			)
		);

	if (
		!Number.isInteger(
			season
		) ||
		!Number.isInteger(
			week
		)
	) {
		generationError =
			'Choose a valid season and week.';

		return;
	}

	generatingDraft =
		true;

	generationError =
		'';

	try {
		/*
		 * ========================================================
		 * PHASE 1 — PREPARE
		 *
		 * Build the authoritative packet in its own
		 * Cloudflare request.
		 * ========================================================
		 */

		generationStage =
			'Building facts…';

		const prepareParams =
			new URLSearchParams({
				phase:
					'prepare',

				season:
					String(
						season
					),

				week:
					String(
						week
					),

				force:
					'1'
			});

		const prepareResponse =
			await fetch(
				`/api/internal/weekly-recap/auto-draft?${prepareParams.toString()}`,
				{
					method:
						'POST',

					credentials:
						'same-origin',

					headers: {
						'content-type':
							'application/json'
					},

					body:
						'{}'
				}
			);

		const prepared =
			await readApiResponse(
				prepareResponse,
				'Packet preparation'
			);

		if (
			prepared.status !==
				'packet_ready' ||
			!prepared.packet
		) {
			throw new Error(
				prepared.reason ||
				'The recap packet was not returned.'
			);
		}


		/*
		 * ========================================================
		 * PHASE 2 — WRITE
		 *
		 * Fresh request = fresh Worker invocation.
		 * OpenAI + D1 save happen here.
		 * ========================================================
		 */

		generationStage =
			'Writing draft…';

		const writeParams =
			new URLSearchParams({
				phase:
					'write',

				force:
					'1'
			});

		const writeResponse =
			await fetch(
				`/api/internal/weekly-recap/auto-draft?${writeParams.toString()}`,
				{
					method:
						'POST',

					credentials:
						'same-origin',

					headers: {
						'content-type':
							'application/json'
					},

					body:
						JSON.stringify({
							season,
							week,
							packet:
								prepared.packet
						})
				}
			);

		const written =
			await readApiResponse(
				writeResponse,
				'Draft generation'
			);

		if (
			written.status !==
			'draft_created'
		) {
			throw new Error(
				written.reason ||
				`Unexpected draft status: ${written.status || 'unknown'}.`
			);
		}


		/*
		 * Reload the selected week so load() pulls
		 * the newly saved recap from D1.
		 */

		const next =
			new URL(
				window.location.href
			);

		next.searchParams.set(
			'season',
			String(
				season
			)
		);

		next.searchParams.set(
			'week',
			String(
				week
			)
		);

		window.location.assign(
			next.toString()
		);
	} catch (error) {
		console.error(
			'[weekly-recap] Split generation failed:',
			error
		);

		generationError =
			error instanceof Error
				? error.message
				: 'Could not generate the weekly recap draft.';
	} finally {
		generatingDraft =
			false;

		generationStage =
			'';
	}
}
</script>

<div class="page-stack">
  <section class="hero">

	<div class="hero-copy">

		<div class="eyebrow">
			League Media Automation
		</div>

		<h1>
			Weekly Recap Lab
		</h1>

		<p>
			Build the authoritative weekly record, generate
			The Irving Weekly recap, review the copy, and send
			it to press.
		</p>

		<div class="pipeline">

			<div class:complete={packet}>
				<span>01</span>

				<div>
					<small>Data Desk</small>
					<strong>Build Facts</strong>
				</div>
			</div>


			<div class:complete={recap}>
				<span>02</span>

				<div>
					<small>Writer</small>
					<strong>Generate Draft</strong>
				</div>
			</div>


			<div class:complete={isPublished}>
				<span>03</span>

				<div>
					<small>Press Desk</small>
					<strong>Publish</strong>
				</div>
			</div>

		</div>

	</div>


	<div class="lab-mark">

		<div class="lab-bug">
			IW
		</div>

		<div>
			<span>
				The Irving Weekly
			</span>

			<strong>
				Recap Lab
			</strong>

			<small>
				Automated editorial desk
			</small>
		</div>

	</div>


	<div
		class="hero-watermark"
		aria-hidden="true"
	>
		RECAP
	</div>

</section>

  <section class="card">
    <div class="section-label">
      Test a completed week
    </div>

    <form
      method="POST"
      action="?/build"
      class="controls"
    >
      <label>
        <span>
          Season
        </span>

        <input
          name="season"
          type="number"
          min="2017"
          max="2100"
          value={form?.season ?? data.defaultSeason}
        />
      </label>

      <label>
        <span>
          Week
        </span>

        <input
          name="week"
          type="number"
          min="1"
          max="18"
          value={form?.week ?? data.defaultWeek}
        />
      </label>

<button
  type="submit"
  formaction="?/build"
>
  Build Facts
</button>

<button
	type="button"
	class="ai-button"
	onclick={generateDraft}
	disabled={generatingDraft}
>
	{#if generatingDraft}
		{generationStage}
	{:else if recap}
		Regenerate Draft
	{:else}
		Generate Draft
	{/if}
</button>

<button
  type="submit"
  formaction="?/publish"
  class="publish-button"
  disabled={!recap}
>
  Publish Draft
</button>
    </form>
    {#if savedRecap}
  <div class="recap-status">
    <span
      class:published={isPublished}
      class:draft={!isPublished}
    >
      {isPublished
        ? 'Published'
        : 'Draft'}
    </span>

    {#if savedRecap.draftGeneratedAt}
      <small>
        Draft saved
        {new Date(
          savedRecap.draftGeneratedAt *
          1000
        ).toLocaleString()}
      </small>
    {/if}

    {#if savedRecap.publishedAt}
      <small>
        · Published
        {new Date(
          savedRecap.publishedAt *
          1000
        ).toLocaleString()}
      </small>
    {/if}
  </div>
{/if}

{#if form?.message}
  <div class="success-message">
    {form.message}
  </div>
{/if}
{#if generationError}
	<div class="generation-error">
		{generationError}
	</div>
{/if}
  </section>

  {#if form && form.ok === false}
    <section class="card error-card">
      <div class="section-label">
        Build failed
      </div>

      <h2>
        Something went wrong
      </h2>

      <p>
        {form.error}
      </p>
    </section>
  {/if}

  {#if packet}
    <section class="card success-card">
      <div class="section-label">
        Packet built
      </div>

      <h2>
        {packet.season} · Week {packet.week}
      </h2>

      <p>
        {packet.league?.name}
      </p>
    </section>

    {#if summary}
      <section class="stats">
        <article class="stat">
          <span>
            Matchups
          </span>

          <strong>
            {summary.matchupCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Teams
          </span>

          <strong>
            {summary.teamCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Waivers
          </span>

          <strong>
            {summary.waiverCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            FAAB Spent
          </span>

          <strong>
            ${summary.faabSpent}
          </strong>
        </article>

        <article class="stat">
          <span>
            Free Agents
          </span>

          <strong>
            {summary.freeAgentCount}
          </strong>
        </article>

        <article class="stat">
          <span>
            Trades
          </span>

          <strong>
            {summary.tradeCount}
          </strong>
        </article>
      </section>
    {/if}

    {#if packet.highlights}
      <section class="card">
        <div class="section-label">
          Weekly highlights
        </div>

        <div class="highlight-grid">
          <div>
            <span>
              Highest score
            </span>

            <strong>
              {packet.highlights.highestScoreTeam?.teamName}
            </strong>

            <small>
              {packet.highlights.highestScoreTeam?.score}
            </small>
          </div>

          <div>
            <span>
              Lowest score
            </span>

            <strong>
              {packet.highlights.lowestScoreTeam?.teamName}
            </strong>

            <small>
              {packet.highlights.lowestScoreTeam?.score}
            </small>
          </div>

          <div>
            <span>
              Closest game
            </span>

            <strong>
              {packet.highlights.closestGame?.left?.teamName}
              vs
              {packet.highlights.closestGame?.right?.teamName}
            </strong>

            <small>
              {packet.highlights.closestGame?.margin}
              point margin
            </small>
          </div>

          <div>
            <span>
              Biggest blowout
            </span>

            <strong>
              {packet.highlights.biggestBlowout?.winnerName}
            </strong>

            <small>
              {packet.highlights.biggestBlowout?.margin}
              point margin
            </small>
          </div>

          <div>
            <span>
              Highest-scoring loser
            </span>

            <strong>
              {packet.highlights.highestScoringLoser?.teamName}
            </strong>

            <small>
              {packet.highlights.highestScoringLoser?.score}
            </small>
          </div>
        </div>
      </section>
    {/if}
      {#if packet.standings?.movement?.length}
  <section class="card">
    <div class="section-label">
      Historical standings
    </div>

    <h2>
      After Week {packet.week}
    </h2>

    <p class="muted">
      Reconstructed from Weeks 1–{packet.week}.
      Week {packet.week} median:
      {packet.standings.medianScore ?? '—'}
    </p>

    <div class="standings-table">
      <div class="standings-head">
        <span>Rank</span>
        <span>Team</span>
        <span>Before</span>
        <span>Week</span>
        <span>After</span>
        <span>Move</span>
        <span>PF</span>
      </div>

      {#each packet.standings.movement as row}
        <div class="standings-row">
          <strong>
            {row.afterRank}
          </strong>

          <div class="team-cell">
            <strong>
              {row.teamName}
            </strong>

            <small>
              {row.managerName}
            </small>
          </div>

          <span>
            #{row.beforeRank}
            ·
            {row.beforeRecord}
          </span>

          <strong>
            {row.weekRecord}
          </strong>

          <span>
            {row.afterRecord}
          </span>

          <strong
            class:move-up={row.change > 0}
            class:move-down={row.change < 0}
          >
            {#if row.change > 0}
              ↑ {row.change}
            {:else if row.change < 0}
              ↓ {Math.abs(row.change)}
            {:else}
              —
            {/if}
          </strong>

          <span>
            {row.pointsFor}
          </span>
        </div>
      {/each}
    </div>
  </section>
{/if}

{#if packet.storyFacts}
  <section class="card">
    <div class="section-label">
      Story Facts
    </div>

    <h2>
      Stuff worth writing about
    </h2>

    <p class="muted">
      Deterministic facts and existing Irving badge logic.
      These will eventually feed the AI writer.
    </p>

    <div class="story-grid">
      {#if packet.storyFacts.standings?.biggestClimber}
        <article class="story-card">
          <span>
            Biggest Climber
          </span>

          <strong>
            {packet.storyFacts.standings.biggestClimber.teamName}
          </strong>

          <small>
            #{packet.storyFacts.standings.biggestClimber.beforeRank}
            →
            #{packet.storyFacts.standings.biggestClimber.afterRank}
            ·
            +{packet.storyFacts.standings.biggestClimber.change}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.standings?.biggestFaller}
        <article class="story-card">
          <span>
            Biggest Fall
          </span>

          <strong>
            {packet.storyFacts.standings.biggestFaller.teamName}
          </strong>

          <small>
            #{packet.storyFacts.standings.biggestFaller.beforeRank}
            →
            #{packet.storyFacts.standings.biggestFaller.afterRank}
            ·
            {packet.storyFacts.standings.biggestFaller.change}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.faab?.biggestSpend}
        <article class="story-card">
          <span>
            FAAB King
          </span>

          <strong>
            {packet.storyFacts.faab.biggestSpend.teamName}
          </strong>

          <small>
            ${packet.storyFacts.faab.biggestSpend.amount}

            {#if packet.storyFacts.faab.biggestSpend.players?.length}
              ·
              {packet.storyFacts.faab.biggestSpend.players
                .map((player) => player.name)
                .join(', ')}
            {/if}
          </small>
        </article>
      {/if}

      {#if packet.storyFacts.scoring?.benchExplosion}
        <article class="story-card">
          <span>
            Bench Explosion
          </span>

          <strong>
            {packet.storyFacts.scoring.benchExplosion.player.name}
          </strong>

          <small>
            {packet.storyFacts.scoring.benchExplosion.player.fantasyPoints}
            pts on
            {packet.storyFacts.scoring.benchExplosion.teamName}'s bench
          </small>
        </article>
      {/if}
    </div>

    {#if packet.storyFacts.weeklyAwards?.all?.length}
      <div class="award-list">
        <div class="section-label">
          Weekly Badge Facts
        </div>

        {#each packet.storyFacts.weeklyAwards.all as award}
          <article class="award-row">
            <div>
              <strong>
                {award.badgeTitle}
              </strong>

              <small>
                {award.teamName}
              </small>
            </div>

            <p>
              {award.reason}
            </p>
          </article>
        {/each}
      </div>
    {:else}
      <div class="notice">
        No badge preview data was available for this build.
      </div>
    {/if}

    {#if packet.enrichment?.warnings?.length}
      <div class="warning-box">
        {#each packet.enrichment.warnings as warning}
          <p>
            {warning}
          </p>
        {/each}
      </div>
    {/if}
  </section>
{/if}

{#if recap}
  <section class="card">
    <div class="section-label">
      AI Weekly Recap
    </div>

    <div class="admin-recap-preview">
      <WeeklyRecapArticle
        {recap}
        {aiMeta}
        preview={true}
      />
    </div>
  </section>
{/if}

<section class="card">
  <div class="section-label">
    Raw authoritative packet
  </div>

  <p class="muted">
    This is what the AI writer will eventually receive.
  </p>

  <pre>{pretty(packet)}</pre>
</section>

{/if}

</div>

<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.page-stack {
		width: 100%;
		max-width: 1380px;

		display: grid;
		gap: 18px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	h1,
	h2,
	h3,
	p {
		margin: 0;
	}


	.eyebrow,
	.section-label,
	label span,
	.stat span,
	.highlight-grid span,
	.story-card span {
		color: var(--brand-gold);

		font-size: .54rem;
		font-weight: 800;
		letter-spacing: .14em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.hero {
		position: relative;

		min-height: 265px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			245px;

		align-items: center;

		gap: 38px;

		overflow: hidden;

		padding:
			clamp(
				30px,
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
				rgba(191,161,106,.05),
				transparent 43%
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


	.hero h1 {
		margin-top: 8px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				6.6vw,
				6.5rem
			);

		font-weight: 400;

		line-height: .86;

		letter-spacing: -.02em;

		text-transform: uppercase;
	}


	.hero > .hero-copy > p {
		max-width: 720px;

		margin-top: 20px;

		color: var(--muted);

		font-size: .94rem;
		font-weight: 600;

		line-height: 1.55;
	}


	/* ==================================================
	   PIPELINE
	   ================================================== */

	.pipeline {
		display: flex;
		flex-wrap: wrap;

		gap: 7px;

		margin-top: 24px;
	}


	.pipeline > div {
		min-width: 145px;

		display: flex;
		align-items: center;

		gap: 9px;

		padding:
			8px 10px;

		border:
			1px solid
			var(--border);

		background:
			rgba(8,11,10,.34);
	}


	.pipeline > div > span {
		width: 27px;
		height: 27px;

		display: grid;
		place-items: center;

		flex: 0 0 auto;

		border:
			1px solid
			rgba(191,161,106,.28);

		color:
			var(--brand-stone);

		font-size: .5rem;
		font-weight: 850;
	}


	.pipeline > div > div {
		display: grid;
		gap: 1px;
	}


	.pipeline small {
		color:
			var(--brand-stone);

		font-size: .43rem;
		font-weight: 800;
		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.pipeline strong {
		color:
			var(--brand-sand);

		font-size: .56rem;
		font-weight: 800;

		text-transform: uppercase;
	}


	.pipeline > div.complete {
		border-color:
			rgba(135,171,132,.38);
	}


	.pipeline > div.complete > span {
		border-color:
			rgba(135,171,132,.45);

		color:
			#96b894;
	}


	/* ==================================================
	   LAB IDENTITY
	   ================================================== */

	.lab-mark {
		position: relative;
		z-index: 2;

		min-height: 165px;

		display: flex;

		align-items: center;
		justify-content: center;

		gap: 15px;

		padding: 20px;

		border:
			1px solid
			rgba(191,161,106,.22);

		background:
			rgba(8,11,10,.4);
	}


	.lab-bug {
		width: 60px;
		height: 60px;

		display: grid;
		place-items: center;

		flex: 0 0 auto;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.35rem;
	}


	.lab-mark > div:last-child {
		display: grid;
		gap: 2px;
	}


	.lab-mark span {
		color:
			var(--brand-stone);

		font-size: .46rem;
		font-weight: 800;
		letter-spacing: .12em;

		text-transform: uppercase;
	}


	.lab-mark strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.9rem;
		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}


	.lab-mark small {
		margin-top: 5px;

		color:
			var(--brand-gold);

		font-size: .44rem;
		font-weight: 750;
		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -20px;
		bottom: -45px;

		color:
			rgba(191,161,106,.017);

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
	   GENERAL PANELS
	   ================================================== */

	.card {
		padding: 20px;

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


	.card > .section-label:first-child {
		margin-bottom: 5px;
	}


	.card h2 {
		margin-top: 5px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2rem;
		font-weight: 400;

		line-height: 1;
	}


	.card > p,
	.muted {
		margin-top: 8px;

		color:
			var(--muted);

		font-size: .76rem;

		line-height: 1.55;
	}


	/* ==================================================
	   CONTROL DESK
	   ================================================== */

	.controls {
		display: grid;

		grid-template-columns:
			minmax(115px, 150px)
			minmax(100px, 120px)
			minmax(155px, 1fr)
			minmax(175px, 1fr)
			minmax(155px, .9fr);

		gap: 8px;

		align-items: end;

		margin-top: 14px;
	}


	label {
		display: grid;
		gap: 6px;
	}


	input {
		width: 100%;
		min-height: 40px;

		box-sizing: border-box;

		outline: 0;

		padding:
			0 10px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 3px;

		background:
			#0a0e0d;

		color:
			var(--brand-ivory);

		font: inherit;

		font-size: .78rem;
		font-weight: 700;
	}


	input:focus {
		border-color:
			var(--brand-gold);

		box-shadow:
			0 0 0 1px
			rgba(191,161,106,.12);
	}


	button {
		min-height: 40px;

		appearance: none;

		cursor: pointer;

		padding:
			0 13px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 3px;

		background:
			rgba(8,11,10,.42);

		color:
			var(--brand-sand);

		font: inherit;

		font-size: .54rem;
		font-weight: 850;
		letter-spacing: .06em;

		text-transform: uppercase;

		transition:
			transform 120ms ease,
			border-color 120ms ease,
			background 120ms ease,
			color 120ms ease;
	}


	button:hover:not(:disabled) {
		transform:
			translateY(-1px);

		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	.controls button:first-of-type {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.controls button:first-of-type:hover {
		background:
			var(--brand-sand);

		border-color:
			var(--brand-sand);

		color:
			var(--brand-charcoal);
	}


	.ai-button {
		border-color:
			rgba(191,161,106,.55);

		background:
			rgba(191,161,106,.07);

		color:
			var(--brand-sand);
	}


	.publish-button {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.publish-button:hover:not(:disabled) {
		border-color:
			var(--brand-sand);

		background:
			var(--brand-sand);

		color:
			var(--brand-charcoal);
	}


	button:disabled {
		opacity: .35;

		cursor: not-allowed;

		transform: none;
	}


	/* ==================================================
	   RECAP STATUS
	   ================================================== */

	.recap-status {
		display: flex;
		flex-wrap: wrap;

		align-items: center;

		gap: 8px;

		margin-top: 14px;
	}


	.recap-status > span {
		padding:
			4px 7px;

		border:
			1px solid
			var(--border);

		font-size: .48rem;
		font-weight: 850;
		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.recap-status .draft {
		border-color:
			rgba(191,161,106,.4);

		color:
			var(--brand-gold);
	}


	.recap-status .published {
		border-color:
			rgba(135,171,132,.45);

		color:
			#96b894;
	}


	.recap-status small {
		color:
			var(--brand-stone);

		font-size: .61rem;
	}


	.success-message {
		margin-top: 12px;

		padding:
			9px 11px;

		border:
			1px solid
			rgba(135,171,132,.35);

		background:
			rgba(135,171,132,.04);

		color:
			#abc4aa;

		font-size: .7rem;
	}
.generation-error {
	margin-top: 12px;

	padding:
		9px 11px;

	border:
		1px solid
		rgba(166,87,77,.55);

	background:
		rgba(166,87,77,.06);

	color:
		#dba49d;

	font-size: .7rem;
}

	/* ==================================================
	   PACKET SUMMARY
	   ================================================== */

	.success-card {
		position: relative;

		padding-left: 22px;
	}


	.success-card::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 2px;

		background:
			var(--brand-gold);
	}


	.error-card {
		border-color:
			rgba(166,87,77,.55);
	}


	/* ==================================================
	   STATS
	   ================================================== */

	.stats {
		display: grid;

		grid-template-columns:
			repeat(
				6,
				minmax(0,1fr)
			);

		border:
			1px solid
			var(--border);

		background:
			rgba(8,11,10,.28);
	}


	.stat {
		min-height: 87px;

		display: grid;
		align-content: center;

		gap: 5px;

		padding:
			12px 14px;

		border-right:
			1px solid
			var(--border);
	}


	.stat:last-child {
		border-right: 0;
	}


	.stat strong {
		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.8rem;
		font-weight: 400;

		line-height: 1;
	}


	/* ==================================================
	   HIGHLIGHTS
	   ================================================== */

	.highlight-grid {
		display: grid;

		grid-template-columns:
			repeat(
				5,
				minmax(0,1fr)
			);

		gap: 1px;

		margin-top: 16px;

		border:
			1px solid
			var(--border);

		background:
			var(--border);
	}


	.highlight-grid > div {
		min-width: 0;

		display: grid;
		align-content: start;

		gap: 7px;

		min-height: 130px;

		padding: 14px;

		background:
			#111513;
	}


	.highlight-grid strong {
		color:
			var(--brand-ivory);

		font-size: .82rem;

		line-height: 1.3;
	}


	.highlight-grid small {
		color:
			var(--brand-stone);

		font-size: .68rem;

		line-height: 1.4;
	}


	/* ==================================================
	   STANDINGS
	   ================================================== */

	.standings-table {
		display: grid;

		margin-top: 16px;

		overflow-x: auto;

		border:
			1px solid
			var(--border);
	}


	.standings-head,
	.standings-row {
		display: grid;

		grid-template-columns:
			60px
			minmax(220px,1.5fr)
			minmax(120px,.8fr)
			80px
			80px
			70px
			90px;

		gap: 12px;

		align-items: center;

		min-width: 850px;
	}


	.standings-head {
		min-height: 34px;

		padding:
			7px 11px;

		background:
			#090d0c;

		color:
			var(--brand-stone);

		font-size: .48rem;
		font-weight: 800;
		letter-spacing: .11em;

		text-transform: uppercase;
	}


	.standings-row {
		min-height: 54px;

		padding:
			8px 11px;

		border-top:
			1px solid
			var(--border);

		color:
			var(--brand-sand);

		font-size: .72rem;
	}


	.standings-row:hover {
		background:
			rgba(191,161,106,.022);
	}


	.team-cell {
		display: grid;
		gap: 2px;
	}


	.team-cell strong {
		color:
			var(--brand-ivory);
	}


	.team-cell small {
		color:
			var(--brand-stone);
	}


	.move-up {
		color:
			#91b897;
	}


	.move-down {
		color:
			#bd7b72;
	}


	/* ==================================================
	   STORY FACTS
	   ================================================== */

	.story-grid {
		display: grid;

		grid-template-columns:
			repeat(
				4,
				minmax(0,1fr)
			);

		gap: 8px;

		margin-top: 16px;
	}


	.story-card {
		min-height: 110px;

		display: grid;
		align-content: start;

		gap: 7px;

		padding: 13px;

		border:
			1px solid
			var(--border);

		background:
			rgba(8,11,10,.32);
	}


	.story-card strong {
		color:
			var(--brand-ivory);

		font-size: .83rem;

		line-height: 1.25;
	}


	.story-card small {
		color:
			var(--brand-stone);

		font-size: .66rem;

		line-height: 1.4;
	}


	/* ==================================================
	   AWARDS
	   ================================================== */

	.award-list {
		display: grid;

		gap: 1px;

		margin-top: 22px;

		border:
			1px solid
			var(--border);

		background:
			var(--border);
	}


	.award-list > .section-label {
		padding:
			11px 13px;

		background:
			#090d0c;
	}


	.award-row {
		display: grid;

		grid-template-columns:
			minmax(180px,250px)
			1fr;

		gap: 18px;

		align-items: center;

		padding:
			11px 13px;

		background:
			#111513;
	}


	.award-row > div {
		display: grid;
		gap: 3px;
	}


	.award-row strong {
		color:
			var(--brand-ivory);
	}


	.award-row small {
		color:
			var(--brand-gold);

		font-size: .62rem;
	}


	.award-row p {
		color:
			var(--muted);

		font-size: .72rem;

		line-height: 1.45;
	}


	/* ==================================================
	   NOTICES
	   ================================================== */

	.warning-box,
	.notice {
		margin-top: 16px;

		padding:
			10px 12px;

		border:
			1px solid
			rgba(191,161,106,.32);

		background:
			rgba(191,161,106,.035);

		color:
			var(--brand-sand);

		font-size: .7rem;
	}


	.warning-box p {
		margin: 0;
	}


	.warning-box p + p {
		margin-top: 6px;
	}


	/* ==================================================
	   AI RECAP
	   ================================================== */

	.admin-recap-preview {
		margin-top: 16px;
	}


	/* ==================================================
	   RAW PACKET
	   ================================================== */

	pre {
		max-height: 620px;

		overflow: auto;

		margin:
			16px 0 0;

		padding: 16px;

		border:
			1px solid
			var(--border);

		background:
			#080b0a;

		color:
			#c8c5ba;

		font-family:
			Consolas,
			Monaco,
			monospace;

		font-size: .69rem;

		line-height: 1.55;

		white-space: pre-wrap;

		word-break: break-word;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1100px) {

		.controls {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.controls button:last-child {
			grid-column:
				span 2;
		}


		.stats {
			grid-template-columns:
				repeat(
					3,
					minmax(0,1fr)
				);
		}


		.stat:nth-child(3) {
			border-right: 0;
		}


		.highlight-grid {
			grid-template-columns:
				repeat(
					3,
					minmax(0,1fr)
				);
		}

	}


	@media (max-width: 850px) {

		.hero {
			grid-template-columns:
				1fr;
		}


		.lab-mark {
			display: none;
		}


		.story-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}

	}


	@media (max-width: 700px) {

		.page-stack {
			gap: 14px;
		}


		.hero {
			min-height: 0;

			padding:
				27px 21px;
		}


		.hero h1 {
			font-size:
				clamp(
					3.4rem,
					15vw,
					5rem
				);
		}


		.pipeline {
			display: grid;
		}


		.controls,
		.stats,
		.highlight-grid,
		.story-grid,
		.award-row {
			grid-template-columns:
				1fr;
		}


		.controls button:last-child {
			grid-column: auto;
		}


		.stat {
			border-right: 0;

			border-bottom:
				1px solid
				var(--border);
		}


		.stat:last-child {
			border-bottom: 0;
		}


		.highlight-grid {
			gap: 1px;
		}

	}
</style>