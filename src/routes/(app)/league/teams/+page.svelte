<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;

  const fmt = (value, digits = 2) => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : Number(0).toFixed(digits);
  };

  function moneyNumber(value) {
    if (value == null || value === '—') return null;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }

  function moneyLabel(value) {
    const amount = moneyNumber(value);
    if (amount == null) return '—';
    return `$${amount.toLocaleString('en-US', {
      maximumFractionDigits: amount % 1 ? 2 : 0
    })}`;
  }

  function draftDollarClass(value) {
    const amount = moneyNumber(value);
    if (amount == null) return 'draft-money-neutral';
    if (amount < 100) return 'draft-money-low';
    if (amount > 200) return 'draft-money-high';
    return 'draft-money-mid';
  }

  $: cards = data.cards || [];
  $: season = data.season || new Date().getFullYear();
</script>

<div class="page-stack">
  <LeagueSubnav season={season} active="teams" />

  <section class="directory-hero">
    <div class="bug-label">Franchises</div>
    <h1>The Teams</h1>
    <p>Find out more about who runs each franchise.</p>
  </section>

  <div class="grid">
    {#each cards as card}
      <article class="team-card">
        <a class="cover" href={card.quickLinks.team} aria-label={`Open ${card.teamName}`}>
          <img src={card.teamPhoto} alt={card.teamName} />
        </a>

        <div class="content">
          <div class="scorebug-row">
            <span>{card.currentRank ? `#${card.currentRank}` : '—'}</span>
            <strong>{card.teamName}</strong>
            <em>{card.currentRecord}</em>
          </div>

          <h3><a href={card.quickLinks.team}>{card.managerName}</a></h3>

          <div class="bug-stats" aria-label="Current season snapshot">
            <span>{fmt(card.currentPoints)} PF</span>
            <span>{fmt(card.currentPointDiff)} DIFF</span>
            <span class:draft-money-pill={true} class={draftDollarClass(card.futureDraftDollars)}>
             Draft {moneyLabel(card.futureDraftDollars)}
            </span>
          </div>

          <div class="link-row">
            <a href={card.quickLinks.team}>Franchise page</a>
            <a href={card.quickLinks.games}>Games</a>
            <a href={card.quickLinks.moves}>Moves</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>

<style>
  .page-stack { display: grid; gap: 20px; }

  .directory-hero {
    border: 2px solid #070808;
    border-radius: 14px;
    padding: 22px;
    background:
      linear-gradient(90deg, rgba(199,25,47,0.22), transparent 34%),
      linear-gradient(180deg, #5f6763, #252b2a 48%, #101313);
    box-shadow: var(--shadow-bug);
  }

  .directory-hero h1 {
    margin: 10px 0 6px;
    font-size: clamp(2.4rem, 5vw, 4.8rem);
    line-height: 0.9;
  }

  .directory-hero p {
    max-width: 62ch;
    margin: 0;
    color: rgba(247,245,235,0.78);
    font-weight: 750;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .team-card {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    gap: 16px;
    overflow: hidden;
    border-radius: 14px;
    padding: 14px;
  }

  .cover img {
    width: 128px;
    height: 128px;
    object-fit: cover;
    border: 2px solid #070808;
    border-radius: 8px;
    background: var(--bug-silver);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px rgba(0,0,0,0.35);
  }

  .content {
    min-width: 0;
    display: grid;
    gap: 10px;
  }

  .scorebug-row {
    overflow: hidden;
    display: grid;
    grid-template-columns: 48px minmax(0,1fr) auto;
    align-items: stretch;
    border: 2px solid #070808;
    border-radius: 7px;
    background: #0b0d0d;
    font-family: var(--font-score);
    text-transform: uppercase;
  }

  .scorebug-row span {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    color: white;
  }

  .scorebug-row strong {
    min-width: 0;
    padding: 8px 10px;
    overflow: hidden;
    color: white;
    font-size: 0.82rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scorebug-row em {
    display: grid;
    place-items: center;
    min-width: 58px;
    padding: 0 9px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111;
    font-style: normal;
  }

  h3 { margin: 0; }
  h3 a { color: white; text-decoration: none; }
  p { margin: 0; color: rgba(247,245,235,0.72); line-height: 1.45; }

  .bug-stats,
  .link-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .bug-stats span {
    border: 1px solid #070808;
    border-radius: 5px;
    padding: 6px 9px;
    background: linear-gradient(180deg, #f5f4ea, #b9bcb5 52%, #6d7470);
    color: #111;
    font-family: var(--font-score);
    font-size: 0.68rem;
    font-weight: 950;
    text-shadow: 0 1px 0 rgba(255,255,255,0.45);
  }

.money-low,
.money-mid,
.money-high,
.money-neutral {
  color: #070808 !important;
  background:
    linear-gradient(180deg, #fffef2 0%, #d8dbd2 46%, #8d948f 100%) !important;
  border: 2px solid #050606 !important;
  border-left-width: 8px !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65) !important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.75),
    inset 0 -2px 0 rgba(0,0,0,0.28),
    0 2px 0 rgba(0,0,0,0.45);
  font-weight: 950;
}

/* .money-low {
  border-left-color: #c8102e !important;
}

.money-mid {
  border-left-color: #f7c948 !important;
}

.money-high {
  border-left-color: #2f9d59 !important;
}

.money-neutral {
  border-left-color: #8b918d !important;
} */
  .link-row a {
    color: var(--bug-yellow);
    font-size: 0.9rem;
    font-weight: 900;
    text-decoration: none;
  }
  .link-row a:hover { text-decoration: underline; }

  @media(max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }
  @media(max-width: 560px) {
    .team-card { grid-template-columns: 1fr; }
    .cover img { width: 108px; height: 108px; }
  }
</style>
