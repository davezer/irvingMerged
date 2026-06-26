<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  let draft;
  let archive;

  $: draft = data?.draft;
  $: archive = data?.archive || [];

  const money = (value) => Number(value || 0).toFixed(0);
  const money2 = (value) => Number(value || 0).toFixed(2);
  const pct = (value) => `${Number(value || 0).toFixed(1)}%`;

  $: teamBoards = draft?.teamBoards || [];
  $: maxRosterRows = Math.max(0, ...teamBoards.map((team) => team.allPicks?.length || team.picks?.length || 0));
  $: draftRows = Array.from({ length: maxRosterRows }, (_, index) => index);
  $: topBuys = draft?.topPicks?.slice(0, 10) || [];
  $: hasPickRows = Boolean(draft && teamBoards.length && maxRosterRows);
  

  $: positionEconomy = draft?.positionEconomy || [];
  $: priceBands = draft?.priceBands || [];
  

  function amountClass(amount) {
    const value = Number(amount || 0);
    if (value >= 50) return 'pick-elite';
    if (value >= 40) return 'pick-premium';
    if (value >= 25) return 'pick-core';
    if (value >= 10) return 'pick-mid';
    return 'pick-cheap';
  }

  function playerLine(pick) {
    const pos = pick?.player?.position || 'FLEX';
    const team = pick?.player?.teamLabel || pick?.player?.team || 'FA';
    return `${pos} · ${team}`;
  }

  function playerPhoto(pick) {
    return pick?.player?.photoUrl || '/managers/question.jpg';
  }
</script>

<div class="page-stack draft-page">
  <LeagueSubnav season={data.season || new Date().getFullYear()} active="drafts" />

  <section class="draft-hero bug-panel">
    <div class="bug-titlebar">
      <span class="bug-network">ICN</span>
      <strong>Draft Center</strong>
      <em>{draft?.status || 'Archive'}</em>
    </div>

    <div class="draft-hero-main">
      <div>
        <div class="eyebrow">Previous drafts</div>
        <h1>{data.season} Auction Board</h1>
      </div>

      <div class="season-box">
        <span>Season feed</span>
        <div class="season-pills">
          {#each archive as item}
            <a class:selected={item.season === data.season} href={`?season=${item.season}`}>{item.season}</a>
          {/each}
        </div>
      </div>
    </div>
  </section>

  {#if !draft}
    <section class="card empty-state">
      <h2>No draft data available</h2>
      <p>We could not pull a Sleeper draft for this season.</p>
    </section>
  {:else}
    <section class="draft-board-card board-full-bleed">
      <div class="board-head">
        <div>
          <div class="eyebrow">Sleeper auction archive</div>
          <h2>{data.season} Draft board</h2>
        </div>
        <div class="board-key" aria-label="Bid color key">
          <span class="key elite">$50+</span>
          <span class="key premium">$40–$49</span>
          <span class="key core">$25–$39</span>
          <span class="key mid">$10–$24</span>
          <span class="key cheap">Under $10</span>
        </div>
      </div>

      {#if hasPickRows}
        <div class="draft-board-shell" style={`--team-count:${teamBoards.length || 1}`}>
          <div class="draft-board">
            {#each teamBoards as team (team.teamName)}
              <a class="draft-team-head" href={team.managerSlug ? `/league/teams/${team.managerSlug}?season=${data.season}` : `/league/teams?season=${data.season}`}>
                <div class="team-logo">
                  {#if team.teamPhoto}
                    <img src={team.teamPhoto} alt={team.teamName} />
                  {:else}
                    <span>{team.teamName.slice(0, 2)}</span>
                  {/if}
                </div>
                <strong>{team.teamName}</strong>
                <small>{team.managerName}</small>
              </a>
            {/each}

            {#each draftRows as rowIndex}
              {#each teamBoards as team (team.teamName + '-' + rowIndex)}
                {@const pick = team.allPicks?.[rowIndex]}
                {#if pick}
                  <article class={`draft-pick ${amountClass(pick.amount)}`}>
                    <div class="price">${money(pick.amount)}</div>
                    <img src={playerPhoto(pick)} alt={pick.player?.name || 'Player'} />
                    <strong>{pick.player?.name || 'Unknown Player'}</strong>
                    <small>{playerLine(pick)}</small>
                  </article>
                {:else}
                  <div class="draft-empty" aria-hidden="true"></div>
                {/if}
              {/each}
            {/each}
          </div>
        </div>
      {:else}
        <div class="no-board">
          <strong>No picks have landed for {data.season} yet.</strong>
          <p>Flip to a completed season above to see the full throwback auction board.</p>
        </div>
      {/if}
    </section>

    <section class="grid two-up">
      <article class="card studio-card">
        <div class="section-head">
          <div>
            <div class="eyebrow">Draft desk</div>
            <h3>Most expensive buys</h3>
          </div>
          <span>{data.season}</span>
        </div>
        <div class="stack picks compact-list">
          {#each topBuys as pick, index (pick.id)}
            <div class="pick-row">
              <b>#{index + 1}</b>
              <img src={playerPhoto(pick)} alt={pick.player?.name || 'Player'} />
              <div>
                <strong>{pick.player?.name}</strong>
                <small>{pick.teamName} • Round {pick.round}</small>
              </div>
              <span>${money(pick.amount)}</span>
            </div>
          {/each}
          {#if !topBuys.length}<div class="empty">No expensive buys yet.</div>{/if}
        </div>
      </article>

      <article class="card studio-card">
        <div class="section-head">
          <div>
            <div class="eyebrow">Market share</div>
            <h3>Position economy</h3>
          </div>
          <span>Avg bid</span>
        </div>
        <div class="position-table">
          {#each positionEconomy as row (row.position)}
            <div>
              <strong>{row.position}</strong>
              <span>{row.picks} picks</span>
              <span>${money(row.spend)}</span>
              <b>${money2(row.averageSpend)}</b>
            </div>
          {/each}
          {#if !positionEconomy.length}<div class="empty">No position economy data yet.</div>{/if}
        </div>
      </article>
    </section>

    <section class="card studio-card">
      <div class="section-head">
        <div>
          <div class="eyebrow">Room spending</div>
          <h3>Bid bands</h3>
        </div>
        <span>How the room spent its money</span>
      </div>
      <div class="bands-grid">
        {#each priceBands as band (band.label)}
          <div class="band-card">
            <strong>{band.label}</strong>
            <span>{band.picks} picks</span>
            <b>${money(band.spend)}</b>
          </div>
        {/each}
      </div>
    </section>

    <section class="grid two-up">
      

      
    </section>

   
   
   
  {/if}
</div>

<style>
  .page-stack {
    display: grid;
    gap: 22px;
    max-width: 1480px;
    margin: 0 auto;
  }

  .draft-hero,
  .draft-board-card,
  .card {
    border: 2px solid #060707;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.03) 18%, rgba(0, 0, 0, 0.16)),
      linear-gradient(180deg, var(--bug-gray), var(--bug-charcoal) 48%, var(--bug-black));
    box-shadow: var(--shadow-panel);
  }

  .draft-hero,
  .draft-board-card,
  .card {
    border-radius: 18px;
    overflow: hidden;
  }

  .bug-titlebar {
    display: flex;
    align-items: center;
    min-height: 42px;
    background: linear-gradient(180deg, #1d2322, #070808);
    border-bottom: 2px solid #000;
  }

  .bug-titlebar strong {
    flex: 1;
    padding: 0 14px;
    color: var(--bug-yellow);
    font-family: var(--font-score);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    text-shadow: 0 2px 0 #000;
  }

  .bug-titlebar em,
  .bug-network {
    align-self: stretch;
    display: inline-grid;
    place-items: center;
    min-width: 72px;
    padding: 0 14px;
    color: #fff;
    background: linear-gradient(180deg, #e21d36, #a3081c);
    border-right: 2px solid #050505;
    font-family: var(--font-score);
    font-style: normal;
    text-transform: uppercase;
    text-shadow: 0 2px 0 #000;
  }

  .bug-titlebar em {
    border-right: 0;
    border-left: 2px solid #050505;
  }

  .draft-hero-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 24px;
    padding: 28px 30px 30px;
    align-items: end;
    background:
      linear-gradient(90deg, rgba(199, 25, 47, 0.19), transparent 26%),
      linear-gradient(180deg, rgba(255,255,255,0.08), transparent 30%);
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
  h2,
  h3 {
    margin: 0;
    text-shadow: 0 2px 0 #000;
  }

  h1 {
    margin-top: 9px;
    font-family: var(--font-display);
    font-size: clamp(2.3rem, 6vw, 5.2rem);
    line-height: 0.9;
    letter-spacing: -0.065em;
  }

  h2 { font-size: 1.65rem; }
  h3 { font-size: 1.22rem; }

  p {
    max-width: 76ch;
    margin: 14px 0 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .season-box {
    display: grid;
    gap: 10px;
    min-width: 260px;
    padding: 14px;
    border: 2px solid #111;
    background: linear-gradient(180deg, #d9d9cf, #777d78 48%, #222826);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.55);
  }

  .season-box > span {
    color: #111;
    font-family: var(--font-score);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    text-shadow: 0 1px 0 rgba(255,255,255,0.35);
  }

  .season-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .season-pills a {
    padding: 8px 13px;
    border: 2px solid #070808;
    border-radius: 6px;
    background: linear-gradient(180deg, #f4f2e6, #a8aaa4 48%, #454b49);
    color: #101111;
    font-family: var(--font-score);
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255,255,255,0.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(0,0,0,0.34);
  }

  .season-pills a.selected {
    color: #fff;
    background: linear-gradient(180deg, #e31e36, #9d0719);
    text-shadow: 0 2px 0 #000;
  }

  /* Full-width board: desktop gets the old-site "everything visible" treatment. */
  /* .board-full-bleed {
    width: calc(100vw - 32px);
    max-width: none;
    margin-left: 50%;
    transform: translateX(-50%);
    overflow: hidden;
  } */

  .draft-board-card {
    padding: 0;
  }

  .board-head,
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .board-head {
    padding: 18px 20px;
    border-bottom: 2px solid #060707;
    background: linear-gradient(180deg, #5d6561, #242a29 50%, #101313);
  }

  .board-key {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
    max-width: 520px;
  }

  .key {
    display: inline-flex;
    min-height: 24px;
    align-items: center;
    padding: 4px 8px;
    border: 1px solid rgba(0,0,0,0.55);
    color: #080909 !important;
    font-family: var(--font-score);
    font-size: 0.67rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-shadow: none;
  }

  .key.elite { background: #70c8bd; }
  .key.premium { background: #f47ca7; }
  .key.core { background: #a9cff2; }
  .key.mid { background: #ffd5a8; }
  .key.cheap { background: #cfd4cc; }

 .draft-board-shell {
  width: 100%;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,0.12);
  background:
    linear-gradient(90deg, rgba(0,0,0,0.18), transparent 18%, transparent 82%, rgba(0,0,0,0.18)),
    #1b211f;
}
  .draft-board {
  display: grid;
  grid-template-columns: repeat(var(--team-count), minmax(0, 1fr));
  align-items: stretch;
  width: 100%;
  min-width: 0;
}

.draft-board > * {
  min-width: 0;
}

  .draft-team-head {
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 0;
  min-height: 108px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 5px;
  padding: 9px 5px;
  color: var(--bug-white);
  text-decoration: none;
  text-align: center;
  background: linear-gradient(180deg, #2a302f, #101313);
  border-right: 1px solid #050505;
  border-bottom: 2px solid #050505;
}

.draft-team-head:hover {
  color: var(--bug-yellow);
  background: linear-gradient(180deg, #454c49, #141717);
}

.team-logo {
  width: clamp(34px, 3.2vw, 44px);
  height: clamp(34px, 3.2vw, 44px);
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: #eee8d7;
  border: 2px solid #0a0a0a;
  box-shadow: 0 2px 0 rgba(255,255,255,0.18), 0 5px 12px rgba(0,0,0,0.42);
  color: #111;
  font-family: var(--font-score);
  font-size: 0.72rem;
}

.team-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.draft-team-head strong {
  display: block;
  max-width: 100%;
  font-size: clamp(0.54rem, 0.72vw, 0.76rem);
  line-height: 1.05;
  text-shadow: 0 2px 0 #000;
  overflow-wrap: anywhere;
}

.draft-team-head small {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(0.48rem, 0.62vw, 0.66rem);
}

.draft-pick,
.draft-empty {
  min-width: 0;
  min-height: 78px;
  border-right: 1px solid rgba(0,0,0,0.42);
  border-bottom: 1px solid rgba(0,0,0,0.42);
}

.draft-pick {
  position: relative;
  display: grid;
  grid-template-columns: clamp(18px, 1.8vw, 26px) minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  gap: 2px 5px;
  align-content: start;
  padding: 6px 5px;
  color: #06100f;
  text-shadow: 0 1px 0 rgba(255,255,255,0.35);
}

.draft-pick img {
  grid-row: 2 / 4;
  width: clamp(18px, 1.8vw, 26px);
  height: clamp(18px, 1.8vw, 26px);
  place-self: start center;
  object-fit: contain;
  filter: drop-shadow(0 2px 1px rgba(0,0,0,0.28));
}

.draft-pick .price {
  grid-column: 1 / -1;
  font-family: var(--font-score);
  font-size: clamp(0.55rem, 0.68vw, 0.72rem);
  font-style: italic;
  color: #08100f;
}

.draft-pick strong {
  min-width: 0;
  align-self: end;
  font-size: clamp(0.48rem, 0.62vw, 0.66rem);
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.draft-pick small {
  min-width: 0;
  color: rgba(0,0,0,0.72) !important;
  font-size: clamp(0.43rem, 0.54vw, 0.57rem);
  line-height: 1.05;
  font-weight: 800;
  overflow-wrap: anywhere;
}

@media (max-width: 980px) {
  .draft-board-shell {
    overflow-x: auto;
  }

  .draft-board {
    min-width: 1180px;
    grid-template-columns: repeat(var(--team-count), minmax(84px, 1fr));
  }
}
  .draft-pick,
  .draft-empty {
    min-width: 0;
    min-height: 76px;
    border-right: 1px solid rgba(0,0,0,0.42);
    border-bottom: 1px solid rgba(0,0,0,0.42);
  }

  .draft-pick {
    display: grid;
    grid-template-columns: clamp(18px, 1.6vw, 26px) minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    gap: 2px 5px;
    align-content: start;
    padding: 6px 5px;
    color: #06100f;
    text-shadow: 0 1px 0 rgba(255,255,255,0.35);
  }

  .draft-pick img {
    grid-row: 2 / 4;
    width: clamp(18px, 1.6vw, 26px);
    height: clamp(18px, 1.6vw, 26px);
    place-self: start center;
    object-fit: contain;
    filter: drop-shadow(0 2px 1px rgba(0,0,0,0.28));
  }

  .draft-pick .price {
    grid-column: 1 / -1;
    font-family: var(--font-score);
    font-size: clamp(0.58rem, 0.63vw, 0.72rem);
    font-style: italic;
    color: #08100f;
  }

  .draft-pick strong {
    align-self: end;
    min-width: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    font-size: clamp(0.52rem, 0.58vw, 0.68rem);
    line-height: 1.05;
  }

  .draft-pick small {
    min-width: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    color: rgba(0,0,0,0.72) !important;
    font-size: clamp(0.46rem, 0.5vw, 0.58rem);
    line-height: 1.05;
    font-weight: 800;
  }

  .pick-elite { background: #6dcac0; }
  .pick-premium { background: #f47aa6; }
  .pick-core { background: #a8cff5; }
  .pick-mid { background: #ffd3a1; }
  .pick-cheap { background: #cfd7cc; }
  .draft-empty { background: rgba(255,255,255,0.025); }

  .no-board,
  .empty,
  .empty-state {
    padding: 22px;
    color: var(--muted);
  }

  .grid.two-up,
  .team-grid,
  .bands-grid,
  .stack {
    display: grid;
    gap: 14px;
  }

  .grid.two-up { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .team-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bands-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; }
  .stack { margin-top: 14px; }

  .studio-card,
  .card {
    padding: 20px;
  }

  .section-head {
    margin-bottom: 10px;
  }

  .section-head span,
  small,
  .muted {
    color: var(--muted);
  }

  .section-head > span {
    font-family: var(--font-score);
    font-size: 0.67rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .picks .pick-row,
  .history-row,
  .trade-row,
  .position-table > div,
  .band-card,
  .team-card {
    border: 2px solid #0a0b0b;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 20%),
      linear-gradient(180deg, #343b39, #141716);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -2px 0 rgba(0,0,0,0.38);
  }

  .picks .pick-row {
    display: grid;
    grid-template-columns: auto 44px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border-radius: 10px;
  }

  .picks .pick-row > b {
    color: var(--bug-yellow);
    font-family: var(--font-score);
  }

  .pick-row img,
  .team-photo img {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    background: var(--bug-cream);
  }

  .pick-row span,
  .band-card b,
  .history-side span {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    text-shadow: 0 2px 0 #000;
  }

  .position-table {
    display: grid;
    gap: 10px;
    margin-top: 14px;
  }

  .position-table > div {
    display: grid;
    grid-template-columns: 70px 1fr auto auto;
    gap: 12px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
  }

  .band-card {
    display: grid;
    gap: 6px;
    padding: 14px;
    border-radius: 10px;
  }

  .team-card {
    display: grid;
    gap: 11px;
    padding: 15px;
    border-radius: 12px;
  }

  .team-head {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .team-photo {
    width: 48px;
    height: 48px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 50%;
    background: var(--bug-cream);
    color: #111;
    font-family: var(--font-score);
  }

  .team-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .team-metrics span {
    padding: 5px 8px;
    border-radius: 6px;
    color: #151515;
    background: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 0.72rem;
    text-shadow: none;
  }

  .history-row,
  .trade-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
  }

  .history-main,
  .history-side {
    display: grid;
    gap: 4px;
  }

  .history-side {
    text-align: right;
  }

  .trade-row span {
    color: var(--muted);
  }

  @media (max-width: 1100px) {
    .grid.two-up,
    .team-grid,
    .bands-grid {
      grid-template-columns: 1fr;
    }

    .draft-hero-main {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .board-full-bleed {
      width: 100%;
      margin-left: 0;
      transform: none;
    }

    .draft-board-shell {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .draft-board {
      min-width: 1180px;
      grid-template-columns: repeat(var(--team-count), minmax(84px, 1fr));
    }
  }

  @media (max-width: 640px) {
    .draft-hero-main,
    .studio-card,
    .card {
      padding: 16px;
    }

    .board-head,
    .section-head {
      display: grid;
    }

    .picks .pick-row,
    .position-table > div,
    .history-row,
    .trade-row {
      grid-template-columns: 1fr;
    }

    .history-side {
      text-align: left;
    }
  }
</style>
