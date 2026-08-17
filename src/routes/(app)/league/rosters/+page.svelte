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

  function isRealPlayer(player) {
	if (!player) return false;

	const id = String(player.id ?? '').trim();

	return (
		id &&
		id !== '0' &&
		player.name !== 'Player 0'
	);
}
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="rosters" />

  <section class="roster-hero icl-hero-shell pad-md">
    <div class="hero-copy">
      
      <h1>Roster Board</h1>

<p>
	Every franchise. Every lineup. Week-by-week snapshots across the league.
</p>

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
      <div class="bug-row"><span>ICL</span><strong>No roster signal</strong></div>
      <h2>No roster data available</h2>
      <p>We could not pull a roster board for this season, week, or franchise selection.</p>
    </section>
  {:else}
    <section class="roster-board-card">
      <div class="board-topper">
        <div>
          <div class="eyebrow">League roster board</div>
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
              {#if isRealPlayer(player)}
                <div
	class={`player-cell ${positionClass(player, slot)}`}
	data-player-id={player.id}
	data-player-season={season}
	role="button"
	tabindex="0"
	aria-label={`Open ${player.name} player card`}
>
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
                {#if isRealPlayer(player)}
                  <div
	class={`player-cell bench-cell ${positionClass(player, 'BN')}`}
	data-player-id={player.id}
	data-player-season={season}
	role="button"
	tabindex="0"
	aria-label={`Open ${player.name} player card`}
>
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
                {#if isRealPlayer(player)}
                  <div
	class={`player-cell reserve-cell ${positionClass(player, 'IR')}`}
	data-player-id={player.id}
	data-player-season={season}
	role="button"
	tabindex="0"
	aria-label={`Open ${player.name} player card`}
>
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
	/* =========================================================
	   IRVING COLLECTIVE — ROSTER BOARD
	   ========================================================= */

	.page-stack {
		display: grid;

		gap: 18px;

		max-width: 1500px;

		margin: 0 auto;

		padding-bottom: 44px;
	}


	/* =========================================================
	   SHARED SURFACES
	   ========================================================= */

	.week-panel,
	.roster-board-card,
	.empty-card {
		border:
			1px solid
			var(--border) !important;

		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.018),
				transparent 24%
			),
			var(--panel) !important;

		box-shadow:
			var(--shadow-panel) !important;
	}


	/* =========================================================
	   HERO
	   ========================================================= */

	.roster-hero {
		position: relative;

		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			300px;

		gap:
			18px 22px;

		align-items: start;

		overflow: hidden;

		padding: 26px 28px;

		border:
			1px solid
			var(--border-strong) !important;

		border-radius:
			var(--radius-lg);

		background:
			linear-gradient(
				120deg,
				rgba(191,161,106,.055),
				transparent 38%
			),
			var(--panel-strong) !important;

		box-shadow:
			var(--shadow-panel) !important;
	}


	.roster-hero::after {
		content: 'ROSTERS';

		position: absolute;

		right: 26px;

		bottom: -22px;

		color:
			rgba(191,161,106,.024);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				5rem,
				12vw,
				10rem
			);

		line-height: 1;

		letter-spacing: .04em;

		pointer-events: none;
	}


	.hero-copy {
		position: relative;

		z-index: 1;

		min-width: 0;

		align-self: stretch;

		display: grid;

		align-content: start;

		gap: 10px;
	}


	h1,
	h2 {
		margin: 0;

		color:
			var(--brand-ivory);

		text-shadow: none;
	}


	h1 {
		font-family:
			var(--font-display);

		font-size:
			clamp(
				3.8rem,
				7vw,
				6.8rem
			);

		font-weight: 400;

		line-height: .88;

		letter-spacing: .015em;
	}


	h2 {
		font-family:
			var(--font-display);

		font-size: 1.9rem;

		font-weight: 400;

		line-height: 1;

		letter-spacing: .02em;
	}


	p {
		max-width: 70ch;

		margin: 0;

		color:
			var(--muted);

		line-height: 1.55;
	}


	small {
		color:
			var(--muted-2);
	}


	.eyebrow,
	.control-box > span,
	.team-select-box label {
		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .16em;

		text-transform: uppercase;
	}


	/* =========================================================
	   HERO META
	   ========================================================= */

	.hero-meta {
		display: flex;

		flex-wrap: wrap;

		gap: 7px;

		margin-top: 5px;
	}


	.hero-meta span,
	.board-status span {
		padding:
			5px 8px;

		border:
			1px solid
			rgba(191,161,106,.15);

		border-radius: 3px;

		background:
			rgba(255,255,255,.018);

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .59rem;

		font-weight: 700;

		letter-spacing: .06em;

		text-transform: uppercase;

		text-shadow: none;

		box-shadow: none;
	}


	/* =========================================================
	   RIGHT-SIDE CONTROLS
	   ========================================================= */

	.control-stack {
		position: relative;

		z-index: 2;

		display: grid;

		gap: 10px;

		min-width: 0;
	}


	.control-box {
		display: grid;

		gap: 9px;

		padding:
			12px 14px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			var(--radius-sm);

		background:
			rgba(13,16,15,.78);

		box-shadow: none;
	}


	.season-pills,
	.week-pills {
		display: flex;

		flex-wrap: wrap;

		gap: 6px;
	}


	.season-pills a,
	.week-pills a {
		display: inline-flex;

		align-items: center;

		justify-content: center;

		min-width: 50px;

		min-height: 31px;

		padding:
			5px 8px;

		border:
			1px solid
			rgba(191,161,106,.18);

		border-radius: 3px;

		background:
			transparent;

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .64rem;

		font-weight: 700;

		letter-spacing: .06em;

		line-height: 1;

		text-decoration: none;

		text-shadow: none;

		box-shadow: none;

		transition:
			color 120ms ease,
			border-color 120ms ease,
			background 120ms ease;
	}


	.season-pills a:hover,
	.week-pills a:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-ivory);
	}


	.season-pills a.active,
	.week-pills a.active {
		border-color:
			var(--brand-gold);

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);
	}


	.team-select-box select {
		width: 100%;

		min-height: 36px;

		padding:
			0 10px;

		border:
			1px solid
			rgba(191,161,106,.22);

		border-radius: 3px;

		background:
			var(--brand-charcoal);

		color:
			var(--brand-ivory);

		font-family:
			var(--font-body);

		font-size: .68rem;

		font-weight: 700;

		cursor: pointer;

		color-scheme: dark;
	}


	.team-select-box select:focus {
		outline:
			1px solid
			var(--brand-gold);

		outline-offset: 2px;
	}


	/* =========================================================
	   WEEK PANEL
	   ========================================================= */

	.week-panel {
		position: relative;

		z-index: 1;

		grid-column:
			1 / -1;

		display: grid;

		gap: 13px;

		padding:
			14px 16px;

		border-radius:
			var(--radius-md);

		background:
			rgba(0,0,0,.11) !important;

		box-shadow: none !important;
	}


	.week-head {
		display: flex;

		justify-content:
			space-between;

		align-items: end;

		gap: 16px;
	}


	.week-head strong {
		display: block;

		margin-top: 4px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size: 1.55rem;

		font-weight: 400;

		line-height: 1;

		letter-spacing: .03em;

		text-transform: uppercase;
	}


	.week-head > span {
		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		text-align: right;

		text-transform: uppercase;

		letter-spacing: .11em;
	}


	/* =========================================================
	   BOARD SHELL
	   ========================================================= */

	.roster-board-card {
		overflow: hidden;

		border-radius:
			var(--radius-lg);
	}


	.board-topper {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			auto
			auto;

		align-items: center;

		gap: 18px;

		padding:
			17px 18px;

		border-bottom:
			1px solid
			var(--border);

		background:
			rgba(0,0,0,.13);
	}


	.board-status,
	.board-key {
		display: flex;

		flex-wrap: wrap;

		justify-content: flex-end;

		gap: 6px;
	}


	/* =========================================================
	   POSITION KEY

	   Position colors remain because they are useful information,
	   but they are intentionally muted to live inside the brand.
	   ========================================================= */

	.key {
		--position:
			var(--brand-stone);

		min-width: 38px;

		padding:
			5px 7px;

		border:
			1px solid
			color-mix(
				in srgb,
				var(--position) 50%,
				transparent
			);

		border-radius: 3px;

		background:
			color-mix(
				in srgb,
				var(--position) 10%,
				var(--brand-charcoal)
			);

		color:
			color-mix(
				in srgb,
				var(--position) 75%,
				var(--brand-ivory)
			);

		font-family:
			var(--font-body);

		font-size: .57rem;

		font-weight: 800;

		letter-spacing: .06em;

		text-align: center;
	}


	.key.qb {
		--position: #b87588;
	}


	.key.rb {
		--position: #65958c;
	}


	.key.wr {
		--position: #718ba3;
	}


	.key.te {
		--position: #ae8c68;
	}


	.key.k {
		--position: #91749f;
	}


	.key.def {
		--position: #a89b68;
	}


	/* =========================================================
	   BOARD GRID
	   ========================================================= */

	.board-scroll {
		width: 100%;

		overflow-x: hidden;

		background:
			#101312;
	}


	.roster-board {
		display: grid;

		grid-template-columns:
			44px
			repeat(
				var(--team-count),
				minmax(0,1fr)
			);

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
		border-right:
			1px solid
			rgba(191,161,106,.08);

		border-bottom:
			1px solid
			rgba(191,161,106,.09);
	}


	/* =========================================================
	   POSITION COLUMN
	   ========================================================= */

	.slot-corner,
	.slot-label {
		position: sticky;

		left: 0;

		display: grid;

		place-items: center;

		background:
			#0c0f0e;

		color:
			var(--brand-stone);

		font-family:
			var(--font-body);

		font-size: .56rem;

		font-weight: 800;

		letter-spacing: .06em;

		text-transform: uppercase;

		text-shadow: none;
	}


	.slot-corner {
		z-index: 4;

		min-height: 82px;

		color:
			var(--brand-gold);
	}


	.slot-label {
		z-index: 3;

		min-height: 58px;
	}


	/* =========================================================
	   TEAM HEADERS
	   ========================================================= */

	.team-head {
		position: sticky;

		top: 0;

		z-index: 2;

		min-height: 88px;

		display: grid;

		justify-items: center;

		align-content: center;

		gap: 4px;

		padding:
			8px 4px;

		background:
			#111513;

		color:
			var(--brand-ivory);

		text-align: center;

		text-decoration: none;

		transition:
			background 120ms ease,
			color 120ms ease;
	}


	.team-head:hover {
		background:
			rgba(191,161,106,.06);

		color:
			var(--brand-gold);
	}


	.team-logo {
		width:
			clamp(
				30px,
				2.45vw,
				38px
			);

		height:
			clamp(
				30px,
				2.45vw,
				38px
			);

		display: grid;

		place-items: center;

		overflow: hidden;

		

		color:
			var(--brand-charcoal);

		font-family:
			var(--font-body);

		font-size: .65rem;

		font-weight: 800;

		box-shadow: none;
	}


	.team-logo img {
		width: 100%;

		height: 100%;

		object-fit: cover;
	}


	.team-head strong {
		max-width: 100%;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-body);

		font-size:
			clamp(
				.53rem,
				.67vw,
				.68rem
			);

		font-weight: 800;

		line-height: 1.05;

		overflow-wrap: anywhere;

		text-shadow: none;
	}


	.team-head:hover strong {
		color:
			var(--brand-gold);
	}


	.team-head small {
		max-width: 100%;

		color:
			var(--brand-stone);

		font-size:
			clamp(
				.44rem,
				.53vw,
				.52rem
			);

		line-height: 1.05;

		overflow: hidden;

		text-overflow: ellipsis;

		white-space: nowrap;
	}


	/* =========================================================
	   PLAYER CELLS
	   ========================================================= */

	.player-cell {
		--position:
			var(--brand-stone);

		position: relative;

		min-height: 58px;

		display: grid;

		grid-template-columns:
			clamp(
				18px,
				1.55vw,
				23px
			)
			minmax(0,1fr);

		grid-template-rows:
			1fr
			auto;

		gap:
			2px 5px;

		align-content: center;

		padding:
			5px 5px 5px 7px;

		background:
			color-mix(
				in srgb,
				var(--position) 7%,
				#121614
			);

		color:
			var(--brand-ivory);

		text-shadow: none;

		cursor: pointer;

		transition:
			background 120ms ease;
	}


	.player-cell::before {
		content: '';

		position: absolute;

		top: 7px;
		bottom: 7px;
		left: 0;

		width: 2px;

		background:
			var(--position);

		opacity: .5;
	}


	.player-cell:hover {
		background:
			color-mix(
				in srgb,
				var(--position) 14%,
				#121614
			);
	}


	.player-cell:hover::before {
		opacity: 1;
	}


	.player-cell img,
	.player-avatar {
		grid-row:
			1 / 3;

		width:
			clamp(
				18px,
				1.55vw,
				23px
			);

		height:
			clamp(
				18px,
				1.55vw,
				23px
			);

		place-self: center;
	}


	.player-cell img {
		object-fit: contain;

		filter:
			drop-shadow(
				0 2px 2px
				rgba(0,0,0,.28)
			);
	}


	.player-avatar {
		display: grid;

		place-items: center;

		border:
			1px solid
			color-mix(
				in srgb,
				var(--position) 42%,
				transparent
			);

		border-radius: 50%;

		background:
			color-mix(
				in srgb,
				var(--position) 12%,
				var(--brand-charcoal)
			);

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .45rem;

		font-weight: 800;
	}


	.player-cell strong {
		align-self: end;

		min-width: 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-body);

		font-size:
			clamp(
				.47rem,
				.59vw,
				.60rem
			);

		font-weight: 750;

		line-height: 1.04;

		overflow-wrap: anywhere;
	}


	.player-cell small {
		min-width: 0;

		color:
			var(--brand-stone);

		font-size:
			clamp(
				.38rem,
				.49vw,
				.48rem
			);

		font-weight: 600;

		line-height: 1.05;

		overflow-wrap: anywhere;
	}


	/* =========================================================
	   POSITION ACCENTS
	   ========================================================= */

	.pos-qb {
		--position: #b87588;
	}


	.pos-rb {
		--position: #65958c;
	}


	.pos-wr {
		--position: #718ba3;
	}


	.pos-te {
		--position: #ae8c68;
	}


	.pos-k {
		--position: #91749f;
	}


	.pos-def {
		--position: #a89b68;
	}


	.pos-flex {
		--position:
			var(--brand-stone);
	}


	/* =========================================================
	   EMPTY CELLS
	   ========================================================= */

	.empty-cell {
		display: grid;

		place-items: center;

		background:
			rgba(255,255,255,.012);

		color:
			rgba(242,236,226,.24);

		text-shadow: none;

		cursor: default;
	}


	.empty-cell::before {
		display: none;
	}


	/* =========================================================
	   BENCH / RESERVE BANDS
	   ========================================================= */

	.bench-band {
		grid-column:
			1 / -1;

		display: grid;

		place-items: center;

		min-height: 30px;

		border-top:
			1px solid
			rgba(191,161,106,.18);

		border-bottom:
			1px solid
			rgba(191,161,106,.18);

		background:
			#0d100f;

		color:
			var(--brand-sand);

		font-family:
			var(--font-body);

		font-size: .57rem;

		font-weight: 700;

		letter-spacing: .16em;

		text-transform: uppercase;

		text-shadow: none;
	}


	.reserve-band {
		color:
			var(--brand-gold);
	}


	.bench-label {
		color:
			var(--brand-stone);
	}


	.bench-cell,
	.reserve-cell {
		min-height: 56px;
	}


	.bench-cell {
		opacity: .90;
	}


	.reserve-cell {
		opacity: .78;
	}


	/* =========================================================
	   EMPTY STATE
	   ========================================================= */

	.empty-card {
		display: grid;

		gap: 12px;

		padding: 22px;

		border-radius:
			var(--radius-lg);

		color:
			var(--muted);
	}


	.bug-row {
		display: inline-flex;

		width: fit-content;

		align-items: center;

		overflow: hidden;

		border:
			1px solid
			var(--border-strong);

		border-radius: 3px;

		background:
			var(--brand-charcoal);

		color:
			var(--brand-gold);

		font-family:
			var(--font-body);

		font-size: .61rem;

		font-weight: 700;

		letter-spacing: .09em;

		text-transform: uppercase;
	}


	.bug-row span {
		display: grid;

		place-items: center;

		padding:
			7px 9px;

		border-right:
			1px solid
			var(--border-strong);

		background:
			transparent;

		color:
			var(--brand-gold);
	}


	.bug-row strong {
		padding:
			7px 10px;
	}


	/* =========================================================
	   RESPONSIVE
	   ========================================================= */

	@media (
		max-width: 1180px
	) {
		.roster-hero {
			grid-template-columns:
				1fr;
		}


		.roster-hero::after {
			display: none;
		}


		.control-stack {
			grid-template-columns:
				1fr
				1fr;
		}
	}


	@media (
		max-width: 980px
	) {
		.board-scroll {
			overflow-x: auto;
		}


		.roster-board {
			grid-template-columns:
				48px
				repeat(
					var(--team-count),
					minmax(
						118px,
						118px
					)
				);

			width: max-content;

			min-width:
				calc(
					48px +
					(var(--team-count) * 118px)
				);
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
			font-size: .72rem;
		}


		.team-head small {
			font-size: .56rem;
		}


		.player-cell {
			grid-template-columns:
				26px
				minmax(0,1fr);

			padding:
				7px 6px 7px 8px;
		}


		.player-cell img,
		.player-avatar {
			width: 26px;

			height: 26px;
		}


		.player-cell strong {
			font-size: .64rem;
		}


		.player-cell small {
			font-size: .52rem;
		}


		.board-topper {
			grid-template-columns:
				1fr;

			align-items: start;
		}


		.board-status,
		.board-key {
			justify-content:
				flex-start;
		}
	}


	@media (
		max-width: 720px
	) {
		.roster-hero {
			padding: 18px;
		}


		.control-stack {
			grid-template-columns:
				1fr;
		}


		.week-head {
			display: grid;
		}


		.week-head > span {
			text-align: left;
		}
	}
</style>