<!-- src/lib/games/worldcup/AdminResults.svelte -->
<script>
  import { enhance } from '$app/forms';
  import { WORLD_CUP_ROUNDS, WORLD_CUP_ROUND_LABELS, WORLD_CUP_POINTS } from '$lib/scoring/worldCup.js';
  import UnpublishButton from '$lib/components/admin/UnpublishButton.svelte';

  export let data;

  $: event = data?.event ?? null;
  $: results = data?.results ?? null;
  $: entries = Array.isArray(data?.entries) ? data.entries : [];
  $: teams = Array.isArray(data?.teams) ? data.teams : [];
  $: currentRound = data?.currentRound || 'group';
  $: roundsPayload = data?.roundsPayload || {};
  $: suggestedNextRound = data?.suggestedNextRound || currentRound;
  $: eventPublishedAt = event?.results_published_at || null;

  // Admin form state
  let round = currentRound;
  let nextRound = suggestedNextRound;
  let syncedCurrentRound = '';
  let lastSelectedRound = '';
  let showEliminated = false;

  // When the admin advances from Group -> R32 -> R16, etc., make the form follow
  // the actual current round. This prevents old checkmarks from lingering visually.
  $: if (currentRound && currentRound !== syncedCurrentRound) {
    syncedCurrentRound = currentRound;
    round = currentRound;
    nextRound = suggestedNextRound;
    showEliminated = false;
  }

  $: if (round && round !== lastSelectedRound) {
    lastSelectedRound = round;
    showEliminated = false;
  }

  $: advancedSelected = new Set((roundsPayload?.[round]?.advancedTeamIds || []).map(String));

  function toggleAdvanced(id) {
    id = String(id);
    if (advancedSelected.has(id)) advancedSelected.delete(id);
    else advancedSelected.add(id);
    // force reactive update
    advancedSelected = new Set(advancedSelected);
  }

  function isChecked(id) {
    return advancedSelected.has(String(id));
  }

  function roundLabel(r) {
    return `${WORLD_CUP_ROUND_LABELS[r] || r} (${WORLD_CUP_POINTS[r] || 0})`;
  }

  function sortGroupValue(group) {
    const g = String(group || '').trim().toUpperCase();
    const idx = 'ABCDEFGHIJKL'.indexOf(g);
    return idx >= 0 ? idx : 999;
  }

  function sortTeamName(a, b) {
    return String(a?.name || '').localeCompare(String(b?.name || ''), undefined, { sensitivity: 'base' });
  }

  function previousRoundKey(r) {
    const idx = WORLD_CUP_ROUNDS.indexOf(String(r || ''));
    if (idx <= 0) return null;
    return WORLD_CUP_ROUNDS[idx - 1];
  }

  function isTeamEligible(id) {
    if (!eligibleTeamIds) return true;
    return eligibleTeamIds.has(String(id));
  }

  function groupAndSortTeams(list) {
    const byGroup = new Map();

    for (const team of list || []) {
      const group = String(team?.group || '').trim().toUpperCase();
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
          label: group ? `Group ${group}` : 'Other Teams',
          teams: [...groupTeams].sort(sortTeamName)
        };
      });
  }

  $: previousRound = previousRoundKey(round);
  $: previousRoundLabel = previousRound ? (WORLD_CUP_ROUND_LABELS[previousRound] || previousRound) : '';
  $: previousRoundPayload = previousRound ? roundsPayload?.[previousRound] : null;
  $: previousAdvancedIds = previousRound && Array.isArray(previousRoundPayload?.advancedTeamIds)
    ? previousRoundPayload.advancedTeamIds.map(String)
    : [];
  $: eligibleTeamIds = previousRound ? new Set(previousAdvancedIds) : null;
  $: displayTeams = eligibleTeamIds && !showEliminated
    ? teams.filter((t) => eligibleTeamIds.has(String(t?.id)))
    : teams;
  $: groupedTeams = groupAndSortTeams(displayTeams);
  $: hiddenEliminatedCount = eligibleTeamIds
    ? teams.filter((t) => !eligibleTeamIds.has(String(t?.id))).length
    : 0;
  $: eligibleCount = eligibleTeamIds ? Math.max(0, teams.length - hiddenEliminatedCount) : teams.length;
  $: selectedIds = Array.from(advancedSelected || []);
  $: selectedEligibleCount = eligibleTeamIds
    ? selectedIds.filter((id) => eligibleTeamIds.has(String(id))).length
    : selectedIds.length;


  function enhancePublishRound({ formData }) {
    // SvelteKit reloads action data after publish. Keep the admin focused on
    // the round they just published instead of snapping back to currentRound.
    const submittedRound = String(formData.get('round') || round || currentRound);

    return async ({ update }) => {
      await update();
      round = submittedRound;
      showEliminated = false;
    };
  }

  function fmtTs(sec) {
    if (!sec) return '—';
    try {
      return new Date(Number(sec) * 1000).toLocaleString();
    } catch {
      return '—';
    }
  }
</script>

<div class="page-wide">
  <div class="card">
    <div class="section-head">
      <h2 class="h2">World Cup Admin</h2>
      <div class="muted">{event?.name || event?.slug}</div>
    </div>

    <div class="panel">
      <div class="row">
        <div class="muted small">Current Round</div>
        <div class="big">{WORLD_CUP_ROUND_LABELS[currentRound] || currentRound}</div>
      </div>

      <form id="publishForm" method="POST" action="?/publish" use:enhance={enhancePublishRound} class="publish">
        <div class="grid-one">
          <div class="field">
            <label>Publish Round</label>
            <select name="round" bind:value={round}>
              {#each WORLD_CUP_ROUNDS as r}
                <option value={r}>{roundLabel(r)}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="divider"></div>
        

        <div class="field">
          <div class="field-head">
            <label>Teams that advanced (this round)</label>

            {#if previousRound}
              <label class="mini-toggle">
                <input type="checkbox" bind:checked={showEliminated} />
                Show eliminated teams
              </label>
            {/if}
          </div>

          {#if previousRound}
            <div class="muted small">
              Showing teams still alive after {previousRoundLabel}.
              {eligibleCount} alive{hiddenEliminatedCount ? `, ${hiddenEliminatedCount} eliminated hidden` : ''}.
            </div>
          {/if}

          <div class="team-groups">
            {#if groupedTeams.length}
              {#each groupedTeams as groupBlock (groupBlock.key)}
                <div class="team-group">
                  <div class="team-group-title">{groupBlock.label}</div>
                  <div class="team-grid">
                    {#each groupBlock.teams as t (t.id)}
                      {@const eligible = isTeamEligible(t.id)}
                      <label class={eligible ? 'team' : 'team team--eliminated'}>
                        <input
                          type="checkbox"
                          name="advancedTeamId"
                          value={t.id}
                          checked={eligible && isChecked(t.id)}
                          disabled={!eligible}
                          on:change={() => toggleAdvanced(t.id)}
                        />
                        <span>{t.name}</span>
                        {#if !eligible}
                          <span class="team-status">Out</span>
                        {/if}
                      </label>
                    {/each}
                  </div>
                </div>
              {/each}
            {:else}
              <div class="empty-state">
                No eligible teams for this round yet. Publish the previous round first.
              </div>
            {/if}
          </div>
          <div class="muted small">
            Selected: {selectedEligibleCount}
          </div>
        </div>

        
     </form>

<div class="actions">
  <!-- ✅ Submit the publish form from outside using form= -->
  <button class="btn btn--vip" type="submit" form="publishForm">
    Publish + Recompute
  </button>

  <form method="POST" action="?/advanceRound" use:enhance>
    <button class="btn btn--ghost" type="submit">Advance to Next Round</button>
  </form>

  <!-- ✅ Reset tournament back to Group Stage -->
  <form
    method="POST"
    action="?/resetTournament"
    use:enhance
    on:submit|preventDefault={(e) => {
      const ok = confirm(
        `RESET TO GROUP STAGE?\n\nThis will:\n• Set the current round back to Group\n• Clear all advanced-team selections for every round\n• Delete all computed entry_scores for this event\n• Clear published state\n\nEntries are NOT deleted.\n\nThis cannot be undone.`
      );
      if (ok) e.currentTarget.submit();
    }}
  >
    <button class="btn btn--danger" type="submit">Reset Tournament</button>
  </form>
</div>

      <div class="divider"></div>

      <div class="muted small">
        Results last published: {results?.published_at ? results.published_at : '—'}
      </div>
    </div>
  </div>
  <div style="margin-top: 18px;">
  <div class="section-head">
    <h3 class="h3">Danger Zone</h3>
    <div class="muted">Unpublishing removes all computed scores for this event.</div>
  </div>

  <div class="actions" style="margin-top: 10px;">
    <UnpublishButton publishedAt={eventPublishedAt} />
  </div>
</div>

  <div class="card">
    <div class="section-head">
      <h2 class="h2">Entries</h2>
      <div class="muted small">{entries.length} total</div>
    </div>

    <div class="entries">
      {#if entries.length}
        {#each entries as e (e.user_id)}
          <div class="entry">
            <div class="entry-top">
              <div>
                <div class="name">{e.display_name}</div>
                <div class="muted small">
                  Updated {fmtTs(e.updated_at)}
                </div>
              </div>

              <div class="score">
                <div class="muted small">Score</div>
                <div class="big">{e?.score?.score_total ?? 0}</div>
              </div>
            </div>

            <div class="picks">
              {#if e.eliminated}
                <div class="elim">Eliminated{e.eliminatedRound ? ` in ${e.eliminatedRound}` : ''}</div>
              {/if}

              {#if e.picks?.length}
                {#each e.picks as p (p.round)}
                  <div class="pick">
                    <div class="pick-left">
                      <div class="pick-round">{WORLD_CUP_ROUND_LABELS[p.round] || p.round}</div>
                      <div class="pick-team">{p.teamName}</div>
                    </div>
                    <div class="pick-right">
                      <span class="pill">{WORLD_CUP_POINTS[p.round] || 0}</span>
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="muted small">No picks yet.</div>
              {/if}
            </div>
          </div>
        {/each}
      {:else}
        <div class="muted">No entries found.</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .page-wide{ max-width: 1100px; margin: 0 auto; padding: 24px; display:grid; gap:16px; }
  .card{ border-radius: 18px; border:1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.18); padding:16px; }
  .section-head{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; margin-bottom:10px; flex-wrap:wrap; }
  .h2{ margin:0; font-size:1.2rem; font-weight:950; }
  .muted{ opacity:0.7; }
  .small{ font-size:0.85rem; }
  .big{ font-weight:950; font-size:1.1rem; }

  .panel{ border-radius: 16px; border:1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.16); padding:14px; }
  .row{ display:grid; gap:4px; margin-bottom:10px; }

  .publish{ display:grid; gap:12px; }
  .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
  @media (max-width: 780px){ .grid{ grid-template-columns: 1fr; } }

  .field{ display:grid; gap:6px; }
  .field-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
  label{ font-weight:900; opacity:0.9; }
  .mini-toggle{ display:inline-flex; align-items:center; gap:8px; font-size:0.84rem; opacity:0.72; cursor:pointer; }
  .mini-toggle input{ transform: scale(1.02); }
  select{
    padding:10px 12px;
    border-radius: 12px;
    border:1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.20);
    color: rgba(255,255,255,0.9);
  }

  .divider{ height:1px; background: rgba(255,255,255,0.08); margin: 6px 0; }

  .team-groups{
    display:grid;
    gap:12px;
  }

  .team-group{
    border-radius: 16px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.025);
    padding:10px;
  }

  .team-group-title{
    font-weight:950;
    font-size:0.85rem;
    letter-spacing:0.08em;
    text-transform:uppercase;
    opacity:0.78;
    margin:0 0 8px;
  }

  .team-grid{
    display:grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap:8px;
  }
  @media (max-width: 960px){ .team-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 520px){ .team-grid{ grid-template-columns: 1fr; } }

  .team{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.16);
    cursor:pointer;
    user-select:none;
  }
  .team input{ transform: scale(1.05); }
  .team input:disabled{ cursor:not-allowed; }
  .team--eliminated{
    opacity:0.42;
    filter: grayscale(0.5);
    cursor:not-allowed;
    background: rgba(255,255,255,0.015);
  }
  .team-status{
    margin-left:auto;
    display:inline-flex;
    align-items:center;
    height:22px;
    padding:0 8px;
    border-radius:999px;
    border:1px solid rgba(255,120,120,0.22);
    background: rgba(255,120,120,0.07);
    color: rgba(255,235,235,0.86);
    font-size:0.74rem;
    font-weight:950;
    text-transform:uppercase;
    letter-spacing:0.04em;
  }
  .empty-state{
    border-radius:14px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    padding:12px;
    color: rgba(255,255,255,0.68);
    font-size:0.9rem;
  }

  .btn{ display:inline-flex; align-items:center; justify-content:center; border-radius: 12px; padding:10px 14px; font-weight:900; }
  .btn--vip{ border:1px solid rgba(212,175,55,0.25); background: rgba(212,175,55,0.10); }

  .entries{ display:grid; gap:10px; }
  .entry{ border-radius: 16px; border:1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.16); padding:12px; }
  .entry-top{ display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; }
  .name{ font-weight:950; }

  .score{ text-align:right; min-width: 90px; }

  .picks{ margin-top:10px; display:grid; gap:8px; }
  .pick{
    display:flex;
    justify-content:space-between;
    gap:12px;
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.14);
  }
  .pick-round{ font-weight:900; opacity:0.85; }
  .pick-team{ opacity:0.75; margin-top:2px; }

  .pill{
    display:inline-flex;
    align-items:center;
    height:26px;
    padding:0 10px;
    border-radius: 999px;
    border:1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    opacity:0.85;
  }

  .elim{
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,120,120,0.20);
    background: rgba(255,120,120,0.06);
  }

  .grid-one{ display:grid; grid-template-columns: 1fr; gap:12px; }

.actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
}

.btn--ghost{
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
}

</style>
