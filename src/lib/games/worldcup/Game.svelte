<!-- src/lib/games/worldcup/Game.svelte -->
<script>
  import { WORLD_CUP_ROUNDS, WORLD_CUP_ROUND_LABELS, WORLD_CUP_POINTS } from '$lib/scoring/worldCup.js';
  import SectionHead from '$lib/ui/SectionHeader.svelte';
  import { WORLDCUP_RULES } from './rules.js';

  export let event;
  export let locked;
  export let entry;
  export let options;   // from /api/events/[slug]/options
  export let loading;
  export let loadError;
  export let results;
  export let bankroll;
  export let onRetryOptions;

  const empty = (v) => (v == null ? '' : String(v));

  $: teams = options?.teams || [];
  $: currentRound = results?.payload?.currentRound || 'group';
  $: roundsPayload = results?.payload?.rounds || {};
  $: roundLabel = WORLD_CUP_ROUND_LABELS[currentRound] || currentRound;
  $: roundPts = WORLD_CUP_POINTS[currentRound] || 0;

  $: picksByRound = entry?.payload?.picksByRound || {};
  $: usedTeams = entry?.payload?.usedTeams || [];
  $: storedEliminated = Boolean(entry?.payload?.eliminated);

  let teamId = '';

  // keep select in sync with current round pick
  $: teamId = empty(picksByRound?.[currentRound] || '');

  function teamName(id) {
    const t = teams.find((x) => empty(x.id) === empty(id));
    return t?.name || id;
  }

  function sortGroupValue(group) {
    const g = empty(group).toUpperCase();
    const idx = 'ABCDEFGHIJKL'.indexOf(g);
    return idx >= 0 ? idx : 999;
  }

  function groupLabel(group) {
    return group ? `Group ${group}` : 'Other Teams';
  }

  function sortTeamName(a, b) {
    return empty(a?.name).localeCompare(empty(b?.name), undefined, { sensitivity: 'base' });
  }

  function previousRoundKey(r) {
    const idx = WORLD_CUP_ROUNDS.indexOf(empty(r));
    if (idx <= 0) return null;
    return WORLD_CUP_ROUNDS[idx - 1];
  }


  function getRunStatus(picks, rounds, round) {
    const currentIdx = WORLD_CUP_ROUNDS.indexOf(empty(round));
    if (currentIdx <= 0) {
      return { eliminated: false, eliminatedRound: null, reason: '' };
    }

    const used = [];

    for (const r of WORLD_CUP_ROUNDS.slice(0, currentIdx)) {
      const advancedIds = Array.isArray(rounds?.[r]?.advancedTeamIds)
        ? rounds[r].advancedTeamIds.map(empty).filter(Boolean)
        : [];

      // If the previous round has not been published yet, do not call the user eliminated.
      // The picker will already show the "publish previous results first" empty state.
      if (!advancedIds.length) {
        return { eliminated: false, eliminatedRound: null, reason: '' };
      }

      const pick = empty(picks?.[r]);
      const label = WORLD_CUP_ROUND_LABELS[r] || r;

      if (!pick) {
        return {
          eliminated: true,
          eliminatedRound: r,
          reason: `No pick was submitted for ${label}.`
        };
      }

      if (used.includes(pick)) {
        return {
          eliminated: true,
          eliminatedRound: r,
          reason: `${teamName(pick)} was already used before ${label}.`
        };
      }

      used.push(pick);

      if (!advancedIds.includes(pick)) {
        return {
          eliminated: true,
          eliminatedRound: r,
          reason: `${teamName(pick)} did not survive ${label}.`
        };
      }
    }

    return { eliminated: false, eliminatedRound: null, reason: '' };
  }

  function groupAndSortTeams(list) {
    const byGroup = new Map();

    for (const team of list || []) {
      const group = empty(team?.group).toUpperCase();
      const key = group || '__other';
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(team);
    }

    return Array.from(byGroup.entries())
      .sort(([a], [b]) => sortGroupValue(a === '__other' ? '' : a) - sortGroupValue(b === '__other' ? '' : b))
      .map(([key, groupTeams]) => {
        const group = key === '__other' ? '' : key;
        return {
          key,
          group,
          label: groupLabel(group),
          teams: [...groupTeams].sort(sortTeamName)
        };
      });
  }

  $: previousRound = previousRoundKey(currentRound);
  $: previousRoundLabel = previousRound ? (WORLD_CUP_ROUND_LABELS[previousRound] || previousRound) : '';
  $: previousRoundPayload = previousRound ? roundsPayload?.[previousRound] : null;
  $: previousAdvancedIds = previousRound && Array.isArray(previousRoundPayload?.advancedTeamIds)
    ? previousRoundPayload.advancedTeamIds.map(empty).filter(Boolean)
    : [];
  $: aliveTeamIds = previousRound ? new Set(previousAdvancedIds) : null;
  $: visibleTeams = aliveTeamIds
    ? teams.filter((t) => aliveTeamIds.has(empty(t?.id)))
    : teams;
  $: hiddenEliminatedCount = aliveTeamIds
    ? Math.max(0, teams.length - visibleTeams.length)
    : 0;
  $: selectedTeamVisible = !teamId || visibleTeams.some((t) => empty(t?.id) === empty(teamId));
  $: groupedTeams = groupAndSortTeams(visibleTeams);
  $: runStatus = getRunStatus(picksByRound, roundsPayload, currentRound);
  $: eliminated = storedEliminated || runStatus.eliminated;
  $: eliminatedReason = runStatus.reason || 'Your run is over for this World Cup.';
  $: saveDisabled = locked || eliminated || !teamId || !selectedTeamVisible || isUsed(teamId);

  function isUsed(id) {
    // allow selecting same as current round pick (edit)
    const prev = empty(picksByRound?.[currentRound] || '');
    return usedTeams.includes(id) && id !== prev;
  }
</script>

<div class="page">
  <!-- Header block (match other games vibe) -->
  <div class="card">
    <div class="kicker">Final Fifa Frenzy</div>

    <div class="head-row">
      <SectionHead rules={WORLDCUP_RULES} />
      <div class="bankroll">
        <div class="bankroll-label">Bankroll</div>
        <div class="bankroll-value">{bankroll}</div>
      </div>
    </div>

    <div class="title-row">
      <div class="title">{roundLabel}</div>
      <div class="pts">{roundPts} pts</div>
    </div>

    <div class="sub">
      One team per round. No re-use. Lose once and you’re eliminated.
    </div>
  </div>

  <!-- Pick block -->
  <div class="card">
    <div class="section-title">Pick a team</div>

    {#if loading}
      <div class="muted">Loading teams…</div>
    {:else if loadError}
      <div class="error">
        <div>{loadError}</div>
        <button class="btn btn--ghost btn--sm" on:click={onRetryOptions}>Retry</button>
      </div>
    {:else if eliminated}
      <div class="elim">
        <strong>You’re eliminated.</strong> {eliminatedReason}
      </div>
    {:else}
      <form method="POST" action="?/save" class="form">
        <input type="hidden" name="round" value={currentRound} />

        <label class="label">Select a team</label>
        <div class="hint">
          {#if previousRound}
            Showing teams still alive after {previousRoundLabel}. {visibleTeams.length} available{hiddenEliminatedCount ? `, ${hiddenEliminatedCount} eliminated hidden` : ''}.
          {:else}
            Grouped by World Cup group, alphabetized inside each group.
          {/if}
        </div>

        {#if teamId && !selectedTeamVisible}
          <div class="warning">
            Your saved pick for this round is no longer available based on the latest results. Pick a team that is still alive.
          </div>
        {/if}

        {#if previousRound && !visibleTeams.length}
          <div class="empty-state">
            No teams are available for {roundLabel} yet. Publish {previousRoundLabel} results first.
          </div>
        {:else}
          <select class="select" name="teamId" bind:value={teamId} disabled={locked}>
            <option value="" disabled>Select a team</option>
            {#each groupedTeams as groupBlock (groupBlock.key)}
              <optgroup label={groupBlock.label}>
                {#each groupBlock.teams as t (t.id)}
                  <option value={t.id} disabled={isUsed(String(t.id))}>
                    {t.name}{isUsed(String(t.id)) ? ' (used)' : ''}
                  </option>
                {/each}
              </optgroup>
            {/each}
          </select>
        {/if}

        <button class="btn btn--vip" disabled={saveDisabled}>
          {locked ? 'Locked' : 'Save Pick'}
        </button>
      </form>
    {/if}
  </div>

  <!-- History block -->
  <div class="card">
    <div class="section-title">Your Run</div>

    <div class="history">
      {#each WORLD_CUP_ROUNDS as r}
        {#if picksByRound?.[r]}
          <div class="row">
            <div class="row-left">
              <div class="row-round">{WORLD_CUP_ROUND_LABELS[r] || r}</div>
              <div class="row-team">{teamName(picksByRound[r])}</div>
            </div>
            <div class="row-right">
              <span class="chip">{WORLD_CUP_POINTS[r] || 0} pts</span>
            </div>
          </div>
        {/if}
      {/each}

      {#if !Object.keys(picksByRound || {}).length}
        <div class="muted">No picks submitted yet.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* page wrapper similar to other event pages */
  .page{
    display: grid;
    gap: 16px;
  }

  /* your house-style card look (matches admin + other games) */
  .card{
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    padding: 16px;
  }

  .kicker{
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.78rem;
    opacity: 0.85;
    margin-bottom: 8px;
  }

  .head-row{
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
  }

  /* SectionHead component probably renders the Rules button; keep it aligned left */
  :global(.sectionHead){
    margin: 0;
  }

  .bankroll{
    text-align: right;
    opacity: 0.9;
    min-width: 110px;
  }

  .bankroll-label{
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .bankroll-value{
    font-weight: 950;
    font-size: 1.2rem;
  }

  .title-row{
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 8px;
  }

  .title{
    font-size: 1.35rem;
    font-weight: 950;
  }

  .pts{
    font-size: 0.95rem;
    opacity: 0.75;
  }

  .sub{
    margin-top: 6px;
    opacity: 0.7;
  }

  .section-title{
    font-weight: 950;
    margin-bottom: 10px;
  }

  .form{
    display: grid;
    gap: 10px;
  }

  .label{
    font-weight: 900;
    opacity: 0.9;
  }

  .hint{
    margin-top: -4px;
    font-size: 0.86rem;
    opacity: 0.62;
  }

  .warning,
  .empty-state{
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(212,175,55,0.20);
    background: rgba(212,175,55,0.06);
    font-size: 0.9rem;
    opacity: 0.88;
  }

  .empty-state{
    border-color: rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.035);
    opacity: 0.72;
  }

  .select{
    width: 100%;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.9);
    outline: none;
  }

  .btn{
    appearance: none;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.92);
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 850;
  }

  .btn--vip{
    border-color: rgba(212,175,55,0.22);
    background: rgba(212,175,55,0.06);
    justify-self: start;
  }

  .btn--ghost{
    background: rgba(255,255,255,0.03);
  }

  .btn--sm{
    padding: 8px 10px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .error{
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    opacity: 0.9;
  }

  .muted{ opacity: 0.7; }

  .elim{
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,120,120,0.20);
    background: rgba(255,120,120,0.07);
  }

  .history{
    display: grid;
    gap: 8px;
  }

  .row{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.18);
  }

  .row-round{
    font-weight: 900;
    opacity: 0.85;
    font-size: 0.9rem;
  }

  .row-team{
    opacity: 0.75;
    font-size: 0.88rem;
    margin-top: 2px;
  }

  .chip{
    display:inline-flex;
    align-items:center;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    opacity: 0.85;
    white-space: nowrap;
  }

  @media (max-width: 720px){
    .bankroll{ text-align: left; }
  }
</style>
