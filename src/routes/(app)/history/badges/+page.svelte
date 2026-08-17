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
      subtitle:
        "The league's recurring characters."
    },
    {
      key: 'weekly',
      title: 'Weekly Honors',
      subtitle:
        'Greatness, heartbreak and public humiliation.'
    },
    {
      key: 'luck',
      title: 'Luck',
      subtitle:
        'Sometimes the fantasy gods choose violence.'
    },
    {
      key: 'stains',
      title: 'Stains',
      subtitle:
        'These do not wash out.'
    },
    {
      key: 'yearly',
      title: 'Service',
      subtitle:
        "For reasons nobody can adequately explain, you're still here."
    },
    {
      key: 'legacy',
      title: 'Legacy Champions',
      subtitle:
        'Before there was one league, there were two.'
    }
  ];


  const POINTS_BADGES =
    new Set([
      'suck',
      'bde',
      'ides'
    ]);


  let showModal = false;
  let activeBadge = null;


  $: sections =
    data?.sections ??
    EMPTY_SECTIONS;


  $: categoryStats =
    data?.categoryStats ??
    badgeGroups.map(
      (group) => {
        const badges =
          sections[group.key] ??
          [];

        return {
          key:
            group.key,

          definitions:
            badges.length,

          earnedDefinitions:
            badges.filter(
              (badge) =>
                Number(
                  badge?.count || 0
                ) > 0
            ).length,

          awards:
            badges.reduce(
              (sum, badge) =>
                sum +
                Number(
                  badge?.count || 0
                ),
              0
            )
        };
      }
    );


  $: fallbackAwardCount =
    categoryStats.reduce(
      (sum, group) =>
        sum +
        Number(
          group.awards || 0
        ),
      0
    );


  $: fallbackDefinitions =
    categoryStats.reduce(
      (sum, group) =>
        sum +
        Number(
          group.definitions || 0
        ),
      0
    );


  $: fallbackEarnedBadges =
    categoryStats.reduce(
      (sum, group) =>
        sum +
        Number(
          group.earnedDefinitions || 0
        ),
      0
    );


  $: fallbackManagers =
    Object.keys(
      data?.byManager || {}
    ).length;


  $: stats = {
    awards:
      data?.stats?.awards ??
      data?.badgeMeta?.displayedAwards ??
      fallbackAwardCount,

    definitions:
      data?.stats?.definitions ??
      data?.badgeMeta?.definitions ??
      fallbackDefinitions,

    earnedBadges:
      data?.stats?.earnedBadges ??
      fallbackEarnedBadges,

    managers:
      data?.stats?.managers ??
      fallbackManagers
  };


  function categoryStat(key) {
    return (
      categoryStats.find(
        (item) =>
          item.key === key
      ) || {
        definitions: 0,
        earnedDefinitions: 0,
        awards: 0
      }
    );
  }


  function hasEarned(badge) {
    return (
      Array.isArray(
        badge?.earned
      ) &&
      badge.earned.length > 0
    );
  }


  function earnedCount(badge) {
    if (
      Number.isFinite(
        Number(
          badge?.count
        )
      )
    ) {
      return Number(
        badge.count
      );
    }

    return Array.isArray(
      badge?.earned
    )
      ? badge.earned.length
      : 0;
  }


  function openBadge(badge) {
    activeBadge =
      badge;

    showModal =
      true;
  }


  function closeModal() {
    activeBadge =
      null;

    showModal =
      false;
  }


  function detailLabel(
    badge,
    earned
  ) {
    if (
      badge.type ===
      'legacy'
    ) {
      return earned.years
        ?.length
        ? `Years: ${earned.years.join(', ')}`
        : '';
    }


    if (
      badge.type ===
        'weekly' ||
      badge.type ===
        'stains' ||
      badge.type ===
        'luck'
    ) {
      const parts = [];


      if (
        earned.season
      ) {
        parts.push(
          `${earned.season}`
        );
      }


      if (
        earned.week != null
      ) {
        parts.push(
          `Wk ${earned.week}`
        );
      }


      if (
        POINTS_BADGES.has(
          badge.id
        )
      ) {
        const hasSelf =
          Number.isFinite(
            earned.points
          );

        const hasOpponent =
          Number.isFinite(
            earned.opponentPoints
          );

        const opponent =
          earned.opponentTeamName ||
          earned.opponentName ||
          null;


        if (
          hasSelf &&
          hasOpponent &&
          opponent
        ) {
          parts.push(
            `${earned.points.toFixed(2)}–${earned.opponentPoints.toFixed(2)} pts vs ${opponent}`
          );

        } else if (
          hasSelf &&
          hasOpponent
        ) {
          parts.push(
            `${earned.points.toFixed(2)}–${earned.opponentPoints.toFixed(2)} pts`
          );

        } else if (
          hasSelf
        ) {
          parts.push(
            `${earned.points.toFixed(2)} pts`
          );
        }
      }


      return parts.join(
        ' • '
      );
    }


    return '';
  }


  function heroBadge(
    category,
    index = 0
  ) {
    return badgeIcon(
      sections?.[category]
        ?.[index]
    );
  }
</script>


<svelte:head>
  <title>
    Badge Cabinet | Irving Collective
  </title>
</svelte:head>


<svelte:window
  on:keydown={(event) => {
    if (
      event.key ===
      'Escape'
    ) {
      closeModal();
    }
  }}
/>


<div class="badge-page">


  <!-- =====================================================
       HERO
       ===================================================== -->

  <section class="badge-hero">


    <div class="hero-topline">

      <div class="eyebrow">
        Irving Collective Archives
      </div>


      <div class="hero-document">
        Honors & Infamy Division
        <span>•</span>
        Permanent Record
      </div>

    </div>



    <div class="hero-main">


      <div class="hero-copy">

        <div class="hero-label">
          Badges
        </div>


        <h1>
          Badge
          <span>
            Cabinet
          </span>
        </h1>


        <p>
          Honors, dishonors, personas,
          service and stains. Every badge
          the league has handed out —
          deserved or otherwise.
        </p>

      </div>



      <div class="hero-badges">

        <img
          class="
            hero-badge
            hero-badge-left
          "
          src={heroBadge(
            'personas',
            0
          )}
          alt=""
        />


        <img
          class="
            hero-badge
            hero-badge-center
          "
          src={heroBadge(
            'stains',
            0
          )}
          alt=""
        />


        <img
          class="
            hero-badge
            hero-badge-right
          "
          src={heroBadge(
            'weekly',
            0
          )}
          alt=""
        />

      </div>


    </div>



    <div class="badge-stats">


      <div>

        <strong>
          {stats.awards}
        </strong>

        <span>
          Awards preserved
        </span>

      </div>


      <div>

        <strong>
          {stats.definitions}
        </strong>

        <span>
          Badge types
        </span>

      </div>


      <div>

        <strong>
          {stats.earnedBadges}
        </strong>

        <span>
          Badges claimed
        </span>

      </div>


      <div>

        <strong>
          {stats.managers}
        </strong>

        <span>
          Managers represented
        </span>

      </div>


    </div>


  </section>



  <!-- =====================================================
       CABINET DIRECTORY
       ===================================================== -->

  <section class="badge-directory">


    <div class="directory-heading">

      <div>

        <div class="section-label">
          Cabinet Index
        </div>

        <h2>
          Browse the Collection
        </h2>

      </div>


      <p>
        Select a category or scroll
        the complete cabinet below.
      </p>

    </div>



    <div class="category-grid">


      {#each badgeGroups as group, index}

        <a
          class="category-card"
          href={`#badges-${group.key}`}
        >


          <div class="category-number">
            {String(
              index + 1
            ).padStart(
              2,
              '0'
            )}
          </div>



          <div class="category-copy">

            <strong>
              {group.title}
            </strong>

            <span>
              {group.subtitle}
            </span>

          </div>



          <div class="category-count">

            <strong>
              {categoryStat(
                group.key
              ).awards}
            </strong>

            <span>
              awarded
            </span>

          </div>



          <div class="category-arrow">
            →
          </div>


        </a>

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


    {#each badgeGroups as group}


      <section
        class="badge-section"
        id={`badges-${group.key}`}
      >


        <header class="badge-section-head">


          <div class="section-bar">
          </div>


          <div>

            <div class="section-label">
              {group.title}
            </div>


            <p>
              {group.subtitle}
            </p>

          </div>


          <div class="section-count">

            <strong>
              {categoryStat(
                group.key
              ).awards}
            </strong>

            <span>
              awarded
            </span>

          </div>


        </header>



        <div class="badge-grid">


          {#each sections[group.key] ?? [] as badge}


            <button
              type="button"
              class:unearned={!hasEarned(badge)}
              class="badge-card"
              on:click={() =>
                openBadge(badge)}
            >


              <span class="badge-card-head">


                <span class="badge-avatar">

                  <img
                    src={badgeIcon(
                      badge
                    )}
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
                  {earnedCount(
                    badge
                  )}
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
                    No teams have earned
                    this yet.
                  </span>


                {/if}


              </span>


            </button>


          {/each}



          {#if !(sections[group.key] ?? []).length}


            <div class="empty-category">
              No badges found in this
              category.
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
  >
  </button>



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
          src={badgeIcon(
            activeBadge
          )}
          alt=""
        />

      </div>



      <div class="modal-heading">

        <div class="eyebrow">
          Badge History
        </div>

        <h2>
          {activeBadge.name}
        </h2>

        <div class="modal-id">
          #{activeBadge.id}
        </div>

      </div>



      <div class="modal-count">
        {earnedCount(
          activeBadge
        )}
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



              {#if detailLabel(
                activeBadge,
                earned
              )}

                <div class="earned-sub">

                  {detailLabel(
                    activeBadge,
                    earned
                  )}

                </div>

              {/if}



              {#if
                earned.opponentName &&
                !POINTS_BADGES.has(
                  activeBadge.id
                )
              }

                <div class="earned-sub">

                  vs
                  {earned.opponentTeamName ||
                    earned.opponentName}

                  {#if
                    earned.opponentPoints != null
                  }

                    •
                    {Number(
                      earned.opponentPoints
                    ).toFixed(2)}
                    pts

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
                  {earned.nominatedByTeamName ||
                    earned.nominatedByName}

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

  :global(body) {
    --badge-gold:
      #d6b15e;

    --badge-gold-bright:
      #edcc7d;

    --badge-cream:
      #f2eee4;

    --badge-ink:
      #0b0e0d;

    --badge-panel:
      #111513;

    --badge-line:
      rgba(
        214,
        177,
        94,
        .27
      );
  }



  /* ======================================================
     PAGE
     ====================================================== */

  .badge-page {
    display: grid;
    gap: 58px;

    padding-bottom: 75px;
  }


  .eyebrow,
  .hero-label,
  .section-label {
    color:
      var(--badge-gold);

    font-size: 11px;
    font-weight: 900;

    letter-spacing:
      .18em;

    text-transform:
      uppercase;
  }



  /* ======================================================
     HERO
     ====================================================== */

  .badge-hero {
    position: relative;

    overflow: hidden;

    padding:
      24px 28px 0;

    border-top:
      1px solid
      rgba(
        214,
        177,
        94,
        .55
      );

    border-bottom:
      1px solid
      rgba(
        214,
        177,
        94,
        .38
      );

    background:
      radial-gradient(
        circle at 80% 35%,
        rgba(
          214,
          177,
          94,
          .11
        ),
        transparent 32%
      ),
      linear-gradient(
        135deg,
        rgba(
          255,
          255,
          255,
          .035
        ),
        rgba(
          255,
          255,
          255,
          .008
        )
      );
  }


  .badge-hero::after {
    content: 'ICL';

    position: absolute;

    right: -20px;
    top: 35px;

    color:
      rgba(
        255,
        255,
        255,
        .018
      );

    font-size:
      clamp(
        180px,
        23vw,
        360px
      );

    font-weight: 950;

    line-height: .8;

    pointer-events: none;
  }


  .hero-topline {
    position: relative;
    z-index: 2;

    display: flex;

    align-items: center;

    justify-content:
      space-between;

    padding-bottom: 18px;

    border-bottom:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );
  }


  .hero-document {
    color:
      rgba(
        255,
        255,
        255,
        .38
      );

    font-size: 10px;
    font-weight: 800;

    letter-spacing:
      .12em;

    text-transform:
      uppercase;
  }


  .hero-document span {
    margin: 0 8px;

    color:
      var(--badge-gold);
  }


  .hero-main {
    position: relative;
    z-index: 2;

    display: grid;

    grid-template-columns:
      minmax(0, 1fr)
      minmax(360px, .7fr);

    align-items: center;

    gap: 45px;

    min-height: 315px;

    padding:
      36px 8px;
  }


  .hero-copy h1 {
    margin:
      6px 0 14px;

    color:
      var(--badge-cream);

    font-size:
      clamp(
        60px,
        7.5vw,
        112px
      );

    line-height: .86;

    letter-spacing:
      -.04em;

    text-transform:
      uppercase;
  }


  .hero-copy h1 span {
    display: block;

    color:
      var(--badge-gold);
  }


  .hero-copy p {
    max-width: 680px;

    margin: 0;

    color:
      rgba(
        255,
        255,
        255,
        .61
      );

    font-size: 17px;

    line-height: 1.5;
  }



  /* ======================================================
     HERO BADGES
     ====================================================== */

  .hero-badges {
    position: relative;

    min-height: 245px;
  }


  .hero-badge {
    position: absolute;

    width: 175px;
    height: 175px;

    object-fit: contain;

    filter:
      drop-shadow(
        0 18px 20px
        rgba(
          0,
          0,
          0,
          .48
        )
      );
  }


  .hero-badge-left {
    left: 5px;
    top: 55px;

    transform:
      rotate(-12deg);

    opacity: .62;
  }


  .hero-badge-center {
    left: 50%;
    top: 10px;

    width: 205px;
    height: 205px;

    transform:
      translateX(-50%);

    z-index: 3;
  }


  .hero-badge-right {
    right: 5px;
    top: 55px;

    transform:
      rotate(12deg);

    opacity: .62;
  }



  /* ======================================================
     HERO STATS
     ====================================================== */

  .badge-stats {
    position: relative;
    z-index: 2;

    display: grid;

    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    border-top:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );
  }


  .badge-stats > div {
    display: flex;

    align-items:
      baseline;

    gap: 11px;

    padding:
      20px 16px;

    border-right:
      1px solid
      rgba(
        255,
        255,
        255,
        .08
      );
  }


  .badge-stats > div:last-child {
    border-right: 0;
  }


  .badge-stats strong {
    color:
      var(--badge-gold-bright);

    font-size: 28px;

    line-height: 1;
  }


  .badge-stats span {
    color:
      rgba(
        255,
        255,
        255,
        .39
      );

    font-size: 10px;
    font-weight: 800;

    letter-spacing:
      .09em;

    text-transform:
      uppercase;
  }



  /* ======================================================
     DIRECTORY
     ====================================================== */

  .badge-directory {
    display: grid;
    gap: 22px;
  }


  .directory-heading {
    display: flex;

    align-items:
      flex-end;

    justify-content:
      space-between;

    gap: 30px;

    padding-bottom: 17px;

    border-bottom:
      1px solid
      var(--badge-line);
  }


  .directory-heading h2 {
    margin:
      5px 0 0;

    color:
      var(--badge-cream);

    font-size:
      clamp(
        34px,
        4.5vw,
        56px
      );

    line-height: .95;

    text-transform:
      uppercase;
  }


  .directory-heading p {
    max-width: 380px;

    margin: 0;

    color:
      rgba(
        255,
        255,
        255,
        .42
      );

    font-size: 12px;

    text-align: right;
  }


  .category-grid {
    display: grid;

    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );

    border-top:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );

    border-left:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );
  }


  .category-card {
    display: grid;

    grid-template-columns:
      38px
      minmax(0, 1fr)
      auto
      25px;

    align-items: center;

    gap: 14px;

    min-height: 90px;

    padding:
      14px 17px;

    border-right:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );

    border-bottom:
      1px solid
      rgba(
        255,
        255,
        255,
        .09
      );

    background:
      rgba(
        255,
        255,
        255,
        .012
      );

    color: inherit;

    text-decoration: none;

    transition:
      background .15s ease;
  }


  .category-card:hover {
    background:
      rgba(
        214,
        177,
        94,
        .055
      );
  }


  .category-number {
    color:
      rgba(
        214,
        177,
        94,
        .55
      );

    font-size: 11px;
    font-weight: 900;
  }


  .category-copy {
    display: grid;
    gap: 4px;
  }


  .category-copy strong {
    color:
      var(--badge-cream);

    font-size: 14px;

    text-transform:
      uppercase;
  }


  .category-copy span {
    color:
      rgba(
        255,
        255,
        255,
        .42
      );

    font-size: 11px;
  }


  .category-count {
    display: grid;

    min-width: 65px;

    text-align: right;
  }


  .category-count strong {
    color:
      var(--badge-gold-bright);

    font-size: 23px;

    line-height: 1;
  }


  .category-count span {
    margin-top: 3px;

    color:
      rgba(
        255,
        255,
        255,
        .30
      );

    font-size: 8px;
    font-weight: 800;

    letter-spacing:
      .08em;

    text-transform:
      uppercase;
  }


  .category-arrow {
    color:
      var(--badge-gold);

    font-size: 18px;

    text-align: right;
  }



  /* ======================================================
     BADGE CABINET
     ====================================================== */

  .badge-cabinet {
    display: grid;
    gap: 30px;

    scroll-margin-top: 100px;
  }



  /* ======================================================
     BADGE SECTIONS
     ====================================================== */

  .badge-section {
    display: grid;
    gap: 17px;

    padding-top: 10px;

    scroll-margin-top: 95px;
  }


  .badge-section +
  .badge-section {
    margin-top: 18px;
  }


  .badge-section-head {
    display: grid;

    grid-template-columns:
      3px
      minmax(0, 1fr)
      auto;

    gap: 13px;

    align-items: stretch;

    padding-bottom: 12px;

    border-bottom:
      1px solid
      rgba(
        255,
        255,
        255,
        .07
      );
  }


  .section-bar {
    width: 3px;

    min-height: 50px;

    background:
      linear-gradient(
        180deg,
        var(--badge-gold-bright),
        var(--badge-gold)
      );

    box-shadow:
      0 0 14px
      rgba(
        214,
        177,
        94,
        .18
      );
  }


  .badge-section-head p {
    margin:
      5px 0 0;

    color:
      rgba(
        255,
        255,
        255,
        .58
      );

    font-size: 13px;
  }


  .section-count {
    display: grid;

    align-content: center;

    text-align: right;
  }


  .section-count strong {
    color:
      var(--badge-gold-bright);

    font-size: 25px;

    line-height: 1;
  }


  .section-count span {
    margin-top: 3px;

    color:
      rgba(
        255,
        255,
        255,
        .3
      );

    font-size: 8px;
    font-weight: 800;

    letter-spacing:
      .1em;

    text-transform:
      uppercase;
  }



  /* ======================================================
     BADGE GRID
     ====================================================== */

  .badge-grid {
    display: grid;

    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );

    gap: 16px;
  }


  .badge-card {
    width: 100%;

    min-height: 190px;

    padding: 17px;

    display: flex;

    flex-direction:
      column;

    gap: 13px;

    text-align: left;

    color: inherit;

    font: inherit;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        .11
      );

    border-radius: 17px;

    background:
      linear-gradient(
        180deg,
        rgba(
          255,
          255,
          255,
          .10
        ) 0%,
        rgba(
          255,
          255,
          255,
          .045
        ) 20%,
        rgba(
          255,
          255,
          255,
          .018
        ) 100%
      );

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .10
      ),
      0 10px 22px
      rgba(
        0,
        0,
        0,
        .23
      );

    cursor: pointer;

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease,
      box-shadow .14s ease;
  }


  .badge-card:hover {
    transform:
      translateY(-3px);

    border-color:
      rgba(
        214,
        177,
        94,
        .42
      );

    background:
      linear-gradient(
        180deg,
        rgba(
          214,
          177,
          94,
          .09
        ),
        rgba(
          255,
          255,
          255,
          .025
        )
      );

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .13
      ),
      0 16px 30px
      rgba(
        0,
        0,
        0,
        .32
      );
  }


  .badge-card:focus-visible {
    outline:
      2px solid
      var(--badge-gold);

    outline-offset: 3px;
  }


  .badge-card.unearned {
    opacity: .72;
  }



  /* ======================================================
     BADGE CARD CONTENT
     ====================================================== */

  .badge-card-head {
    display: grid;

    grid-template-columns:
      62px
      minmax(0, 1fr)
      auto;

    gap: 13px;

    align-items: center;
  }


  .badge-avatar {
    width: 62px;
    height: 62px;

    display: grid;

    place-items: center;

    background:
      rgba(
        0,
        0,
        0,
        .15
      );

    overflow: hidden;
  }


  .badge-avatar img {
    width: 100%;
    height: 100%;

    object-fit: contain;

    filter:
      drop-shadow(
        0 4px 5px
        rgba(
          0,
          0,
          0,
          .4
        )
      );
  }


  .badge-title {
    min-width: 0;

    display: flex;

    flex-direction:
      column;

    gap: 3px;
  }


  .badge-title strong {
    color:
      var(--badge-cream);

    font-size: 17px;

    line-height: 1.1;
  }


  .badge-title small {
    color:
      rgba(
        255,
        255,
        255,
        .48
      );

    font-size: 11px;
  }


  .earned-chip {
    min-width: 35px;
    height: 35px;

    padding: 0 8px;

    display: grid;

    place-items: center;

    border-radius: 999px;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        .12
      );

    background:
      rgba(
        0,
        0,
        0,
        .22
      );

    color:
      var(--badge-gold-bright);

    font-size: 13px;
    font-weight: 900;
  }


  .badge-definition {
    display: block;

    flex: 1;

    color:
      rgba(
        255,
        255,
        255,
        .76
      );

    font-size: 14px;

    line-height: 1.45;
  }


  .earned-area {
    display: flex;

    flex-direction:
      column;

    gap: 8px;

    padding-top: 5px;

    border-top:
      1px solid
      rgba(
        255,
        255,
        255,
        .055
      );
  }


  .earned-label {
    color:
      var(--badge-gold);

    font-size: 9px;
    font-weight: 900;

    text-transform:
      uppercase;

    letter-spacing:
      .16em;
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
      1px solid
      rgba(
        255,
        255,
        255,
        .15
      );

    background:
      rgba(
        0,
        0,
        0,
        .3
      );

    box-shadow:
      0 3px 7px
      rgba(
        0,
        0,
        0,
        .35
      );

    overflow: hidden;
  }


  .team-logo-wrap img {
    width: 100%;
    height: 100%;

    object-fit: cover;
  }


  .empty {
    color:
      rgba(
        255,
        255,
        255,
        .42
      );

    font-size: 12px;
  }


  .empty-category {
    grid-column:
      1 / -1;

    padding: 32px;

    text-align: center;

    color:
      rgba(
        255,
        255,
        255,
        .45
      );

    border:
      1px dashed
      rgba(
        255,
        255,
        255,
        .12
      );
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
      rgba(
        0,
        0,
        0,
        .72
      );

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
      translate(
        -50%,
        -50%
      );

    width:
      min(
        680px,
        calc(
          100vw - 30px
        )
      );

    max-height:
      min(
        760px,
        calc(
          100vh - 40px
        )
      );

    overflow: auto;

    padding: 25px;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        .15
      );

    border-top:
      2px solid
      var(--badge-gold);

    color: white;

    background:
      linear-gradient(
        180deg,
        #252b2b 0%,
        #161a19 20%,
        #0d1010 100%
      );

    box-shadow:
      inset 0 1px 0
      rgba(
        255,
        255,
        255,
        .17
      ),
      0 35px 90px
      rgba(
        0,
        0,
        0,
        .75
      );
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
      1px solid
      rgba(
        255,
        255,
        255,
        .12
      );

    background:
      rgba(
        0,
        0,
        0,
        .32
      );

    color:
      rgba(
        255,
        255,
        255,
        .75
      );

    font-size: 21px;

    cursor: pointer;
  }


  .modal-close:hover {
    color: white;

    border-color:
      rgba(
        214,
        177,
        94,
        .45
      );
  }


  .modal-head {
    display: grid;

    grid-template-columns:
      88px
      minmax(0, 1fr)
      auto;

    gap: 17px;

    align-items: center;

    padding-right: 42px;
  }


  .modal-badge {
    width: 88px;
    height: 88px;

    display: grid;

    place-items: center;
  }


  .modal-badge img {
    width: 100%;
    height: 100%;

    object-fit: contain;
  }


  .modal-heading h2 {
    margin:
      5px 0 2px;

    color:
      var(--badge-cream);

    font-size: 28px;
  }


  .modal-id {
    color:
      rgba(
        255,
        255,
        255,
        .5
      );

    font-size: 12px;
  }


  .modal-count {
    min-width: 43px;
    height: 43px;

    display: grid;

    place-items: center;

    border-radius: 999px;

    border:
      1px solid
      rgba(
        214,
        177,
        94,
        .3
      );

    background:
      rgba(
        0,
        0,
        0,
        .3
      );

    color:
      var(--badge-gold-bright);

    font-size: 15px;
    font-weight: 900;
  }


  .modal-definition {
    margin:
      22px 0;

    color:
      rgba(
        255,
        255,
        255,
        .74
      );

    line-height: 1.5;
  }


  .earned-list {
    display: grid;

    gap: 9px;
  }


  .earned-row {
    display: grid;

    grid-template-columns:
      50px
      minmax(0, 1fr);

    gap: 13px;

    align-items: start;

    padding: 12px;

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        .08
      );

    background:
      rgba(
        255,
        255,
        255,
        .035
      );
  }


  .earned-logo {
    width: 50px;
    height: 50px;

    object-fit: cover;

    background:
      rgba(
        0,
        0,
        0,
        .3
      );

    border:
      1px solid
      rgba(
        255,
        255,
        255,
        .12
      );
  }


  .earned-details {
    min-width: 0;
  }


  .earned-details strong {
    display: block;

    color:
      var(--badge-cream);

    font-size: 14px;
  }


  .muted,
  .earned-sub,
  .earned-nominator {
    color:
      rgba(
        255,
        255,
        255,
        .5
      );

    font-size: 12px;
  }


  .earned-sub {
    margin-top: 5px;
  }


  .earned-explanation {
    margin-top: 8px;

    color:
      rgba(
        255,
        255,
        255,
        .75
      );

    font-size: 13px;

    line-height: 1.4;
  }


  .earned-nominator {
    margin-top: 7px;

    color:
      var(--badge-gold);
  }


  .modal-empty {
    padding: 25px;

    text-align: center;

    color:
      rgba(
        255,
        255,
        255,
        .48
      );

    border:
      1px dashed
      rgba(
        255,
        255,
        255,
        .13
      );
  }



  /* ======================================================
     RESPONSIVE
     ====================================================== */

  @media (
    max-width: 1100px
  ) {

    .hero-main {
      grid-template-columns:
        minmax(0, 1fr)
        320px;
    }


    .hero-badge {
      width: 145px;
      height: 145px;
    }


    .hero-badge-center {
      width: 175px;
      height: 175px;
    }


    .badge-grid {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }

  }



  @media (
    max-width: 800px
  ) {

    .badge-page {
      gap: 45px;
    }


    .hero-main {
      grid-template-columns:
        1fr;
    }


    .hero-badges {
      min-height: 210px;

      max-width: 460px;

      width: 100%;
    }


    .badge-stats {
      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );
    }


    .badge-stats > div:nth-child(2) {
      border-right: 0;
    }


    .directory-heading {
      align-items:
        flex-start;

      flex-direction:
        column;

      gap: 12px;
    }


    .directory-heading p {
      text-align: left;
    }


    .category-grid {
      grid-template-columns:
        1fr;
    }


    .badge-grid {
      grid-template-columns:
        1fr;
    }

  }



  @media (
    max-width: 560px
  ) {

    .badge-hero {
      padding:
        20px 16px 0;
    }


    .hero-topline {
      align-items:
        flex-start;

      gap: 14px;
    }


    .hero-document {
      text-align: right;
    }


    .hero-copy h1 {
      font-size:
        clamp(
          58px,
          19vw,
          88px
        );
    }


    .hero-copy p {
      font-size: 15px;
    }


    .hero-badges {
      min-height: 170px;
    }


    .hero-badge {
      width: 115px;
      height: 115px;
    }


    .hero-badge-left {
      top: 40px;
    }


    .hero-badge-center {
      width: 145px;
      height: 145px;

      top: 0;
    }


    .hero-badge-right {
      top: 40px;
    }


    .badge-stats {
      grid-template-columns:
        1fr;
    }


    .badge-stats > div {
      border-right: 0;

      border-bottom:
        1px solid
        rgba(
          255,
          255,
          255,
          .07
        );
    }


    .badge-stats > div:last-child {
      border-bottom: 0;
    }


    .category-card {
      grid-template-columns:
        30px
        minmax(0, 1fr)
        auto;

      min-height: 78px;
    }


    .category-arrow {
      display: none;
    }


    .category-copy span {
      font-size: 10px;
    }


    .badge-section-head {
      grid-template-columns:
        3px
        minmax(0, 1fr);
    }


    .section-count {
      display: none;
    }


    .badge-card {
      min-height: 0;
    }


    .badge-card-head {
      grid-template-columns:
        56px
        minmax(0, 1fr)
        auto;
    }


    .badge-avatar {
      width: 56px;
      height: 56px;
    }


    .modal-head {
      grid-template-columns:
        70px
        minmax(0, 1fr);

      padding-right: 30px;
    }


    .modal-badge {
      width: 70px;
      height: 70px;
    }


    .modal-count {
      display: none;
    }

  }

</style>