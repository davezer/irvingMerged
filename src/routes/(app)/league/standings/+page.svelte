<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';

  export let data;

  const standings = data.standings || [];

  const fmt = (value, digits = 2) => Number(value || 0).toFixed(digits);
  const pct = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

  $: season = data.season || new Date().getFullYear();
  $: topSeed = data.pulse?.topSeed || standings[0] || null;
  $: averagePoints = data.pulse?.averagePoints || 0;
  $: hottest = data.pulse?.hottest || null;
  $: teamCount = standings.length;

  function teamHref(row) {
    return row.slug ? `/league/teams/${row.slug}?season=${season}` : `/league/teams?season=${season}`;
  }

  function trendClass(row) {
    const diff = Number(row.pointDiff || 0);
    if (diff > 0) return 'good';
    if (diff < 0) return 'bad';
    return 'even';
  }
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="standings" />

  <section class="studio-header">
    <div class="header-bug">
      <span class="network">ICN</span>
      <span>Studio Standings</span>
    </div>

    <div class="header-copy">
      <div class="eyebrow">Live League Table</div>
      <h1>Standings Desk</h1>
      
    </div>

    <div class="score-meta">
      <span>Season</span>
      <strong>{season}</strong>
    </div>
  </section>

  <div class="season-pills" aria-label="Season selector">
    {#each data.seasons || [] as option}
      <a class:selected={option === season} href={`?season=${option}`}>{option}</a>
    {/each}
  </div>

  {#if !data.hasData}
    <section class="studio-card empty-state">
      <div class="bug-row"><span>ICN</span><strong>No Signal</strong></div>
      <h2>No standings data yet</h2>
      <p>We could not pull Sleeper standings for this season.</p>
    </section>
  {:else}
    <!-- <section class="studio-strip" aria-label="Standings summary">
      

      <article>
        <span>Best point diff</span>
        <strong>{hottest?.teamName || '—'}</strong>
        <small>{hottest ? `${fmt(hottest.pointDiff)} diff` : 'No data yet'}</small>
      </article>

      <article>
        <span>Teams on board</span>
        <strong>{teamCount}</strong>
        <small>Full franchise field</small>
      </article>
    </section> -->

    <section class="standings-board" aria-label="Full league standings">
      <div class="board-topper">
        <div class="bug-row"><span>ICN</span><strong>FantasyCast Standings</strong></div>
        <!-- <div class="board-note">Sleeper API + runtime cache</div> -->
      </div>

      <div class="table-shell">
        <table>
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th class="team-col">Franchise</th>
              <th>Manager</th>
              <th>Record</th>
              <th>PF</th>
              <th>PA</th>
              <th>Diff</th>
              <th>Win %</th>
              <th>Back</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {#each standings as row}
              <tr class:leader={row.rank === 1}>
                <td class="rank-cell">#{row.rank}</td>
                <td class="team-cell">
                  <a class="team-inline" href={teamHref(row)}>
                    <span class="inline-photo">
                      {#if row.teamPhoto}
                        <img src={row.teamPhoto} alt={row.teamName} />
                      {:else}
                        <span>{row.initials}</span>
                      {/if}
                    </span>
                    <span class="team-copy">
                      <strong>{row.teamName}</strong>
                      <small>{row.branded ? 'Franchise feed' : 'Sleeper feed'}</small>
                    </span>
                  </a>
                </td>
                <td>{row.managerName}</td>
                <td><strong class="record-text">{row.recordLabel}</strong></td>
                <td class="num">{fmt(row.points)}</td>
                <td class="num">{fmt(row.pointsAgainst)}</td>
                <td class={`num diff ${trendClass(row)}`}>{fmt(row.pointDiff)}</td>
                <td class="num">{pct(row.pct)}</td>
                <td class="num">{fmt(row.pointsBehind)}</td>
                <td><span class="tier-chip">{row.tier}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}
</div>

<style>
  .page-stack {
    display: grid;
    gap: 18px;
  }

  .studio-header,
  .studio-card,
  .standings-board,
  .studio-strip article {
    border: 2px solid #070808;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.025) 18%, rgba(0, 0, 0, 0.18)),
      linear-gradient(180deg, var(--bug-gray), var(--bug-charcoal) 48%, var(--bug-black));
    box-shadow: var(--shadow-panel);
  }

  .studio-header {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 18px;
    align-items: stretch;
    overflow: hidden;
    border-radius: 18px;
  }

  .studio-header::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgba(199, 25, 47, 0.26), transparent 26%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 4px);
    opacity: .82;
  }

  .header-bug,
  .header-copy,
  .score-meta {
    position: relative;
    z-index: 1;
  }

  .header-bug {
    display: grid;
    grid-template-columns: 58px 1fr;
    align-self: start;
    min-width: 270px;
    border-right: 2px solid #070808;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #050606);
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: .15em;
    color: var(--bug-yellow);
  }

  .network,
  .bug-row span {
    display: grid;
    place-items: center;
    min-height: 42px;
    padding: 0 12px;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: #fff;
    border-right: 2px solid #070808;
    letter-spacing: 0;
  }

  .header-bug > span:last-child {
    display: flex;
    align-items: center;
    padding: 0 14px;
  }

  .header-copy {
    padding: 28px 0 30px;
  }

  .eyebrow {
    margin-bottom: 8px;
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 7vw, 6.2rem);
    line-height: .88;
    letter-spacing: -.065em;
  }

  .header-copy p {
    max-width: 68ch;
    margin: 12px 0 0;
    color: var(--bug-cream);
    line-height: 1.45;
    text-shadow: 0 2px 0 rgba(0,0,0,.78);
  }

  .score-meta {
    align-self: start;
    justify-self: end;
    min-width: 120px;
    margin: 18px 18px 0 0;
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #eeeeea, #aeb4af 48%, #5d6460);
    color: #080909;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.72), inset 0 -2px 0 rgba(0,0,0,.35);
    text-align: center;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .score-meta span {
    display: block;
    padding: 5px 8px 3px;
    background: linear-gradient(180deg, #2e3432, #090a0a);
    color: var(--bug-yellow);
    font-size: .62rem;
    letter-spacing: .14em;
  }

  .score-meta strong {
    display: block;
    padding: 8px 10px 9px;
    font-size: 1.05rem;
  }

  .season-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .season-pills a {
    border: 2px solid #070808;
    border-radius: 8px;
    padding: 8px 12px;
    background: linear-gradient(180deg, #6b726f, #252a29 50%, #101212);
    color: var(--bug-white);
    font-family: var(--font-score);
    font-size: .76rem;
    font-weight: 950;
    text-decoration: none;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -2px 0 rgba(0,0,0,.48);
  }

  .season-pills a.selected,
  .season-pills a:hover {
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: #fff;
  }

  .studio-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .studio-strip article {
    min-height: 104px;
    display: grid;
    align-content: space-between;
    gap: 12px;
    border-radius: 16px;
    padding: 14px 16px;
  }

  .studio-strip span,
  .board-note {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .66rem;
    font-weight: 950;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .studio-strip strong {
    display: block;
    color: var(--bug-white);
    font-family: var(--font-score);
    font-size: clamp(1.35rem, 3vw, 2.4rem);
    line-height: .92;
    text-shadow: 0 2px 0 #000;
  }

  .studio-strip small {
    color: var(--muted);
  }

  .standings-board {
    overflow: hidden;
    border-radius: 18px;
  }

  .board-topper {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 14px;
    border-bottom: 2px solid #070808;
    background: linear-gradient(180deg, #171a19, #050606);
  }

  .bug-row {
    display: inline-grid;
    grid-template-columns: 58px auto;
    align-items: stretch;
    color: var(--bug-yellow);
    font-family: var(--font-score);
    text-transform: uppercase;
    letter-spacing: .15em;
  }

  .bug-row strong {
    display: flex;
    align-items: center;
    padding: 0 14px;
    min-height: 42px;
  }

  .board-note {
    display: flex;
    align-items: center;
    padding: 0 16px;
    text-align: right;
  }

  .table-shell {
    overflow-x: auto;
    background:
      repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, rgba(255,255,255,.045), rgba(0,0,0,.12));
  }

  table {
    width: 100%;
    min-width: 1060px;
    border-collapse: separate;
    border-spacing: 0;
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 11px 12px;
    border-bottom: 1px solid rgba(247, 245, 235, 0.12);
    text-align: left;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 3;
    background: linear-gradient(180deg, #e8e8df, #9ca39e 52%, #555c59);
    color: #080909;
    border-bottom: 2px solid #070808;
    font-family: var(--font-score);
    font-size: .72rem;
    font-weight: 950;
    letter-spacing: .08em;
    text-transform: uppercase;
    text-shadow: 0 1px 0 rgba(255,255,255,.45);
  }

  tbody tr {
    background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015));
  }

  tbody tr:nth-child(even) {
    background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025));
  }

  tbody tr:hover,
  tbody tr.leader {
    background:
      linear-gradient(90deg, rgba(199,25,47,.22), transparent 38%),
      linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.025));
  }

  .rank-col,
  .rank-cell {
    width: 76px;
    text-align: center;
  }

  .rank-cell {
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: 1.05rem;
    text-shadow: 0 2px 0 #000;
  }

  .team-col {
    min-width: 270px;
  }

  .team-inline {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--bug-white);
    text-decoration: none;
  }

  .team-inline:hover strong {
    color: var(--bug-yellow);
  }

  .inline-photo {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 2px solid #070808;
    border-radius: 50%;
    background: #e8e2d4;
    color: #111;
    font-family: var(--font-score);
    font-size: .8rem;
    box-shadow: 0 1px 0 rgba(255,255,255,.28), 0 5px 10px rgba(0,0,0,.42);
  }

  .inline-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .team-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .team-copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 950;
  }

  .team-copy small {
    color: var(--muted);
    font-size: .76rem;
  }

  .record-text,
  .num {
    font-family: var(--font-score);
    text-shadow: 0 2px 0 #000;
  }

  .num {
    text-align: right;
    white-space: nowrap;
  }

  .diff.good { color: var(--success); }
  .diff.bad { color: #ff6464; }
  .diff.even { color: var(--bug-silver); }

  .tier-chip {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    max-width: 100%;
    padding: 7px 10px;
    border: 1px solid #070808;
    border-radius: 999px;
    background: linear-gradient(180deg, #504522, #221d0d);
    color: var(--bug-yellow);
    font-family: var(--font-score);
    font-size: .68rem;
    font-weight: 950;
    text-transform: uppercase;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.5);
  }

  .empty-state {
    display: grid;
    gap: 10px;
    padding: 24px;
    border-radius: 18px;
  }

  .empty-state h2,
  .empty-state p {
    margin: 0;
  }

  @media (max-width: 960px) {
    .studio-header {
      grid-template-columns: 1fr;
    }

    .header-bug {
      width: 100%;
      min-width: 0;
      border-right: 0;
    }

    .header-copy {
      padding: 4px 18px 24px;
    }

    .score-meta {
      justify-self: start;
      margin: 0 18px 18px;
    }

    .studio-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .studio-strip {
      grid-template-columns: 1fr;
    }

    .board-topper {
      display: grid;
    }

    .board-note {
      padding: 0 14px 12px;
      text-align: left;
    }
  }
</style>
