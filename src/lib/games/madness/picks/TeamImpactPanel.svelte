<script>
  export let teamImpact = null;
  export let teamName = (team) => team?.name || team?.abbr || 'Team';

  const shortRound = (label) => {
    const map = {
      'Round of 32': 'R32',
      'Sweet 16': 'S16',
      'Elite 8': 'E8',
      'Final Four': 'F4',
      Championship: 'Title',
      Champion: 'Champ'
    };
    return map[label] || label;
  };
</script>

{#if teamImpact}
  <div class="impact-panel">
    <div class="impact-head">
      <div class="impact-teamline">
        {#if teamImpact.team?.logoUrl}
          <img class="impact-logo" src={teamImpact.team.logoUrl} alt="" />
        {/if}
        <div class="impact-meta">
          <div class="impact-title">
            {#if Number.isFinite(teamImpact.seed)}
              <span class="seed-tag">{teamImpact.seed}</span>
            {/if}
            <span class="impact-name">{teamName(teamImpact.team)}</span>
          </div>
          <div class="impact-sub">
            {teamImpact.count} owner{teamImpact.count === 1 ? '' : 's'} • {teamImpact.stage}
          </div>
        </div>
      </div>

      <span class={teamImpact.status === 'eliminated' ? 'pill pill--red' : 'pill pill--green'}>
        {teamImpact.status === 'eliminated' ? 'Out' : teamImpact.status === 'champion' ? 'Champion' : 'Alive'}
      </span>
    </div>

    <div class="impact-storygrid">
      <div class="impact-storycard">
        <div class="impact-label">If they win</div>
        <div class="impact-copy">{teamImpact.impactIfWin}</div>
      </div>

      <div class="impact-storycard impact-storycard--danger">
        <div class="impact-label">If they lose</div>
        <div class="impact-copy">{teamImpact.impactIfLose}</div>
      </div>
    </div>

    <div class="impact-section">
      <div class="impact-label impact-label--section">Ownership path</div>
      <div class="impact-rounds">
        {#each teamImpact.ownershipByRound as row (row.key)}
          <div class="impact-roundcard">
            <div class="impact-roundtop">{shortRound(row.label)}</div>
            <div class="impact-roundvalue">{row.count}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="impact-section">
      <div class="impact-label impact-label--section">Affected entries</div>
      {#if teamImpact.affectedEntries?.length}
        <div class="impact-ownerlist">
          {#each teamImpact.affectedEntries as owner (owner.user_id)}
            <div class="impact-ownerrow">
              <div class="impact-ownername">{owner.display_name}</div>
              <div class="impact-ownerstats">{owner.swing} live • {owner.maxLeft} ceiling</div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="impact-copy impact-copy--muted">No owned entries tied to this team.</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .impact-panel {
    display: grid;
    gap: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    border-radius: 18px;
    padding: 14px;
    min-width: 0;
  }

  .impact-head,
  .impact-teamline {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .impact-head {
    justify-content: space-between;
  }

  .impact-meta {
    min-width: 0;
  }

  .impact-logo {
    width: 30px;
    height: 30px;
    object-fit: contain;
    border-radius: 8px;
    flex: 0 0 auto;
  }

  .impact-title {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-weight: 900;
    line-height: 1.1;
  }

  .impact-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .impact-sub,
  .impact-copy,
  .impact-ownerstats {
    opacity: 0.8;
    font-size: 0.95rem;
    line-height: 1.35;
  }

  .impact-storygrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .impact-storycard,
  .impact-roundcard,
  .impact-ownerrow {
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.16);
    border-radius: 12px;
  }

  .impact-storycard {
    padding: 10px 12px;
    min-width: 0;
  }

  .impact-storycard--danger {
    border-color: rgba(191, 78, 78, 0.24);
    background: rgba(191, 78, 78, 0.08);
  }

  .impact-label {
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.66;
    margin-bottom: 6px;
  }

  .impact-label--section {
    margin-bottom: 8px;
  }

  .impact-section {
    min-width: 0;
  }

  .impact-rounds {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .impact-roundcard {
    padding: 9px 10px;
    display: grid;
    gap: 4px;
    min-height: 0;
  }

  .impact-roundtop {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.68;
    overflow-wrap: anywhere;
  }

  .impact-roundvalue {
    font-size: 1.15rem;
    font-weight: 900;
    line-height: 1;
  }

  .impact-ownerlist {
    display: grid;
    gap: 8px;
  }

  .impact-ownerrow {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    min-width: 0;
  }

  .impact-ownername {
    font-weight: 900;
    line-height: 1.1;
    min-width: 0;
  }

  .impact-ownerstats {
    font-size: 0.92rem;
    text-align: right;
    white-space: nowrap;
  }

  .impact-copy--muted {
    opacity: 0.72;
  }

  .seed-tag {
    display: inline-flex;
    min-width: 20px;
    justify-content: center;
    padding: 2px 6px;
    border-radius: 999px;
    border: 1px solid rgba(214,177,94,0.28);
    background: rgba(214,177,94,0.10);
    font-size: 0.78rem;
    font-weight: 900;
    flex: 0 0 auto;
  }

  @media (max-width: 900px) {
    .impact-storygrid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .impact-rounds {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .impact-ownerrow {
      display: grid;
      gap: 4px;
    }

    .impact-ownerstats {
      text-align: left;
      white-space: normal;
    }
  }
</style>