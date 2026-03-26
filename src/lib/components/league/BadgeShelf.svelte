<script>
  export let badges = [];
</script>

<div class="badge-shelf card">
  <div class="section-kicker">Badge shelf</div>
  {#if badges.length}
    <div class="badge-grid">
      {#each badges as badge (badge.badge_id || badge.slug || badge.name)}
        <div class="badge-chip">
          <div class="badge-name">{badge.name || 'League badge'}</div>
          <div class="badge-meta">{badge.tier || 'standard'}{#if badge.awarded_at} • {badge.awarded_at}{/if}</div>
          {#if badge.notes}
            <p>{badge.notes}</p>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty">No badges on file yet.</p>
  {/if}
</div>

<style>
  .card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px}
  .section-kicker{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d4b15e;margin-bottom:14px}
  .badge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
  .badge-chip{border:1px solid rgba(212,177,94,.22);background:radial-gradient(circle at top left,rgba(212,177,94,.14),transparent 55%),rgba(255,255,255,.03);border-radius:18px;padding:16px;display:grid;gap:6px}
  .badge-name{font-weight:800}
  .badge-meta,.empty,p{color:rgba(255,255,255,.72)}
  p{margin:0;font-size:.95rem}
</style>
