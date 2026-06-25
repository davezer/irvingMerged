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

{#if event?.type === 'masters'}
  <MastersPicksBoard {data} />
{:else}
<div class="page-wide">
  <div class="warroom card card--glow">
    <div class="warroom__top">
      <div class="warroom__titlewrap">
        <div class="kicker">Tournament War Room</div>

        <div class="warroom__titleline">
          {#if names.logo}
            <img class="warroom__logo" src={names.logo} alt={`${names.title} logo`} loading="lazy" />
          {/if}
          <h1 class="warroom__title">{names.title} Picks Board</h1>
        </div>

        <div class="warroom__subtitle">
          Every pick. Every sweat. Every busted Cinderella and beautiful longshot.
        </div>
      </div>

      <div class="warroom__actions">
        <span class={locked ? 'pill pill--red' : 'pill pill--green'}>
          {locked ? 'Locked' : 'Open'}
        </span>
        <span class="pill pill--gold">{enrichedEntries.length} entries</span>
        <a class="btn btn--ghost" href={resolve('/games/[slug]', { slug: event.slug })}>Back to event</a>
      </div>
    </div>

    <div class="warroom__meta">
      <span class="pill">Lock time: {prettyLock(event?.lock_at)}</span>
      <span class="pill">Current stage: {completedRoundLabel}</span>
    </div>
  </div>
</div>

<div class="page-wide">
  {#if !locked}
    <div class="card notice">
      <div class="section-head">
        <h2 class="h2">Board is armed but not public yet</h2>
        <span class="pill">Waiting for lock</span>
      </div>

      <p class="subtle" style="margin-top: 8px;">
        Once the event locks, this page becomes the full league-wide picks and progress board.
      </p>
    </div>
  {:else if !enrichedEntries.length}
    <div class="card notice">
      <div class="section-head">
        <h2 class="h2">No entries yet</h2>
        <span class="pill">Empty board</span>
      </div>

      <p class="subtle" style="margin-top: 8px;">
        Nobody has submitted teams for this event.
      </p>
    </div>
  {:else}
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Most picked</div>
        {#if mostPickedTeams[0]}
          <div class="stat-value">{fmtTeamName(mostPickedTeams[0].team)}</div>
          <div class="stat-sub">
            {mostPickedTeams[0].count} entries
            {#if Number.isFinite(mostPickedTeams[0].seed)}
              • {mostPickedTeams[0].seed} seed
            {/if}
          </div>
        {:else}
          <div class="stat-value">—</div>
        {/if}
      </div>

      <div class="stat-card">
        <div class="stat-label">Highest seed picked</div>
        {#if highestSeedPicked}
          <div class="stat-value">{highestSeedPicked.seed} seed</div>
          <div class="stat-sub">
            {fmtTeamName(highestSeedPicked.team)} • {highestSeedPicked.owners.join(', ')}
          </div>
        {:else}
          <div class="stat-value">—</div>
        {/if}
      </div>

      <div class="stat-card">
        <div class="stat-label">Most alive</div>
        {#if displayMostAliveEntry}
          <div class="stat-value">{displayMostAliveEntry.display_name}</div>
          <div class="stat-sub">{displayAliveCount(displayMostAliveEntry)} alive</div>
        {:else}
          <div class="stat-value">—</div>
        {/if}
      </div>

      <div class="stat-card">
        <div class="stat-label">Boldest card</div>
        {#if boldestEntry}
          <div class="stat-value">{boldestEntry.display_name}</div>
          <div class="stat-sub">Avg seed {fmtAvgSeed(boldestEntry.avgSeed)}</div>
        {:else}
          <div class="stat-value">—</div>
        {/if}
      </div>

      <div class="stat-card">
        <div class="stat-label">Chalk king</div>
        {#if chalkiestEntry}
          <div class="stat-value">{chalkiestEntry.display_name}</div>
          <div class="stat-sub">Avg seed {fmtAvgSeed(chalkiestEntry.avgSeed)}</div>
        {:else}
          <div class="stat-value">—</div>
        {/if}
      </div>

      <div class="stat-card">
        <div class="stat-label">Graveyard team</div>
        {#if graveyardTeam}
          <div class="stat-value">{fmtTeamName(graveyardTeam.team)}</div>
          <div class="stat-sub">
            {graveyardTeam.count} {graveyardTeam.count === 1 ? 'entry' : 'entries'} • eliminated
          </div>
        {:else}
          <div class="stat-value">No graveyard yet</div>
          <div class="stat-sub">Nobody popular has died yet</div>
        {/if}
      </div>
    </section>
    <div class="war-room-grid">
    
      <section class="panel card">
        <div class="panel-head">
          <h2 class="h2">Most Picked Teams</h2>
          <span class="pill pill--gold">{teamStats.length} unique picked teams</span>
        </div>

        <div class="popular-list">
          {#each displayMostPickedTeams as row (row.id)}
            <button
              type="button"
              class:selected={selectedImpactTeamId === row.id}
              class="popular-row popular-row--button"
              on:click={() => (selectedImpactTeamId = row.id)}
            >
              <div class="popular-main">
                {#if row.team?.logoUrl}
                  <img class="popular-logo" src={row.team.logoUrl} alt="" />
                {/if}

                <div>
                  <div class="popular-name">
                    {#if Number.isFinite(row.seed)}
                      <span class="seed-tag">{row.seed}</span>
                    {/if}
                    {fmtTeamName(row.team)}
                  </div>
                  <div class="popular-sub">
                    {row.count} picks • {row.stage}
                    {#if row.isLoneWolf}
                      • lone wolf
                    {/if}
                  </div>
                </div>
              </div>
              
              <div class="popular-side">
                <span class={row.status === 'eliminated' ? 'pill pill--red' : 'pill pill--green'}>
                  {row.status === 'eliminated' ? 'Out' : row.status === 'champion' ? 'Champion' : 'Alive'}
                </span>
              </div>
            </button>
          {/each}
        </div>

       
     
    </section>
      <section>
        <TeamImpactPanel teamImpact={selectedTeamImpact} teamName={fmtTeamName} />
      </section>
     <section>
      <div class="panel card">
        <div class="panel-head">
        
          <h2 class="h2">Cinderella Watch</h2>
          <span class="pill">Longshots still breathing</span>
          
        </div>
        
        {#if displaySurvivingLongshots.length}
          <div class="chips-wrap">
            {#each displaySurvivingLongshots as row (row.id)}
              <div class="story-chip story-chip--gold">
                <div class="story-chip__title">{row.seed} seed {fmtTeamName(row.team)}</div>
                <div class="story-chip__sub">
                  {row.count} owner{row.count === 1 ? '' : 's'} • {row.stage}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-copy">No living longshots right now.</div>
        {/if}

        <div class="panel-divider"></div>
        </div>  
     </section>
      

 
  </div>  
    <section class="entries-grid">
      {#each enrichedEntries as entry, i (entry.user_id)}
        <details class="entry-card" open={i < 3}>
          <summary class="entry-summary">
  <div class="entry-summary__left">
    <div class="rank-badge">#{i + 1}</div>

    <div class="entry-identity">
      <div class="entry-name-row">
        <div class="entry-name">{entry.display_name}</div>

        <div class="badge-row">
          {#each badgeList(entry) as badge}
            <span class={`mini-badge mini-badge--${badge.tone}`}>{badge.label}</span>
          {/each}
        </div>
      </div>

      <div class="entry-meta-stack">
        <div class="entry-meta entry-meta--top">
          <span>{entry.scoreTotal} pts</span>
          <span>•</span>
          <span>{displayAliveCount(entry)} alive</span>
          <span>•</span>
          <span>avg {fmtAvgSeed(entry.avgSeed)}</span>
        </div>

        <div class="entry-meta entry-meta--bottom">
          <span>ceiling {entry.futurePoints.maxLeft}</span>
          <span>•</span>
          <span>deepest {entry.deepest}W</span>
        </div>
      </div>
    </div>
  </div>

  <div class="entry-summary__right">
    <span class="pill pill--gold">{entry.selectedTeams.length}/4</span>
    <span class="panel-collapse__hint">Tap to {i < 3 ? 'collapse' : 'expand'}</span>
  </div>
</summary>

          <div class="entry-body">
          <div class="team-strip">
              {#each entry.selectedTeams as team (team.id)}
                {@const status = displayTeamStatus(team)}
                <div class={`team-chip team-chip--${status}`}>
                  <div class="team-chip__top">
                    <div class="team-chip__identity">
                      {#if team.logoUrl}
                        <img class="team-chip__logo" src={team.logoUrl} alt="" />
                      {/if}
                      <div>
                        <div class="team-chip__name">
                          {#if Number.isFinite(seedOf(team))}
                            <span class="seed-tag">{seedOf(team)}</span>
                          {/if}
                          {fmtTeamName(team)}
                        </div>
                        <div class="team-chip__meta">
                          {#if team.region}{team.region} • {/if}{displayStageLabel(team)}
                        </div>
                      </div>
                    </div>

                    <div class="team-chip__pills">
                      <span class="pill pill--gold">{pointsSoFar(team)} pts</span>
                    </div>
                  </div>

                  <div class="team-chip__bottom">
                    <span class={status === 'eliminated' ? 'pill pill--red' : 'pill pill--green'}>
                      {status === 'eliminated' ? 'Eliminated' : status === 'champion' ? 'Champion' : 'Alive'}
                    </span>

                    {#if teamOwners(team).length === 1}
                      <span class="pill">Lone wolf</span>
                    {:else}
                      <span class="pill">{teamOwners(team).length} owners</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
            <div class="entry-overview">
            
              <div class="entry-hero-card entry-hero-card--gold">
                <div class="entry-hero-card__eyebrow">War room read</div>
                <div class="entry-hero-card__title">{entry.fatePath.summary}</div>
                
                <div class="entry-hero-card__meta">
                
                  <span>Best pick:</span>
                  <strong>
                    {#if entry.bestPick}
                      {#if Number.isFinite(seedOf(entry.bestPick))}{seedOf(entry.bestPick)} seed {/if}{fmtTeamName(entry.bestPick)}
                    {:else}
                      —
                    {/if}
                  </strong>
                  <span>•</span>
                  <span>Toughest loss:</span>
                  <strong>
                    {#if entry.worstBeat}
                      {#if Number.isFinite(seedOf(entry.worstBeat))}{seedOf(entry.worstBeat)} seed {/if}{fmtTeamName(entry.worstBeat)}
                    {:else}
                      None yet
                    {/if}
                  </strong>
                </div>
              </div>
            
              
              <div class="entry-snapshot-grid">
              
            
                <div class="story-chip story-chip--compact">
                  <div class="story-chip__title">Ceiling</div>
                  <div class="story-chip__value">{entry.futurePoints.maxLeft}</div>
                  <div class="story-chip__sub">best-case from here</div>
                </div>

                <div class="story-chip story-chip--compact story-chip--danger">
                  <div class="story-chip__title">Burned</div>
                  <div class="story-chip__value">{entry.futurePoints.deadValueLost}</div>
                  <div class="story-chip__sub">already burned off the card</div>
                </div>

              </div>
            </div>
            
           
            <FatePathCard fatePath={entry.fatePath} />
            <!-- <FuturePointsPanel futurePoints={entry.futurePoints} compact={true} /> -->

            
            
            <div class="entry-safe-block">
              <RoundTracker selectedTeams={entry.selectedTeams} {resultsPayload} dense={true} />
            </div>
          </div>
        </details>
      {/each}
    </section>
  {/if}
</div>
{/if}

<style>
.page-wide {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px 24px;
  box-sizing: border-box;
}

.warroom {
  margin-bottom: 18px;
}

.warroom__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.warroom__titlewrap {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.warroom__titleline {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.warroom__logo {
  width: 42px;
  height: 42px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.22);
  flex: 0 0 auto;
}

.warroom__title {
  margin: 0;
  font-family: ui-serif, 'Iowan Old Style', 'Palatino Linotype', Palatino, Garamond, Georgia, serif;
  font-size: 1.9rem;
  line-height: 1.1;
  letter-spacing: 0.2px;
}

.warroom__subtitle {
  opacity: 0.74;
  font-size: 0.98rem;
}

.warroom__actions,
.warroom__meta,
.badge-row,
.team-chip__bottom,
.team-chip__pills,
.entry-summary__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.warroom__meta {
  margin-top: 14px;
}

.notice {
  margin-bottom: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.war-room-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr 1fr;
  gap: 20px;
  align-items: start;
  padding-bottom: inherit;
}

.stat-card,
.ownership-card {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.22);
  border-radius: 18px;
  padding: 14px;
  min-width: 0;
}

.stat-label,
.ownership-label {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.66;
}

.stat-value,
.ownership-value {
  margin-top: 6px;
  font-size: 1.12rem;
  font-weight: 900;
  line-height: 1.15;
}

.stat-sub,
.ownership-sub,
.popular-sub,
.entry-meta,
.story-chip__sub,
.team-chip__meta,
.empty-copy {
  opacity: 0.72;
  font-size: 0.92rem;
}

.summary-panels {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.summary-panels--triple {
  grid-template-columns: 1.2fr 0.9fr;
}

.panel {
  display: grid;
  gap: 14px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
}

.popular-list {
  display: grid;
  gap: 10px;
}

.popular-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  min-width: 0;
}

.popular-row--button {
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.popular-row--button.selected {
  border-color: rgba(214,177,94,0.28);
  background: rgba(214,177,94,0.09);
}

.popular-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.popular-side {
  flex: 0 0 auto;
}

.popular-logo,
.team-chip__logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: contain;
  flex: 0 0 auto;
}

.popular-name,
.team-chip__name,
.entry-name {
  font-weight: 900;
  line-height: 1.15;
  min-width: 0;
  overflow-wrap: anywhere;
}

.seed-tag {
  display: inline-flex;
  min-width: 20px;
  justify-content: center;
  padding: 2px 6px;
  margin-right: 6px;
  border-radius: 999px;
  border: 1px solid rgba(214,177,94,0.28);
  background: rgba(214,177,94,0.10);
  font-size: 0.78rem;
  font-weight: 900;
  vertical-align: middle;
}

.chips-wrap,
.entry-story-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.entry-story-grid--triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.story-chip {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 12px;
  min-width: 0;
}

.story-chip--gold {
  border-color: rgba(214,177,94,0.22);
  background: rgba(214,177,94,0.08);
}

.story-chip__title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.66;
  margin-bottom: 6px;
}

.story-chip__value {
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 6px;
}

.story-chip--compact {
  padding: 13px;
}

.story-chip--danger {
  border-color: rgba(191, 78, 78, 0.22);
  background: rgba(191, 78, 78, 0.07);
}

.entry-overview {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  align-items: stretch;
}

.entry-hero-card {
  border: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025));
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 8px;
  min-width: 0;
}

.entry-hero-card--gold {
  border-color: rgba(214,177,94,0.24);
  background: linear-gradient(180deg, rgba(214,177,94,0.12), rgba(214,177,94,0.06));
  box-shadow: 0 12px 28px rgba(214,177,94,0.07);
}

.entry-hero-card__eyebrow {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.66;
}

.entry-hero-card__title {
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.25;
}

.entry-hero-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 0.92rem;
  opacity: 0.78;
}

.entry-snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mini-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}

.mini-badge--gold {
  border-color: rgba(214,177,94,0.32);
  background: rgba(214,177,94,0.12);
  box-shadow: 0 0 0 1px rgba(214,177,94,0.06), 0 8px 18px rgba(214,177,94,0.10);
}

.mini-badge--green {
  border-color: rgba(49, 163, 112, 0.30);
  background: rgba(49, 163, 112, 0.11);
  box-shadow: 0 8px 18px rgba(49, 163, 112, 0.09);
}

.mini-badge--red {
  border-color: rgba(191, 78, 78, 0.28);
  background: rgba(191, 78, 78, 0.11);
  box-shadow: 0 8px 18px rgba(191, 78, 78, 0.08);
}

.mini-badge--muted {
  border-color: rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.06);
}

.ownership-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.entries-grid {
  display: grid;
  gap: 16px;
}

.entry-card {
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(0,0,0,0.22);
  border-radius: 20px;
  overflow: hidden;
}

.entry-card[open] {
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
}

.entry-summary {
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  cursor: pointer;
}

.entry-summary::-webkit-details-marker {
  display: none;
}

.entry-summary__left {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
  flex: 1 1 auto;
}

.entry-summary__right {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.entry-identity {
  min-width: 0;
  display: grid;
  gap: 6px;
  flex: 1 1 auto;
}

.entry-name-row {
  display: grid;
  gap: 6px;
}

.entry-meta-stack {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.entry-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1.2;
}

.entry-meta--top,
.entry-meta--bottom {
  font-size: 0.92rem;
}

.rank-badge {
  min-width: 48px;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-weight: 900;
  border: 1px solid rgba(214,177,94,0.28);
  background: rgba(214,177,94,0.10);
  flex: 0 0 auto;
}

.entry-body {
  display: grid;
  gap: 14px;
  padding: 0 16px 16px;
}

.team-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.team-chip {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 10px;
  min-width: 0;
}

.team-chip--alive,
.team-chip--champion {
  border-color: rgba(49, 163, 112, 0.24);
}

.team-chip--eliminated {
  border-color: rgba(191, 78, 78, 0.22);
  background: rgba(191, 78, 78, 0.06);
}

.team-chip__top,
.team-chip__identity {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
}

.team-chip__identity {
  justify-content: flex-start;
}
.entry-safe-block {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}
.panel-collapse {
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
}

.panel-collapse__summary {
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.panel-collapse__summary::-webkit-details-marker {
  display: none;
}

.panel-collapse__hint {
  opacity: 0.56;
  font-size: 0.88rem;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .war-room-grid {
    grid-template-columns: 1fr;
  }

  .summary-panels,
  .summary-panels--triple {
    grid-template-columns: 1fr;
  }

  .entry-overview,
  .entry-story-grid--triple {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .team-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-wide {
    padding: 0 16px 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: -12px;
  }

  .chips-wrap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entry-overview {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .entry-snapshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .entry-story-grid,
  .entry-story-grid--triple,
  .ownership-grid {
    grid-template-columns: 1fr;
  }

  .team-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .entry-summary {
    align-items: stretch;
    gap: 12px;
  }

  .entry-summary__right {
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
  }

  .entry-body {
    gap: 12px;
    padding: 0 14px 14px;
  }

  .entry-hero-card {
    padding: 12px;
    gap: 6px;
  }

  .entry-hero-card__title {
    font-size: 1rem;
    line-height: 1.2;
  }

  .entry-hero-card__meta {
    font-size: 0.86rem;
    gap: 6px;
  }

  .story-chip {
    padding: 12px;
  }

  .story-chip__title {
    font-size: 0.74rem;
    margin-bottom: 5px;
  }

  .story-chip__value {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }

  .story-chip__sub {
    font-size: 0.84rem;
    line-height: 1.2;
  }

  .team-chip {
    padding: 11px;
    gap: 8px;
  }

  .team-chip__meta,
  .popular-sub {
    font-size: 0.86rem;
    line-height: 1.2;
  }

  .mini-badge {
    min-height: 26px;
    padding: 4px 9px;
    font-size: 0.74rem;
  }

  .rank-badge {
    min-width: 42px;
    width: 42px;
    height: 42px;
    font-size: 0.92rem;
  }

  .panel-collapse__hint {
    font-size: 0.8rem;
  }
}

@media (max-width: 520px) {
  .warroom__title {
    font-size: 1.45rem;
  }

  .warroom__subtitle {
    font-size: 0.92rem;
  }

  .warroom__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .warroom__meta {
    gap: 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-card {
    padding: 12px;
    border-radius: 16px;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-value {
    font-size: 1rem;
    line-height: 1.1;
  }

  .stat-sub {
    font-size: 0.84rem;
    line-height: 1.2;
  }

  .entry-summary {
    flex-direction: column;
    padding: 14px;
  }

  .entry-summary__left {
    gap: 12px;
  }

  .entry-name-row {
    gap: 5px;
  }

  .entry-meta-stack {
    gap: 3px;
  }

  .entry-meta {
    gap: 6px;
    font-size: 0.84rem;
  }

  .entry-meta--top,
  .entry-meta--bottom {
    font-size: 0.84rem;
  }

  .entry-summary__right {
    width: 100%;
    justify-content: flex-start;
  }

  .entry-hero-card__meta {
    display: grid;
    gap: 4px;
  }

  .entry-snapshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

   .team-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px;
  }

  .chips-wrap {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .story-chip,
  .story-chip--compact {
    border-radius: 13px;
  }

   .team-chip {
    padding: 10px;
  }

  .team-chip__top {
    align-items: flex-start;
  }

  .team-chip__pills {
    justify-content: flex-end;
  }

  .team-chip__name {
    font-size: 0.98rem;
    line-height: 1.1;
  }

  .team-chip__meta {
    font-size: 0.82rem;
    line-height: 1.15;
  }

  .team-chip__bottom {
    gap: 6px;
  }

}


</style>
