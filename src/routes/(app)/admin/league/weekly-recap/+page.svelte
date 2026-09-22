<script>
  import WeeklyRecapArticle
    from '$lib/components/league/WeeklyRecapArticle.svelte';

  export let data;
  export let form;


  function pretty(
    value
  ) {
    if (
      value == null
    ) {
      return '';
    }

    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return String(
        value
      );
    }
  }


  function clone(
    value
  ) {
    return JSON.parse(
      JSON.stringify(
        value
      )
    );
  }


  $: savedRecap =
    form?.savedRecap ||
    data.savedRecap ||
    null;

  $: packet =
    form?.packet ||
    savedRecap
      ?.draftPacket ||
    null;

  $: summary =
    packet?.summary ||
    null;

  $: recap =
    form?.recap ||
    savedRecap
      ?.draftRecap ||
    null;

  $: aiMeta =
    form?.aiMeta ||
    savedRecap
      ?.draftAiMeta ||
    null;

  $: brain =
    packet
      ?.league
      ?.beatWriterContext ||
    null;

  $: brainTeamCount =
    brain?.teams?.length ||
    0;

  $: brainEditorialTeamCount =
    (
      brain?.teams ||
      []
    ).filter(
      (team) =>
        team.editorialNotes
          ?.length
    ).length;

  $: isPublished =
    Boolean(
      savedRecap
        ?.publishedRecap
    );


  let generatingDraft =
    false;

  let generationStage =
    '';

  let generationError =
    '';

  let editing =
    false;

  let editableRecap =
    null;


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
          ? JSON.parse(
              text
            )
          : null;
    } catch {
      body =
        null;
    }

    if (
      !response.ok
    ) {
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


  function startEditing() {
    if (!recap) {
      return;
    }

    editableRecap =
      clone(
        recap
      );

    editing =
      true;

    requestAnimationFrame(
      () => {
        document
          .querySelector(
            '#recap-editor'
          )
          ?.scrollIntoView({
            behavior:
              'smooth',

            block:
              'start'
          });
      }
    );
  }


  function cancelEditing() {
    editing =
      false;

    editableRecap =
      null;
  }


  function setFeatured(
    selectedIndex
  ) {
    if (
      !editableRecap
        ?.matchupRecaps
    ) {
      return;
    }

    editableRecap
      .matchupRecaps
      .forEach(
        (matchup, index) => {
          matchup.featured =
            index ===
            selectedIndex;
        }
      );

    editableRecap = {
      ...editableRecap
    };
  }


  async function generateDraft(
    event
  ) {
    if (
      generatingDraft
    ) {
      return;
    }

    const formElement =
      event.currentTarget
        ?.form;

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

    editing =
      false;

    try {
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

      generationStage =
        'Writing with league memory…';

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
    <div>
      <div class="eyebrow">
        League Media Automation
      </div>

      <h1>
        Weekly Recap Lab
      </h1>

      <p>
        Build the facts, let Eli write with the full Irving brain,
        edit the copy yourself, and publish only when it reads right.
      </p>
    </div>

    <div class="pipeline">
      <span class:done={packet}>
        01 Facts
      </span>

      <span class:done={recap}>
        02 Draft
      </span>

      <span class:done={editing}>
        03 Edit
      </span>

      <span class:done={isPublished}>
        04 Publish
      </span>
    </div>
  </section>


  <section class="card">
    <div class="section-label">
      Recap controls
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
        type="button"
        class="edit-button"
        onclick={startEditing}
        disabled={!recap}
      >
        Edit Draft
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

        {#if aiMeta?.manuallyEdited}
          <span class="edited-pill">
            Manually edited
          </span>
        {/if}

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
            Published
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
      <div class="error-message">
        {generationError}
      </div>
    {/if}


    {#if form && form.ok === false}
      <div class="error-message">
        {form.error}
      </div>
    {/if}
  </section>


  {#if summary}
    <section class="stats">
      <article>
        <span>Matchups</span>
        <strong>{summary.matchupCount}</strong>
      </article>

      <article>
        <span>Waivers</span>
        <strong>{summary.waiverCount}</strong>
      </article>

      <article>
        <span>FAAB</span>
        <strong>${summary.faabSpent}</strong>
      </article>

      <article>
        <span>Free Agents</span>
        <strong>{summary.freeAgentCount}</strong>
      </article>

      <article>
        <span>Trades</span>
        <strong>{summary.tradeCount}</strong>
      </article>
    </section>
  {/if}


  {#if packet?.transactions?.editorialWindow}
    <section class="card compact-card">
      <div class="section-label">
        Transaction window
      </div>

      <div class="window-grid">
        <div>
          <span>
            Recap Week
          </span>

          <strong>
            {packet.transactions.editorialWindow.recapWeek}
          </strong>
        </div>

        <div>
          <span>
            Wire source
          </span>

          <strong>
            Sleeper Week
            {packet.transactions.editorialWindow.waiverAndFreeAgentSleeperWeek}
          </strong>
        </div>

        <div>
          <span>
            Trade source
          </span>

          <strong>
            Sleeper Week
            {packet.transactions.editorialWindow.tradeSleeperWeek}
          </strong>
        </div>
      </div>

      <p class="muted">
        {packet.transactions.editorialWindow.note}
      </p>
    </section>
  {/if}


  {#if brain}
    <section class="card brain-card">
      <div class="section-label">
        League Brain
      </div>

      <div class="brain-heading">
        <div>
          <h2>
            What Eli knows before he writes
          </h2>

          <p class="muted">
            Priority storylines stay short. The full commissioner lore
            is now balanced matchup-by-matchup so one franchise cannot
            drown out the rest of the league.
          </p>
        </div>

        {#if brain.archiveCoverage}
          <div class="archive-chip">
            Archive
            {brain.archiveCoverage.firstSeason}
            –
            {brain.archiveCoverage.lastSeason}
          </div>
        {/if}
      </div>


      <div class="brain-section">
        <div class="brain-subhead">
          <div>
            <span>
              Priority Storylines
            </span>

            <small>
              Week-level angles only
            </small>
          </div>
        </div>

        {#if brain.priorityStoryHooks?.length}
          <div class="brain-hooks">
            {#each brain.priorityStoryHooks as hook}
              <article>
                {hook}
              </article>
            {/each}
          </div>
        {:else}
          <p class="muted">
            No priority historical hook was triggered for this week.
          </p>
        {/if}
      </div>


      <div class="brain-section">
        <div class="brain-subhead">
          <div>
            <span>
              Matchup Memory
            </span>

            <small>
              Both franchises receive equal editorial weight
            </small>
          </div>

          <strong>
            {brain.currentMatchupLore?.length || 0}
            matchups loaded
          </strong>
        </div>


        {#if brain.currentMatchupLore?.length}
          <div class="matchup-memory-grid">
            {#each brain.currentMatchupLore as matchup}
              <article class="matchup-memory-card">
                <header>
                  <strong>
                    {matchup.left?.teamName}
                  </strong>

                  <span>
                    vs
                  </span>

                  <strong>
                    {matchup.right?.teamName}
                  </strong>
                </header>


                <div class="memory-sides">
                  <div>
                    <div class="team-memory-name">
                      {matchup.left?.teamName}
                    </div>

                    <small>
                      {matchup.left?.editorialNotes?.length || 0}
                      editorial notes
                      ·
                      {matchup.left?.championships?.length || 0}
                      titles
                      {#if matchup.left?.defendingChampion}
                        · defending champion
                      {/if}
                    </small>

                    {#if matchup.left?.editorialNotes?.length}
                      <details>
                        <summary>
                          View commissioner lore
                        </summary>

                        <ul>
                          {#each matchup.left.editorialNotes as note}
                            <li>
                              {note}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                  </div>


                  <div>
                    <div class="team-memory-name">
                      {matchup.right?.teamName}
                    </div>

                    <small>
                      {matchup.right?.editorialNotes?.length || 0}
                      editorial notes
                      ·
                      {matchup.right?.championships?.length || 0}
                      titles
                      {#if matchup.right?.defendingChampion}
                        · defending champion
                      {/if}
                    </small>

                    {#if matchup.right?.editorialNotes?.length}
                      <details>
                        <summary>
                          View commissioner lore
                        </summary>

                        <ul>
                          {#each matchup.right.editorialNotes as note}
                            <li>
                              {note}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                  </div>
                </div>


                {#if matchup.series}
                  <footer>
                    {#if matchup.series.declaredRivalry}
                      <span class="rivalry-chip">
                        Declared rivalry
                      </span>
                    {/if}

                    {#if matchup.series.meetings}
                      <span>
                        Available series:
                        {matchup.series.leftTeam}
                        {matchup.series.leftWins}
                        –
                        {matchup.series.rightWins}
                        {matchup.series.rightTeam}
                        {#if matchup.series.ties}
                          · {matchup.series.ties} ties
                        {/if}
                      </span>
                    {:else}
                      <span>
                        No prior meeting in the available archive.
                      </span>
                    {/if}
                  </footer>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <p class="muted">
            No balanced matchup lore was available for this packet.
          </p>
        {/if}
      </div>


      <div class="brain-health">
        <strong>
          {brainTeamCount}
          franchise profiles loaded
        </strong>

        <span>
          ·
        </span>

        <span>
          {brainEditorialTeamCount}
          franchises currently have commissioner editorial notes
        </span>
      </div>
    </section>
  {/if}


  {#if editing && editableRecap}
    <section
      class="card editor-card"
      id="recap-editor"
    >
      <div class="editor-header">
        <div>
          <div class="section-label">
            Copy Desk
          </div>

          <h2>
            Edit the draft
          </h2>

          <p class="muted">
            This changes the saved draft only. Nothing public changes
            until you hit Publish Draft.
          </p>
        </div>

        <button
          type="button"
          class="ghost-button"
          onclick={cancelEditing}
        >
          Cancel
        </button>
      </div>


      <form
        method="POST"
        action="?/save"
        class="editor-form"
      >
        <input
          type="hidden"
          name="season"
          value={form?.season ?? data.defaultSeason}
        />

        <input
          type="hidden"
          name="week"
          value={form?.week ?? data.defaultWeek}
        />

        <input
          type="hidden"
          name="recap_json"
          value={JSON.stringify(editableRecap)}
        />


        <div class="field full">
          <label for="edit-title">
            Headline
          </label>

          <input
            id="edit-title"
            bind:value={editableRecap.title}
          />
        </div>


        <div class="field full">
          <label for="edit-subtitle">
            Subtitle
          </label>

          <textarea
            id="edit-subtitle"
            rows="2"
            bind:value={editableRecap.subtitle}
          ></textarea>
        </div>


        <div class="field full">
          <label for="edit-opening">
            Opening
          </label>

          <textarea
            id="edit-opening"
            rows="6"
            bind:value={editableRecap.opening}
          ></textarea>
        </div>


        <div class="editor-section">
          <h3>
            Matchups
          </h3>

          {#each editableRecap.matchupRecaps as matchup, index}
            <article class="edit-block">
              <div class="edit-block-head">
                <strong>
                  Matchup {matchup.matchupId}
                </strong>

                <label class="featured-toggle">
                  <input
                    type="radio"
                    name="featured_matchup"
                    checked={matchup.featured}
                    onchange={() => setFeatured(index)}
                  />

                  Featured
                </label>
              </div>

              <div class="field">
                <label>
                  Headline
                </label>

                <input
                  bind:value={matchup.headline}
                />
              </div>

              <div class="field">
                <label>
                  Body
                </label>

                <textarea
                  rows="5"
                  bind:value={matchup.body}
                ></textarea>
              </div>
            </article>
          {/each}
        </div>


        <div class="editor-section">
          <h3>
            Waiver Wire
          </h3>

          <div class="field">
            <label>
              Headline
            </label>

            <input
              bind:value={editableRecap.waiverWire.headline}
            />
          </div>

          <div class="field">
            <label>
              Body
            </label>

            <textarea
              rows="5"
              bind:value={editableRecap.waiverWire.body}
            ></textarea>
          </div>

          {#each editableRecap.waiverWire.notableClaims || [] as claim}
            <article class="fact-edit">
              <strong>
                {claim.teamName}
                ·
                {claim.players?.join(', ')}
                ·
                ${claim.faab}
              </strong>

              <textarea
                rows="2"
                bind:value={claim.commentary}
              ></textarea>
            </article>
          {/each}
        </div>


        <div class="editor-section">
          <h3>
            Trade Desk
          </h3>

          <div class="field">
            <label>
              Section headline
            </label>

            <input
              bind:value={editableRecap.tradeDesk.headline}
            />
          </div>

          <div class="field">
            <label>
              Section body
            </label>

            <textarea
              rows="4"
              bind:value={editableRecap.tradeDesk.body}
            ></textarea>
          </div>

          {#each editableRecap.tradeDesk.items || [] as trade}
            <article class="edit-block">
              <small>
                Transaction {trade.transactionId}
              </small>

              <div class="field">
                <label>
                  Headline
                </label>

                <input
                  bind:value={trade.headline}
                />
              </div>

              <div class="field">
                <label>
                  Body
                </label>

                <textarea
                  rows="4"
                  bind:value={trade.body}
                ></textarea>
              </div>
            </article>
          {/each}
        </div>


        <div class="editor-section two-up">
          <div>
            <h3>
              Standings Watch
            </h3>

            <div class="field">
              <label>
                Headline
              </label>

              <input
                bind:value={editableRecap.standings.headline}
              />
            </div>

            <div class="field">
              <label>
                Body
              </label>

              <textarea
                rows="5"
                bind:value={editableRecap.standings.body}
              ></textarea>
            </div>
          </div>

          <div>
            <h3>
              Badge Cabinet
            </h3>

            <div class="field">
              <label>
                Headline
              </label>

              <input
                bind:value={editableRecap.awards.headline}
              />
            </div>

            {#each editableRecap.awards.items || [] as award}
              <article class="fact-edit">
                <strong>
                  {award.title}
                  ·
                  {award.teamName}
                </strong>

                <textarea
                  rows="2"
                  bind:value={award.body}
                ></textarea>
              </article>
            {/each}
          </div>
        </div>


        <div class="field full">
          <label for="edit-closing">
            Closing
          </label>

          <textarea
            id="edit-closing"
            rows="4"
            bind:value={editableRecap.closing}
          ></textarea>
        </div>


        <div class="editor-actions">
          <button
            type="submit"
            class="save-button"
          >
            Save Draft Changes
          </button>

          <button
            type="button"
            class="ghost-button"
            onclick={cancelEditing}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  {/if}


  {#if recap}
    <section class="card">
      <div class="preview-header">
        <div>
          <div class="section-label">
            Editorial Preview
          </div>

          <h2>
            Current saved draft
          </h2>
        </div>

        <button
          type="button"
          class="edit-button"
          onclick={startEditing}
        >
          Edit Copy
        </button>
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


  {#if packet}
    <details class="card raw-card">
      <summary>
        Raw authoritative packet
      </summary>

      <p class="muted">
        Useful when you want to verify exactly what the writer received.
      </p>

      <pre>{pretty(packet)}</pre>
    </details>
  {/if}

</div>


<style>
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

  .hero,
  .card {
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    background: var(--panel);
    box-shadow: var(--shadow-panel);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    gap: 28px;
    align-items: end;
    padding: clamp(28px,4vw,44px);
    background:
      linear-gradient(
        120deg,
        rgba(191,161,106,.06),
        transparent 50%
      ),
      var(--panel-strong);
  }

  .eyebrow,
  .section-label,
  .field > label,
  .controls label span,
  .stats span,
  .window-grid span {
    color: var(--brand-gold);
    font-size: .56rem;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .hero h1 {
    margin-top: 8px;
    color: var(--brand-ivory);
    font-family: var(--font-display);
    font-size: clamp(3.8rem,7vw,6.4rem);
    font-weight: 400;
    line-height: .88;
    text-transform: uppercase;
  }

  .hero p {
    max-width: 760px;
    margin-top: 18px;
    color: var(--muted);
    line-height: 1.6;
  }

  .pipeline {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }

  .pipeline span {
    padding: 7px 9px;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: .62rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .pipeline span.done {
    border-color: rgba(191,161,106,.48);
    color: var(--brand-gold);
  }

  .card {
    padding: 22px;
  }

  .compact-card {
    display: grid;
    gap: 15px;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: end;
    margin-top: 14px;
  }

  .controls label {
    display: grid;
    gap: 6px;
  }

  input,
  textarea,
  button {
    font: inherit;
  }

  .controls input,
  .editor-form input,
  .editor-form textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: rgba(7,10,9,.7);
    color: var(--brand-ivory);
  }

  .controls input {
    width: 110px;
    padding: 10px 11px;
  }

  .editor-form input {
    padding: 11px 12px;
  }

  .editor-form textarea {
    resize: vertical;
    padding: 11px 12px;
    line-height: 1.55;
  }

  button {
    min-height: 39px;
    padding: 9px 12px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: rgba(255,255,255,.025);
    color: var(--brand-ivory);
    cursor: pointer;
    font-weight: 800;
  }

  button:hover:not(:disabled) {
    border-color: var(--brand-gold);
  }

  button:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  .ai-button {
    border-color: rgba(191,161,106,.55);
  }

  .edit-button {
    border-color: rgba(191,161,106,.25);
    color: var(--brand-sand);
  }

  .publish-button,
  .save-button {
    background: var(--brand-gold);
    border-color: var(--brand-gold);
    color: #111;
  }

  .ghost-button {
    background: transparent;
  }

  .recap-status {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 16px;
    color: var(--muted);
  }

  .recap-status > span {
    padding: 4px 7px;
    border: 1px solid var(--border);
    font-size: .58rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .recap-status > span.published {
    border-color: rgba(191,161,106,.55);
    color: var(--brand-gold);
  }

  .edited-pill {
    color: var(--brand-sand);
  }

  .success-message,
  .error-message {
    margin-top: 14px;
    padding: 10px 12px;
    border: 1px solid var(--border);
  }

  .success-message {
    color: var(--brand-sand);
  }

  .error-message {
    color: #f1a39c;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(5,minmax(0,1fr));
    gap: 8px;
  }

  .stats article {
    display: grid;
    gap: 5px;
    padding: 15px;
    border: 1px solid var(--border);
    background: var(--panel);
  }

  .stats strong {
    color: var(--brand-ivory);
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 400;
  }

  .window-grid {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 8px;
  }

  .window-grid > div {
    display: grid;
    gap: 5px;
    padding: 12px;
    border: 1px solid var(--border);
  }

  .window-grid strong {
    color: var(--brand-ivory);
  }

  .muted {
    color: var(--muted);
    line-height: 1.6;
  }

  .brain-card {
    display: grid;
    gap: 18px;
    border-color: rgba(191,161,106,.34);
    background:
      linear-gradient(
        120deg,
        rgba(191,161,106,.045),
        transparent 50%
      ),
      var(--panel);
  }

  .brain-heading,
  .editor-header,
  .preview-header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
  }

  .brain-heading h2,
  .editor-header h2,
  .preview-header h2 {
    margin-top: 5px;
    color: var(--brand-ivory);
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 400;
  }

  .archive-chip {
    flex: 0 0 auto;
    padding: 7px 9px;
    border: 1px solid rgba(191,161,106,.35);
    color: var(--brand-gold);
    font-size: .65rem;
    font-weight: 800;
  }

  .brain-hooks {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 8px;
  }

  .brain-hooks article {
    padding: 13px 14px;
    border: 1px solid var(--border);
    color: var(--brand-sand);
    font-size: .88rem;
    line-height: 1.55;
  }

  .brain-section {
    display: grid;
    gap: 11px;
    padding-top: 17px;
    border-top: 1px solid var(--border);
  }

  .brain-subhead {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: end;
  }

  .brain-subhead > div {
    display: grid;
    gap: 3px;
  }

  .brain-subhead span {
    color: var(--brand-gold);
    font-size: .6rem;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .brain-subhead small,
  .brain-subhead > strong {
    color: var(--muted);
    font-size: .66rem;
  }

  .matchup-memory-grid {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 9px;
  }

  .matchup-memory-card {
    display: grid;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,.012);
  }

  .matchup-memory-card > header {
    display: grid;
    grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
    gap: 8px;
    align-items: center;
  }

  .matchup-memory-card > header strong {
    color: var(--brand-ivory);
    font-size: .78rem;
    line-height: 1.25;
  }

  .matchup-memory-card > header strong:last-child {
    text-align: right;
  }

  .matchup-memory-card > header span {
    color: var(--brand-stone);
    font-size: .54rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .memory-sides {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 8px;
  }

  .memory-sides > div {
    min-width: 0;
    display: grid;
    align-content: start;
    gap: 6px;
    padding: 10px;
    border: 1px solid rgba(191,161,106,.1);
    background: rgba(7,10,9,.28);
  }

  .team-memory-name {
    color: var(--brand-sand);
    font-size: .72rem;
    font-weight: 800;
  }

  .memory-sides small {
    color: var(--muted);
    font-size: .62rem;
    line-height: 1.45;
  }

  .memory-sides details {
    margin-top: 2px;
  }

  .memory-sides summary {
    color: var(--brand-gold);
    cursor: pointer;
    font-size: .61rem;
    font-weight: 800;
  }

  .memory-sides ul {
    display: grid;
    gap: 6px;
    margin: 9px 0 0;
    padding-left: 16px;
  }

  .memory-sides li {
    color: var(--muted);
    font-size: .68rem;
    line-height: 1.45;
  }

  .matchup-memory-card > footer {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    align-items: center;
    color: var(--muted);
    font-size: .62rem;
  }

  .rivalry-chip {
    padding: 3px 5px;
    border: 1px solid rgba(191,161,106,.32);
    color: var(--brand-gold);
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .brain-health {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: .68rem;
  }

  .brain-health strong {
    color: var(--brand-sand);
  }

  .editor-card {
    scroll-margin-top: 20px;
    border-color: rgba(191,161,106,.48);
  }

  .editor-form {
    display: grid;
    gap: 22px;
    margin-top: 22px;
  }

  .field {
    display: grid;
    gap: 7px;
  }

  .editor-section {
    display: grid;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .editor-section h3 {
    color: var(--brand-ivory);
    font-family: var(--font-display);
    font-size: 1.65rem;
    font-weight: 400;
  }

  .edit-block,
  .fact-edit {
    display: grid;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--border);
    background: rgba(255,255,255,.012);
  }

  .edit-block-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .edit-block strong,
  .fact-edit strong {
    color: var(--brand-sand);
  }

  .edit-block small {
    color: var(--muted);
  }

  .featured-toggle {
    display: flex;
    gap: 7px;
    align-items: center;
    color: var(--brand-gold);
    font-size: .7rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .featured-toggle input {
    width: auto;
  }

  .two-up {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .two-up > div {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .editor-actions {
    display: flex;
    gap: 9px;
    padding-top: 8px;
  }

  .admin-recap-preview {
    margin-top: 18px;
  }

  .raw-card summary {
    color: var(--brand-ivory);
    cursor: pointer;
    font-weight: 800;
  }

  .raw-card p {
    margin-top: 10px;
  }

  pre {
    max-height: 720px;
    overflow: auto;
    margin: 14px 0 0;
    padding: 15px;
    border: 1px solid var(--border);
    background: #080b0a;
    color: var(--brand-sand);
    font-size: .72rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media (max-width: 900px) {
    .hero {
      grid-template-columns: 1fr;
    }

    .pipeline {
      justify-content: flex-start;
    }

    .stats {
      grid-template-columns: repeat(2,minmax(0,1fr));
    }

    .window-grid,
    .two-up,
    .brain-hooks,
    .matchup-memory-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .card {
      padding: 17px;
    }

    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .controls label,
    .controls button {
      width: 100%;
    }

    .controls input {
      width: 100%;
      box-sizing: border-box;
    }

    .brain-heading,
    .editor-header,
    .preview-header,
    .brain-subhead {
      display: grid;
    }

    .memory-sides {
      grid-template-columns: 1fr;
    }

    .stats {
      grid-template-columns: 1fr 1fr;
    }

    .editor-actions {
      display: grid;
    }
  }
</style>
