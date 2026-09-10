<script>
  let { data, form } = $props();
  let editingId = $state(null);

  const activePicks = $derived(data.picks.filter((pick) => pick.status === 'active'));
  const missingManagers = $derived(
    data.managers.filter((manager) => !activePicks.some((pick) => String(pick.manager_id) === manager.id))
  );
  const linkedManagers = $derived(
    data.managers.filter((manager) => Boolean(data.linkByManager[manager.id]?.discord_user_id)).length
  );

  function pickLabel(pick) {
    const direction = pick.direction ? `${String(pick.direction).toUpperCase()} ` : '';
    const line = pick.current_line == null ? '' : `${pick.current_line} `;
    return `${direction}${line}${pick.market || pick.bet_type}`.trim();
  }

  function oddsLabel(value) {
    if (value == null || value === '') return '—';
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    return `${number > 0 ? '+' : ''}${number}`;
  }
</script>

<svelte:head><title>Parlay Control Room · Irving Admin</title></svelte:head>

<div class="shell">
  <header class="topbar">
    <div class="title-block">
      <p class="eyebrow">IRVING ADMIN / PARLAY</p>
      <h1>Parlay Control Room</h1>
      <p>Build the weekly ticket, catch duplicates, track line movement, lock it down.</p>
    </div>

    {#if data.selectedWeek}
      <div class="week-card">
        <span>{data.selectedWeek.season}</span>
        <strong>Week {data.selectedWeek.week}</strong>
        <em class:open={data.selectedWeek.status === 'open'}>{data.selectedWeek.status}</em>
      </div>
    {/if}
  </header>

  {#if form?.message}
    <div class:bad={form?.status >= 400} class="notice">{form.message}</div>
  {/if}

  <section class="dashboard-strip">
    <div class="metric primary">
      <span class="metric-value">{data.progress.submitted}<small>/14</small></span>
      <span class="metric-label">Picks in</span>
    </div>
    <div class="metric">
      <span class="metric-value">{missingManagers.length}</span>
      <span class="metric-label">Still missing</span>
    </div>
    <div class="metric">
      <span class="metric-value">{linkedManagers}<small>/14</small></span>
      <span class="metric-label">Discord linked</span>
    </div>
    <div class="metric archive-metric">
      <span class="metric-value">{data.legacyImport?.importedRows || 0}</span>
      <span class="metric-label">Archived picks</span>
    </div>
  </section>

  <section class="workspace-grid">
    <div class="main-column">
      <section class="panel current-ticket">
        <div class="panel-head">
          <div>
            <p class="kicker">LIVE BOARD</p>
            <h2>Current ticket</h2>
            <p>Submitted values stay preserved. Only the current line and odds change when Hard Rock moves.</p>
          </div>
          <div class="progress-pill">{data.progress.submitted} OF 14</div>
        </div>

        <div class="progress-track" aria-label={`${data.progress.submitted} of 14 picks submitted`}>
          <span style={`width:${Math.min(100, (data.progress.submitted / 14) * 100)}%`}></span>
        </div>

        {#if !activePicks.length}
          <div class="empty">
            <strong>No picks yet.</strong>
            <span>The next Discord submission will land here automatically.</span>
          </div>
        {:else}
          <div class="pick-list">
            {#each activePicks as pick, i}
              <article class:locked={Number(pick.locked) === 1} class="pick-row">
                <div class="leg-number">{String(i + 1).padStart(2, '0')}</div>

                <div class="pick-main">
                  <div class="pick-tags">
                    <span>{String(pick.sport).toUpperCase()}</span>
                    {#if Number(pick.locked) === 1}<span class="locked-tag">LOCKED</span>{/if}
                  </div>
                  <h3>{pick.subject}</h3>
                  <strong class="market">{pickLabel(pick)}</strong>
                  <div class="manager-line">
                    <span>{pick.team_name || pick.manager_name}</span>
                    <i>{pick.manager_name}</i>
                  </div>
                </div>

                <div class="pick-meta">
                  <span class="odds">{oddsLabel(pick.current_odds)}</span>
                  <span>{pick.sportsbook}</span>
                  {#if pick.original_line !== pick.current_line || pick.original_odds !== pick.current_odds}
                    <span class="movement">Changed from {pick.original_line ?? '—'} @ {oddsLabel(pick.original_odds)}</span>
                  {/if}
                </div>

                <div class="pick-actions">
                  <button type="button" class="ghost" onclick={() => editingId = editingId === pick.id ? null : pick.id}>Edit</button>
                  <form method="POST" action="?/togglePickLock">
                    <input type="hidden" name="id" value={pick.id} />
                    <button class="ghost">{Number(pick.locked) === 1 ? 'Unlock' : 'Lock'}</button>
                  </form>
                  <form method="POST" action="?/voidPick" onsubmit={(e) => { if (!confirm('Void this pick? The manager will be allowed to submit a replacement.')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={pick.id} />
                    <button class="ghost danger">Void</button>
                  </form>
                </div>

                <div class="grade-actions">
                  {#each ['PENDING','WIN','LOSS','PUSH'] as result}
                    <form method="POST" action="?/gradePick">
                      <input type="hidden" name="id" value={pick.id} />
                      <input type="hidden" name="result" value={result} />
                      <button class:active={pick.result === result}>{result}</button>
                    </form>
                  {/each}
                </div>

                {#if pick.notes}<p class="notes">{pick.notes}</p>{/if}

                {#if editingId === pick.id}
                  <form method="POST" action="?/editPick" class="edit-form">
                    <input type="hidden" name="id" value={pick.id} />
                    <label>Player / Team<input name="subject" value={pick.subject} required /></label>
                    <label>Market<input name="market" value={pick.market || ''} /></label>
                    <div class="two">
                      <label>Direction
                        <select name="direction">
                          <option value="">—</option>
                          <option value="over" selected={pick.direction === 'over'}>Over</option>
                          <option value="under" selected={pick.direction === 'under'}>Under</option>
                        </select>
                      </label>
                      <label>Current line<input name="line" type="number" step="0.5" value={pick.current_line ?? ''} /></label>
                    </div>
                    <label>Current odds<input name="odds" value={oddsLabel(pick.current_odds)} required /></label>
                    <label>Notes<textarea name="notes">{pick.notes || ''}</textarea></label>
                    <div class="edit-actions">
                      <button disabled={Number(pick.locked) === 1}>Save changes</button>
                      <button type="button" class="ghost" onclick={() => editingId = null}>Cancel</button>
                    </div>
                    {#if Number(pick.locked) === 1}<small>Unlock the pick before editing.</small>{/if}
                  </form>
                {/if}
              </article>
            {/each}
          </div>
        {/if}
      </section>

      {#if missingManagers.length}
        <section class="panel on-clock">
          <div class="panel-head compact">
            <div>
              <p class="kicker">WAITING ROOM</p>
              <h2>Still on the clock</h2>
            </div>
            <span class="muted-count">{missingManagers.length} remaining</span>
          </div>
          <div class="manager-chips">
            {#each missingManagers as manager}<span>{manager.teamName}</span>{/each}
          </div>
        </section>
      {/if}

      {#if data.selectedWeek}
        <section class="panel final-ticket">
          <div class="panel-head compact">
            <div>
              <p class="kicker">HARD ROCK</p>
              <h2>Final ticket</h2>
              <p>Record the actual parlay once the 14-leg slip is built.</p>
            </div>
          </div>
          <form method="POST" action="?/saveTicket" class="ticket-form">
            <input type="hidden" name="id" value={data.selectedWeek.id} />
            <label>Combined odds<input name="combinedOdds" value={data.selectedWeek.combined_odds || ''} placeholder="+24838" /></label>
            <label>Wager<input name="wagerAmount" type="number" step="0.01" value={data.selectedWeek.wager_amount ?? ''} placeholder="10.00" /></label>
            <label>Potential payout<input name="potentialPayout" type="number" step="0.01" value={data.selectedWeek.potential_payout ?? ''} placeholder="2493.80" /></label>
            <button>Save ticket</button>
          </form>

          <details class="build-checklist">
            <summary>
              <span>Hard Rock build checklist</span>
              <strong>{activePicks.length}/14 legs available</strong>
            </summary>
            <p>Check each leg off as you add it to the Hard Rock bet slip. These checks stay local to this browser session.</p>
            <div class="checklist-rows">
              {#each activePicks as pick, i}
                <label class="check-row">
                  <input type="checkbox" />
                  <span class="check-number">{String(i + 1).padStart(2, '0')}</span>
                  <span class="check-pick">
                    <strong>{pick.subject}</strong>
                    <small>{pickLabel(pick)} · {oddsLabel(pick.current_odds)} · {pick.team_name || pick.manager_name}</small>
                  </span>
                </label>
              {/each}
            </div>
          </details>
        </section>
      {/if}
    </div>

    <aside class="side-column">
      <section class="panel week-controls">
        <div class="panel-head compact">
          <div>
            <p class="kicker">SUBMISSION WINDOW</p>
            <h2>Week controls</h2>
          </div>
        </div>

        <form method="POST" action="?/openWeek" class="week-form">
          <div class="two">
            <label>Season<input name="season" type="number" min="2020" value={data.selectedWeek?.season || 2026} required /></label>
            <label>Week<input name="week" type="number" min="1" max="30" value={data.selectedWeek?.week || 1} required /></label>
          </div>
          <button>Open selected week</button>
        </form>

        {#if data.selectedWeek}
          <form method="POST" action="?/rolloverWeek" class="rollover-form" onsubmit={(e) => {
            if (!confirm(`Close Week ${data.selectedWeek.week} and open Week ${Number(data.selectedWeek.week) + 1}?`)) e.preventDefault();
          }}>
            <input type="hidden" name="id" value={data.selectedWeek.id} />
            <button class="rollover">Close week → Open Week {Number(data.selectedWeek.week) + 1}</button>
          </form>
        {/if}

        {#if data.selectedWeek}
          <div class="status-stack">
            <span>Current status</span>
            <div class="status-buttons">
              {#each ['open', 'locked', 'placed', 'graded'] as status}
                <form method="POST" action="?/setWeekStatus">
                  <input type="hidden" name="id" value={data.selectedWeek.id} />
                  <input type="hidden" name="status" value={status} />
                  <button class:active={data.selectedWeek.status === status} disabled={data.selectedWeek.status === status}>{status}</button>
                </form>
              {/each}
            </div>
          </div>
        {/if}
      </section>

      <details class="panel utility" open={linkedManagers < 14}>
        <summary>
          <div>
            <p class="kicker">ONE-TIME SETUP</p>
            <h2>Discord links</h2>
          </div>
          <span>{linkedManagers}/14</span>
        </summary>
        <p>Link each Irving manager to their Discord User ID.</p>
        <div class="link-list">
          {#each data.managers as manager}
            <form method="POST" action="?/saveDiscordLink" class="link-row">
              <input type="hidden" name="managerId" value={manager.id} />
              <div><strong>{manager.teamName}</strong><span>{manager.name}</span></div>
              <input name="discordUserId" value={data.linkByManager[manager.id]?.discord_user_id || ''} placeholder="Discord User ID" inputmode="numeric" />
              <button>Save</button>
            </form>
          {/each}
        </div>
      </details>

      <details class="panel utility archive-panel">
        <summary>
          <div>
            <p class="kicker gold">HISTORICAL DATA</p>
            <h2>Legacy archive</h2>
          </div>
          <span class:ready={data.legacyImport?.complete}>{data.legacyImport?.complete ? 'READY' : 'SETUP'}</span>
        </summary>

        <div class="archive-summary">
          <div><strong>{data.legacyImport?.importedRows || 0}</strong><span>D1 rows</span></div>
          <div><strong>{data.legacyImport?.sourceRows || '—'}</strong><span>Source rows</span></div>
        </div>

        <p>{data.legacyImport?.complete ? 'Historical Parlay data is stored in D1.' : 'Import the historical Google Sheet into D1.'}</p>

        {#if data.legacyImport?.lastImportedAt}
          <small>Last refreshed {new Date(data.legacyImport.lastImportedAt + 'Z').toLocaleString()}</small>
        {/if}

        {#if data.legacyImport?.lastError}
          <div class="legacy-error">{data.legacyImport.lastError}</div>
        {/if}

        <form method="POST" action="?/importLegacyHistory" onsubmit={(e) => { if (!confirm('Refresh the complete legacy Parlay history from Google Sheets into D1?')) e.preventDefault(); }}>
          <button class="secondary">{data.legacyImport?.importedRows ? 'Refresh archive' : 'Import archive'}</button>
        </form>
      </details>

      {#if data.picks.some((pick) => pick.status !== 'active')}
        <details class="panel utility">
          <summary>
            <div><p class="kicker">AUDIT</p><h2>Replaced picks</h2></div>
            <span>{data.picks.filter((pick) => pick.status !== 'active').length}</span>
          </summary>
          <div class="void-list">
            {#each data.picks.filter((pick) => pick.status !== 'active') as pick}
              <div><strong>{pick.team_name || pick.manager_name}</strong><span>{pick.subject} · {pick.status}</span></div>
            {/each}
          </div>
        </details>
      {/if}
    </aside>
  </section>
</div>

<style>
  :global(body){background:#080817;color:#f6f4ff}.shell{max-width:1540px;margin:0 auto;padding:1.3rem 1rem 5rem}.topbar{display:flex;justify-content:space-between;align-items:center;gap:2rem;padding:.2rem 0 1.15rem;border-bottom:1px solid #29283d}.title-block{min-width:0}.eyebrow,.kicker{margin:0 0 .32rem;font-size:.64rem;font-weight:1000;letter-spacing:.17em;color:#00e7ec;text-transform:uppercase}.title-block h1{margin:0;font-size:clamp(2rem,4vw,3.35rem);line-height:.95;text-transform:uppercase;letter-spacing:-.045em}.title-block>p:last-child{margin:.55rem 0 0;color:#8f8ca6;font-size:.9rem}.week-card{min-width:124px;padding:.72rem .9rem;background:#10102b;border:1px solid #302e52;border-right:4px solid #00e7ec;text-align:right}.week-card span,.week-card strong,.week-card em{display:block}.week-card span{font-size:.62rem;color:#8f8ca6}.week-card strong{font-size:1.15rem;text-transform:uppercase}.week-card em{margin-top:.2rem;font-size:.64rem;font-style:normal;text-transform:uppercase;color:#ed3f98}.week-card em.open{color:#00e7ec}.notice{margin:1rem 0;padding:.7rem .9rem;background:#103238;border:1px solid #00e7ec;font-size:.82rem}.notice.bad{background:#3a1724;border-color:#ed3f98}.dashboard-strip{display:grid;grid-template-columns:repeat(4,1fr);margin:1rem 0;border:1px solid #2c2a42;background:#10101f}.metric{padding:.85rem 1rem;border-right:1px solid #2c2a42;display:flex;align-items:baseline;gap:.6rem}.metric:last-child{border-right:0}.metric-value{font-size:1.65rem;font-weight:1000;line-height:1;color:#fff}.metric-value small{font-size:.72rem;color:#77748d;margin-left:.12rem}.metric-label{font-size:.65rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#77748d}.metric.primary .metric-value{color:#00e7ec}.archive-metric .metric-value{color:#edb84f}.workspace-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:1rem;align-items:start}.main-column,.side-column{display:grid;gap:1rem}.panel{background:#10101f;border:1px solid #2b2940;padding:1rem;box-shadow:0 10px 25px #0004}.panel-head{display:flex;justify-content:space-between;align-items:start;gap:1rem}.panel-head.compact{align-items:center}.panel h2{margin:0;text-transform:uppercase;font-size:1.05rem;letter-spacing:.03em}.panel p{margin:.3rem 0 0;color:#8f8ca6;font-size:.82rem;line-height:1.45}.progress-pill{font-size:.66rem;font-weight:1000;letter-spacing:.08em;color:#00e7ec;border:1px solid #28505a;background:#09181d;padding:.38rem .55rem}.progress-track{height:5px;margin:.9rem 0 0;background:#25243a;overflow:hidden}.progress-track span{display:block;height:100%;background:linear-gradient(90deg,#00e7ec,#fe04ff)}.empty{margin-top:.9rem;padding:2.7rem 1rem;border:1px dashed #35324e;text-align:center;color:#77748d}.empty strong,.empty span{display:block}.empty strong{color:#d7d4e2;margin-bottom:.25rem}.pick-list{margin-top:.55rem}.pick-row{display:grid;grid-template-columns:42px minmax(0,1fr) 130px auto;grid-template-areas:'leg main meta actions' 'leg main grade grade' 'leg notes notes notes' 'leg edit edit edit';gap:.55rem .9rem;padding:1rem .2rem;border-bottom:1px solid #28263c}.pick-row:last-child{border-bottom:0}.pick-row.locked{opacity:.84}.leg-number{grid-area:leg;font-size:1.35rem;font-weight:1000;color:#3f3d59;padding-top:.05rem}.pick-main{grid-area:main;min-width:0}.pick-tags{display:flex;gap:.35rem;margin-bottom:.35rem}.pick-tags span{font-size:.56rem;font-weight:1000;letter-spacing:.08em;color:#ed3f98;background:#17152e;padding:.18rem .32rem}.pick-tags .locked-tag{color:#c9b3ff}.pick-main h3{margin:0;font-size:1.22rem;line-height:1.05}.market{display:block;margin-top:.25rem;font-size:.87rem}.manager-line{display:flex;gap:.45rem;margin-top:.5rem;font-size:.72rem}.manager-line span{color:#fff;font-weight:800}.manager-line i{color:#77748d;font-style:normal}.pick-meta{grid-area:meta;display:grid;align-content:start;justify-items:end;gap:.18rem;text-align:right;font-size:.68rem;color:#77748d}.pick-meta .odds{font-size:1rem;font-weight:1000;color:#00e7ec}.movement{margin-top:.25rem;color:#ff9bd0!important;max-width:130px}.pick-actions{grid-area:actions;display:flex;gap:.3rem;justify-content:flex-end;align-items:start}.pick-actions form,.grade-actions form,.status-buttons form{display:inline}.grade-actions{grid-area:grade;display:flex;justify-content:flex-end;gap:.28rem}.grade-actions button{font-size:.56rem;padding:.34rem .42rem}.notes{grid-area:notes!important;margin:.15rem 0 0!important;font-size:.72rem!important;color:#aaa7c2!important}.edit-form{grid-area:edit;display:grid;gap:.55rem;margin-top:.35rem;padding:.85rem;background:#0a0a18;border:1px solid #302d47}.edit-actions{display:flex;gap:.4rem}.on-clock .manager-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.8rem}.manager-chips span{font-size:.66rem;font-weight:900;padding:.36rem .5rem;background:#151424;border:1px solid #333046}.muted-count{font-size:.7rem;color:#77748d}.final-ticket .ticket-form{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:.6rem;align-items:end;margin-top:.9rem}.week-form{display:grid;gap:.65rem;margin-top:.8rem}.status-stack{margin-top:1rem;padding-top:.85rem;border-top:1px solid #29273c}.status-stack>span{display:block;margin-bottom:.45rem;font-size:.62rem;font-weight:900;text-transform:uppercase;color:#77748d;letter-spacing:.08em}.status-buttons{display:grid;grid-template-columns:1fr 1fr;gap:.35rem}.status-buttons button{width:100%;font-size:.62rem}.utility{padding:.9rem}.utility summary{display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;list-style:none}.utility summary::-webkit-details-marker{display:none}.utility summary>span{font-size:.66rem;font-weight:1000;color:#8f8ca6}.utility summary>span.ready{color:#00e7ec}.utility[open] summary{padding-bottom:.7rem;border-bottom:1px solid #29273c}.link-list{display:grid;gap:.4rem;margin-top:.75rem}.link-row{display:grid;grid-template-columns:minmax(0,1fr);gap:.35rem;padding:.55rem;background:#0a0a18;border:1px solid #26243a}.link-row div{display:flex;justify-content:space-between;gap:.5rem;align-items:baseline}.link-row strong{font-size:.72rem}.link-row span{font-size:.61rem;color:#77748d}.link-row input{font-size:.72rem;padding:.48rem}.link-row button{font-size:.6rem;padding:.45rem}.archive-summary{display:grid;grid-template-columns:1fr 1fr;gap:.45rem;margin-top:.75rem}.archive-summary div{padding:.55rem;background:#0a0a18;border:1px solid #26243a}.archive-summary strong,.archive-summary span{display:block}.archive-summary strong{font-size:1rem}.archive-summary span{font-size:.58rem;color:#77748d;text-transform:uppercase}.gold{color:#edb84f}.archive-panel small{display:block;margin:.55rem 0;color:#77748d}.legacy-error{margin:.6rem 0;padding:.55rem;background:#351621;border:1px solid #78304b;color:#ffb7d2;font-size:.7rem}.void-list{display:grid;gap:.45rem;margin-top:.7rem}.void-list div{padding:.45rem 0;border-bottom:1px solid #26243a}.void-list strong,.void-list span{display:block}.void-list strong{font-size:.72rem}.void-list span{font-size:.65rem;color:#77748d}label{display:grid;gap:.25rem;font-size:.61rem;text-transform:uppercase;font-weight:900;letter-spacing:.05em;color:#8f8ca6}input,select,textarea{width:100%;box-sizing:border-box;background:#090918;color:#fff;border:1px solid #37344f;border-radius:3px;padding:.62rem;font:inherit}textarea{min-height:72px;resize:vertical}button{border:1px solid #64439a;background:#19163c;color:#fff;padding:.58rem .7rem;border-radius:3px;font-weight:900;text-transform:uppercase;letter-spacing:.035em;cursor:pointer}button:hover{border-color:#00e7ec}button.active{background:#64439a;border-color:#fe04ff}button.ghost{background:transparent;border-color:#3a3754;font-size:.59rem;padding:.4rem .48rem}button.danger{color:#ff8fbb;border-color:#693047}button.secondary{width:100%;margin-top:.75rem;background:#15132f}button:disabled{opacity:.4;cursor:not-allowed}.two{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.rollover-form{margin-top:.45rem}.rollover-form .rollover{width:100%;background:#10242b;border-color:#23636c;color:#00e7ec}.build-checklist{margin-top:1rem;padding-top:.8rem;border-top:1px solid #29273c}.build-checklist summary{display:flex;justify-content:space-between;gap:1rem;cursor:pointer;font-size:.7rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.build-checklist summary strong{color:#00e7ec}.checklist-rows{display:grid;gap:.35rem;margin-top:.75rem}.check-row{display:grid;grid-template-columns:auto 34px minmax(0,1fr);align-items:center;gap:.55rem;padding:.55rem;background:#0a0a18;border:1px solid #26243a;text-transform:none;letter-spacing:normal}.check-row input{width:auto}.check-number{color:#57546d;font-weight:1000}.check-pick strong,.check-pick small{display:block}.check-pick strong{color:#fff;font-size:.76rem}.check-pick small{color:#8f8ca6;font-size:.66rem;margin-top:.1rem}
@media(max-width:1100px){.workspace-grid{grid-template-columns:1fr}.side-column{grid-template-columns:1fr 1fr}.side-column .week-controls{grid-row:1 / span 2}.dashboard-strip{grid-template-columns:1fr 1fr}.metric:nth-child(2){border-right:0}.metric:nth-child(-n+2){border-bottom:1px solid #2c2a42}.pick-row{grid-template-columns:36px minmax(0,1fr) 110px;grid-template-areas:'leg main meta' 'leg actions actions' 'leg grade grade' 'leg notes notes' 'leg edit edit'}}@media(max-width:720px){.shell{padding:.8rem .65rem 4rem}.topbar{align-items:flex-start}.title-block>p:last-child{display:none}.week-card{min-width:100px}.dashboard-strip{grid-template-columns:1fr 1fr}.metric{padding:.7rem}.metric-value{font-size:1.35rem}.metric-label{font-size:.57rem}.side-column{grid-template-columns:1fr}.side-column .week-controls{grid-row:auto}.pick-row{grid-template-columns:30px 1fr;grid-template-areas:'leg main' 'leg meta' 'leg actions' 'leg grade' 'leg notes' 'leg edit'}.pick-meta{justify-items:start;text-align:left}.pick-actions,.grade-actions{justify-content:flex-start;flex-wrap:wrap}.final-ticket .ticket-form{grid-template-columns:1fr}.two{grid-template-columns:1fr 1fr}}
</style>
