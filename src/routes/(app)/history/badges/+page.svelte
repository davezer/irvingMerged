<script>
  export let data;

  const EMPTY_SECTIONS = {
    personas: [],
    weekly: [],
    luck: [],
    stains: [],
    yearly: [],
    legacy: []
  };

  /*
   * New static badge locations.
   *
   * These completely override whatever old icon path
   * may still be coming back from the badge API.
   */
  function badgeIcon(badge) {
  return (
    badge?.icon ||
    '/badges/stains.png'
  );
}

  const badgeGroups = [
    {
      key: 'personas',
      title: 'Personas',
      subtitle: "The league's recurring characters."
    },
    {
      key: 'weekly',
      title: 'Weekly Honors',
      subtitle: 'Greatness, heartbreak and public humiliation.'
    },
    {
      key: 'luck',
      title: 'Luck',
      subtitle: 'Sometimes the fantasy gods choose violence.'
    },
    {
      key: 'stains',
      title: 'Stains',
      subtitle: 'These do not wash out.'
    },
    {
      key: 'yearly',
      title: 'Service',
      subtitle: "For reasons nobody can adequately explain, you're still here."
    },
    {
      key: 'legacy',
      title: 'Legacy Champions',
      subtitle: 'Before there was one league, there were two.'
    }
  ];

  const POINTS_BADGES = new Set(['suck', 'bde', 'ides']);

  let showModal = false;
  let activeBadge = null;

  $: sections = data?.sections ?? EMPTY_SECTIONS;

  function hasEarned(badge) {
    return Array.isArray(badge?.earned) && badge.earned.length > 0;
  }

  function earnedCount(badge) {
    if (Number.isFinite(Number(badge?.count))) {
      return Number(badge.count);
    }

    return Array.isArray(badge?.earned)
      ? badge.earned.length
      : 0;
  }

  function openBadge(badge) {
    activeBadge = badge;
    showModal = true;
  }

  function closeModal() {
    activeBadge = null;
    showModal = false;
  }

  function detailLabel(badge, earned) {
    if (badge.type === 'legacy') {
      return earned.years?.length
        ? `Years: ${earned.years.join(', ')}`
        : '';
    }

    if (
      badge.type === 'weekly' ||
      badge.type === 'stains' ||
      badge.type === 'luck'
    ) {
      const parts = [];

      if (earned.season) {
        parts.push(`${earned.season}`);
      }

      if (earned.week != null) {
        parts.push(`Wk ${earned.week}`);
      }

      if (POINTS_BADGES.has(badge.id)) {
        const hasSelf = Number.isFinite(earned.points);
        const hasOpponent = Number.isFinite(earned.opponentPoints);

        const opponent =
          earned.opponentTeamName ||
          earned.opponentName ||
          null;

        if (hasSelf && hasOpponent && opponent) {
          parts.push(
            `${earned.points.toFixed(2)}–${earned.opponentPoints.toFixed(2)} pts vs ${opponent}`
          );
        } else if (hasSelf && hasOpponent) {
          parts.push(
            `${earned.points.toFixed(2)}–${earned.opponentPoints.toFixed(2)} pts`
          );
        } else if (hasSelf) {
          parts.push(`${earned.points.toFixed(2)} pts`);
        }
      }

      return parts.join(' • ');
    }

    return '';
  }

  function historyModuleHref(item) {
    if (item?.title?.toLowerCase() === 'badges') {
      return '#badge-cabinet';
    }

    return item.href;
  }
</script>

<svelte:window
  on:keydown={(event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  }}
/>

<div class="page-stack">

  <!-- =====================================================
       HISTORY HERO
       ===================================================== -->
  <section class="hero card">
    <div>
      <div class="eyebrow">History</div>
      <h1>Legacy wing</h1>
      <p>records, titles, grudges, archetypes, etc.</p>
    </div>
  </section>


  <!-- =====================================================
       HISTORY MODULES
       ===================================================== -->
  <div class="history-grid">
    {#each data.modules as item}
      <a
        class="card module"
        href={historyModuleHref(item)}
      >
        <strong>{item.title}</strong>
        <p>{item.description}</p>
      </a>
    {/each}
  </div>


  <!-- =====================================================
       EXISTING PREVIEWS
       ===================================================== -->
  <section class="showcase-grid">

    <div class="card showcase-card">
      <div class="section-label">
        Record board preview
      </div>

      {#each data.records as record}
        <div class="line-item">
          <strong>{record.title}</strong>
          <span>{record.value}</span>
        </div>
      {/each}
    </div>

    <div class="card showcase-card">
      <div class="section-label">
        Rivalry preview
      </div>

      {#each data.rivalries as item}
        <div class="line-item">
          <strong>{item.headline}</strong>
          <span>{item.subhead}</span>
        </div>
      {/each}
    </div>

  </section>


  <!-- =====================================================
       BADGE CABINET
       ===================================================== -->
  <section
    class="badge-cabinet"
    id="badge-cabinet"
  >

    <div class="cabinet-header card">

      <div class="cabinet-heading">
        <div class="eyebrow">
          League archive
        </div>

        <h2>Badge Cabinet</h2>

        <p>
          Honors, dishonors, reputations and permanent stains.
        </p>
      </div>

      <img
        class="cabinet-shield"
        src="/badges/stains.png"
        alt=""
      />

    </div>


    <!-- category jump navigation -->
    <nav
      class="badge-nav"
      aria-label="Badge categories"
    >
      {#each badgeGroups as group}
        <a href={`#badges-${group.key}`}>
          {group.title}
        </a>
      {/each}
    </nav>


    <!-- ===================================================
         BADGE GROUPS
         =================================================== -->
    {#each badgeGroups as group}

      <section
        class="badge-section"
        id={`badges-${group.key}`}
      >

        <header class="badge-section-head">
          <div class="section-bar"></div>

          <div>
            <div class="section-label">
              {group.title}
            </div>

            <p>
              {group.subtitle}
            </p>
          </div>
        </header>


        <div class="badge-grid">

          {#each sections[group.key] ?? [] as badge}

            <button
              type="button"
              class:unearned={!hasEarned(badge)}
              class="badge-card"
              on:click={() => openBadge(badge)}
            >

              <span class="badge-card-head">

                <span class="badge-avatar">
                  <img
                    src={badgeIcon(badge)}
                    alt=""
                  />
                </span>

                <span class="badge-title">
                  <strong>
                    {badge.name}
                  </strong>

                  <small>
                    #{badge.id}
                  </small>
                </span>

                <span
                  class="earned-chip"
                  title="Times earned"
                >
                  {earnedCount(badge)}
                </span>

              </span>


              <span class="badge-definition">
                {badge.definition}
              </span>


              <span class="earned-area">

                {#if hasEarned(badge)}

                  <span class="earned-label">
                    Earned by
                  </span>

                  <span class="team-logo-row">

                    {#each badge.earned as earned}

                      <span
                        class="team-logo-wrap"
                        title={`${earned.teamName} — ${earned.managerName}`}
                      >
                        <img
                          src={earned.teamLogo}
                          alt={`${earned.teamName} logo`}
                        />
                      </span>

                    {/each}

                  </span>

                {:else}

                  <span class="empty">
                    No teams have earned this yet.
                  </span>

                {/if}

              </span>

            </button>

          {/each}


          {#if !(sections[group.key] ?? []).length}

            <div class="empty-category">
              No badges found in this category.
            </div>

          {/if}

        </div>

      </section>

    {/each}

  </section>

</div>


<!-- =======================================================
     BADGE DETAIL MODAL
     ======================================================= -->
{#if showModal && activeBadge}

  <button
    type="button"
    class="modal-backdrop"
    aria-label="Close badge details"
    on:click={closeModal}
  ></button>


  <div
    class="badge-modal"
    role="dialog"
    aria-modal="true"
    aria-label={`${activeBadge.name} details`}
  >

    <button
      type="button"
      class="modal-close"
      aria-label="Close"
      on:click={closeModal}
    >
      ×
    </button>


    <div class="modal-head">

      <div class="modal-badge">
        <img
          src={badgeIcon(activeBadge)}
          alt=""
        />
      </div>

      <div class="modal-heading">
        <div class="eyebrow">
          Badge history
        </div>

        <h2>
          {activeBadge.name}
        </h2>

        <div class="modal-id">
          #{activeBadge.id}
        </div>
      </div>

      <div class="modal-count">
        {earnedCount(activeBadge)}
      </div>

    </div>


    <p class="modal-definition">
      {activeBadge.definition}
    </p>


    {#if hasEarned(activeBadge)}

      <div class="earned-list">

        {#each activeBadge.earned as earned}

          <div class="earned-row">

            <img
              class="earned-logo"
              src={earned.teamLogo}
              alt={`${earned.teamName} logo`}
            />

            <div class="earned-details">

              <strong>
                {earned.teamName}
              </strong>

              {#if earned.managerName}
                <div class="muted">
                  {earned.managerName}
                </div>
              {/if}


              {#if detailLabel(activeBadge, earned)}

                <div class="earned-sub">
                  {detailLabel(activeBadge, earned)}
                </div>

              {/if}


              {#if earned.opponentName && !POINTS_BADGES.has(activeBadge.id)}

                <div class="earned-sub">
                  vs {earned.opponentTeamName || earned.opponentName}

                  {#if earned.opponentPoints != null}
                    • {Number(earned.opponentPoints).toFixed(2)} pts
                  {/if}
                </div>

              {/if}


              {#if earned.explanation}

                <div class="earned-explanation">
                  {earned.explanation}
                </div>

              {/if}


              {#if earned.nominatedByName}

                <div class="earned-nominator">
                  Nominated by
                  {earned.nominatedByTeamName || earned.nominatedByName}
                </div>

              {/if}

            </div>

          </div>

        {/each}

      </div>

    {:else}

      <div class="modal-empty">
        Nobody has earned this one yet.
      </div>

    {/if}

  </div>

{/if}


<style>
  /* ======================================================
     PAGE
     ====================================================== */

  .page-stack {
    display: grid;
    gap: 20px;
  }

  .card {
    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.16) 0%,
        rgba(255,255,255,.055) 18%,
        rgba(255,255,255,.025) 48%,
        rgba(0,0,0,.12) 100%
      );
    border: 1px solid rgba(255,255,255,.11);
    border-radius: 24px;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.17),
      0 12px 28px rgba(0,0,0,.20);
  }

  .hero {
    padding: 24px;
  }

  .hero h1 {
    margin: 26px 0 14px;
  }

  .hero p {
    margin: 0;
    color: rgba(255,255,255,.72);
  }

  .eyebrow,
  .section-label {
    text-transform: uppercase;
    letter-spacing: .2em;
    font-size: 11px;
    color: #d6b15e;
    font-weight: 800;
  }


  /* ======================================================
     HISTORY MODULES
     ====================================================== */

  .history-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .module {
    color: inherit;
    padding: 22px;
    text-decoration: none;
    transition:
      transform .15s ease,
      border-color .15s ease,
      box-shadow .15s ease;
  }

  .module:hover {
    transform: translateY(-2px);
    border-color: rgba(52,165,255,.42);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.18),
      0 15px 32px rgba(0,0,0,.3);
  }

  .module p {
    margin-bottom: 0;
    color: rgba(255,255,255,.7);
  }


  /* ======================================================
     PREVIEWS
     ====================================================== */

  .showcase-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .showcase-card {
    padding: 24px;
  }

  .line-item {
    display: grid;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,.08);
  }

  .line-item:last-child {
    border-bottom: 0;
  }

  .line-item span {
    color: #e0bc48;
    font-weight: 700;
  }


  /* ======================================================
     BADGE CABINET
     ====================================================== */

  .badge-cabinet {
    display: grid;
    gap: 24px;
    margin-top: 34px;
    scroll-margin-top: 110px;
  }

  .cabinet-header {
    min-height: 140px;
    padding: 30px 32px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;

    overflow: hidden;
    position: relative;
  }

  .cabinet-header::after {
    content: '';
    position: absolute;
    inset: auto -60px -120px auto;
    width: 360px;
    height: 260px;

    background:
      radial-gradient(
        circle,
        rgba(25,150,230,.18),
        transparent 68%
      );

    pointer-events: none;
  }

  .cabinet-heading {
    position: relative;
    z-index: 1;
  }

  .cabinet-heading h2 {
    margin: 10px 0 6px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1;
  }

  .cabinet-heading p {
    margin: 0;
    color: rgba(255,255,255,.68);
  }

  .cabinet-shield {
    position: relative;
    z-index: 1;

    width: 92px;
    height: 92px;

    object-fit: contain;

    filter:
      drop-shadow(0 10px 12px rgba(0,0,0,.45));
  }


  /* ======================================================
     BADGE NAV
     ====================================================== */

  .badge-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .badge-nav a {
    padding: 9px 14px;

    color: rgba(255,255,255,.78);
    text-decoration: none;

    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;

    border: 1px solid rgba(255,255,255,.1);
    border-radius: 999px;

    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.09),
        rgba(255,255,255,.025)
      );

    transition:
      color .15s ease,
      border-color .15s ease,
      background .15s ease;
  }

  .badge-nav a:hover {
    color: white;
    border-color: rgba(48,164,255,.5);
    background: rgba(40,140,215,.13);
  }


  /* ======================================================
     BADGE SECTIONS
     ====================================================== */

  .badge-section {
    display: grid;
    gap: 15px;
    padding-top: 10px;
    scroll-margin-top: 100px;
  }

  .badge-section + .badge-section {
    margin-top: 18px;
  }

  .badge-section-head {
    display: flex;
    align-items: stretch;
    gap: 12px;
  }

  .section-bar {
    width: 3px;
    min-height: 48px;

    background:
      linear-gradient(
        180deg,
        #1ea7ff,
        #235be0
      );

    box-shadow:
      0 0 14px rgba(26,156,255,.22);
  }

  .badge-section-head p {
    margin: 5px 0 0;
    color: rgba(255,255,255,.58);
    font-size: 13px;
  }


  /* ======================================================
     BADGE GRID
     ====================================================== */

  .badge-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .badge-card {
    width: 100%;
    min-height: 190px;

    padding: 17px;

    display: flex;
    flex-direction: column;
    gap: 13px;

    text-align: left;
    color: inherit;
    font: inherit;

    border:
      1px solid rgba(255,255,255,.11);

    border-radius: 17px;

    background:
      linear-gradient(
        180deg,
        rgba(255,255,255,.13) 0%,
        rgba(255,255,255,.055) 20%,
        rgba(255,255,255,.026) 100%
      );

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.13),
      0 10px 22px rgba(0,0,0,.23);

    cursor: pointer;

    transition:
      transform .14s ease,
      border-color .14s ease,
      box-shadow .14s ease;
  }

  .badge-card:hover {
    transform: translateY(-3px);

    border-color:
      rgba(47,162,255,.44);

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.16),
      0 16px 30px rgba(0,0,0,.32);
  }

  .badge-card:focus-visible {
    outline: 2px solid #259bff;
    outline-offset: 3px;
  }

  .badge-card.unearned {
    opacity: .84;
  }


  /* ======================================================
     BADGE CARD CONTENT
     ====================================================== */

  .badge-card-head {
    display: grid;
    grid-template-columns: 54px minmax(0,1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .badge-avatar {
    width: 54px;
    height: 54px;

    display: grid;
    place-items: center;

    border-radius: 50%;
    border: 1px solid rgba(255,255,255,.14);

    background:
      radial-gradient(
        circle at 40% 30%,
        rgba(255,255,255,.13),
        rgba(0,0,0,.45)
      );

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.12),
      0 5px 12px rgba(0,0,0,.4);

    overflow: hidden;
  }

  .badge-avatar img {
    width: 88%;
    height: 88%;
    object-fit: contain;

    filter:
      drop-shadow(0 3px 3px rgba(0,0,0,.45));
  }

  .badge-title {
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .badge-title strong {
    font-size: 16px;
    line-height: 1.1;
  }

  .badge-title small {
    color: rgba(255,255,255,.52);
    font-size: 11px;
  }

  .earned-chip {
    min-width: 32px;
    height: 32px;

    padding: 0 8px;

    display: grid;
    place-items: center;

    border-radius: 999px;

    border:
      1px solid rgba(255,255,255,.12);

    background:
      rgba(0,0,0,.22);

    color: rgba(255,255,255,.82);

    font-size: 12px;
    font-weight: 800;
  }

  .badge-definition {
    display: block;
    flex: 1;

    color: rgba(255,255,255,.76);

    font-size: 14px;
    line-height: 1.45;
  }

  .earned-area {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .earned-label {
    color: #d6b15e;

    font-size: 9px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: .16em;
  }

  .team-logo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .team-logo-wrap {
    width: 36px;
    height: 36px;

    display: grid;
    place-items: center;

    border-radius: 50%;

    border:
      1px solid rgba(255,255,255,.15);

    background: rgba(0,0,0,.3);

    box-shadow:
      0 3px 7px rgba(0,0,0,.35);

    overflow: hidden;
  }

  .team-logo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empty {
    color: rgba(255,255,255,.46);
    font-size: 12px;
  }

  .empty-category {
    grid-column: 1 / -1;

    padding: 32px;

    text-align: center;
    color: rgba(255,255,255,.45);

    border:
      1px dashed rgba(255,255,255,.12);

    border-radius: 16px;
  }


  /* ======================================================
     MODAL
     ====================================================== */

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;

    width: 100%;
    height: 100%;

    padding: 0;
    border: 0;

    background:
      rgba(0,0,0,.72);

    backdrop-filter:
      blur(5px);

    cursor: default;
  }

  .badge-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 101;

    transform:
      translate(-50%, -50%);

    width:
      min(680px, calc(100vw - 30px));

    max-height:
      min(760px, calc(100vh - 40px));

    overflow: auto;

    padding: 25px;

    border:
      1px solid rgba(255,255,255,.15);

    border-radius: 20px;

    color: white;

    background:
      linear-gradient(
        180deg,
        #252b2b 0%,
        #161a19 20%,
        #0d1010 100%
      );

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.17),
      0 35px 90px rgba(0,0,0,.75);
  }

  .modal-close {
    position: absolute;
    right: 14px;
    top: 14px;

    width: 34px;
    height: 34px;

    display: grid;
    place-items: center;

    padding: 0;

    border-radius: 50%;

    border:
      1px solid rgba(255,255,255,.12);

    background:
      rgba(0,0,0,.32);

    color:
      rgba(255,255,255,.75);

    font-size: 21px;

    cursor: pointer;
  }

  .modal-close:hover {
    color: white;
  }

  .modal-head {
    display: grid;
    grid-template-columns: 74px minmax(0,1fr) auto;
    gap: 15px;
    align-items: center;

    padding-right: 42px;
  }

  .modal-badge {
    width: 74px;
    height: 74px;

    display: grid;
    place-items: center;

    border-radius: 50%;

    border:
      1px solid rgba(255,255,255,.14);

    background:
      rgba(0,0,0,.25);
  }

  .modal-badge img {
    width: 90%;
    height: 90%;
    object-fit: contain;
  }

  .modal-heading h2 {
    margin: 5px 0 2px;
    font-size: 24px;
  }

  .modal-id {
    color:
      rgba(255,255,255,.5);

    font-size: 12px;
  }

  .modal-count {
    min-width: 40px;
    height: 40px;

    display: grid;
    place-items: center;

    border-radius: 999px;

    border:
      1px solid rgba(255,255,255,.13);

    background:
      rgba(0,0,0,.3);

    font-weight: 800;
  }

  .modal-definition {
    margin: 22px 0;

    color:
      rgba(255,255,255,.74);

    line-height: 1.5;
  }

  .earned-list {
    display: grid;
    gap: 9px;
  }

  .earned-row {
    display: grid;
    grid-template-columns: 46px minmax(0,1fr);
    gap: 12px;

    align-items: start;

    padding: 12px;

    border:
      1px solid rgba(255,255,255,.08);

    border-radius: 13px;

    background:
      rgba(255,255,255,.035);
  }

  .earned-logo {
    width: 46px;
    height: 46px;

    border-radius: 50%;
    object-fit: cover;

    background:
      rgba(0,0,0,.3);

    border:
      1px solid rgba(255,255,255,.12);
  }

  .earned-details {
    min-width: 0;
  }

  .earned-details strong {
    display: block;
    font-size: 14px;
  }

  .muted,
  .earned-sub,
  .earned-nominator {
    color:
      rgba(255,255,255,.5);

    font-size: 12px;
  }

  .earned-sub {
    margin-top: 5px;
  }

  .earned-explanation {
    margin-top: 8px;

    color:
      rgba(255,255,255,.75);

    font-size: 13px;
    line-height: 1.4;
  }

  .earned-nominator {
    margin-top: 7px;
    color: #d6b15e;
  }

  .modal-empty {
    padding: 25px;

    text-align: center;

    color:
      rgba(255,255,255,.48);

    border:
      1px dashed rgba(255,255,255,.13);

    border-radius: 13px;
  }


  /* ======================================================
     RESPONSIVE
     ====================================================== */

  @media (max-width: 1050px) {
    .badge-grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .history-grid,
    .showcase-grid,
    .badge-grid {
      grid-template-columns: 1fr;
    }

    .cabinet-header {
      padding: 24px;
    }

    .cabinet-shield {
      width: 70px;
      height: 70px;
    }
  }

  @media (max-width: 520px) {
    .cabinet-shield {
      display: none;
    }

    .badge-nav {
      justify-content: flex-start;
    }

    .badge-card {
      min-height: 0;
    }

    .modal-head {
      grid-template-columns:
        62px minmax(0,1fr);

      padding-right: 30px;
    }

    .modal-badge {
      width: 62px;
      height: 62px;
    }

    .modal-count {
      display: none;
    }
  }
</style>