<script>
  export let data;
  export let form;

  let selectedBadge = '';

  /*
   * Always give the UI arrays, even during
   * navigation/action refreshes.
   */
  $: badges = data?.badges ?? [];
  $: managers = data?.managers ?? [];
  $: awards = data?.awards ?? [];

  $: activeBadge =
    badges.find(
      (badge) =>
        badge.key === selectedBadge
    ) ?? null;

  $: showWeek =
    !activeBadge ||
    (
      activeBadge.scope !== 'career' &&
      activeBadge.scope !== 'legacy'
    );

  $: showSeason =
    !activeBadge ||
    activeBadge.scope !== 'career';

  $: isStain =
    activeBadge?.category === 'stains';

  $: isLegacy =
    activeBadge?.scope === 'legacy';


  const automationWeeks =
    Array.from(
      { length: 18 },
      (_, index) =>
        index + 1
    );

  $: weeklyPreview =
    form?.preview ?? null;

  $: pendingWeekly =
    weeklyPreview?.candidates?.filter(
      (candidate) =>
        !candidate.alreadyAwarded
    ) ?? [];


  function formatDate(value) {
    if (!value) return '';

    return new Date(
      Number(value) * 1000
    ).toLocaleString();
  }


  function awardDetail(award) {
    const parts = [];

    if (
      award.season &&
      award.season !== 'career'
    ) {
      parts.push(
        award.season
      );
    }

    if (award.week != null) {
      parts.push(
        `Week ${award.week}`
      );
    }

    if (award.score != null) {
      parts.push(
        `${Number(
          award.score
        ).toFixed(2)} pts`
      );
    }

    return parts.join(' · ');
  }
</script>

<div class="page-stack">

  <!-- =====================================================
       HERO
       ===================================================== -->

 <section class="hero">

	<div class="hero-copy">

		<div class="eyebrow">
			League History & Discipline
		</div>

		<h1>
			Badge Control
		</h1>

		<p>
			Hand out honors, record stains, automate weekly awards,
			and maintain the permanent Irving rap sheet.
		</p>

		<div class="hero-meta">
			<span>
				<strong>{badges.length}</strong>
				Badge Types
			</span>

			<span>
				<strong>{awards.length}</strong>
				Awards on Record
			</span>

			<span>
				<strong>{managers.length}</strong>
				Franchises
			</span>
		</div>

	</div>


	<div class="badge-stage">

		<div class="badge-frame">
			<img
				src="/badges/stains.png"
				alt=""
			/>
		</div>

		<div>
			<span>
				Official League Record
			</span>

			<strong>
				Trophy Case
				<br />
				& Rap Sheet
			</strong>
		</div>

	</div>


	<div
		class="hero-watermark"
		aria-hidden="true"
	>
		BADGES
	</div>

</section>

  <!-- =====================================================
       RESULT MESSAGE
       ===================================================== -->

  {#if form?.ok}

    <div class="notice success">
      <strong>
        ✓ {form.message || 'Done.'}
      </strong>
    </div>

  {:else if form?.ok === false}

    <div class="notice error">
      <strong>
        {form.error || 'Something went wrong.'}
      </strong>
    </div>

  {/if}


  <!-- =====================================================
       CONTROL GRID
       ===================================================== -->

  <section class="control-grid">


    <!-- ===================================================
         MANUAL AWARD
         =================================================== -->

    <div class="card control-card">

      <div class="section-label">
        Manual Award
      </div>

      <h2>
        Hand out a badge
      </h2>

      <p class="muted">
        Commissioner override for stains, personas,
        legacy awards or anything the machines can't judge.
      </p>


      <form
        method="POST"
        action="?/award"
        class="award-form"
      >

        <!-- BADGE -->

        <label class="field">

          <span>
            Badge
          </span>

          <select
            name="badgeKey"
            bind:value={selectedBadge}
            required
          >

            <option value="">
              Select badge...
            </option>

            {#each badges as badge}

              <option value={badge.key}>
                {badge.title}
                — {badge.category}
              </option>

            {/each}

          </select>

        </label>


        <!-- TEAM -->

        <label class="field">

          <span>
            Team
          </span>

          <select
            name="managerId"
            required
          >

            <option value="">
              Select team...
            </option>

            {#each managers as manager}

              <option value={manager.id}>
                {manager.teamName}
                — {manager.name}
              </option>

            {/each}

          </select>

        </label>


        <!-- SEASON -->

        {#if showSeason}

          <label class="field">

            <span>
              {isLegacy
                ? 'Championship Year'
                : 'Season'}
            </span>

            <input
              name="season"
              type="number"
              min="2000"
              max="2100"
              value={data.season}
              required
            />

          </label>

        {:else}

          <input
            type="hidden"
            name="season"
            value="career"
          />

        {/if}


        <!-- WEEK -->

        {#if showWeek}

          <label class="field">

            <span>
              Week
              <small>
                optional
              </small>
            </span>

            <input
              name="week"
              type="number"
              min="1"
              max="18"
              placeholder="1"
            />

          </label>

        {/if}


        <!-- SCORE -->

        {#if showWeek}

          <label class="field">

            <span>
              Team Score
              <small>
                optional
              </small>
            </span>

            <input
              name="score"
              type="number"
              step="0.01"
              placeholder="142.36"
            />

          </label>

        {/if}


        <!-- OPPONENT -->

        {#if showWeek}

          <label class="field">

            <span>
              Opponent
              <small>
                optional
              </small>
            </span>

            <select
              name="opponentManagerId"
            >

              <option value="">
                None
              </option>

              {#each managers as manager}

                <option value={manager.id}>
                  {manager.teamName}
                </option>

              {/each}

            </select>

          </label>


          <label class="field">

            <span>
              Opponent Score
              <small>
                optional
              </small>
            </span>

            <input
              name="opponentScore"
              type="number"
              step="0.01"
              placeholder="141.97"
            />

          </label>

        {/if}


        <!-- NOMINATOR -->

        {#if isStain}

          <label class="field full">

            <span>
              Nominated By
              <small>
                optional
              </small>
            </span>

            <select
              name="nominatedByManagerId"
            >

              <option value="">
                Commissioner / none
              </option>

              {#each managers as manager}

                <option value={manager.id}>
                  {manager.teamName}
                  — {manager.name}
                </option>

              {/each}

            </select>

          </label>

        {/if}


        <!-- EXPLANATION -->

        <label class="field full">

          <span>
            Explanation
            <small>
              optional
            </small>
          </span>

          <textarea
            name="reason"
            rows="4"
            placeholder="Why does this poor bastard deserve this badge?"
          ></textarea>

        </label>


        <!-- SELECTED BADGE PREVIEW -->

        {#if activeBadge}

          <div class="selected-badge full">

            <img
              src={activeBadge.icon}
              alt=""
            />

            <div>

              <div class="section-label">
                Selected
              </div>

              <strong>
                {activeBadge.title}
              </strong>

              <p>
                {activeBadge.description}
              </p>

              <div class="badge-meta">
                <span>
                  {activeBadge.award_mode}
                </span>

                <span>
                  {activeBadge.scope}
                </span>

                {#if activeBadge.automation_key}

                  <span>
                    {activeBadge.automation_key}
                  </span>

                {/if}
              </div>

            </div>

          </div>

        {/if}


        <button
          class="award-btn full"
          type="submit"
        >
          AWARD BADGE
        </button>

      </form>

    </div>


    <!-- ===================================================
         AUTOMATION PLACEHOLDER
         =================================================== -->

    <div class="card control-card automation-card">

  <div class="section-label">
    Automation
  </div>

  <h2>
    Generate weekly awards
  </h2>

  <p class="muted">
    Read the official Sleeper results, calculate the week's
    automatic badges, review them, then commit them to league history.
  </p>


  <!-- ==============================================
       GENERATOR CONTROLS
       ============================================== -->

  <form
    method="POST"
    action="?/previewWeekly"
    class="automation-controls"
  >

    <label class="field">

      <span>
        Season
      </span>

      <input
        type="number"
        name="automationSeason"
        min="2025"
        max="2100"
        value={form?.automationSeason ?? data.season}
        required
      />

    </label>


    <label class="field">

      <span>
        Week
      </span>

      <select
        name="automationWeek"
        required
      >

        {#each automationWeeks as week}

          <option
            value={week}
            selected={
              Number(
                form?.automationWeek ?? 1
              ) === week
            }
          >
            Week {week}
          </option>

        {/each}

      </select>

    </label>


    <button
      type="submit"
      class="generate-btn"
    >
      GENERATE WEEKLY AWARDS
    </button>

  </form>


  <!-- ==============================================
       RULES
       ============================================== -->

  <div class="machine">

    <div class="machine-row">
      <span>BDE</span>
      <strong>Highest score</strong>
    </div>

    <div class="machine-row">
      <span>Sucko</span>
      <strong>Lowest score</strong>
    </div>

    <div class="machine-row">
      <span>Ides</span>
      <strong>Highest-scoring loser</strong>
    </div>

    <div class="machine-row">
      <span>HBK</span>
      <strong>Loss ≤ 1 point</strong>
    </div>

    <div class="machine-row">
        <span>Zero Hour</span>
        <strong>Started player scored 0</strong>
    </div>

    <div class="machine-row">
        <span>Bye Bye Bye</span>
        <strong>Started player on NFL bye</strong>
    </div>

    <div class="machine-row">
        <span>Cap'n Hindsight</span>
        <strong>Winning lineup move left on bench</strong>
    </div>

  </div>


  <!-- ==============================================
       PREVIEW
       ============================================== -->

  {#if weeklyPreview}

    <div class="preview-head">

      <div>
        <div class="section-label">
          Proposed Awards
        </div>

        <strong>
          {weeklyPreview.season}
          · Week {weeklyPreview.week}
        </strong>
      </div>

      <div class="preview-count">
        {weeklyPreview.pendingCount}
        NEW
      </div>

    </div>


    {#if weeklyPreview.warnings?.length}

      <div class="preview-warnings">

        {#each weeklyPreview.warnings as warning}
          <div>
            ⚠ {warning}
          </div>
        {/each}

      </div>

    {/if}


    {#if weeklyPreview.candidates.length}

      <div class="candidate-list">

        {#each weeklyPreview.candidates as candidate}

          <article
            class:already-awarded={candidate.alreadyAwarded}
            class="candidate-row"
          >

            <img
              src={candidate.badgeIcon}
              alt=""
              class="candidate-badge"
            />


            <div class="candidate-main">

              <div class="candidate-title">

                <strong>
                  {candidate.badgeTitle}
                </strong>

                {#if candidate.alreadyAwarded}
                  <span class="already-chip">
                    ALREADY AWARDED
                  </span>
                {/if}

              </div>


              <div class="candidate-team">
                {candidate.teamName}
              </div>


              <div class="candidate-reason">
                {candidate.reason}
              </div>


              {#if candidate.opponentTeamName}

                <div class="candidate-matchup">

                  vs
                  {candidate.opponentTeamName}

                  {#if candidate.opponentScore != null}

                    ·
                    {candidate.score.toFixed(2)}
                    –
                    {candidate.opponentScore.toFixed(2)}

                  {/if}

                </div>

              {/if}

            </div>


            <div class="candidate-score">

              {#if candidate.margin != null}

                <small>
                  MARGIN
                </small>

                <strong>
                  {candidate.margin.toFixed(2)}
                </strong>

              {:else}

                <small>
                  SCORE
                </small>

                <strong>
                  {candidate.score.toFixed(2)}
                </strong>

              {/if}

            </div>

          </article>

        {/each}

      </div>


      <form
        method="POST"
        action="?/commitWeekly"
        class="commit-form"
      >

        <input
          type="hidden"
          name="automationSeason"
          value={weeklyPreview.season}
        />

        <input
          type="hidden"
          name="automationWeek"
          value={weeklyPreview.week}
        />


        <button
          type="submit"
          class="commit-btn"
          disabled={pendingWeekly.length === 0}
        >

          {#if pendingWeekly.length}

            COMMIT
            {pendingWeekly.length}
            AWARD{pendingWeekly.length === 1 ? '' : 'S'}

          {:else}

            WEEK ALREADY COMMITTED

          {/if}

        </button>

      </form>

    {:else}

      <div class="empty-preview">
        No automatic awards were generated.
      </div>

    {/if}

  {/if}

</div>
  </section>


  <!-- =====================================================
       AWARD HISTORY
       ===================================================== -->

  <section class="card">

    <div class="history-head">

      <div>

        <div class="section-label">
          Award Ledger
        </div>

        <h2>
          Current badge history
        </h2>

      </div>


      <div class="season-chip">
        {data.season}
      </div>

    </div>


    {#if awards.length}

      <div class="award-list">

        {#each awards as award}

          <article class="award-row">

            <div class="award-logo">

              <img
                src={award.badge_icon}
                alt=""
              />

            </div>


            <div class="award-main">

              <div class="award-title">

                <strong>
                  {award.badge_title}
                </strong>

                <span>
                  {award.teamName}
                </span>

              </div>


              <div class="award-sub">

                {#if awardDetail(award)}
                  <span>
                    {awardDetail(award)}
                  </span>
                {/if}

                {#if award.source}
                  <span>
                    {award.source}
                  </span>
                {/if}

              </div>


              {#if award.reason}

                <p class="reason">
                  {award.reason}
                </p>

              {/if}


              {#if award.opponentTeamName}

                <div class="extra">
                  vs {award.opponentTeamName}

                  {#if award.opponent_score != null}
                    ·
                    {Number(
                      award.opponent_score
                    ).toFixed(2)}
                  {/if}
                </div>

              {/if}


              {#if award.nominatedByTeamName}

                <div class="nominator">
                  Nominated by
                  {award.nominatedByTeamName}
                </div>

              {/if}


              <div class="timestamp">
                Awarded
                {formatDate(
                  award.created_at
                )}
              </div>

            </div>


            <form
              method="POST"
              action="?/revoke"
            >

              <input
                type="hidden"
                name="awardId"
                value={award.id}
              />

              <button
                type="submit"
                class="revoke-btn"
                aria-label={`Revoke ${award.badge_title} from ${award.teamName}`}
              >
                REVOKE
              </button>

            </form>

          </article>

        {/each}

      </div>

    {:else}

      <div class="empty">
        No awards found for this season.
      </div>

    {/if}

  </section>

</div>


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.page-stack {
		width: 100%;
		max-width: 1450px;

		display: grid;
		gap: 26px;

		margin: 0 auto;

		padding-bottom: 70px;
	}


	h1,
	h2,
	p {
		margin: 0;
	}


.eyebrow,
.section-label {
	color: var(--brand-gold);
	font-size: .64rem;
	font-weight: 850;
	letter-spacing: .12em;
	text-transform: uppercase;
}


	.muted {
		color: var(--muted);

		font-size: .76rem;

		line-height: 1.55;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.hero {
		position: relative;

		min-height: 250px;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			300px;

		align-items: center;

		gap: 40px;

		overflow: hidden;

		padding:
			34px
			clamp(28px, 4vw, 46px);

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.045),
				transparent 44%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.hero-copy {
		position: relative;
		z-index: 2;
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
				7vw,
				6.8rem
			);

		font-weight: 400;

		line-height: .84;

		letter-spacing: -.025em;

		text-transform: uppercase;
	}


	.hero p {
		max-width: 680px;

		margin-top: 18px;

		color:
			var(--muted);

		font-size: .95rem;
	line-height: 1.6;
		font-weight: 600;

		
	}


.hero-meta {
	display: inline-flex;
	flex-wrap: wrap;

	width: fit-content;
	max-width: 100%;

	gap: 0;

	margin-top: 24px;

	border:
		1px solid
		var(--border);

	background: transparent;
}


.hero-meta span {
	min-width: 110px;

	display: grid;
	gap: 2px;

	padding:
		9px 12px;

	border-right:
		1px solid
		var(--border);

	background:
		#0a0e0d;

	color:
		var(--brand-stone);

	font-size: .55rem;
	font-weight: 800;
	letter-spacing: .08em;

	text-transform: uppercase;
}

.hero-meta span:last-child {
	border-right: 0;
}

.hero-meta strong {
	color:
		var(--brand-sand);

	font-family:
		var(--font-display);

	font-size: 1.4rem;
	font-weight: 400;

	line-height: 1;
}

	.badge-stage {
		position: relative;
		z-index: 2;

		display: flex;

		align-items: center;

		gap: 18px;

		padding: 18px;

		border:
			1px solid
			rgba(191,161,106,.25);

		background:
			rgba(8,11,10,.42);
	}


	.badge-frame {
		width: 82px;
		height: 82px;

		display: grid;
		place-items: center;

		flex: 0 0 auto;

		border:
			1px solid
			rgba(191,161,106,.3);

		background:
			rgba(191,161,106,.025);
	}


	.badge-frame img {
		width: 70px;
		height: 70px;

		object-fit: contain;
	}


	.badge-stage > div:last-child {
		display: grid;
		gap: 5px;
	}


	.badge-stage span {
		color:
			var(--brand-stone);

		font-size: .44rem;
		font-weight: 800;
		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.badge-stage strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.65rem;
		font-weight: 400;

		line-height: .95;

		text-transform: uppercase;
	}


	.hero-watermark {
		position: absolute;

		right: -15px;
		bottom: -55px;

		color:
			rgba(191,161,106,.016);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				9rem,
				16vw,
				14rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   MESSAGES
	   ================================================== */

	.notice {
		padding:
			11px 14px;

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(191,161,106,.035);

		color:
			var(--brand-sand);

		font-size: .72rem;
	}


	.notice.success {
		border-color:
			#8cad91;

		background:
			rgba(140,173,145,.04);
	}


	.notice.error {
		border-color:
			#bd746d;

		background:
			rgba(189,116,109,.05);
	}


	/* ==================================================
	   WORKSTATIONS
	   ================================================== */

.control-grid {
	display: grid;
	grid-template-columns:
		minmax(0, 1fr)
		minmax(0, 1fr);

	gap: 64px;

	align-items: start;

	padding:
		10px 18px 38px;

	border-bottom:
		1px solid
		var(--border);
}


	.card {
		min-width: 0;
	}


.control-card {
	position: relative;

	min-width: 0;

	align-content: start;

	padding: 0 !important;

	border: 0 !important;
	border-radius: 0 !important;

	background: transparent !important;

	box-shadow: none !important;
}


.control-card::before {
	display: none;
}

.control-card::after {
	content: '';

	display: block;

	width: 52px;
	height: 1px;

	margin-top: 16px;

	background:
		var(--brand-gold);

	opacity: .5;
}

.control-card h2 {
	margin-top: 5px;

	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		clamp(
			2.4rem,
			3.3vw,
			3.4rem
		);

	font-weight: 400;

	line-height: .95;

	text-transform: uppercase;
}
.control-card > .muted {
	max-width: 650px;
	margin-top: 12px;
	color: var(--muted);
	font-size: .86rem;
	line-height: 1.55;
}

	/* ==================================================
	   MANUAL AWARD FORM
	   ================================================== */

.award-form {
	display: grid;

	grid-template-columns:
		repeat(
			2,
			minmax(0, 1fr)
		);

	gap:
		12px 14px;

	margin-top: 24px;
}


.field {
	min-width: 0;

	display: grid;

	align-content: start;

	gap: 6px;
}

.field.full {
	grid-column:
		1 / -1;
}

	.field > span {
		color:
			var(--brand-stone);

		font-size: .61rem;

		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.field small {
		margin-left: 4px;

		color:
			rgba(157,155,145,.65);

		font-weight: 600;
	}


	input,
	select,
	textarea {
		width: 100%;
    min-height: 88px;

		box-sizing: border-box;

		outline: 0;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		padding:
			10px 11px;

		background:
			#0a0e0d;

		color:
			var(--brand-ivory);

		font: inherit;

		font-size: .84rem;
	}


	input,
	select {
		min-height: 44px;
	}


	textarea {
		min-height: 100px;

		resize: vertical;

		line-height: 1.5;
	}


	input:focus,
	select:focus,
	textarea:focus {
		border-color:
			var(--brand-gold);

		box-shadow:
			0 0 0 1px
			rgba(191,161,106,.12);
	}


	select option {
		color: #111;

		background: #fff;
	}


	/* ==================================================
	   SELECTED BADGE
	   ================================================== */

	.selected-badge {
		grid-column:
			1 / -1;

		display: grid;

		grid-template-columns:
			72px
			minmax(0,1fr);

		gap: 15px;

		align-items: center;

		margin-top: 3px;

		padding:
			14px;

		border:
			1px solid
			rgba(191,161,106,.2);

		background:
			rgba(191,161,106,.025);
	}


	.selected-badge img {
		width: 72px;
		height: 72px;

		object-fit: contain;
	}


	.selected-badge strong {
		color:
			var(--brand-ivory);

		font-size: .88rem;
	}


	.selected-badge p {
		margin-top: 4px;

		color:
			var(--muted);

		font-size: .68rem;

		line-height: 1.4;
	}


	.badge-meta {
		display: flex;
		flex-wrap: wrap;

		gap: 5px;

		margin-top: 9px;
	}


	.badge-meta span {
		padding:
			3px 6px;

		border:
			1px solid
			var(--border);

		color:
			var(--brand-stone);

		font-size: .43rem;
		font-weight: 800;

		text-transform: uppercase;
	}


	/* ==================================================
	   PRIMARY BUTTONS
	   ================================================== */

	.award-btn,
.generate-btn,
.commit-btn {
	width: fit-content;

	min-width: 190px;
	min-height: 42px;

	cursor: pointer;

	padding:
		0 16px;

	border:
		1px solid
		var(--brand-gold);

	border-radius: 2px;

	background:
		var(--brand-gold);

	color:
		var(--brand-charcoal);

	font: inherit;

	font-size: .62rem;
letter-spacing: .05em;
	font-weight: 900;

	

	text-transform: uppercase;
}


.award-btn:hover,
.generate-btn:hover,
.commit-btn:hover:not(:disabled) {
	border-color:
		var(--brand-sand);

	background:
		var(--brand-sand);
}



.award-btn.full {
	grid-column:
		1 / -1;

	justify-self: start;

	margin-top: 2px;
}

.generate-btn {
	width: fit-content;

	justify-self: start;

	margin-top: 2px;
}

	.commit-btn {
		width: 100%;

		padding:
			12px 16px;
	}


	.commit-btn:disabled,
	.generate-btn:disabled {
		opacity: .35;

		cursor: not-allowed;
	}


	/* ==================================================
	   AUTOMATION CONTROLS
	   ================================================== */

.automation-controls {
	display: grid;

	grid-template-columns:
		repeat(
			2,
			minmax(0, 1fr)
		);

	gap: 12px 14px;

	margin-top: 24px;
}



.automation-controls .generate-btn {
	grid-column:
		1 / -1;

	justify-self: start;
}

	/* ==================================================
	   AUTOMATION RULEBOOK
	   ================================================== */

.machine {
	display: grid;

	grid-template-columns:
		repeat(
			2,
			minmax(0, 1fr)
		);

	column-gap: 28px;

	margin-top: 26px;

	border-top:
		1px solid
		var(--border);
}


.machine-row {
	display: grid;

	grid-template-columns:
		minmax(90px, .45fr)
		minmax(0, 1fr);

	gap: 12px;

	align-items: center;

	min-height: 46px;

	padding:
		9px 0;

	border-bottom:
		1px solid
		var(--border);
}


.machine-row span {
	color:
		var(--brand-gold);

	font-size: .64rem;
	font-weight: 850;

	white-space: nowrap;
}


.machine-row strong {
	color:
		var(--muted);

	font-size: .68rem;
	font-weight: 650;

	line-height: 1.4;
}

	/* ==================================================
	   GENERATED PREVIEW
	   ================================================== */

	.preview-head {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 15px;

		margin-top: 28px;

		padding-top: 20px;

		border-top:
			1px solid
			var(--border);
	}


	.preview-head strong {
		display: block;

		margin-top: 3px;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.35rem;

		font-weight: 400;
	}


	.preview-count {
		padding:
			5px 8px;

		border:
			1px solid
			rgba(191,161,106,.32);

		color:
			var(--brand-gold);

		font-size: .47rem;

		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.preview-warnings {
		display: grid;
		gap: 4px;

		margin-top: 12px;

		padding:
			9px 11px;

		border-left:
			2px solid
			#bd9664;

		background:
			rgba(189,150,100,.04);

		color:
			var(--brand-sand);

		font-size: .61rem;
	}


	/* ==================================================
	   CANDIDATES
	   ================================================== */

	.candidate-list {
		display: grid;

		margin-top: 14px;

		border-top:
			1px solid
			var(--border);
	}


	.candidate-row {
		display: grid;

		grid-template-columns:
			48px
			minmax(0,1fr)
			auto;

		gap: 12px;

		align-items: center;

		padding:
			11px 2px;

		border-bottom:
			1px solid
			var(--border);
	}


	.candidate-row.already-awarded {
		opacity: .48;
	}


	.candidate-badge {
		width: 48px;
		height: 48px;

		object-fit: contain;
	}


	.candidate-main {
		min-width: 0;
	}


	.candidate-title {
		display: flex;
		flex-wrap: wrap;

		align-items: center;

		gap: 7px;
	}


	.candidate-title strong {
		color:
			var(--brand-ivory);

		font-size: .74rem;
	}


	.already-chip {
		padding:
			3px 5px;

		border:
			1px solid
			rgba(135,171,132,.35);

		color:
			#91b897;

		font-size: .39rem;

		font-weight: 850;

		letter-spacing: .05em;
	}


	.candidate-team {
		margin-top: 3px;

		color:
			var(--brand-gold);

		font-size: .62rem;

		font-weight: 750;
	}


	.candidate-reason {
		margin-top: 4px;

		color:
			var(--muted);

		font-size: .57rem;

		line-height: 1.4;
	}


	.candidate-matchup {
		margin-top: 4px;

		color:
			var(--brand-stone);

		font-size: .5rem;
	}


	.candidate-score {
		display: grid;

		justify-items: end;

		min-width: 58px;
	}


	.candidate-score small {
		color:
			var(--brand-stone);

		font-size: .4rem;

		font-weight: 850;

		letter-spacing: .11em;
	}


	.candidate-score strong {
		margin-top: 2px;

		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.25rem;

		font-weight: 400;
	}


	.commit-form {
		margin-top: 14px;
	}


	.empty-preview {
		margin-top: 15px;

		padding:
			18px 0;

		border-top:
			1px solid
			var(--border);

		color:
			var(--brand-stone);

		font-size: .64rem;

		text-align: center;
	}


	/* ==================================================
	   AWARD LEDGER
	   ================================================== */

	.page-stack > section.card:last-child {
		padding-top: 4px;
	}


	.history-head {
		display: flex;

		align-items: end;

		justify-content: space-between;

		gap: 20px;

		padding-bottom: 15px;

		border-bottom:
			1px solid
			var(--border);
	}


	.season-chip {
		padding:
			6px 9px;

		border:
			1px solid
			var(--border-strong);

		color:
			var(--brand-gold);

		font-size: .54rem;

		font-weight: 850;

		letter-spacing: .06em;
	}


	.award-list {
		display: grid;
	}


	.award-row {
		display: grid;

		grid-template-columns:
			56px
			minmax(0,1fr)
			auto;

		gap: 14px;

		align-items: center;

		min-height: 82px;

		padding:
			11px 4px;

		border-bottom:
			1px solid
			var(--border);

		transition:
			background 120ms ease;
	}


	.award-row:hover {
		background:
			rgba(191,161,106,.018);
	}


	.award-logo {
		width: 52px;
		height: 52px;

		display: grid;
		place-items: center;
	}


	.award-logo img {
		width: 100%;
		height: 100%;

		object-fit: contain;
	}


	.award-main {
		min-width: 0;
	}


	.award-title {
		display: flex;
		flex-wrap: wrap;

		align-items: baseline;

		gap: 8px;
	}


	.award-title strong {
		color:
			var(--brand-ivory);

		font-size: .78rem;
	}


	.award-title span {
		color:
			var(--brand-gold);

		font-size: .64rem;
	}


	.award-sub {
		display: flex;
		flex-wrap: wrap;

		gap: 8px;

		margin-top: 4px;

		color:
			var(--brand-stone);

		font-size: .5rem;

		font-weight: 750;

		letter-spacing: .04em;

		text-transform: uppercase;
	}


	.reason {
		margin-top: 6px;

		color:
			var(--muted);

		font-size: .61rem;

		line-height: 1.4;
	}


	.extra,
	.nominator,
	.timestamp {
		margin-top: 4px;

		color:
			var(--brand-stone);

		font-size: .51rem;
	}


	.nominator {
		color:
			var(--brand-gold);
	}


	.revoke-btn {
		min-height: 31px;

		cursor: pointer;

		padding:
			0 9px;

		border:
			1px solid
			rgba(189,116,109,.4);

		border-radius: 2px;

		background:
			transparent;

		color:
			#c77d72;

		font: inherit;

		font-size: .46rem;

		font-weight: 850;

		letter-spacing: .05em;
	}


	.revoke-btn:hover {
		border-color:
			#c77d72;

		background:
			rgba(189,116,109,.05);
	}


	.empty {
		padding:
			28px 0;

		color:
			var(--brand-stone);

		font-size: .67rem;

		text-align: center;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1000px) {

		.hero {
			grid-template-columns:
				1fr;
		}


		.badge-stage {
			display: none;
		}


		.control-grid {
			grid-template-columns:
				1fr;

			gap: 38px;
		}

	}


	@media (max-width: 650px) {

		.page-stack {
			gap: 20px;
		}


		.hero {
			min-height: 0;

			padding:
				28px 21px;
		}


		.hero h1 {
			font-size:
				clamp(
					3.5rem,
					16vw,
					5rem
				);
		}


		.hero-meta {
			display: grid;

			grid-template-columns:
				repeat(3,1fr);
		}


		.hero-meta span {
			min-width: 0;
		}


		.award-form,
		.automation-controls {
			grid-template-columns:
				1fr;
		}


		.field.full,
		.selected-badge,
		.award-btn.full,
		.automation-controls .generate-btn {
			grid-column: auto;
		}


		.selected-badge {
			grid-template-columns:
				56px
				1fr;
		}


		.selected-badge img {
			width: 56px;
			height: 56px;
		}


		.award-row {
			grid-template-columns:
				46px
				minmax(0,1fr);
		}


		.award-row form {
			grid-column:
				1 / -1;
		}


		.revoke-btn {
			width: 100%;
		}


		.candidate-row {
			grid-template-columns:
				42px
				minmax(0,1fr);
		}


		.candidate-score {
			grid-column: 2;

			justify-items: start;
		}

	}
</style>