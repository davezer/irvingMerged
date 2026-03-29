<script>
  import LeagueSubnav from '$lib/components/league/LeagueSubnav.svelte';
  export let data;
</script>

<div class="page-stack">
  <LeagueSubnav season={data.season} active="teams" />

  <section class="hero card">
    <div>
      <div class="eyebrow">Weekly team page</div>
      <h1>{data.manager.liveTeamName} · Week {data.week}</h1>
      <p>{data.manager.name} against {data.opponent?.teamName || 'Bye'}.</p>
      <div class="link-row">
        {#if data.previousWeek}<a href={`/league/teams/${data.manager.slug}/weeks/${data.previousWeek}?season=${data.season}`}>← Week {data.previousWeek}</a>{/if}
        <a href={data.sections.team}>Back to franchise</a>
        <a href={data.sections.dossier}>Manager dossier</a>
        {#if data.nextWeek}<a href={`/league/teams/${data.manager.slug}/weeks/${data.nextWeek}?season=${data.season}`}>Week {data.nextWeek} →</a>{/if}
      </div>
    </div>
    <div class="score-card">
      <div><span class="label">Actual</span><strong>{(data.actualScore || 0).toFixed(2)}</strong></div>
      <div><span class="label">Optimal</span><strong>{(data.lineupSnapshot?.optimalScore || 0).toFixed(2)}</strong></div>
      <div><span class="label">Lineup IQ</span><strong>{(data.lineupSnapshot?.lineupIQ || 0).toFixed(1)}%</strong></div>
      <div><span class="label">Bench swing</span><strong>{(data.lineupSnapshot?.benchPoints || 0).toFixed(2)}</strong></div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Actual starters</h3>
      <div class="stack">
        {#each data.lineupSnapshot?.actualStarterScores || [] as row}
          <div class="player-row">
            {#if row.player}<img src={row.player.photoUrl} alt={row.player.name} />{:else}<div class="placeholder">?</div>{/if}
            <div><strong>{row.player?.name || row.playerId}</strong><small>{row.player?.position || '—'} · {row.player?.teamLabel || row.player?.team || 'FA'}</small></div>
            <span>{row.score.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    </div>
    <div class="card">
      <h3>Slot-valid optimal lineup</h3>
      <div class="stack">
        {#each data.lineupSnapshot?.optimalSlots || [] as row}
          <div class="player-row">
            <img src={row.player.photoUrl} alt={row.player.name} />
            <div><strong>{row.player.name}</strong><small>{row.slot} · {row.player.position || '—'} · {row.player.teamLabel || row.player.team || 'FA'}</small></div>
            <span>{row.score.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="grid two-up">
    <div class="card">
      <h3>Missed ceiling</h3>
      <div class="stack">
        {#each data.lineupSnapshot?.topBenchCandidates || [] as row}
          <div class="player-row">
            <img src={row.player.photoUrl} alt={row.player.name} />
            <div><strong>{row.player.name}</strong><small>{row.slot} upgrade · {row.player.position || '—'} · {row.player.teamLabel || row.player.team || 'FA'}</small></div>
            <span>{row.score.toFixed(2)}</span>
          </div>
        {/each}
        {#if !(data.lineupSnapshot?.topBenchCandidates || []).length}<div class="empty">No missed starters this week.</div>{/if}
      </div>
    </div>
    <div class="card">
      <h3>Opponent board</h3>
      {#if data.opponent}
        <div class="opponent-card">
          <div class="team-photo">{#if data.opponent.teamPhoto}<img src={data.opponent.teamPhoto} alt={data.opponent.teamName} />{:else}<span>?</span>{/if}</div>
          <div><strong>{data.opponent.teamName}</strong><small>{data.opponent.managerName}</small></div>
          <span>{data.opponent.score.toFixed(2)}</span>
        </div>
        <div class="link-row"><a href={data.sections.games}>Open matchup board</a>{#if data.opponent.managerSlug}<a href={`/league/managers/${data.opponent.managerSlug}?season=${data.season}`}>Opponent dossier</a>{/if}</div>
      {:else}
        <div class="empty">Bye week or missing opponent data.</div>
      {/if}
    </div>
  </section>
</div>

<style>
  .page-stack,.stack{display:grid;gap:20px}.card{background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:20px}
  .hero{display:grid;grid-template-columns:1.2fr .9fr;gap:18px}.eyebrow,.label{text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#d6b15e}.link-row{display:flex;gap:10px;flex-wrap:wrap}.link-row a{color:#f0c96d;text-decoration:none}
  .score-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.score-card div{padding:14px;border-radius:16px;background:rgba(255,255,255,.03)}.score-card strong{display:block;font-size:1.5rem;margin-top:6px}
  .grid.two-up{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .player-row,.opponent-card{display:grid;grid-template-columns:44px 1fr auto;gap:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.03);align-items:center}
  .player-row img,.team-photo{width:44px;height:44px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.08)}.player-row img,.team-photo img{width:100%;height:100%;object-fit:cover}
  .player-row small,.opponent-card small{color:rgba(255,255,255,.68)}.empty{padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);color:rgba(255,255,255,.68)}
  @media(max-width:900px){.hero,.grid.two-up{grid-template-columns:1fr}}
</style>
