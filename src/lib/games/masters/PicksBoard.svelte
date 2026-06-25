<script>
  import { resolve } from '$app/paths';
  import { eventDisplay } from '$lib/events/displayNames';
  import { MASTERS_STAGE_LABELS, MASTERS_STAGE_POINTS } from '$lib/scoring/masters.js';

  export let data;

  const { event, locked, results, entries = [], leaderboardRows = [], optionsMode = '', optionsNote = '', liveMode = '', liveNote = '' } = data;

  const names = eventDisplay(event);
  const resultsPayload = results?.payload || {};

  function asStr(v) {
    return v == null ? '' : String(v).trim();
  }

  function posRank(pos) {
    const s = asStr(pos).toUpperCase();
    if (!s) return 9996;
    const cleaned = s.replace(/^T/, '');
    const n = Number.parseInt(cleaned, 10);
    if (Number.isFinite(n)) return n;
    if (s === 'CUT') return 9997;
    if (s === 'WD') return 9998;
    if (s === 'DQ') return 9999;
    return 9996;
  }

  function prettyLock(ts) {
    if (!ts) return '';
    return new Date(Number(ts) * 1000).toLocaleString();
  }

  function stageLabel(stage) {
    return MASTERS_STAGE_LABELS[stage] || stage || 'Round 1';
  }

  function stagePoints(stage) {
    return MASTERS_STAGE_POINTS[stage] ?? 0;
  }

  function golferNameFromEntry(entry) {
    return (
      entry?.pickDisplay?.name ||
      entry?.payload?.golferSnapshot?.name ||
      entry?.payload?.golferId ||
      '—'
    );
  }

  function golferIdFromEntry(entry) {
    return asStr(entry?.payload?.golferId);
  }

  $: leaderboardById = new Map((leaderboardRows || []).map((row) => [String(row.id), row]));

  $: enrichedEntries = (entries || []).map((entry) => {
    const golferId = golferIdFromEntry(entry);
    const live = leaderboardById.get(golferId) || null;
    const lockStage = asStr(entry?.payload?.lockStage) || 'pre_r1';

    return {
      ...entry,
      golferId,
      golferName: golferNameFromEntry(entry),
      lockStage,
      stageLabel: stageLabel(lockStage),
      stagePoints: stagePoints(lockStage),
      live
    };
  });

  $: pickGroups = [...enrichedEntries.reduce((map, entry) => {
    const golferId = entry.golferId || `unknown:${entry.golferName}`;
    const current = map.get(golferId) || {
      id: golferId,
      name: entry.golferName,
      live: entry.live,
      owners: [],
      count: 0,
      bestStagePoints: entry.stagePoints
    };

    current.owners = [...current.owners, entry.display_name];
    current.count += 1;
    current.bestStagePoints = Math.max(current.bestStagePoints || 0, entry.stagePoints || 0);
    if (!current.live && entry.live) current.live = entry.live;

    map.set(golferId, current);
    return map;
  }, new Map()).values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const posDelta = posRank(a?.live?.position) - posRank(b?.live?.position);
    if (posDelta !== 0) return posDelta;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });

  $: pickedLeaderboardRows = pickGroups
    .filter((row) => row.live)
    .map((row) => ({ ...row, ...row.live }))
    .sort((a, b) => posRank(a?.position) - posRank(b?.position) || b.count - a.count || String(a?.name || '').localeCompare(String(b?.name || '')));

  $: mostPicked = pickGroups[0] || null;
  $: currentLeader = pickedLeaderboardRows[0] || null;
  $: loneWolf = pickGroups.find((row) => row.count === 1) || null;
  $: winningSweat = pickedLeaderboardRows.slice().sort((a, b) => b.count - a.count || posRank(a?.position) - posRank(b?.position))[0] || null;

  $: liveWinnerSnapshot = resultsPayload?.winnerSnapshot || null;
  $: publishedWinnerName = liveWinnerSnapshot?.name || null;
</script>

<div class="page-wide">
  <div class="warroom card card--glow">
    <div class="warroom__top">
      <div class="warroom__titlewrap">
        <div class="kicker">Tournament War Room</div>

        <div class="warroom__titleline">
          {#if names.logo}
            <img class="warroom__logo" src={names.logo} alt={`${names.title} logo`} loading="lazy" />
          {/if}
          <h1 class="warroom__title">{names.title} War Room</h1>
        </div>

        <div class="warroom__subtitle">
          Ownership, loyalty stage, and live Masters sweat in one place.
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
      <span class="pill">Current stage: {stageLabel(resultsPayload?.stage || 'pre_r1')}</span>
      {#if publishedWinnerName}
        <span class="pill pill--gold">Published winner: {publishedWinnerName}</span>
      {/if}
    </div>

    {#if optionsMode || liveMode}
      <div class="debugline muted">
        Field: {optionsMode || '—'}{#if optionsNote} · {optionsNote}{/if}
        {#if liveMode}
          <span> · Live board: {liveMode}{#if liveNote} · {liveNote}{/if}</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<div class="page-wide">
  {#if !locked}
    <div class="card notice">
      <div class="section-head">
        <h2 class="h2">War room is loaded but waiting for lock</h2>
        <span class="pill">Waiting for lock</span>
      </div>

      <p class="subtle" style="margin-top: 8px;">
        Once the event locks, this becomes the league-wide Masters ownership board.
      </p>
    </div>
  {:else if !enrichedEntries.length}
    <div class="card notice">
      <div class="section-head">
        <h2 class="h2">No entries yet</h2>
        <span class="pill">Empty board</span>
      </div>

      <p class="subtle" style="margin-top: 8px;">
        Nobody has locked a Masters pick yet.
      </p>
    </div>
  {:else}
    <section class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Most picked</div>
        <div class="stat-value">{mostPicked?.name || '—'}</div>
        <div class="stat-sub">{mostPicked ? `${mostPicked.count} entries` : '—'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Current best-owned golfer</div>
        <div class="stat-value">{currentLeader?.name || '—'}</div>
        <div class="stat-sub">
          {#if currentLeader}
            {currentLeader.position || '—'} • {currentLeader.toPar || currentLeader.status || currentLeader.teeTime || 'No live status'}
          {:else}
            Waiting for live board
          {/if}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Single-bullet sweat</div>
        <div class="stat-value">{loneWolf?.name || '—'}</div>
        <div class="stat-sub">{loneWolf ? loneWolf.owners.join(', ') : 'No solo pick yet'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Biggest shared sweat</div>
        <div class="stat-value">{winningSweat?.name || '—'}</div>
        <div class="stat-sub">
          {#if winningSweat}
            {winningSweat.count} entries{#if winningSweat.position} • {winningSweat.position}{/if}
          {:else}
            Waiting for leaderboard
          {/if}
        </div>
      </div>
    </section>

    <section class="warroom-grid">
      <div class="card panel-card">
        <div class="section-head">
          <h2 class="h2">Picked golfers live board</h2>
          <span class="pill">{pickedLeaderboardRows.length} tracked</span>
        </div>

        {#if pickedLeaderboardRows.length}
          <div class="table-wrap" style="margin-top: 12px;">
            <table class="board-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Golfer</th>
                  <th>To Par</th>
                  <th>Thru</th>
                  <th>Owners</th>
                </tr>
              </thead>
              <tbody>
                {#each pickedLeaderboardRows as row (row.id)}
                  <tr>
                    <td>{row.position || '—'}</td>
                    <td>
                      <div class="row-main">{row.name}</div>
                      <div class="row-sub">{row.status || row.teeTime || row.country || ''}</div>
                    </td>
                    <td>{row.toPar || '—'}</td>
                    <td>{row.thru || '—'}</td>
                    <td>{row.count}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="muted" style="margin-top: 12px;">
            No live player rows yet. That usually means ESPN has not exposed the tournament board yet.
          </div>
        {/if}
      </div>

      <div class="card panel-card">
        <div class="section-head">
          <h2 class="h2">Ownership board</h2>
          <span class="pill">{pickGroups.length} golfers</span>
        </div>

        <div class="ownership-list">
          {#each pickGroups as row (row.id)}
            <div class="ownership-item">
              <div>
                <div class="ownership-name">{row.name}</div>
                <div class="ownership-meta">
                  {#if row.live?.position}
                    {row.live.position} • {row.live.toPar || row.live.status || row.live.teeTime || 'Live'}
                  {:else}
                    {row.live?.status || row.live?.teeTime || 'No live status yet'}
                  {/if}
                </div>
              </div>

              <div class="ownership-right">
                <span class="pill pill--gold">{row.count}</span>
              </div>

              <div class="owner-chips">
                {#each row.owners as owner}
                  <span class="chip">{owner}</span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section class="entry-section card">
      <div class="section-head">
        <h2 class="h2">Entry tracker</h2>
        <span class="pill">Loyalty stages live here</span>
      </div>

      <div class="entry-grid">
        {#each enrichedEntries as entry (entry.user_id)}
          <div class="entry-card">
            <div class="entry-head">
              <div class="entry-name">{entry.display_name}</div>
              <span class="pill">{entry?.score?.score_total ?? 0} pts</span>
            </div>

            <div class="chips" style="margin-top: 10px;">
              <span class="chip chip--badge">
                <span class="k">Pick</span>
                <span class="v">{entry.golferName}</span>
              </span>
              <span class="chip">
                <span class="k">Stage</span>
                <span class="v">{entry.stageLabel}</span>
              </span>
              <span class="chip">
                <span class="k">Worth</span>
                <span class="v">{entry.stagePoints}</span>
              </span>
              <span class="chip">
                <span class="k">Live</span>
                <span class="v">
                  {#if entry.live}
                    {entry.live.position || '—'} {entry.live.toPar || entry.live.status || ''}
                  {:else}
                    Waiting
                  {/if}
                </span>
              </span>
            </div>

            <div class="muted entry-meta">
              Updated: {new Date(Number(entry.updated_at || entry.submitted_at || 0) * 1000).toLocaleString()}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .page-wide {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }

  .warroom {
    margin-bottom: 16px;
  }

  .warroom__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    flex-wrap: wrap;
  }

  .warroom__titlewrap {
    display: grid;
    gap: 6px;
  }

  .warroom__titleline {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .warroom__logo {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.24);
  }

  .warroom__title {
    margin: 0;
    font-size: clamp(1.6rem, 2vw, 2.4rem);
  }

  .warroom__subtitle {
    opacity: 0.8;
  }

  .warroom__actions,
  .warroom__meta,
  .section-head,
  .chips,
  .owner-chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .warroom__meta {
    margin-top: 14px;
  }

  .debugline {
    margin-top: 12px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .stat-card,
  .panel-card,
  .entry-card,
  .ownership-item {
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    border-radius: 18px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-label {
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  .stat-value {
    margin-top: 8px;
    font-size: 1.2rem;
    font-weight: 900;
  }

  .stat-sub {
    margin-top: 6px;
    opacity: 0.76;
  }

  .warroom-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .panel-card,
  .entry-section {
    padding: 14px;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .board-table {
    width: 100%;
    border-collapse: collapse;
  }

  .board-table th,
  .board-table td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    vertical-align: top;
  }

  .row-main,
  .ownership-name,
  .entry-name {
    font-weight: 900;
  }

  .row-sub,
  .ownership-meta,
  .entry-meta {
    font-size: 0.86rem;
    opacity: 0.72;
    margin-top: 4px;
  }

  .ownership-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .ownership-item {
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .ownership-right {
    justify-self: end;
  }

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 14px;
    margin-top: 12px;
  }

  .entry-card {
    padding: 12px;
  }

  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
  }

  .chip--badge {
    border-color: rgba(255,210,120,0.22);
    background: rgba(255,210,120,0.06);
  }

  .k {
    opacity: 0.72;
    font-size: 0.82rem;
  }

  .v {
    font-weight: 900;
  }

  @media (max-width: 1100px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .warroom-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .page-wide {
      padding: 0 14px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
