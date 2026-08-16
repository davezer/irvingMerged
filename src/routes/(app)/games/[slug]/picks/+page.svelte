<script>
  import { resolve } from '$app/paths';
  import { eventDisplay } from '$lib/events/displayNames';
  import RoundTracker from '$lib/games/madness/RoundTracker.svelte';
  import FuturePointsPanel from '$lib/games/madness/picks/FuturePointsPanel.svelte';
  import FatePathCard from '$lib/games/madness/picks/FatePathCard.svelte';
  import TeamImpactPanel from '$lib/games/madness/picks/TeamImpactPanel.svelte';
  import { createPicksBoardContext, teamIdOf } from '$lib/games/madness/picksBoard.js';
  import MastersPicksBoard from '$lib/games/masters/PicksBoard.svelte';

  export let data;

  const { event, locked, results, entries = [] } = data;
  const names = eventDisplay(event);
  const resultsPayload = results?.payload || null;

  const board = createPicksBoardContext({ entries, resultsPayload });

  const {
    completedRoundIndex,
    completedRoundLabel,
    teamPickMap,
    teamStats,
    mostPickedTeams,
    highestSeedPicked,
    survivingLongshots,
    graveyardTeam,
    ownershipByRound,
    enrichedEntries,
    boldestEntry,
    chalkiestEntry,
    mostAliveEntry,
    seedOf,
    pointsSoFar,
    teamStatus,
    stageLabel,
    buildTeamImpact
  } = board;

  let selectedImpactTeamId = mostPickedTeams[0]?.id || '';

  $: if (!teamStats.some((row) => row.id === selectedImpactTeamId)) {
    selectedImpactTeamId = mostPickedTeams[0]?.id || teamStats[0]?.id || '';
  }

  function prettyLock(ts) {
    if (!ts) return '';
    return new Date(Number(ts) * 1000).toLocaleString();
  }

  function badgeList(entry) {
    const badges = [];

    const aliveNow = displayAliveCount(entry);

    if (aliveNow === 4) badges.push({ label: 'All 4 alive', tone: 'green' });
    if (displayEntryIsBusted(entry)) badges.push({ label: 'Busted', tone: 'red' });
    if (boldestEntry && entry.user_id === boldestEntry.user_id) badges.push({ label: 'Boldest card', tone: 'gold' });
    if (chalkiestEntry && entry.user_id === chalkiestEntry.user_id) badges.push({ label: 'Chalk king', tone: 'muted' });
    if (displayMostAliveEntry && entry.user_id === displayMostAliveEntry.user_id) badges.push({ label: 'Most alive', tone: 'green' });

    const highestSeedOnCard = Math.max(
      0,
      ...((entry.selectedTeams || []).map((t) => Number(seedOf(t) || 0)))
    );
    if (highestSeedOnCard >= 10) {
      badges.push({ label: `Longshot ${highestSeedOnCard}`, tone: 'gold' });
    }

    return badges.slice(0, 5);
  }

  function fmtAvgSeed(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
  }

  function fmtTeamName(team) {
    return team?.name || team?.abbr || teamIdOf(team) || 'Team';
  }

  function teamOwners(team) {
    const row = teamPickMap.get(teamIdOf(team));
    return row?.owners || [];
  }

  const eliminatedByTeamId = resultsPayload?.eliminatedByTeamId || {};

  function isEliminatedTeamId(id) {
    return !!eliminatedByTeamId?.[id];
  }

  function isManuallyEliminated(team) {
    return isEliminatedTeamId(teamIdOf(team));
  }

  function displayTeamStatus(team) {
    return isManuallyEliminated(team) ? 'eliminated' : teamStatus(team);
  }

  function displayStageLabel(team) {
    return isManuallyEliminated(team) ? 'Out' : stageLabel(team);
  }

  function displayAliveCount(entry) {
    return (entry?.selectedTeams || []).filter((team) => displayTeamStatus(team) !== 'eliminated').length;
  }

  function displayEntryIsBusted(entry) {
    return displayAliveCount(entry) === 0 && completedRoundIndex >= 0;
  }

  $: displayMostPickedTeams = mostPickedTeams.map((row) => ({
    ...row,
    status: isEliminatedTeamId(row.id) ? 'eliminated' : row.status,
    stage: isEliminatedTeamId(row.id) ? 'Out' : row.stage
  }));

  $: displaySurvivingLongshots = survivingLongshots.filter((row) => !isEliminatedTeamId(row.id));

  $: displayMostAliveEntry = [...enrichedEntries]
    .sort((a, b) => displayAliveCount(b) - displayAliveCount(a) || (b.scoreTotal || 0) - (a.scoreTotal || 0))[0] || null;

  $: rawTeamImpact = selectedImpactTeamId ? buildTeamImpact(selectedImpactTeamId) : null;
  $: selectedTeamImpact = rawTeamImpact
    ? {
        ...rawTeamImpact,
        status: isEliminatedTeamId(rawTeamImpact.id) ? 'eliminated' : rawTeamImpact.status,
        stage: isEliminatedTeamId(rawTeamImpact.id) ? 'Out' : rawTeamImpact.stage
      }
    : null;
</script>
{#if locked}

	<div class="daytona-shell">

		<header class="entry-hero locked-hero">

			<div class="hero-copy">

				<div class="eyebrow">
					Daytona 500 · Final Entry
				</div>

				<h1>
					Race Card Locked
				</h1>

				<p>
					The green flag has dropped. Your picks are official,
					your Chaos Car is committed, and there are no take-backs.
				</p>

			</div>


			<div class="lock-stamp">
				<span>
					Entry Status
				</span>

				<strong>
					Final
				</strong>

				<small>
					No Edits
				</small>
			</div>


			<div
				class="hero-watermark"
				aria-hidden="true"
			>
				DAYTONA
			</div>

		</header>


		{#if entry?.payload?.top10Ids?.length}

			<section class="final-board">

				<div class="section-heading">

					<div>
						<div class="eyebrow">
							Official Forecast
						</div>

						<h2>
							Your Top 10
						</h2>
					</div>

					<span>
						10 Drivers
					</span>

				</div>


				<div class="final-grid">

					{#if entry?.payload?.top10Snapshot?.length}

						{#each entry.payload.top10Snapshot as row, index}

							<div class="final-driver">

								<span class="final-rank">
									#{index + 1}
								</span>

								<div class="final-driver-name">

									<strong>
										{row?.name || row?.id}
									</strong>

									{#if row?.carNumber}
										<small>
											Car #{row.carNumber}
										</small>
									{/if}

								</div>

							</div>

						{/each}

					{:else}

						{#each entry.payload.top10Ids as id, index}

							<div class="final-driver">

								<span class="final-rank">
									#{index + 1}
								</span>

								<div class="final-driver-name">
									<strong>
										{id}
									</strong>
								</div>

							</div>

						{/each}

					{/if}

				</div>

			</section>


			<section class="locked-chaos">

				<div>

					<div class="eyebrow">
						Chaos Selection
					</div>

					<h2>
						Chaos Car
					</h2>

					<p>
						The driver you trusted to create a little unnecessary danger
						outside your projected Top 10.
					</p>

				</div>


				<div class="locked-chaos-pick">

					{#if entry?.payload?.chaosCarId}

						<span>
							Locked
						</span>

						<strong>
							{#if entry?.payload?.chaosCarSnapshot?.carNumber}
								#{entry.payload.chaosCarSnapshot.carNumber}
							{/if}

							{entry?.payload?.chaosCarSnapshot?.name ||
								entry?.payload?.chaosCarSnapshot?.id ||
								entry.payload.chaosCarId}
						</strong>

					{:else}

						<span>
							No Selection
						</span>

						<strong>
							—
						</strong>

					{/if}

				</div>

			</section>

		{:else}

			<section class="state-message">

				<div class="eyebrow">
					No Entry
				</div>

				<h2>
					You sat this one out.
				</h2>

				<p>
					No Daytona entry was submitted before the event locked.
				</p>

			</section>

		{/if}

	</div>


{:else if loading}

	<div class="daytona-shell">

		<section class="state-message">

			<div class="eyebrow">
				Daytona Entry Desk
			</div>

			<h2>
				Loading the Grid
			</h2>

			<p>
				Fetching the driver pool…
			</p>

		</section>

	</div>


{:else if loadError}

	<div class="daytona-shell">

		<section class="state-message error-state">

			<div class="eyebrow">
				Entry Desk Error
			</div>

			<h2>
				Couldn't Load the Grid
			</h2>

			<p>
				{loadError}
			</p>

			<button
				class="secondary-btn"
				type="button"
				on:click={onRetryOptions}
			>
				Try Again
			</button>

		</section>

	</div>


{:else}

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			saveError = '';
			savedPulse = false;

			const savedIdsNow = [...currentIds];
			const savedChaosNow = currentChaosId
				? String(currentChaosId)
				: '';

			return async ({ result, update }) => {

				if (result.type === 'success') {

					await update({
						reset: false
					});

					hydratedEntryRowId = null;

					lastSavedIds =
						savedIdsNow;

					lastSavedChaosId =
						savedChaosNow;

					savedPulse = true;

					setTimeout(
						() =>
							(savedPulse = false),
						1200
					);

				} else if (result.type === 'failure') {

					saveError =
						result.data?.message ||
						'Could not save entry.';

				} else {

					saveError =
						'Something went wrong saving your entry.';

				}

				saving = false;
			};
		}}
	>

		<div class="daytona-shell">

			<header class="entry-hero">

				<div class="hero-copy">

					<div class="eyebrow">
						Race, Crash, Cash · Daytona 500
					</div>

					<h1>
						Build Your Race Card
					</h1>

					<p>
						Predict the Top 10 in exact order, then choose one driver
						outside your board as the Chaos Car. Ten calculated calls
						and one terrible idea.
					</p>


					<div class="entry-specs">

						<span>
							<strong>
								10
							</strong>

							Ranked Picks
						</span>

						<span>
							<strong>
								1
							</strong>

							Chaos Car
						</span>

						<span>
							<strong>
								41
							</strong>

							Make the Race
						</span>

					</div>

				</div>


				<div class="rules-desk">

					<div class="rules-label">
						Event Rules
					</div>

					<div class="sectionHead">
						<SectionHead
							rules={DAYTONA_RULES}
						/>
					</div>

					<p>
						45 cars are in the pool. Only 41 make the field.
						If your driver misses the race, that's your problem.
					</p>

				</div>


				<div
					class="hero-watermark"
					aria-hidden="true"
				>
					DAYTONA
				</div>

			</header>


			<section class="entry-workspace">

				<div class="section-heading workspace-heading">

					<div>

						<div class="eyebrow">
							Race Forecast
						</div>

						<h2>
							Your Top 10
						</h2>

						<p>
							Order matters. Build the finish exactly how you think
							the checkered flag falls.
						</p>

					</div>


					<div class="selection-count">

						<strong>
							{top10.length}
						</strong>

						<span>
							/ 10 Selected
						</span>

					</div>

				</div>


				<div class="picker-stage">

					<PodiumPicker
						{options}
						bind:value={top10}
						{locked}
						max={10}
					>

						<button
							slot="podiumActions"
							class="save-entry-btn"
							type="submit"
							disabled={
								locked ||
								saving ||
								top10.length !== 10 ||
								!chaosCarId ||
								!dirty
							}
							title={
								locked
									? 'Event is locked'
									: top10.length !== 10
										? 'Pick exactly 10 to save'
										: !chaosCarId
											? 'Choose a Chaos Car'
											: !dirty
												? 'No changes to save'
												: 'Save entry'
							}
						>
							{saveLabel}
						</button>


						<div
							slot="sidePanel"
							class="chaos-desk"
						>

							<div class="chaos-heading">

								<div>

									<div class="eyebrow">
										Wild Card
									</div>

									<h3>
										Chaos Car
									</h3>

								</div>


								<span
									class:chosen={Boolean(
										chaosCarId
									)}
									class="chaos-status"
								>
									{chaosCarId
										? 'Chosen'
										: 'Required'}
								</span>

							</div>


							<p>
								Pick one driver outside your Top 10.
								Someone capable of turning a perfectly normal
								Sunday into complete bullshit.
							</p>


							<label for="chaos">
								Chaos Driver
							</label>

							<select
								id="chaos"
								class="chaos-select"
								bind:value={chaosCarId}
								disabled={locked}
								on:change={() =>
									(chaosTouched = true)}
							>

								<option value="">
									— Choose a Chaos Car —
								</option>

								{#each chaosOptions as opt}

									<option
										value={String(
											opt.id
										)}
									>
										{opt.carNumber
											? `#${opt.carNumber} `
											: ''}{opt.name}
									</option>

								{/each}

							</select>


							{#if chaosCarId}

								<div class="chaos-selection">

									<span>
										Your Chaos Car
									</span>

									<strong>
										{chaosLabel}
									</strong>

									<button
										class="clear-btn"
										type="button"
										on:click={() => {
											chaosCarId = '';
											chaosTouched = true;
										}}
									>
										Clear Selection
									</button>

								</div>

							{:else}

								<div class="chaos-tip">

									<strong>
										Strategy?
									</strong>

									<span>
										Volatile is good. That's the point.
									</span>

								</div>

							{/if}


							<div class="chaos-rule">
								Chaos Car cannot appear in your Top 10.
							</div>

						</div>


						<div
							slot="statusLine"
							class:error={Boolean(
								saveError
							)}
							class:success={
								savedPulse ||
								(!dirty &&
									top10.length ===
										10 &&
									Boolean(
										chaosCarId
									))
							}
							class="entry-status"
							aria-live="polite"
						>

							{#if saveError}

								{saveError}

							{:else if saving}

								Saving your race card…

							{:else if savedPulse}

								✓ Entry saved.

							{:else if top10.length !== 10}

								{10 - top10.length}
								more
								{10 - top10.length === 1
									? 'pick'
									: 'picks'}
								needed.

							{:else if !chaosCarId}

								Top 10 complete. Choose your Chaos Car.

							{:else if !dirty}

								✓ Entry saved.

							{:else}

								Changes ready to save.

							{/if}

						</div>

					</PodiumPicker>

				</div>

			</section>


			<input
				type="hidden"
				name="top10Ids"
				value={top10IdsJson}
			/>

			<input
				type="hidden"
				name="top10Snapshot"
				value={top10SnapshotJson}
			/>

			<input
				type="hidden"
				name="chaosCarId"
				value={chaosCarId}
			/>

			<input
				type="hidden"
				name="chaosCarName"
				value={chaosCarName}
			/>

			<input
				type="hidden"
				name="chaosCarNumber"
				value={chaosCarNumber}
			/>

		</div>

	</form>

{/if}


<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.daytona-shell {
		width: 100%;
		max-width: 1450px;

		display: grid;
		gap: 30px;

		margin: 0 auto;

		padding-bottom: 64px;
	}


	.eyebrow {
		color:
			var(--brand-gold);

		font-size: .64rem;
		font-weight: 850;

		letter-spacing: .12em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.entry-hero {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0, 1fr)
			360px;

		align-items: center;

		gap: 50px;

		overflow: hidden;

		padding:
			38px
			clamp(30px, 4vw, 54px);

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.045),
				transparent 45%
			),
			var(--panel-strong);

		box-shadow:
			var(--shadow-panel);
	}


	.hero-copy {
		position: relative;
		z-index: 2;
	}


	.entry-hero h1 {
		max-width: 850px;

		margin:
			8px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4rem,
				7vw,
				6.5rem
			);

		font-weight: 400;

		line-height: .86;

		letter-spacing: -.025em;

		text-transform: uppercase;
	}


	.hero-copy > p {
		max-width: 720px;

		margin:
			20px 0 0;

		color:
			var(--muted);

		font-size: .94rem;
		font-weight: 600;

		line-height: 1.6;
	}


	.entry-specs {
		display: inline-flex;

		width: fit-content;

		margin-top: 25px;

		border:
			1px solid
			var(--border);
	}


	.entry-specs span {
		min-width: 110px;

		display: grid;
		gap: 2px;

		padding:
			9px 12px;

		border-right:
			1px solid
			var(--border);

		background:
			#090d0c;

		color:
			var(--brand-stone);

		font-size: .56rem;
		font-weight: 750;

		letter-spacing: .05em;

		text-transform: uppercase;
	}


	.entry-specs span:last-child {
		border-right: 0;
	}


	.entry-specs strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 1.35rem;
		font-weight: 400;

		line-height: 1;
	}


	.hero-watermark {
		position: absolute;

		right: -24px;
		bottom: -52px;

		color:
			rgba(191,161,106,.017);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				9rem,
				17vw,
				15rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   RULES
	   ================================================== */

	.rules-desk {
		position: relative;
		z-index: 2;

		display: grid;
		gap: 12px;

		padding: 20px;

		border:
			1px solid
			rgba(191,161,106,.27);

		background:
			rgba(6,9,8,.55);
	}


	.rules-label {
		color:
			var(--brand-gold);

		font-size: .61rem;
		font-weight: 850;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.rules-desk p {
		margin: 0;

		color:
			var(--muted);

		font-size: .76rem;

		line-height: 1.55;
	}


	.sectionHead {
		min-width: 0;
	}


	/* ==================================================
	   WORKSPACE
	   ================================================== */

	.entry-workspace {
		display: grid;
		gap: 18px;
	}


	.section-heading {
		display: flex;

		justify-content: space-between;

		align-items: end;

		gap: 20px;

		padding-bottom: 15px;

		border-bottom:
			1px solid
			var(--border);
	}


	.section-heading h2 {
		margin:
			5px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.6rem,
				4vw,
				3.7rem
			);

		font-weight: 400;

		line-height: .95;

		text-transform: uppercase;
	}


	.section-heading p {
		max-width: 720px;

		margin:
			9px 0 0;

		color:
			var(--muted);

		font-size: .8rem;

		line-height: 1.5;
	}


	.selection-count {
		display: flex;

		align-items: baseline;

		gap: 5px;

		padding-bottom: 3px;
	}


	.selection-count strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2rem;

		font-weight: 400;

		line-height: 1;
	}


	.selection-count span {
		color:
			var(--brand-stone);

		font-size: .61rem;
		font-weight: 800;

		letter-spacing: .05em;

		text-transform: uppercase;
	}


	.picker-stage {
		min-width: 0;
	}


	/* ==================================================
	   SAVE BUTTON
	   ================================================== */

	.save-entry-btn,
	.secondary-btn {
		min-height: 42px;

		cursor: pointer;

		padding:
			0 18px;

		border:
			1px solid
			var(--brand-gold);

		border-radius: 2px;

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);

		font: inherit;

		font-size: .63rem;
		font-weight: 900;

		letter-spacing: .05em;

		text-transform: uppercase;
	}


	.save-entry-btn:hover:not(:disabled),
	.secondary-btn:hover {
		background:
			var(--brand-sand);

		border-color:
			var(--brand-sand);
	}


	.save-entry-btn:disabled {
		opacity: .35;

		cursor: not-allowed;
	}


	/* ==================================================
	   CHAOS DESK
	   ================================================== */

	.chaos-desk {
		min-width: 0;

		display: grid;
		align-content: start;

		gap: 15px;

		padding:
			20px;

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(191,161,106,.028);
	}


	.chaos-heading {
		display: flex;

		justify-content: space-between;

		align-items: start;

		gap: 16px;
	}


	.chaos-heading h3 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2rem;
		font-weight: 400;

		line-height: .95;

		text-transform: uppercase;
	}


	.chaos-status {
		padding:
			5px 7px;

		border:
			1px solid
			var(--border-strong);

		color:
			var(--brand-stone);

		font-size: .55rem;
		font-weight: 850;

		letter-spacing: .06em;

		text-transform: uppercase;
	}


	.chaos-status.chosen {
		border-color:
			rgba(145,184,155,.42);

		color:
			#91b89b;
	}


	.chaos-desk > p {
		margin: 0;

		color:
			var(--muted);

		font-size: .76rem;

		line-height: 1.55;
	}


	.chaos-desk label {
		color:
			var(--brand-stone);

		font-size: .61rem;
		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.chaos-select {
		width: 100%;

		min-height: 44px;

		box-sizing: border-box;

		outline: 0;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		padding:
			9px 11px;

		background:
			#090d0c;

		color:
			var(--brand-ivory);

		font: inherit;

		font-size: .82rem;
	}


	.chaos-select:focus {
		border-color:
			var(--brand-gold);
	}


	.chaos-select option {
		background: #fff;

		color: #111;
	}


	.chaos-selection {
		display: grid;
		gap: 5px;

		padding:
			14px 0;

		border-top:
			1px solid
			var(--border);

		border-bottom:
			1px solid
			var(--border);
	}


	.chaos-selection > span {
		color:
			var(--brand-gold);

		font-size: .57rem;
		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.chaos-selection strong {
		color:
			var(--brand-ivory);

		font-size: .9rem;
	}


	.clear-btn {
		width: fit-content;

		margin-top: 6px;

		cursor: pointer;

		padding: 0;

		border: 0;

		background: transparent;

		color:
			var(--brand-gold);

		font: inherit;

		font-size: .63rem;
		font-weight: 800;
	}


	.clear-btn:hover {
		color:
			var(--brand-sand);
	}


	.chaos-tip {
		display: grid;
		gap: 3px;

		padding:
			13px 0;

		border-top:
			1px solid
			var(--border);

		border-bottom:
			1px solid
			var(--border);
	}


	.chaos-tip strong {
		color:
			var(--brand-gold);

		font-size: .66rem;
	}


	.chaos-tip span,
	.chaos-rule {
		color:
			var(--brand-stone);

		font-size: .66rem;

		line-height: 1.45;
	}


	/* ==================================================
	   STATUS
	   ================================================== */

	.entry-status {
		min-height: 32px;

		display: flex;
		align-items: center;

		padding-left: 12px;

		border-left:
			2px solid
			var(--brand-gold);

		color:
			var(--brand-stone);

		font-size: .7rem;
	}


	.entry-status.success {
		border-color:
			#91b89b;

		color:
			#91b89b;
	}


	.entry-status.error {
		border-color:
			#c77d72;

		color:
			#c77d72;
	}


	/* ==================================================
	   LOCKED ENTRY
	   ================================================== */

	.lock-stamp {
		position: relative;
		z-index: 2;

		display: grid;
		gap: 4px;

		justify-self: end;

		min-width: 190px;

		padding: 20px;

		border:
			1px solid
			rgba(191,161,106,.34);

		text-align: center;
	}


	.lock-stamp span,
	.lock-stamp small {
		color:
			var(--brand-stone);

		font-size: .57rem;
		font-weight: 800;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.lock-stamp strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2.8rem;
		font-weight: 400;

		line-height: 1;
	}


	.final-board {
		display: grid;
		gap: 0;
	}


	.final-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);
	}


	.final-driver {
		display: grid;

		grid-template-columns:
			50px
			minmax(0,1fr);

		gap: 14px;

		align-items: center;

		min-height: 62px;

		padding:
			0 12px;

		border-bottom:
			1px solid
			var(--border);
	}


	.final-driver:nth-child(odd) {
		border-right:
			1px solid
			var(--border);
	}


	.final-rank {
		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size: 1.25rem;
	}


	.final-driver-name {
		display: grid;
		gap: 2px;
	}


	.final-driver-name strong {
		color:
			var(--brand-ivory);

		font-size: .83rem;
	}


	.final-driver-name small {
		color:
			var(--brand-stone);

		font-size: .63rem;
	}


	.locked-chaos {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			320px;

		align-items: center;

		gap: 40px;

		padding:
			24px 0;

		border-top:
			1px solid
			var(--border);

		border-bottom:
			1px solid
			var(--border);
	}


	.locked-chaos h2 {
		margin:
			4px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 2.5rem;
		font-weight: 400;

		text-transform: uppercase;
	}


	.locked-chaos p {
		max-width: 650px;

		margin:
			8px 0 0;

		color:
			var(--muted);

		font-size: .78rem;

		line-height: 1.5;
	}


	.locked-chaos-pick {
		display: grid;
		gap: 4px;

		padding-left: 18px;

		border-left:
			2px solid
			var(--brand-gold);
	}


	.locked-chaos-pick span {
		color:
			var(--brand-gold);

		font-size: .58rem;
		font-weight: 850;

		text-transform: uppercase;
	}


	.locked-chaos-pick strong {
		color:
			var(--brand-sand);

		font-size: 1rem;
	}


	/* ==================================================
	   EMPTY / LOADING / ERROR
	   ================================================== */

	.state-message {
		padding:
			50px 0;

		border-top:
			1px solid
			var(--border);

		border-bottom:
			1px solid
			var(--border);
	}


	.state-message h2 {
		margin:
			5px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.5rem,
				5vw,
				4rem
			);

		font-weight: 400;

		text-transform: uppercase;
	}


	.state-message p {
		margin:
			12px 0 0;

		color:
			var(--muted);

		font-size: .84rem;
	}


	.state-message .secondary-btn {
		margin-top: 20px;
	}


	.error-state {
		border-left:
			2px solid
			#c77d72;

		padding-left: 20px;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 1000px) {

		.entry-hero {
			grid-template-columns:
				1fr;
		}


		.rules-desk {
			max-width: 600px;
		}


		.lock-stamp {
			justify-self: start;
		}


		.locked-chaos {
			grid-template-columns:
				1fr;
		}

	}


	@media (max-width: 650px) {

		.daytona-shell {
			gap: 22px;
		}


		.entry-hero {
			padding:
				28px 21px;
		}


		.entry-hero h1 {
			font-size:
				clamp(
					3.8rem,
					18vw,
					5rem
				);
		}


		.entry-specs {
			display: grid;

			grid-template-columns:
				repeat(
					3,
					1fr
				);

			width: 100%;
		}


		.entry-specs span {
			min-width: 0;
		}


		.section-heading {
			display: grid;
		}


		.selection-count {
			justify-self: start;
		}


		.final-grid {
			grid-template-columns:
				1fr;
		}


		.final-driver:nth-child(odd) {
			border-right: 0;
		}

	}
</style>