<script>
  // RoundTracker.svelte
  // Read-only progress indicator for a user's selected teams during March Madness.

  export let selectedTeams = [];
  export let resultsPayload = null;
  export let dense = false;

  const ROUNDS = [
    { key: 'r1', label: 'R1', mult: 1, long: 'Round of 64' },
    { key: 'r2', label: 'R2', mult: 2, long: 'Round of 32' },
    { key: 'r3', label: 'R3', mult: 3, long: 'Sweet 16' },
    { key: 'r4', label: 'R4', mult: 4, long: 'Elite 8' },
    { key: 'r5', label: 'R5', mult: 6, long: 'Final Four' },
    { key: 'r6', label: 'R6', mult: 10, long: 'Championship' }
  ];

  const seedsByTeamId = resultsPayload?.seedsByTeamId || {};
  const winsByTeamId = resultsPayload?.winsByTeamId || {};
  const eliminatedByTeamId = resultsPayload?.eliminatedByTeamId || {};

  function teamIdOf(t) {
    return String(t?.id ?? t?.teamId ?? '');
  }

  function seedOf(teamId, teamObj) {
    const v = seedsByTeamId?.[teamId];
    const s1 = Number(v?.seed ?? v);
    if (Number.isFinite(s1) && s1 > 0) return s1;

    const s2 = Number(teamObj?.seed ?? teamObj?.seedNumber ?? null);
    if (Number.isFinite(s2) && s2 > 0) return s2;

    return null;
  }

  function winsObj(teamId) {
    return winsByTeamId?.[teamId] || {};
  }

  function winsCount(teamId) {
    const wins = winsObj(teamId);
    let c = 0;
    for (const r of ROUNDS) {
      if (wins?.[r.key]) c++;
    }
    return c;
  }

  function pointsSoFar(teamId, teamObj) {
    const seed = seedOf(teamId, teamObj);
    if (!seed) return 0;

    const wins = winsObj(teamId);
    let pts = 0;
    for (const r of ROUNDS) {
      if (wins?.[r.key]) pts += seed * r.mult;
    }
    return pts;
  }

  function completedRoundIndex() {
    let idx = -1;
    for (let i = 0; i < ROUNDS.length; i += 1) {
      const r = ROUNDS[i];
      const anyWin = Object.values(winsByTeamId || {}).some((w) => Boolean(w?.[r.key]));
      if (anyWin) idx = i;
    }
    return idx;
  }

  const completedIdx = completedRoundIndex();

  function teamStatus(teamId) {
    const wc = winsCount(teamId);

    if (eliminatedByTeamId?.[teamId]) return 'eliminated';
    if (completedIdx < 0) return 'pending';
    if (wc === 6) return 'champion';
    if (wc < completedIdx + 1) return 'eliminated';
    return 'alive';
  }

  function stageLabel(teamId) {
    const wc = winsCount(teamId);
    if (wc >= 6) return 'Champion';
    if (wc === 5) return 'Title Game';
    if (wc === 4) return 'Final Four';
    if (wc === 3) return 'Elite 8';
    if (wc === 2) return 'Sweet 16';
    if (wc === 1) return 'Round of 32';
    if (teamStatus(teamId) === 'eliminated') return 'Out';
    if (completedIdx < 0) return 'Awaiting tip';
    return 'Round of 64';
  }

  const hasAnyResultsData =
    Object.keys(seedsByTeamId).length > 0 ||
    Object.keys(winsByTeamId).length > 0 ||
    Object.keys(eliminatedByTeamId).length > 0;
</script>

<div class={"rt-card " + (dense ? "rt-dense" : "")}>
  <div class="rt-head">
    <div class="rt-title">Round Progress</div>
    {#if !hasAnyResultsData}
      <div class="rt-sub muted">Progress appears once results are synced.</div>
    {:else}
      <div class="rt-sub muted">Wins update as rounds complete.</div>
    {/if}
  </div>

  <div class="rt-table">
    <div class="rt-row rt-header">
      <div class="rt-teamcol">Team</div>
      <div class="rt-seedcol">Seed</div>
      <div class="rt-rounds">
        {#each ROUNDS as r (r.key)}
          <div class="rt-roundhdr">{r.label}</div>
        {/each}
      </div>
      <div class="rt-pointscol">Pts</div>
    </div>

    {#each selectedTeams as t (teamIdOf(t))}
      {#if teamIdOf(t)}
        {@const tid = teamIdOf(t)}
        {@const seed = seedOf(tid, t)}
        {@const wins = winsObj(tid)}
        {@const pts = pointsSoFar(tid, t)}
        {@const wc = winsCount(tid)}
        {@const status = teamStatus(tid)}
        {@const stage = stageLabel(tid)}

        <div class={"rt-row " + (status === 'eliminated' ? 'rt-elim' : status === 'alive' ? 'rt-alive' : status === 'champion' ? 'rt-champion' : '')}>
          <div class="rt-teamcol">
            <div class="rt-team">
              {#if t.logoUrl || t.logo || t.image}
                <img class="rt-logo" src={t.logoUrl || t.logo || t.image} alt="" />
              {/if}

              <div class="rt-teamtext">
                <div class="rt-teamname">{t.name || t.teamName || 'Team'}</div>
                <div class="rt-teammeta muted">
                  {#if t.abbr || t.shortName}
                    <span>{t.abbr || t.shortName}</span>
                    <span>•</span>
                  {/if}
                  <span>{stage}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rt-seedcol">
            {#if seed}
              <span class="pill">{seed}</span>
            {:else}
              <span class="pill pill--muted">—</span>
            {/if}
          </div>

          <div class="rt-rounds">
            {#each ROUNDS as r (r.key)}
              {@const hit = Boolean(wins?.[r.key])}
              <div class={"rt-cell " + (hit ? 'rt-hit' : 'rt-miss')}>
                <span class="rt-dot" aria-hidden="true"></span>
                <span class="rt-celllabel rt-celllabel--mobile">{r.label}</span>
              </div>
            {/each}
          </div>

          <div class="rt-pointscol">
            <span class="pill pill--gold">{pts}</span>
            <span class="muted rt-wins">{wc}W</span>
          </div>

         <div class="rt-mobile-meta">
          <div class="rt-mobile-pillrow">
              {#if seed}
                <span class="pill">Seed {seed}</span>
              {/if}
              <span class="pill pill--gold">{pts} pts</span>
              <span class="pill">{wc}W</span>
            </div>

            <div class="rt-mobile-pillrow">
              <span class={"pill " + (status === 'eliminated' ? 'pill--red' : status === 'alive' || status === 'champion' ? 'pill--green' : 'pill--muted')}>
                {status === 'eliminated' ? 'Out' : status === 'champion' ? 'Champion' : status === 'alive' ? 'Alive' : 'Pending'}
              </span>
              <span class="pill pill--muted">{stage}</span>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .rt-card {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.22);
    border-radius: 18px;
    padding: 14px;
  }

  .rt-head {
    display: grid;
    gap: 6px;
    margin-bottom: 10px;
  }

  .rt-title {
    font-weight: 900;
    letter-spacing: 0.02em;
  }

  .rt-sub {
    font-size: 0.95rem;
  }

  .muted {
    opacity: 0.75;
  }

  .rt-table {
    display: grid;
    gap: 10px;
  }

  .rt-row {
    display: grid;
    grid-template-columns: minmax(220px, 1.6fr) 80px minmax(240px, 2fr) 110px;
    gap: 12px;
    align-items: center;
  }

  .rt-header {
    padding: 8px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.18);
  }

  .rt-header .rt-roundhdr {
    font-weight: 800;
    opacity: 0.85;
    text-align: center;
    font-size: 0.95rem;
  }

  .rt-team {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .rt-logo {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    object-fit: contain;
    flex: 0 0 auto;
  }

  .rt-teamtext {
    min-width: 0;
  }

  .rt-teamname {
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rt-teammeta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 0.9rem;
  }

  .rt-rounds {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

.rt-cell {
  padding: 0;
  min-height: 14px;
  border: 0;
  background: transparent;
  border-radius: 0;
  display: grid;
  place-items: center;
}

  .rt-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 2px solid rgba(255,255,255,0.20);
  }

  .rt-hit .rt-dot {
    border-color: rgba(212, 175, 55, 0.55);
    background: rgba(212, 175, 55, 0.35);
  }

  .rt-miss .rt-dot {
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.03);
  }

  .rt-celllabel {
    display: none;
  }

  .rt-pointscol {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    gap: 8px;
  }

  .rt-wins {
    font-size: 0.9rem;
  }

  .rt-mobile-meta {
    display: none;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
    font-weight: 800;
    min-width: 28px;
    box-sizing: border-box;
  }

  .pill--gold {
    border-color: rgba(212, 175, 55, 0.30);
    background: rgba(212, 175, 55, 0.08);
  }

  .pill--muted {
    opacity: 0.7;
  }

  .pill--red {
    border-color: rgba(220,78,78,0.28);
    background: rgba(220,78,78,0.08);
  }

  .pill--green {
    border-color: rgba(88,190,112,0.28);
    background: rgba(88,190,112,0.10);
  }

  .rt-alive {
    border-radius: 14px;
  }

  .rt-elim {
    border-radius: 14px;
  }

  .rt-champion {
    border-radius: 14px;
  }

  .rt-dense .rt-row {
    grid-template-columns: minmax(88px, 1.4fr) 70px minmax(210px, 2fr) 90px;
  }

  .rt-dense .rt-cell {
    padding: 8px 0;
    border-radius: 10px;
  }

  .rt-dense .rt-logo {
    width: 22px;
    height: 22px;
    border-radius: 7px;
  }

@media (max-width: 900px) {
  .rt-card {
    padding: 12px;
    border-radius: 16px;
  }

  .rt-head {
    margin-bottom: 8px;
  }

  .rt-sub {
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .rt-header {
    display: none;
  }

  .rt-table {
    gap: 8px;
  }

  .rt-row {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.18);
  }

  .rt-teamcol,
  .rt-seedcol,
  .rt-pointscol {
    min-width: 0;
  }

  .rt-seedcol,
  .rt-pointscol {
    display: none;
  }

  .rt-team {
    align-items: flex-start;
    gap: 10px;
  }

  .rt-logo {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    margin-top: 1px;
  }

  .rt-teamname {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
    font-size: 0.98rem;
    line-height: 1.2;
  }

  .rt-teammeta {
    font-size: 0.84rem;
    gap: 5px;
  }

  .rt-rounds {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    align-items: stretch;
  }

  .rt-cell {
    padding: 8px 0;
    border-radius: 10px;
    min-height: 34px;
    display: grid;
    place-items: center;
  }

  .rt-dot {
    width: 10px;
    height: 10px;
  }

  .rt-celllabel--mobile {
    display: none;
  }

  .rt-mobile-meta {
    display: grid;
    gap: 6px;
  }

  .rt-mobile-pillrow {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rt-mobile-pillrow .pill {
    min-height: 30px;
    font-size: 0.76rem;
    padding: 5px 9px;
  }
}

@media (max-width: 560px) {
  .rt-card {
    padding: 10px;
    border-radius: 14px;
  }

  .rt-title {
    font-size: 0.98rem;
  }

  .rt-sub {
    font-size: 0.86rem;
  }

  .rt-row {
    padding: 10px;
    gap: 8px;
    border-radius: 14px;
  }

  .rt-team {
    gap: 8px;
  }

  .rt-logo {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .rt-teamname {
    font-size: 0.94rem;
  }

  .rt-teammeta {
    font-size: 0.8rem;
  }

  .rt-rounds {
    gap: 4px;
  }

  .rt-cell {
    padding: 7px 0;
    min-height: 30px;
    border-radius: 9px;
  }

  .rt-dot {
    width: 9px;
    height: 9px;
  }

  .rt-mobile-pillrow {
    gap: 5px;
  }

  .rt-mobile-pillrow .pill {
    min-height: 28px;
    font-size: 0.72rem;
    padding: 4px 8px;
  }
}
</style>