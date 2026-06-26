<script>
  export let season;
  export let active = 'league';

  const seasonParam = season ? `?season=${season}` : '';

  const items = [
    { key: 'league', label: 'League', href: '/league' },
    { key: 'standings', label: 'Standings', href: `/league/standings${seasonParam}` },
    { key: 'teams', label: 'Teams', href: `/league/teams${seasonParam}` },
    { key: 'matchups', label: 'Matchups', href: `/league/matchups${seasonParam}` },
    { key: 'transactions', label: 'Transactions', href: `/league/transactions${seasonParam}` },
    { key: 'drafts', label: 'Drafts', href: `/league/drafts${seasonParam}` }
  ];
</script>

<nav class="subnav" aria-label="League navigation">
  <span class="network-bug">ICN</span>
  {#each items as item}
    <a class:active={active === item.key} href={item.href}>{item.label}</a>
  {/each}
  {#if season}<span class="season-chip">{season}</span>{/if}
</nav>

<style>
  .subnav {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    overflow: auto;
    padding: 7px;
    border: 2px solid #070808;
    border-radius: 8px;
    background: linear-gradient(180deg, #6a716e, #2d3331 46%, #0d0f0f);
    box-shadow: var(--shadow-bug);
  }

  .network-bug,
  .season-chip,
  .subnav a {
    min-height: 31px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #050606;
    border-radius: 4px;
    font-family: var(--font-score);
    font-size: 0.76rem;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -2px 0 rgba(0,0,0,0.45);
  }

  .network-bug {
    padding: 0 9px;
    color: #fff;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    letter-spacing: -0.03em;
  }

  .subnav a {
    padding: 0 11px;
    color: rgba(247,245,235,0.86);
    background: linear-gradient(180deg, #4f5754, #202625 55%, #0b0d0d);
  }

  .subnav a:hover {
    color: #fff;
    background: linear-gradient(180deg, #7c8581, #353c3a 55%, #121515);
  }

  .subnav a.active {
    color: #111;
    background: linear-gradient(180deg, #fffdf3, #cfd1c9 52%, #8a918c);
  }

  .season-chip {
    margin-left: auto;
    padding: 0 10px;
    color: #111;
    background: linear-gradient(180deg, var(--bug-yellow), #d99a21);
  }

  @media (max-width: 680px) {
    .season-chip { margin-left: 0; }
  }
</style>
