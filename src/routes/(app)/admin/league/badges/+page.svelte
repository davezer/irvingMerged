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

  <section class="card hero">

    <div>
      <div class="eyebrow">
        League Admin
      </div>

      <h1>
        Badge Control
      </h1>

      <p>
        Assign honors, stains and permanent marks on league history.
      </p>
    </div>

    <img
      class="hero-badge"
      src="/badges/stains.png"
      alt=""
    />

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
  .page-stack {
    display: grid;
    gap: 20px;
  }

  .card {
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.10),
        rgba(255,255,255,.025)
      );

    border:
      1px solid rgba(255,255,255,.10);

    border-radius: 24px;

    padding: 24px;

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.12),
      0 14px 32px rgba(0,0,0,.22);
  }

  .hero {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 30px;
  }

  .hero h1,
  h2 {
    margin:
      .35rem 0 .5rem;
  }

  .hero p,
  .muted {
    color:
      rgba(255,255,255,.68);
  }

  .hero-badge {
    width: 90px;
    height: 90px;
    object-fit: contain;
  }

  .eyebrow,
  .section-label {
    text-transform: uppercase;
    letter-spacing: .2em;
    font-size: 11px;
    color: #d6b15e;
    font-weight: 900;
  }


  /* RESULT */

  .notice {
    padding: 16px 20px;

    border-radius: 16px;

    border:
      1px solid rgba(255,255,255,.1);
  }

  .notice.success {
    border-color:
      rgba(70,200,110,.4);

    background:
      rgba(70,200,110,.08);
  }

  .notice.error {
    border-color:
      rgba(230,70,70,.45);

    background:
      rgba(230,70,70,.08);
  }


  /* CONTROLS */

  .control-grid {
    display: grid;

    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(320px, .65fr);

    gap: 18px;
  }

  .control-card {
    align-content: start;
  }

  .award-form {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 14px;

    margin-top: 22px;
  }

  .field {
    display: grid;
    gap: 7px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field > span {
    font-size: 12px;
    font-weight: 800;
  }

  .field small {
    margin-left: 5px;

    color:
      rgba(255,255,255,.42);

    font-weight: 500;
  }

  input,
  select,
  textarea {
    width: 100%;

    box-sizing: border-box;

    border:
      1px solid rgba(255,255,255,.11);

    border-radius: 12px;

    background:
      rgba(0,0,0,.30);

    color: #f6f1e8;

    padding: 12px 13px;

    font: inherit;
  }

  select option {
    background: #161b20;
    color: #fff;
  }

  textarea {
    resize: vertical;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;

    border-color:
      rgba(35,161,255,.65);

    box-shadow:
      0 0 0 3px
      rgba(35,161,255,.1);
  }


  /* BADGE PREVIEW */

  .selected-badge {
    grid-column: 1 / -1;

    display: grid;

    grid-template-columns:
      68px 1fr;

    gap: 14px;

    padding: 14px;

    border:
      1px solid rgba(255,255,255,.09);

    border-radius: 14px;

    background:
      rgba(0,0,0,.18);
  }

  .selected-badge img {
    width: 68px;
    height: 68px;
    object-fit: contain;
  }

  .selected-badge p {
    margin: 5px 0 0;

    color:
      rgba(255,255,255,.62);

    font-size: 13px;
  }

  .badge-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    margin-top: 10px;
  }

  .badge-meta span {
    padding:
      4px 8px;

    border-radius: 999px;

    border:
      1px solid rgba(255,255,255,.1);

    color:
      rgba(255,255,255,.6);

    font-size: 10px;

    text-transform: uppercase;
  }


  /* BUTTONS */

  .award-btn,
  .generate-btn {
    border: 0;

    border-radius: 999px;

    padding: 14px 18px;

    font-weight: 900;

    cursor: pointer;

    color: #111;

    background:
      linear-gradient(
        180deg,
        #f0c96d,
        #c99a34
      );
  }

  .award-btn.full {
    grid-column: 1 / -1;
  }

  .generate-btn {
    width: 100%;
    margin-top: 18px;
  }

  .generate-btn:disabled {
    opacity: .35;
    cursor: not-allowed;
  }


  /* AUTOMATION */

  .machine {
    display: grid;
    gap: 8px;

    margin-top: 20px;
  }

  .machine-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;

    padding: 11px 12px;

    border:
      1px solid rgba(255,255,255,.08);

    border-radius: 11px;

    background:
      rgba(0,0,0,.18);
  }

  .machine-row span {
    color: #d6b15e;
    font-weight: 900;
  }

  .machine-row strong {
    color:
      rgba(255,255,255,.7);

    font-size: 12px;
  }

  .coming {
    margin-top: 9px;

    color:
      rgba(255,255,255,.38);

    text-align: center;

    font-size: 11px;
  }


  /* LEDGER */

  .history-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;

    margin-bottom: 18px;
  }

  .season-chip {
    padding:
      7px 12px;

    border-radius: 999px;

    border:
      1px solid rgba(255,255,255,.12);

    color: #d6b15e;

    font-weight: 900;
  }

  .award-list {
    display: grid;
    gap: 9px;
  }

  .award-row {
    display: grid;

    grid-template-columns:
      52px
      minmax(0,1fr)
      auto;

    gap: 14px;

    align-items: center;

    padding: 13px;

    border:
      1px solid rgba(255,255,255,.08);

    border-radius: 14px;

    background:
      rgba(0,0,0,.16);
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

  .award-title {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: baseline;
  }

  .award-title span {
    color:
      rgba(255,255,255,.63);

    font-size: 13px;
  }

  .award-sub {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    margin-top: 4px;

    color:
      rgba(255,255,255,.43);

    font-size: 11px;

    text-transform: uppercase;
  }

  .reason {
    margin:
      7px 0 0;

    color:
      rgba(255,255,255,.7);

    font-size: 12px;
  }

  .extra,
  .nominator,
  .timestamp {
    margin-top: 5px;

    color:
      rgba(255,255,255,.43);

    font-size: 11px;
  }

  .nominator {
    color: #d6b15e;
  }

  .revoke-btn {
    border:
      1px solid rgba(230,80,80,.4);

    border-radius: 999px;

    padding:
      8px 11px;

    background:
      rgba(180,40,40,.1);

    color:
      #ef9999;

    font-size: 10px;
    font-weight: 900;

    cursor: pointer;
  }

  .revoke-btn:hover {
    background:
      rgba(180,40,40,.22);
  }

  .empty {
    padding: 30px;

    text-align: center;

    color:
      rgba(255,255,255,.42);
  }


  @media (
    max-width: 900px
  ) {
    .control-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (
    max-width: 650px
  ) {
    .award-form {
      grid-template-columns: 1fr;
    }

    .field.full,
    .selected-badge,
    .award-btn.full {
      grid-column: auto;
    }

    .award-row {
      grid-template-columns:
        44px
        minmax(0,1fr);
    }

    .award-row form {
      grid-column: 1 / -1;
    }

    .revoke-btn {
      width: 100%;
    }

    .hero-badge {
      display: none;
    }
  }

  /* ==========================================================
   WEEKLY BADGE AUTOMATION
   ========================================================== */

.automation-controls {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 12px;

  margin-top: 20px;
}

.automation-controls .generate-btn {
  grid-column: 1 / -1;
  margin-top: 0;
}


.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  margin-top: 24px;
  padding-top: 20px;

  border-top:
    1px solid rgba(255,255,255,.1);
}


.preview-count {
  padding:
    6px 10px;

  border-radius: 999px;

  border:
    1px solid rgba(214,177,94,.3);

  color: #d6b15e;

  background:
    rgba(214,177,94,.08);

  font-size: 11px;
  font-weight: 900;
}


.preview-warnings {
  display: grid;
  gap: 5px;

  margin-top: 12px;

  padding: 10px 12px;

  border:
    1px solid rgba(230,170,70,.25);

  border-radius: 10px;

  background:
    rgba(230,170,70,.06);

  color:
    rgba(255,220,150,.8);

  font-size: 11px;
}


.candidate-list {
  display: grid;
  gap: 8px;

  margin-top: 14px;
}


.candidate-row {
  display: grid;

  grid-template-columns:
    48px
    minmax(0,1fr)
    auto;

  gap: 11px;

  align-items: center;

  padding: 11px;

  border:
    1px solid rgba(255,255,255,.09);

  border-radius: 12px;

  background:
    rgba(0,0,0,.2);
}


.candidate-row.already-awarded {
  opacity: .55;
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
  align-items: center;
  flex-wrap: wrap;

  gap: 7px;
}


.candidate-title strong {
  color: #d6b15e;
}


.already-chip {
  padding:
    3px 6px;

  border-radius: 999px;

  border:
    1px solid rgba(80,200,120,.25);

  background:
    rgba(80,200,120,.08);

  color:
    rgba(120,230,155,.85);

  font-size: 8px;
  font-weight: 900;
}


.candidate-team {
  margin-top: 2px;

  font-weight: 800;
}


.candidate-reason {
  margin-top: 4px;

  color:
    rgba(255,255,255,.55);

  font-size: 11px;
  line-height: 1.35;
}


.candidate-matchup {
  margin-top: 4px;

  color:
    rgba(255,255,255,.38);

  font-size: 10px;
}


.candidate-score {
  display: grid;
  justify-items: end;

  min-width: 55px;
}


.candidate-score small {
  color:
    rgba(255,255,255,.35);

  font-size: 8px;
  font-weight: 900;

  letter-spacing: .12em;
}


.candidate-score strong {
  margin-top: 2px;

  font-size: 16px;
}


.commit-form {
  margin-top: 14px;
}


.commit-btn {
  width: 100%;

  padding: 14px 18px;

  border: 0;
  border-radius: 999px;

  background:
    linear-gradient(
      180deg,
      #f0c96d,
      #c99a34
    );

  color: #111;

  font-weight: 900;

  cursor: pointer;
}


.commit-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
}


.empty-preview {
  margin-top: 15px;

  padding: 18px;

  text-align: center;

  border:
    1px dashed rgba(255,255,255,.1);

  border-radius: 12px;

  color:
    rgba(255,255,255,.4);

  font-size: 12px;
}


@media (max-width: 650px) {
  .automation-controls {
    grid-template-columns: 1fr;
  }

  .automation-controls .generate-btn {
    grid-column: auto;
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