<script>
  export let season;
  export let active = 'league';

  const items = [
    { key: 'league', label: 'League', href: '/league' },
    { key: 'standings', label: 'Standings', href: `/league/standings?season=${season}` },
    { key: 'managers', label: 'Managers', href: `/league/managers?season=${season}` },
    { key: 'teams', label: 'Teams', href: `/league/teams?season=${season}` },
    { key: 'matchups', label: 'Matchups', href: `/league/matchups?season=${season}` },
    { key: 'transactions', label: 'Transactions', href: `/league/transactions?season=${season}` },
    { key: 'drafts', label: 'Drafts', href: `/league/drafts?season=${season}` }
  ];
</script>

<nav class="subnav" aria-label="League navigation">
  {#each items as item}
    <a class:active={active === item.key} href={item.href}>{item.label}</a>
  {/each}
</nav>

<style>
  .subnav{display:flex;gap:10px;flex-wrap:wrap;overflow:auto;padding-bottom:2px}
  .subnav a{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);text-decoration:none;color:rgba(255,255,255,.78);white-space:nowrap}
  .subnav a.active{background:rgba(214,177,94,.16);color:#f0c96d;border-color:rgba(214,177,94,.28)}
</style>
