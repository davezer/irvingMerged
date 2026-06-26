<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const FALLBACK_SEASONS = [2026, 2025];

  const fmt = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : Number(0).toFixed(digits);
  };

  $: season = Number(data.season || new Date().getFullYear());
  $: availableWeeks = data.availableWeeks || [];
  $: selectedWeek = Number(data.selectedWeek || availableWeeks[availableWeeks.length - 1] || 1);
  $: rosters = data.rosters || [];
  $: teamOptions = data.teamOptions || [];
  $: starterSlots = data.starterSlots || ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
  $: filterTeam = data.filterTeam || '';
  $: snapshotLabel = data.snapshotLabel || `Week ${selectedWeek}`;
  $: availableSeasons = (Array.isArray(data.seasons) && data.seasons.length ? data.seasons : FALLBACK_SEASONS)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  $: maxBenchRows = Math.max(0, ...rosters.map((roster) => roster.bench?.length || 0));
  $: maxReserveRows = Math.max(0, ...rosters.map((roster) => roster.reserve?.length || 0));
  $: benchRows = Array.from({ length: maxBenchRows }, (_, index) => index);
  $: reserveRows = Array.from({ length: maxReserveRows }, (_, index) => index);
  $: selectedTeam = teamOptions.find(
    (team) => team.managerSlug === filterTeam || String(team.rosterId) === String(filterTeam)
  );
  $: selectedTeamLabel = selectedTeam?.teamName || 'All franchises';
  $: rosterCount = rosters.length || 0;

  function buildHref({ nextSeason = season, week = selectedWeek, team = filterTeam } = {}) {
    const params = new URLSearchParams();
    params.set('season', String(nextSeason));
    if (week) params.set('week', String(week));
    if (team) params.set('team', String(team));
    return `/league/rosters?${params.toString()}`;
  }

  function navigateTo(href) {
    if (typeof window !== 'undefined') window.location.href = href;
  }

  function teamHref(roster) {
    return roster.managerSlug
      ? `/league/teams/${roster.managerSlug}?season=${season}`
      : `/league/rosters?season=${season}&week=${selectedWeek}&team=${roster.rosterId}`;
  }

  function slotLabel(slot, index) {
    if (slot === 'FLEX') return 'FLEX';
    return slot || `S${index + 1}`;
  }

  function playerPosition(player, slot = '') {
    return String(player?.position || slot || 'BN').toUpperCase();
  }

  function positionClass(player, slot = '') {
    const position = playerPosition(player, slot);
    if (slot === 'DEF' || position === 'DEF' || position === 'DST') return 'pos-def';
    if (slot === 'K' || position === 'K') return 'pos-k';
    if (position === 'QB') return 'pos-qb';
    if (position === 'RB') return 'pos-rb';
    if (position === 'WR') return 'pos-wr';
    if (position === 'TE') return 'pos-te';
    return 'pos-flex';
  }

  function playerMeta(player) {
    if (!player) return '';
    const position = player.position || '—';
    const team = player.team || player.teamLabel || 'FA';
    return `${position} · ${team}`;
  }

  function playerInitials(player) {
    return String(player?.name || '—')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="rosters" />

  <section class="roster-hero">
    <div class="hero-copy">
      <div class="hero-bug"><span>ICN</span><strong>Roster Desk</strong></div>
      <h1>League rosters</h1>
      <p>Week-by-week roster snapshots, every franchise on one old-school broadcast board.</p>

      <div class="hero-meta" aria-label="Roster board summary">
        <span>{snapshotLabel}</span>
        <span>{selectedTeamLabel}</span>
        <span>{rosterCount} franchise{rosterCount === 1 ? '' : 's'}</span>
      </div>
    </div>

    <div class="control-stack">
      <div class="control-box season-box" aria-label="Season selector">
        <span>Season feed</span>
        <div class="season-pills">
          {#each availableSeasons as option}
            <a class:active={Number(option) === Number(season)} href={buildHref({ nextSeason: option })}>{option}</a>
          {/each}
        </div>
      </div>

      <div class="control-box team-select-box" aria-label="Team filter">
        <label for="team-filter">Franchise feed</label>
        <select
          id="team-filter"
          value={filterTeam}
          on:change={(event) => navigateTo(buildHref({ team: event.currentTarget.value }))}
        >
          <option value="">All franchises</option>
          {#each teamOptions as team}
            <option value={team.managerSlug || team.rosterId}>{team.teamName}</option>
          {/each}
        </select>
      </div>
    </div>

    <section class="week-panel">
      <div class="week-head">
        <div>
          <div class="eyebrow">Week feed</div>
          <strong>{snapshotLabel}</strong>
        </div>
        <span>{selectedTeamLabel}</span>
      </div>

      <div class="week-pills" aria-label="Week selector">
        {#each availableWeeks as week}
          <a class:active={Number(week) === Number(selectedWeek)} href={buildHref({ week })}>W{week}</a>
        {/each}
      </div>
    </section>
  </section>

  {#if !data.hasData}
    <section class="empty-card">
      <div class="bug-row"><span>ICN</span><strong>No roster signal</strong></div>
      <h2>No roster data available</h2>
      <p>We could not pull a roster board for this season, week, or franchise selection.</p>
    </section>
  {:else}
    <section class="roster-board-card">
      <div class="board-topper">
        <div>
          <div class="eyebrow">RosterCast board</div>
          <h2>{snapshotLabel}</h2>
        </div>

        <div class="board-status">
          <span>{selectedTeamLabel}</span>
          <span>{rosterCount} on board</span>
        </div>

        <div class="board-key" aria-label="Position color key">
          <span class="key qb">QB</span>
          <span class="key rb">RB</span>
          <span class="key wr">WR</span>
          <span class="key te">TE</span>
          <span class="key k">K</span>
          <span class="key def">DEF</span>
        </div>
      </div>

      <div class="board-scroll">
        <div class="roster-board" style={`--team-count:${Math.max(rosters.length, 1)}`}>
          <div class="slot-corner">Pos</div>
          {#each rosters as roster (roster.rosterId)}
            <a class="team-head" href={teamHref(roster)} title={roster.teamName}>
              <div class="team-logo">
                {#if roster.teamPhoto}
                  <img src={roster.teamPhoto} alt={roster.teamName} />
                {:else}
                  <span>{roster.initials}</span>
                {/if}
              </div>
              <strong>{roster.teamName}</strong>
              <small>{roster.recordLabel} · {fmt(roster.pointsFor)} PF</small>
            </a>
          {/each}

          {#each starterSlots as slot, slotIndex}
            <div class="slot-label">{slotLabel(slot, slotIndex)}</div>
            {#each rosters as roster (roster.rosterId + '-' + slotIndex)}
              {@const starter = roster.starters?.[slotIndex]}
              {@const player = starter?.player}
              {#if player}
                <div class={`player-cell ${positionClass(player, slot)}`} title={`${player.name} — ${playerMeta(player)}`}>
                  {#if player.photoUrl}
                    <img src={player.photoUrl} alt={player.name} />
                  {:else}
                    <span class="player-avatar">{playerInitials(player)}</span>
                  {/if}
                  <strong>{player.name}</strong>
                  <small>{playerMeta(player)}</small>
                </div>
              {:else}
                <div class="player-cell empty-cell"><span>—</span></div>
              {/if}
            {/each}
          {/each}

          {#if benchRows.length}
            <div class="bench-band">Bench</div>
            {#each benchRows as rowIndex}
              <div class="slot-label bench-label">BN</div>
              {#each rosters as roster (roster.rosterId + '-bench-' + rowIndex)}
                {@const player = roster.bench?.[rowIndex]}
                {#if player}
                  <div class={`player-cell bench-cell ${positionClass(player, 'BN')}`} title={`${player.name} — ${playerMeta(player)}`}>
                    {#if player.photoUrl}
                      <img src={player.photoUrl} alt={player.name} />
                    {:else}
                      <span class="player-avatar">{playerInitials(player)}</span>
                    {/if}
                    <strong>{player.name}</strong>
                    <small>{playerMeta(player)}</small>
                  </div>
                {:else}
                  <div class="player-cell empty-cell"><span>—</span></div>
                {/if}
              {/each}
            {/each}
          {/if}

          {#if reserveRows.length}
            <div class="bench-band reserve-band">IR / Taxi</div>
            {#each reserveRows as rowIndex}
              <div class="slot-label bench-label">IR</div>
              {#each rosters as roster (roster.rosterId + '-reserve-' + rowIndex)}
                {@const player = roster.reserve?.[rowIndex]}
                {#if player}
                  <div class={`player-cell reserve-cell ${positionClass(player, 'IR')}`} title={`${player.name} — ${playerMeta(player)}`}>
                    {#if player.photoUrl}
                      <img src={player.photoUrl} alt={player.name} />
                    {:else}
                      <span class="player-avatar">{playerInitials(player)}</span>
                    {/if}
                    <strong>{player.name}</strong>
                    <small>{playerMeta(player)}</small>
                  </div>
                {:else}
                  <div class="player-cell empty-cell"><span>—</span></div>
                {/if}
              {/each}
            {/each}
          {/if}
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .page-stack {
    display: grid;
    gap: 18px;
    max-width: 1500px;
    margin: 0 auto;
    padding-bottom: 44px;
  }

  .roster-hero,
  .week-panel,
  .roster-board-card,
  .empty-card {
    border: 2px solid #070808;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.03) 18%, rgba(0,0,0,0.18)),
      linear-gradient(180deg, #5f6763, #252b2a 48%, #101313);
    box-shadow: var(--shadow-bug);
  }

  .roster-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 18px 22px;
    align-items: start;
    border-radius: 18px;
    padding: 22px;
    background:
      linear-gradient(90deg, rgba(199,25,47,0.24), transparent 34%),
      linear-gradient(180deg, #636b67, #252b2a 48%, #101313);
  }

  .hero-copy {
    min-width: 0;
    align-self: stretch;
    display: grid;
    align-content: start;
    gap: 10px;
  }

  .hero-bug {
    display: inline-grid;
    grid-template-columns: 48px auto;
    width: fit-content;
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 7px;
    background: #080909;
    font-family: var(--font-score);
    text-transform: uppercase;
    box-shadow: var(--shadow-bug);
  }

  .hero-bug span {
    display: grid;
    place-items: center;
    padding: 8px 10px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: #fff;
  }

  .hero-bug strong {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    color: var(--bug-yellow);
    letter-spacing: 0.12em;
  }

  .eyebrow {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1,
  h2 {
    margin: 0;
    text-shadow: 0 2px 0 #000;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(2.75rem, 5vw, 5rem);
    line-height: 0.88;
    letter-spacing: -0.065em;
  }

  h2 {
    font-size: 1.45rem;
    line-height: 1;
  }

  p {
    max-width: 70ch;
    margin: 0;
    color: rgba(247,245,235,0.82);
    line-height: 1.45;
  }

  small {
    color: rgba(247,245,235,0.64);
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .hero-meta span,
  .board-status span {
    border: 1px solid #070808;
    border-radius: 5px;
    padding: 6px 9px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.45);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.28);
  }

  .control-stack {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .control-box {
    display: grid;
    gap: 9px;
    padding: 12px;
    border: 2px solid #111;
    border-radius: 7px;
    background: linear-gradient(180deg, #d9d9cf, #777d78 48%, #222826);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.55);
  }

  .control-box > span,
  .team-select-box label {
    color: #111;
    font-family: var(--font-score);
    font-size: 0.66rem;
    font-weight: 950;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
  }

  .season-pills,
  .week-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .season-pills a,
  .week-pills a,
  .team-select-box select {
    border: 2px solid #070808;
    border-radius: 6px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    font-weight: 950;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(0,0,0,0.34);
  }

  .season-pills a,
  .week-pills a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 52px;
    padding: 8px 10px;
    font-size: 0.76rem;
    line-height: 1;
  }

  .season-pills a:hover,
  .season-pills a.active,
  .week-pills a:hover,
  .week-pills a.active {
    color: #fff;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    text-shadow: 0 2px 0 #000;
  }

  .team-select-box select {
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    cursor: pointer;
  }

  .week-panel {
    grid-column: 1 / -1;
    display: grid;
    gap: 14px;
    border-radius: 14px;
    padding: 15px 16px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.025) 18%, rgba(0,0,0,0.14)),
      linear-gradient(180deg, #424a47, #171b1a 58%, #090b0b);
  }

  .week-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: end;
  }

  .week-head strong {
    display: block;
    margin-top: 4px;
    color: #fff;
    font-family: var(--font-score);
    font-size: 1.1rem;
    text-transform: uppercase;
  }

  .week-head > span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-align: right;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .roster-board-card {
    overflow: hidden;
    border-radius: 18px;
  }

  .board-topper {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 16px;
    padding: 14px 16px;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #5d6561, #242a29 50%, #101313);
  }

  .board-status,
  .board-key {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .key {
    min-width: 42px;
    padding: 6px 8px;
    border: 1px solid #070808;
    color: #080909;
    font-family: var(--font-score);
    font-size: 0.66rem;
    font-weight: 950;
    text-align: center;
    text-shadow: none;
  }

  .key.qb { background: #f47ca7; }
  .key.rb { background: #70c8bd; }
  .key.wr { background: #a8cff5; }
  .key.te { background: #ffd3a1; }
  .key.k { background: #d7a4f3; }
  .key.def { background: #fff6aa; }

  .board-scroll {
    width: 100%;
    overflow-x: hidden;
    background: #111615;
  }

  .roster-board {
    display: grid;
    grid-template-columns: 44px repeat(var(--team-count), minmax(0, 1fr));
    width: 100%;
    min-width: 0;
  }

  .roster-board > * {
    min-width: 0;
  }

  .slot-corner,
  .slot-label,
  .team-head,
  .player-cell,
  .bench-band {
    border-right: 1px solid #050606;
    border-bottom: 1px solid #050606;
  }

  .slot-corner,
  .slot-label {
    position: sticky;
    left: 0;
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #262b2a, #090a0a);
    color: #fff;
    font-family: var(--font-score);
    font-size: 0.66rem;
    font-weight: 950;
    text-transform: uppercase;
    text-shadow: 0 2px 0 #000;
  }

  .slot-corner {
    z-index: 4;
    min-height: 82px;
  }

  .slot-label {
    z-index: 3;
    min-height: 58px;
  }

  .team-head {
    position: sticky;
    top: 0;
    z-index: 2;
    min-height: 82px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 4px;
    padding: 7px 4px;
    color: #fff;
    background: linear-gradient(180deg, #242a29, #080909);
    text-align: center;
    text-decoration: none;
  }

  .team-head:hover {
    color: var(--bug-yellow);
    background: linear-gradient(180deg, #3c4542, #0b0d0d);
  }

  .team-logo {
    width: clamp(30px, 2.45vw, 38px);
    height: clamp(30px, 2.45vw, 38px);
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 50%;
    background: #f2ead8;
    color: #111;
    font-family: var(--font-score);
    font-size: 0.7rem;
    box-shadow: 0 2px 0 rgba(255,255,255,0.18), 0 5px 12px rgba(0,0,0,0.42);
  }

  .team-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team-head strong {
    max-width: 100%;
    font-size: clamp(0.54rem, 0.68vw, 0.68rem);
    line-height: 1.05;
    overflow-wrap: anywhere;
    text-shadow: 0 2px 0 #000;
  }

  .team-head small {
    max-width: 100%;
    font-size: clamp(0.45rem, 0.54vw, 0.52rem);
    line-height: 1.05;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .player-cell {
    min-height: 58px;
    display: grid;
    grid-template-columns: clamp(18px, 1.55vw, 23px) minmax(0, 1fr);
    grid-template-rows: 1fr auto;
    gap: 2px 5px;
    align-content: center;
    padding: 5px 4px;
    color: #06100f;
    text-shadow: 0 1px 0 rgba(255,255,255,0.35);
  }

  .player-cell img,
  .player-avatar {
    grid-row: 1 / 3;
    width: clamp(18px, 1.55vw, 23px);
    height: clamp(18px, 1.55vw, 23px);
    place-self: center;
  }

  .player-cell img {
    object-fit: contain;
    filter: drop-shadow(0 2px 1px rgba(0,0,0,0.28));
  }

  .player-avatar {
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(255,255,255,0.45);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.48rem;
  }

  .player-cell strong {
    align-self: end;
    min-width: 0;
    font-size: clamp(0.47rem, 0.59vw, 0.6rem);
    line-height: 1.04;
    overflow-wrap: anywhere;
  }

  .player-cell small {
    min-width: 0;
    color: rgba(0,0,0,0.72);
    font-size: clamp(0.38rem, 0.49vw, 0.48rem);
    font-weight: 850;
    line-height: 1.05;
    overflow-wrap: anywhere;
  }

  .pos-qb { background: #f47ca7; }
  .pos-rb { background: #70c8bd; }
  .pos-wr { background: #a8cff5; }
  .pos-te { background: #ffd3a1; }
  .pos-k { background: #d7a4f3; }
  .pos-def { background: #fff6aa; }
  .pos-flex { background: #cfd7cc; }

  .empty-cell {
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.035);
    color: rgba(247,245,235,0.42);
    text-shadow: none;
  }

  .bench-band {
    grid-column: 1 / -1;
    display: grid;
    place-items: center;
    min-height: 32px;
    background: linear-gradient(180deg, #303735, #111313);
    color: #fff;
    font-family: var(--font-score);
    font-size: 0.74rem;
    font-weight: 950;
    text-transform: uppercase;
    text-shadow: 0 2px 0 #000;
  }

  .reserve-band { color: var(--bug-yellow); }
  .bench-cell,
  .reserve-cell { min-height: 56px; }
  .reserve-cell { opacity: 0.9; }

  .empty-card {
    display: grid;
    gap: 12px;
    border-radius: 18px;
    padding: 22px;
  }

  .bug-row {
    display: inline-grid;
    grid-template-columns: 58px auto;
    width: fit-content;
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 7px;
    background: #090a0a;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .bug-row span {
    display: grid;
    place-items: center;
    padding: 8px 10px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: #fff;
  }

  .bug-row strong {
    padding: 8px 12px;
    color: var(--bug-yellow);
  }

  @media (max-width: 1180px) {
    .roster-hero {
      grid-template-columns: 1fr;
    }

    .control-stack {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 980px) {
    .board-scroll {
      overflow-x: auto;
    }

    .roster-board {
      grid-template-columns: 48px repeat(var(--team-count), minmax(118px, 118px));
      width: max-content;
      min-width: calc(48px + (var(--team-count) * 118px));
    }

    .slot-corner,
    .team-head {
      min-height: 94px;
    }

    .slot-label,
    .player-cell {
      min-height: 68px;
    }

    .team-logo {
      width: 42px;
      height: 42px;
    }

    .team-head strong {
      font-size: 0.72rem;
    }

    .team-head small {
      font-size: 0.56rem;
    }

    .player-cell {
      grid-template-columns: 26px minmax(0, 1fr);
      padding: 7px 6px;
    }

    .player-cell img,
    .player-avatar {
      width: 26px;
      height: 26px;
    }

    .player-cell strong {
      font-size: 0.64rem;
    }

    .player-cell small {
      font-size: 0.52rem;
    }

    .board-topper {
      grid-template-columns: 1fr;
      align-items: start;
    }

    .board-status,
    .board-key {
      justify-content: flex-start;
    }
  }

  @media (max-width: 720px) {
    .roster-hero {
      padding: 16px;
    }

    .control-stack {
      grid-template-columns: 1fr;
    }

    .week-head {
      display: grid;
    }

    .week-head > span {
      text-align: left;
    }
  }
</style>
