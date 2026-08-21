<script>
	export let data;

	$: rivalryStats = data?.rivalries ?? [];

	$: seasonArchive = data?.seasonArchive ?? [];

	function score(value) {
		const number = Number(value);

		return Number.isFinite(number) ? number.toFixed(2) : '0.00';
	}

	function marginWinner(rivalry, game) {
		if (!game) {
			return '—';
		}

		if (game.leftScore > game.rightScore) {
			return rivalry.left.teamName;
		}

		if (game.rightScore > game.leftScore) {
			return rivalry.right.teamName;
		}

		return 'Tie';
	}

	const archiveLinks = [
		{
			href: '/history/awards',
			number: '01',
			title: 'Championship Ledger',
			description: 'Titles, title years and the managers who collected them.'
		},
		{
			href: '/history/records',
			number: '02',
			title: 'Record Book',
			description: 'League records, statistical leaders and permanent bragging rights.'
		},
		{
			href: '/history/rivalry',
			number: '03',
			title: 'Rivalry Files',
			description: 'The grudges, counterparts and recurring wars of the Collective.'
		},
		{
			href: '/history/badges',
			number: '04',
			title: 'Trophy Case',
			description: 'Honors, dishonors, personas, service and stains.'
		}
	];

	const badgeCategoryNames = {
		personas: 'Personas',
		weekly: 'Weekly Honors',
		luck: 'Luck',
		stains: 'Stains',
		yearly: 'Service',
		legacy: 'Legacy'
	};

	function badgeCategoryName(key) {
		return badgeCategoryNames[key] || key;
	}

	function leagueClass(league) {
		const value = String(league || 'legacy')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-');

		return `league-${value}`;
	}
</script>

<svelte:head>
	<title>History | Irving Collective</title>
</svelte:head>

<div class="archive-page">
	<!-- =====================================================
       HERO
       ===================================================== -->

	<section class="archive-hero">
		<div class="hero-topline">
			<div class="archive-kicker">Irving Collective Archives</div>

			<div class="archive-document">
				EST. {data.archiveStartYear}
				<span>•</span>
				DOCUMENT IC-H01
			</div>
		</div>

		<div class="hero-main">
			<div class="hero-copy">
				<div class="hero-label"></div>

				<h1>
					<span>The</span>
					Archive
				</h1>

				<p>
					Championships, grudges, legends, stains and {data.historyYears} years of receipts.
				</p>
			</div>

			<div class="era-mark">
				<span>
					{data.archiveStartYear}
				</span>

				<div class="era-line">
					<i></i>
				</div>

				<span>
					{data.currentYear}
				</span>

				<small> Irving Collective </small>
			</div>
		</div>

		<div class="archive-stats">
			<div class="archive-stat">
				<strong>
					{data.historyYears}
				</strong>
				<span> Years of history </span>
			</div>

			<div class="archive-stat">
				<strong>
					{data.archiveStats.franchises}
				</strong>
				<span> Current franchises </span>
			</div>

			<div class="archive-stat">
				<strong>
					{data.archiveStats.championships}
				</strong>
				<span> Crowns on file </span>
			</div>

			<div class="archive-stat">
				<strong>
					{data.archiveStats.rivalries}
				</strong>
				<span> Rivalry files </span>
			</div>
		</div>
	</section>

	<!-- =====================================================
       YEAR INDEX
       ===================================================== -->

	<section class="year-index">
		<div class="year-index-head">
			<span> Archive Index </span>

			<small> Gold markers indicate championship seasons currently on file. </small>
		</div>

		<div class="year-rail">
			{#each data.archiveYears as year}
				<div
					class:current-year={year === data.currentYear}
					class:has-title={data.championshipYears.includes(year)}
					class="year-node"
				>
					<span>
						{year}
					</span>

					<i></i>
				</div>
			{/each}
		</div>
	</section>

	<!-- =====================================================
       CHAMPIONSHIP WALL
       ===================================================== -->

	<section class="archive-section championship-section">
		<header class="section-heading">
			<div>
				<div class="section-kicker">Exhibit 01</div>

				<h2>Championship Wall</h2>

				<p>The most recent crowns preserved in the Irving and DTSP record.</p>
			</div>

			<a class="section-link" href="/history/awards">
				Full championship ledger
				<span>→</span>
			</a>
		</header>

		<div class="championship-wall">
			{#each data.recentChampionships as title, index}
				<article
  class:featured-champion={index === 0}
  class={`champion-entry ${leagueClass(title.league)}`}
>
					<div class="champion-year">
						{title.year}
					</div>

					<div class={`league-mark ${leagueClass(title.league)} `}>
						<span>{title.league} Champion</span>
					</div>

					<div class="champion-identity">
						{#if title.chiclet || title.photo}
	<img
		src={title.chiclet || title.photo}
		alt=""
		loading="lazy"
	/>
{/if}

						<div>
							<span>
								{title.league} Champion
							</span>

							<strong>
								{title.teamName}
							</strong>

							<small>
								{title.managerName}
							</small>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<!-- =====================================================
       RECORD BOOK
       ===================================================== -->

	<section class="archive-section">
		<header class="section-heading">
			<div>
				<div class="section-kicker">Exhibit 02</div>

				<h2>The Record Book</h2>

				<p>
					The title hierarchy and the franchises that have been here long enough to know better.
				</p>
			</div>

			<a class="section-link" href="/history/records">
				Open record book
				<span>→</span>
			</a>
		</header>

		<div class="record-layout">
			<!-- TITLE LEADERS -->

			<div class="record-board">
				<div class="record-board-title">
					<span> Championship Leaders </span>

					<small> Current franchise registry </small>
				</div>

				<div class="leader-table">
					{#each data.titleLeaders.slice(0, 6) as leader, index}
						<div class="leader-row">
							<div class="leader-rank">
								{String(index + 1).padStart(2, '0')}
							</div>

							<div class="leader-team">
								{#if leader.chiclet || leader.photo}
	<img
		src={leader.chiclet || leader.photo}
		alt=""
		loading="lazy"
	/>
{/if}
								<div>
									<strong>
										{leader.teamName}
									</strong>

									<span>
										{leader.managerName}
									</span>
								</div>
							</div>

							<div class="leader-years">
								{leader.years.join(' · ')}
							</div>

							<div class="leader-total">
								<strong>
									{leader.count}
								</strong>

								<span>
									{leader.count === 1 ? 'TITLE' : 'TITLES'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- RECORD SIDEBAR -->

			<aside class="record-sidebar">
				<div class="ledger-block">
					<div class="record-board-title">
						<span> Legacy Ledger </span>

						<small> Crowns by league </small>
					</div>

					{#each data.leagueTotals as league}
						<div class="legacy-row">
							<span>
								{league.league}
							</span>

							<strong>
								{league.count}
							</strong>
						</div>
					{/each}
				</div>

				<div class="ledger-block">
					<div class="record-board-title">
						<span> Old Guard </span>

						<small> Earliest active franchise starts </small>
					</div>

					<div class="tenure-list">
						{#each data.tenureLeaders as manager}
							<div class="tenure-row">
								<span>
									{manager.fantasyStart}
								</span>

								<div>
									<strong>
										{manager.teamName}
									</strong>

									<small>
										{manager.managerName}
									</small>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</aside>
		</div>
	</section>

	<!-- =====================================================
     RIVALRY VAULT
     ===================================================== -->

<section class="archive-section rivalry-section">

  <header class="section-heading">

    <div>

      <div class="section-kicker">
        Exhibit 03
      </div>

      <h2>
        Rivalry Vault
      </h2>

      <p>
        Actual head-to-head receipts from
        the merged era.
      </p>

    </div>


    <a
      class="section-link"
      href="/history/rivalry"
    >
      Enter rivalry vault
      <span>→</span>
    </a>

  </header>


  <div class="rivalry-files">

    {#each rivalryStats as rivalry, index}

      <article class="rivalry-file">


        <div class="file-heading">

          <div class="file-number">
            Rivalry File
            {String(index + 1).padStart(2, '0')}
          </div>

          <div class="merged-era-tag">
            {data.mergerStartYear}–Present
          </div>

        </div>



        <div class="rivalry-scoreboard">


          <!-- LEFT -->

          <div class="rival-team">

         {#if rivalry.left.chiclet || rivalry.left.photo}
	<img
		src={rivalry.left.chiclet || rivalry.left.photo}
		alt=""
		loading="lazy"
	/>
{/if}

            <div>

              <strong>
                {rivalry.left.teamName}
              </strong>

              <span>
                {rivalry.left.name}
              </span>

            </div>

          </div>



          <!-- SERIES -->

          <div class="series-center">

            <span>
              H2H Series
            </span>

            <div class="series-record">

              <strong>
                {rivalry.leftWins}
              </strong>

              <i>—</i>

              <strong>
                {rivalry.rightWins}
              </strong>

            </div>

            {#if rivalry.ties > 0}

              <small>
                {rivalry.ties}
                {rivalry.ties === 1
                  ? ' tie'
                  : ' ties'}
              </small>

            {:else}

              <small>
                {rivalry.seriesLeader}
              </small>

            {/if}

          </div>



          <!-- RIGHT -->

          <div class="rival-team right">

            <div>

              <strong>
                {rivalry.right.teamName}
              </strong>

              <span>
                {rivalry.right.name}
              </span>

            </div>

           {#if rivalry.right.chiclet || rivalry.right.photo}
	<img
		src={rivalry.right.chiclet || rivalry.right.photo}
		alt=""
		loading="lazy"
	/>
{/if}

          </div>

        </div>



        {#if rivalry.hasData}

          <div class="rivalry-receipts">


            <div class="receipt-stat">

              <span>
                Meetings
              </span>

              <strong>
                {rivalry.meetings}
              </strong>

            </div>


            <div class="receipt-stat">

              <span>
                Total Points
              </span>

              <strong>
                {score(rivalry.leftPoints)}
                <i>—</i>
                {score(rivalry.rightPoints)}
              </strong>

            </div>


            <div class="receipt-stat">

              <span>
                Current Streak
              </span>

              <strong>
                {rivalry.currentStreak.label}
              </strong>

            </div>


            <div class="receipt-stat">

              <span>
                Playoff Meetings
              </span>

              <strong>
                {rivalry.playoffMeetings}
              </strong>

            </div>

          </div>



          {#if rivalry.lastMeeting}

            <div class="last-meeting">

              <div>

                <span>
                  Last Meeting
                </span>

                <strong>
                  {rivalry.lastMeeting.season}
                  · Week
                  {rivalry.lastMeeting.week}

                  {#if rivalry.lastMeeting.playoff}
                    · Playoffs
                  {/if}
                </strong>

              </div>


              <div class="last-score">

                <span>
                  {rivalry.left.teamName}
                </span>

                <strong>
                  {score(rivalry.lastMeeting.leftScore)}
                  —
                  {score(rivalry.lastMeeting.rightScore)}
                </strong>

                <span>
                  {rivalry.right.teamName}
                </span>

              </div>

            </div>

          {/if}



          {#if rivalry.biggestBlowout}

            <div class="rivalry-footnote">

              Biggest margin on file:

              <strong>
                {marginWinner(
                  rivalry,
                  rivalry.biggestBlowout
                )}
              </strong>

              by

              <strong>
                {score(
                  rivalry.biggestBlowout.margin
                )}
              </strong>

              points.

            </div>

          {/if}


        {:else}

          <div class="rivalry-empty">

            <strong>
              No merged-era meeting on file yet.
            </strong>

            <span>
              The grudge exists. The receipts do not.
            </span>

          </div>

        {/if}


      </article>

    {/each}

  </div>

</section>

	<!-- =====================================================
       TROPHY CASE
       ===================================================== -->

	<section class="archive-section trophy-section">
		<header class="section-heading">
			<div>
				<div class="section-kicker">Exhibit 04</div>

				<h2>Trophy Case</h2>

				<p>Honors, dishonors, personas and permanent stains.</p>
			</div>

			<a class="section-link" href="/history/badges">
				Open full trophy case
				<span>→</span>
			</a>
		</header>

		<div class="trophy-layout">
			<div class="badge-showcase">
				{#each data.badgeHighlights as badge}
					<a class="badge-exhibit" href="/history/badges">
						<div class="badge-image">
							<img src={badge.icon} alt="" loading="lazy" />
						</div>

						<div class="badge-copy">
							<span>
								#{badge.id}
							</span>

							<strong>
								{badge.name}
							</strong>

							<p>
								{badge.definition}
							</p>
						</div>

						<div class="badge-count">
							<strong>
								{badge.count}
							</strong>

							<span> earned </span>
						</div>
					</a>
				{/each}
			</div>

			<aside class="trophy-ledger">
				<div class="trophy-total">
					<span> Awards preserved </span>

					<strong>
						{data.badgeMeta?.displayedAwards ?? 0}
					</strong>
				</div>

				<div class="category-ledger">
					{#each data.badgeCategories as category}
						<div class="category-row">
							<span>
								{badgeCategoryName(category.key)}
							</span>

							<div></div>

							<strong>
								{category.awards}
							</strong>
						</div>
					{/each}
				</div>
			</aside>
		</div>
	</section>

<!-- =====================================================
     SEASON ARCHIVE
     ===================================================== -->

<section class="season-archive">

  <header class="season-archive-heading">

    <div>

      <div class="section-kicker">
        Merged Era
      </div>

      <h2>
        Season Archive
      </h2>

      <p>
        The permanent record begins with the
        Irving Collective era. Earlier league
        history can be added when the receipts
        exist.
      </p>

    </div>

    <div class="archive-range">
      {data.mergerStartYear}
      <span>—</span>
      Present
    </div>

  </header>


  <div class="season-ledger">

    {#each seasonArchive as season}

      <article
        class:current-season={season.current}
        class="season-row"
      >


        <div class="season-year">

          <strong>
            {season.season}
          </strong>

          <span>
            {season.statusLabel}
          </span>

        </div>



        <div class="season-feature">

          {#if season.champion}

            {#if season.champion.teamChiclet || season.champion.teamPhoto}
	<img
		src={season.champion.teamChiclet || season.champion.teamPhoto}
		alt=""
		loading="lazy"
	/>
{/if}

            <div>

              <span>
                League Champion
              </span>

              <strong>
                {season.champion.teamName}
              </strong>

              <small>
                {season.champion.managerName}
              </small>

            </div>

          {:else}

            <div class="season-open-mark">
              IC
            </div>

            <div>

              <span>
                Season Status
              </span>

              <strong>
                {season.current
                  ? 'The season is live'
                  : 'No champion on file'}
              </strong>

              <small>
                {season.leagueName}
              </small>

            </div>

          {/if}

        </div>



        <div class="season-facts">

          <div>

            <span>
              Franchises
            </span>

            <strong>
              {season.teamCount}
            </strong>

          </div>


          <div>

            <span>
              Weeks on File
            </span>

            <strong>
              {season.weeksWithData}
            </strong>

          </div>


          <div>

            <span>
              Weekly Recaps
            </span>

            <strong>
              {season.recapCount}
            </strong>

          </div>

        </div>



        <div class="season-actions">

          <a
            href={season.links.standings}
          >
            Standings
          </a>

          <a
            href={season.links.draft}
          >
            Draft
          </a>

          <a
            href={season.links.matchups}
          >
            Matchups
          </a>

        </div>


      </article>

    {/each}


    {#if !seasonArchive.length}

      <div class="season-empty">

        No merged-era Sleeper seasons were
        found in the league history chain.

      </div>

    {/if}

  </div>

</section>

</div>

<style>
	:global(body) {
		--archive-gold: #d6b15e;
		--archive-gold-bright: #edcc7d;
		--archive-cream: #f2eee4;
		--archive-ink: #0b0e0d;
		--archive-panel: #111513;
		--archive-panel-soft: #171b18;
		--archive-line: rgba(214, 177, 94, 0.28);
	}

	/* =====================================================
     PAGE
     ===================================================== */

	.archive-page {
		display: grid;
		gap: 82px;
		padding-bottom: 90px;
	}

	.archive-kicker,
	.section-kicker,
	.hero-label,
	.archive-document,
	.record-board-title span,
	.file-number {
		color: var(--archive-gold);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	/* =====================================================
     HERO
     ===================================================== */

	.archive-hero {
		position: relative;
		overflow: hidden;

		border-top: 1px solid rgba(214, 177, 94, 0.65);

		border-bottom: 1px solid rgba(214, 177, 94, 0.38);

		background:
			radial-gradient(circle at 77% 30%, rgba(214, 177, 94, 0.11), transparent 34%),
			linear-gradient(
				135deg,
				rgba(255, 255, 255, 0.045),
				rgba(255, 255, 255, 0.012) 55%,
				rgba(214, 177, 94, 0.035)
			);

		padding: 24px 28px 0;
	}

	.archive-hero::before {
		content: 'ICL';

		position: absolute;
		right: -15px;
		top: 15px;

		color: rgba(255, 255, 255, 0.025);

		font-size: clamp(150px, 22vw, 330px);

		font-weight: 950;
		line-height: 0.8;
		letter-spacing: -0.08em;

		pointer-events: none;
	}

	.hero-topline {
		position: relative;
		z-index: 1;

		display: flex;
		align-items: center;
		justify-content: space-between;

		padding-bottom: 18px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.archive-document {
		color: rgba(255, 255, 255, 0.45);

		font-size: 9px;
	}

	.archive-document span {
		margin: 0 8px;
		color: var(--archive-gold);
	}

	.hero-main {
		position: relative;
		z-index: 1;

		display: grid;
		grid-template-columns:
			minmax(0, 1fr)
			auto;

		gap: 40px;

		min-height: 330px;

		align-items: center;

		padding: 46px 8px 48px;
	}

	.hero-copy h1 {
		display: flex;
		align-items: baseline;
		gap: 15px;

		margin: 5px 0 12px;

		color: var(--archive-cream);

		font-size: clamp(70px, 9vw, 138px);

		line-height: 0.86;

		letter-spacing: -0.045em;

		text-transform: uppercase;
	}

	.hero-copy h1 span {
		color: var(--archive-gold);

		font-size: 0.24em;

		letter-spacing: 0.04em;
	}

	.hero-copy p {
		max-width: 700px;

		margin: 20px 0 0;

		color: rgba(255, 255, 255, 0.68);

		font-size: clamp(16px, 2vw, 22px);

		line-height: 1.5;
	}

	.era-mark {
		display: grid;
		grid-template-columns: auto 70px auto;
		align-items: center;
		gap: 10px;

		min-width: 320px;

		color: var(--archive-cream);

		font-size: 30px;

		font-weight: 900;
	}

	.era-line {
		height: 1px;
		background: rgba(214, 177, 94, 0.5);
	}

	.era-line i {
		display: block;
		width: 8px;
		height: 8px;

		margin: -3px auto 0;

		border: 2px solid var(--archive-gold);

		border-radius: 50%;

		background: var(--archive-ink);
	}

	.era-mark small {
		grid-column: 1 / -1;

		text-align: center;

		color: rgba(255, 255, 255, 0.4);

		font-size: 9px;
		letter-spacing: 0.26em;
		text-transform: uppercase;
	}

	.archive-stats {
		position: relative;
		z-index: 1;

		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));

		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.archive-stat {
		display: flex;
		align-items: baseline;
		gap: 12px;

		padding: 22px 16px;

		border-right: 1px solid rgba(255, 255, 255, 0.08);
	}

	.archive-stat:first-child {
		padding-left: 8px;
	}

	.archive-stat:last-child {
		border-right: 0;
	}

	.archive-stat strong {
		color: var(--archive-gold-bright);

		font-size: 28px;
	}

	.archive-stat span {
		color: rgba(255, 255, 255, 0.48);

		font-size: 10px;
		font-weight: 700;

		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	/* =====================================================
     YEAR INDEX
     ===================================================== */

	.year-index {
		display: grid;
		gap: 15px;
	}

	.year-index-head {
		display: flex;
		justify-content: space-between;
		gap: 20px;
		align-items: center;

		padding: 0 2px;
	}

	.year-index-head > span {
		color: var(--archive-gold);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.year-index-head small {
		color: rgba(255, 255, 255, 0.4);

		font-size: 10px;
	}

	.year-rail {
		display: flex;

		overflow: hidden;

		border-top: 1px solid rgba(255, 255, 255, 0.12);

		border-bottom: 1px solid rgba(255, 255, 255, 0.12);

		scrollbar-width: thin;
	}

	.year-node {
		position: relative;

		flex: 1 1 0;
		min-width: 54px;

		padding: 16px 8px 20px;

		text-align: center;

		color: rgba(255, 255, 255, 0.35);

		font-size: 12px;
		font-weight: 800;

		border-right: 1px solid rgba(255, 255, 255, 0.06);
	}

	.year-node i {
		position: absolute;
		left: 50%;
		bottom: 7px;

		width: 3px;
		height: 3px;

		transform: translateX(-50%);

		border-radius: 50%;

		background: rgba(255, 255, 255, 0.16);
	}

	.year-node.has-title {
		color: rgba(255, 255, 255, 0.8);
	}

	.year-node.has-title i {
		width: 5px;
		height: 5px;

		background: var(--archive-gold);

		box-shadow: 0 0 10px rgba(214, 177, 94, 0.5);
	}

	.year-node.current-year {
		background: rgba(214, 177, 94, 0.08);

		color: var(--archive-gold-bright);
	}

	/* =====================================================
     GENERIC SECTION
     ===================================================== */

	.archive-section {
		display: grid;
		gap: 28px;
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 30px;

		padding-bottom: 18px;

		border-bottom: 1px solid var(--archive-line);
	}

	.section-heading h2,
	.directory-heading h2 {
		margin: 6px 0 5px;

		color: var(--archive-cream);

		font-size: clamp(34px, 5vw, 58px);

		line-height: 0.95;

		text-transform: uppercase;
	}

	.section-heading p {
		margin: 0;

		color: rgba(255, 255, 255, 0.5);

		font-size: 13px;
	}

	.section-link {
		flex: none;

		color: rgba(255, 255, 255, 0.72);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: 0.12em;
		text-decoration: none;
		text-transform: uppercase;

		transition: color 0.15s ease;
	}

	.section-link span {
		margin-left: 8px;

		color: var(--archive-gold);
	}

	.section-link:hover {
		color: var(--archive-gold-bright);
	}

	/* =====================================================
     CHAMPIONSHIP WALL
     ===================================================== */

	.championship-wall {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));

		border-top: 1px solid rgba(255, 255, 255, 0.08);

		border-left: 1px solid rgba(255, 255, 255, 0.08);
	}

	.champion-entry {
		position: relative;

		min-height: 260px;

		padding: 22px;

		border-right: 1px solid rgba(255, 255, 255, 0.08);

		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		background: linear-gradient(145deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.008));

		overflow: hidden;
	}

.champion-entry::after {
  content: '';

  position: absolute;
  right: -45px;
  bottom: -55px;

  width: 220px;
  height: 220px;

  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;

  opacity: 0.055;

  pointer-events: none;
}

.champion-entry.league-irving::after {
  background-image: url('/badges/Irving.png');
}

.champion-entry.league-dtsp::after {
  background-image: url('/badges/DTSP.png');
}

.champion-entry.league-icl::after {
  background-image: url('/badges/ICLChamp.png');
}

	.champion-year {
		color: var(--archive-cream);

		font-size: 42px;
		font-weight: 900;

		line-height: 1;
		letter-spacing: -0.04em;
	}

	.league-mark {
		display: inline-flex;

		margin-top: 9px;
		padding: 4px 7px;

		border: 1px solid rgba(214, 177, 94, 0.28);

		color: var(--archive-gold);

		font-size: 8px;
		font-weight: 900;

		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.league-dtsp {
		color: rgba(255, 255, 255, 0.68);

		border-color: rgba(255, 255, 255, 0.18);
	}

	.champion-identity {
		position: absolute;
		z-index: 2;

		left: 22px;
		right: 22px;
		bottom: 22px;

		display: flex;
		align-items: center;
		gap: 13px;
	}

	.champion-identity img {
		width: 56px;
		height: 56px;

		object-fit: contain;
	}

	.champion-identity div {
		min-width: 0;

		display: grid;
		gap: 2px;
	}

	.champion-identity span {
		color: var(--archive-gold);

		font-size: 8px;
		font-weight: 800;

		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.champion-identity strong {
		overflow: hidden;

		color: var(--archive-cream);

		font-size: 14px;

		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.champion-identity small {
		color: rgba(255, 255, 255, 0.45);

		font-size: 10px;
	}

	/* =====================================================
     RECORD BOOK
     ===================================================== */

	.record-layout {
		display: grid;
		grid-template-columns:
			minmax(0, 1.75fr)
			minmax(280px, 0.75fr);

		gap: 28px;
	}

	.record-board,
	.ledger-block {
		border-top: 2px solid var(--archive-gold);

		background: rgba(255, 255, 255, 0.018);
	}

	.record-board-title {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;

		padding: 13px 16px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.record-board-title small {
		color: rgba(255, 255, 255, 0.35);

		font-size: 9px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.leader-row {
		display: grid;

		grid-template-columns:
			44px
			minmax(220px, 1fr)
			minmax(160px, auto)
			86px;

		align-items: center;
		gap: 12px;

		min-height: 76px;

		padding: 10px 16px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.leader-rank {
		color: rgba(214, 177, 94, 0.55);

		font-size: 14px;
		font-weight: 900;
	}

	.leader-team {
		display: flex;
		align-items: center;
		gap: 12px;

		min-width: 0;
	}

	.leader-team img {
		width: 43px;
		height: 43px;

		object-fit: contain;
	}

	.leader-team div {
		display: grid;
		gap: 2px;

		min-width: 0;
	}

	.leader-team strong {
		color: var(--archive-cream);

		font-size: 13px;
	}

	.leader-team span {
		color: rgba(255, 255, 255, 0.38);

		font-size: 10px;
	}

	.leader-years {
		color: rgba(255, 255, 255, 0.48);

		font-size: 10px;
		line-height: 1.5;

		text-align: right;
	}

	.leader-total {
		display: grid;

		text-align: right;
	}

	.leader-total strong {
		color: var(--archive-gold-bright);

		font-size: 27px;
		line-height: 1;
	}

	.leader-total span {
		margin-top: 3px;

		color: rgba(255, 255, 255, 0.35);

		font-size: 7px;
		font-weight: 800;

		letter-spacing: 0.14em;
	}

	.record-sidebar {
		display: grid;
		gap: 22px;
	}

	.legacy-row {
		display: flex;
		justify-content: space-between;
		align-items: center;

		padding: 18px 16px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.legacy-row span {
		color: rgba(255, 255, 255, 0.62);

		font-size: 12px;
		font-weight: 800;
	}

	.legacy-row strong {
		color: var(--archive-gold-bright);

		font-size: 26px;
	}

	.tenure-list {
		display: grid;
	}

	.tenure-row {
		display: grid;
		grid-template-columns: 54px 1fr;

		gap: 12px;

		align-items: center;

		padding: 11px 16px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.tenure-row > span {
		color: var(--archive-gold);

		font-size: 12px;
		font-weight: 900;
	}

	.tenure-row div {
		display: grid;
		gap: 2px;
	}

	.tenure-row strong {
		color: rgba(255, 255, 255, 0.78);

		font-size: 11px;
	}

	.tenure-row small {
		color: rgba(255, 255, 255, 0.32);

		font-size: 9px;
	}

	/* =====================================================
   RIVALRY VAULT
   ===================================================== */

.rivalry-files {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0,1fr));

  border:
    1px solid
    rgba(255,255,255,.09);

  background:
    rgba(255,255,255,.08);

  gap: 1px;
}


.rivalry-file {
  min-width: 0;

  padding:
    22px;

  background:
    var(--archive-ink);
}


.file-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;

  margin-bottom: 22px;
}


.file-number {
  margin: 0;
}


.merged-era-tag {
  color:
    rgba(255,255,255,.34);

  font-size: 8px;
  font-weight: 800;

  letter-spacing: .14em;
  text-transform: uppercase;
}


.rivalry-scoreboard {
  display: grid;

  grid-template-columns:
    minmax(0,1fr)
    125px
    minmax(0,1fr);

  gap: 18px;
  align-items: center;

  padding-bottom: 20px;

  border-bottom:
    1px solid
    rgba(255,255,255,.08);
}


.rival-team {
  display: flex;
  align-items: center;
  gap: 12px;

  min-width: 0;
}


.rival-team.right {
  justify-content: flex-end;
  text-align: right;
}


.rival-team img {
  flex: none;

  width: 52px;
  height: 52px;

  object-fit: contain;
}


.rival-team div {
  display: grid;
  gap: 3px;

  min-width: 0;
}


.rival-team strong {
  color:
    var(--archive-cream);

  font-size: 12px;
  line-height: 1.25;
}


.rival-team span {
  color:
    rgba(255,255,255,.38);

  font-size: 9px;
}


.series-center {
  display: grid;
  justify-items: center;

  text-align: center;
}


.series-center > span {
  color:
    var(--archive-gold);

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .16em;
  text-transform: uppercase;
}


.series-record {
  display: flex;
  align-items: center;
  gap: 9px;

  margin-top: 5px;
}


.series-record strong {
  color:
    var(--archive-cream);

  font-size: 30px;
  line-height: 1;
}


.series-record i {
  color:
    var(--archive-gold);

  font-size: 15px;
  font-style: normal;
}


.series-center small {
  margin-top: 5px;

  color:
    rgba(255,255,255,.34);

  font-size: 8px;
}


.rivalry-receipts {
  display: grid;
  grid-template-columns:
    repeat(4,minmax(0,1fr));

  border-bottom:
    1px solid
    rgba(255,255,255,.08);
}


.receipt-stat {
  display: grid;
  gap: 4px;

  padding:
    15px 10px;

  border-right:
    1px solid
    rgba(255,255,255,.07);
}


.receipt-stat:first-child {
  padding-left: 0;
}


.receipt-stat:last-child {
  border-right: 0;
}


.receipt-stat span {
  color:
    rgba(255,255,255,.32);

  font-size: 7px;
  font-weight: 800;

  letter-spacing: .12em;
  text-transform: uppercase;
}


.receipt-stat strong {
  color:
    rgba(255,255,255,.78);

  font-size: 10px;
}


.receipt-stat strong i {
  color:
    var(--archive-gold);

  font-style: normal;
}


.last-meeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;

  padding:
    15px 0 3px;
}


.last-meeting > div:first-child {
  display: grid;
  gap: 3px;
}


.last-meeting > div:first-child span {
  color:
    var(--archive-gold);

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .13em;
  text-transform: uppercase;
}


.last-meeting > div:first-child strong {
  color:
    rgba(255,255,255,.6);

  font-size: 9px;
}


.last-score {
  display: flex;
  align-items: center;
  gap: 8px;

  text-align: right;
}


.last-score span {
  color:
    rgba(255,255,255,.34);

  font-size: 8px;
}


.last-score strong {
  color:
    var(--archive-cream);

  font-size: 13px;
}


.rivalry-footnote {
  margin-top: 12px;

  color:
    rgba(255,255,255,.32);

  font-size: 8px;
}


.rivalry-footnote strong {
  color:
    rgba(255,255,255,.6);
}


.rivalry-empty {
  display: grid;
  gap: 4px;

  padding:
    22px 0 5px;
}


.rivalry-empty strong {
  color:
    rgba(255,255,255,.64);

  font-size: 11px;
}


.rivalry-empty span {
  color:
    rgba(255,255,255,.3);

  font-size: 9px;
}

	/* =====================================================
     TROPHY CASE
     ===================================================== */

	.trophy-layout {
		display: grid;
		grid-template-columns:
			minmax(0, 1.7fr)
			minmax(260px, 0.7fr);

		gap: 26px;
	}

	.badge-showcase {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));

		border-top: 1px solid rgba(255, 255, 255, 0.09);

		border-left: 1px solid rgba(255, 255, 255, 0.09);
	}

	.badge-exhibit {
		display: grid;
		grid-template-columns: 70px 1fr auto;

		gap: 14px;
		align-items: center;

		min-height: 115px;

		padding: 16px;

		border-right: 1px solid rgba(255, 255, 255, 0.09);

		border-bottom: 1px solid rgba(255, 255, 255, 0.09);

		color: inherit;

		text-decoration: none;

		background: rgba(255, 255, 255, 0.012);

		transition: background 0.15s ease;
	}

	.badge-exhibit:hover {
		background: rgba(214, 177, 94, 0.06);
	}

	.badge-image {
		display: grid;
		place-items: center;

		width: 62px;
		height: 62px;
	}

	.badge-image img {
		max-width: 100%;
		max-height: 100%;

		object-fit: contain;
	}

	.badge-copy {
		display: grid;
		gap: 2px;

		min-width: 0;
	}

	.badge-copy > span {
		color: var(--archive-gold);

		font-size: 8px;
		font-weight: 800;

		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.badge-copy strong {
		color: var(--archive-cream);

		font-size: 13px;
	}

	.badge-copy p {
		display: -webkit-box;
		overflow: hidden;

		margin: 3px 0 0;

		color: rgba(255, 255, 255, 0.4);

		font-size: 9px;
		line-height: 1.4;

		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.badge-count {
		display: grid;

		min-width: 42px;

		text-align: center;
	}

	.badge-count strong {
		color: var(--archive-gold-bright);

		font-size: 22px;
		line-height: 1;
	}

	.badge-count span {
		margin-top: 3px;

		color: rgba(255, 255, 255, 0.3);

		font-size: 7px;
		font-weight: 800;

		text-transform: uppercase;
	}

	.trophy-ledger {
		border-top: 2px solid var(--archive-gold);

		background: rgba(255, 255, 255, 0.018);
	}

	.trophy-total {
		padding: 20px;

		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.trophy-total span {
		display: block;

		color: rgba(255, 255, 255, 0.38);

		font-size: 9px;
		font-weight: 800;

		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.trophy-total strong {
		display: block;

		margin-top: 5px;

		color: var(--archive-gold-bright);

		font-size: 54px;
		line-height: 1;
	}

	.category-ledger {
		padding: 8px 20px 15px;
	}

	.category-row {
		display: grid;
		grid-template-columns: auto 1fr auto;

		gap: 10px;
		align-items: center;

		min-height: 36px;
	}

	.category-row span {
		color: rgba(255, 255, 255, 0.58);

		font-size: 10px;
	}

	.category-row div {
		border-bottom: 1px dotted rgba(255, 255, 255, 0.15);
	}

	.category-row strong {
		color: var(--archive-cream);

		font-size: 11px;
	}

	/* =====================================================
     DIRECTORY
     ===================================================== */

/* =====================================================
   SEASON ARCHIVE
   ===================================================== */

.season-archive {
  display: grid;
  gap: 26px;

  padding-top: 30px;

  border-top:
    1px solid
    var(--archive-line);
}


.season-archive-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 30px;
}


.season-archive-heading h2 {
  margin:
    6px 0 6px;

  color:
    var(--archive-cream);

  font-size:
    clamp(40px,5vw,64px);

  line-height: .95;

  text-transform: uppercase;
}


.season-archive-heading p {
  max-width: 680px;

  margin: 0;

  color:
    rgba(255,255,255,.45);

  font-size: 11px;
  line-height: 1.5;
}


.archive-range {
  flex: none;

  color:
    rgba(255,255,255,.5);

  font-size: 12px;
  font-weight: 900;

  letter-spacing: .1em;
  text-transform: uppercase;
}


.archive-range span {
  margin: 0 8px;

  color:
    var(--archive-gold);
}


.season-ledger {
  border-top:
    1px solid
    rgba(255,255,255,.1);
}


.season-row {
  display: grid;

  grid-template-columns:
    130px
    minmax(250px,1.15fr)
    minmax(300px,1fr)
    auto;

  gap: 24px;
  align-items: center;

  min-height: 118px;

  padding:
    18px 10px;

  border-bottom:
    1px solid
    rgba(255,255,255,.09);

  transition:
    background .15s ease;
}


.season-row:hover {
  background:
    linear-gradient(
      90deg,
      rgba(214,177,94,.045),
      transparent 60%
    );
}


.season-row.current-season {
  background:
    linear-gradient(
      90deg,
      rgba(214,177,94,.08),
      transparent 65%
    );

  border-left:
    2px solid
    var(--archive-gold);

  padding-left: 14px;
}


.season-year {
  display: grid;
  gap: 4px;
}


.season-year strong {
  color:
    var(--archive-cream);

  font-size: 31px;
  line-height: 1;
}


.season-year span {
  color:
    var(--archive-gold);

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .13em;
  text-transform: uppercase;
}


.season-feature {
  display: flex;
  align-items: center;
  gap: 13px;

  min-width: 0;
}


.season-feature img {
  flex: none;

  width: 52px;
  height: 52px;

  object-fit: contain;
}


.season-feature > div:last-child {
  display: grid;
  gap: 2px;

  min-width: 0;
}


.season-feature span {
  color:
    var(--archive-gold);

  font-size: 7px;
  font-weight: 900;

  letter-spacing: .14em;
  text-transform: uppercase;
}


.season-feature strong {
  color:
    var(--archive-cream);

  font-size: 12px;
}


.season-feature small {
  color:
    rgba(255,255,255,.34);

  font-size: 9px;
}


.season-open-mark {
  display: grid;
  place-items: center;

  flex: none;

  width: 48px;
  height: 48px;

  border:
    1px solid
    rgba(214,177,94,.32);

  color:
    var(--archive-gold);

  font-size: 12px;
  font-weight: 900;

  letter-spacing: .06em;
}


.season-facts {
  display: grid;
  grid-template-columns:
    repeat(3,minmax(0,1fr));
}


.season-facts > div {
  display: grid;
  gap: 3px;

  padding:
    2px 14px;

  border-left:
    1px solid
    rgba(255,255,255,.08);
}


.season-facts span {
  color:
    rgba(255,255,255,.29);

  font-size: 7px;
  font-weight: 800;

  letter-spacing: .1em;
  text-transform: uppercase;
}


.season-facts strong {
  color:
    rgba(255,255,255,.72);

  font-size: 13px;
}


.season-actions {
  display: flex;
  align-items: center;
  gap: 14px;

  justify-content: flex-end;
}


.season-actions a {
  color:
    rgba(255,255,255,.48);

  font-size: 8px;
  font-weight: 900;

  letter-spacing: .09em;
  text-decoration: none;
  text-transform: uppercase;

  transition:
    color .15s ease;
}


.season-actions a:hover {
  color:
    var(--archive-gold-bright);
}


.season-empty {
  padding:
    25px 10px;

  color:
    rgba(255,255,255,.38);

  font-size: 10px;
}
	/* =====================================================
     RESPONSIVE
     ===================================================== */

	@media (max-width: 1100px) {
		.championship-wall {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.record-layout,
		.trophy-layout {
			grid-template-columns: 1fr;
		}

		.archive-directory {
			grid-template-columns: 1fr;
			gap: 20px;
		}
      .season-row {
    grid-template-columns:
      100px
      minmax(220px,1fr)
      minmax(260px,1fr);
  }

  .season-actions {
    grid-column:
      2 / -1;

    justify-content:
      flex-start;
  }
	}

	@media (max-width: 780px) {
		.archive-page {
			gap: 54px;
		}

		.archive-hero {
			padding: 20px 18px 0;
		}

		.hero-topline {
			align-items: flex-start;
			gap: 12px;
		}

		.archive-document {
			text-align: right;
		}

		.hero-main {
			grid-template-columns: 1fr;

			min-height: 0;

			padding: 38px 4px;
		}

		.era-mark {
			min-width: 0;
			max-width: 340px;
		}

		.archive-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.archive-stat {
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}

		.archive-stat:nth-child(2) {
			border-right: 0;
		}

		.section-heading {
			align-items: flex-start;
			flex-direction: column;
		}

		.leader-row {
			grid-template-columns:
				34px
				minmax(0, 1fr)
				60px;
		}

		.leader-years {
			display: none;
		}

		.rivalry-files,
		.badge-showcase {
			grid-template-columns: 1fr;
		}
		.year-rail {
			overflow-x: auto;
			scrollbar-width: none;
		}

		.year-rail::-webkit-scrollbar {
			display: none;
		}

		.year-node {
			flex: 0 0 66px;
		}
     .rivalry-scoreboard {
    grid-template-columns:
      1fr;
  }

  .series-center {
    justify-items:
      start;

    text-align:
      left;
  }

  .rival-team.right {
    flex-direction:
      row-reverse;

    justify-content:
      flex-end;

    text-align:
      left;
  }

  .rivalry-receipts {
    grid-template-columns:
      repeat(2,minmax(0,1fr));
  }

  .last-meeting {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .last-score {
    text-align:
      left;
  }

  .season-archive-heading {
    align-items:
      flex-start;

    flex-direction:
      column;
  }

  .season-row {
    grid-template-columns:
      90px 1fr;
  }

  .season-facts,
  .season-actions {
    grid-column:
      1 / -1;
  }
	}

	@media (max-width: 560px) {
		.hero-copy h1 {
			display: block;

			font-size: clamp(62px, 20vw, 96px);
		}

		.hero-copy h1 span {
			display: block;

			margin-bottom: 5px;

			font-size: 16px;
		}

		.archive-stats {
			grid-template-columns: 1fr;
		}

		.archive-stat,
		.archive-stat:first-child {
			padding: 15px 4px;

			border-right: 0;
		}

		.championship-wall {
			grid-template-columns: 1fr;
		}

		.champion-entry {
			min-height: 220px;
		}

		.rivalry-matchup {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.versus {
			text-align: left;
		}

		.rival-side.right {
			flex-direction: row-reverse;
			justify-content: flex-end;
			text-align: left;
		}

		.badge-exhibit {
			grid-template-columns: 58px 1fr auto;
		}

		.badge-image {
			width: 50px;
			height: 50px;
		}

		.directory-row {
			grid-template-columns: 28px 1fr 25px;
		}

		.directory-row p {
			display: none;
		}
      .rivalry-receipts {
    grid-template-columns: 1fr;
  }

  .receipt-stat {
    padding:
      11px 0;

    border-right: 0;

    border-bottom:
      1px solid
      rgba(255,255,255,.06);
  }

  .season-row {
    grid-template-columns: 1fr;
  }

  .season-facts,
  .season-actions {
    grid-column: auto;
  }

  .season-facts {
    grid-template-columns:
      repeat(3,minmax(0,1fr));
  }
	}

  /* =====================================================
   RIVALRY VAULT — READABILITY PASS
   ===================================================== */

.rivalry-file {
  padding: 28px 26px 26px;
}


/* Rivalry File 01 */
.file-number {
  font-size: 12px;
  letter-spacing: .18em;
}


/* 2025–PRESENT */
.merged-era-tag {
  font-size: 10px;
  letter-spacing: .12em;
}


/* Team logos */
.rival-team img {
  width: 64px;
  height: 64px;
}


/* Team names */
.rival-team strong {
  font-size: 15px;
  line-height: 1.25;
}


/* Manager names */
.rival-team span {
  margin-top: 2px;
  font-size: 11px;
}


/* H2H SERIES */
.series-center > span {
  font-size: 9px;
  letter-spacing: .16em;
}


/* 1 — 0 */
.series-record strong {
  font-size: 40px;
}


/* dash between record */
.series-record i {
  font-size: 20px;
}


/* "Lehigh Crucible leads" */
.series-center small {
  margin-top: 7px;
  font-size: 10px;
}


/* Give scoreboard more breathing room */
.rivalry-scoreboard {
  grid-template-columns:
    minmax(0, 1fr)
    155px
    minmax(0, 1fr);

  gap: 22px;

  padding-bottom: 24px;
}


/* MEETINGS / TOTAL POINTS / CURRENT STREAK / PLAYOFF MEETINGS */
.receipt-stat {
  gap: 7px;
  padding: 18px 14px;
}


/* stat labels */
.receipt-stat span {
  font-size: 9px;
  letter-spacing: .11em;
}


/* stat values */
.receipt-stat strong {
  font-size: 13px;
  line-height: 1.35;
}


/* LAST MEETING */
.last-meeting {
  padding: 18px 0 5px;
}


/* LAST MEETING label */
.last-meeting > div:first-child span {
  font-size: 9px;
}


/* 2025 · Week 3 */
.last-meeting > div:first-child strong {
  margin-top: 3px;
  font-size: 11px;
}


/* team names beside last score */
.last-score span {
  font-size: 10px;
}


/* 96.52 — 91.90 */
.last-score strong {
  font-size: 17px;
}


/* Biggest margin on file */
.rivalry-footnote {
  margin-top: 16px;

  font-size: 10px;
  line-height: 1.5;
}


/* Empty-state text, for future unmatched rivalries */
.rivalry-empty strong {
  font-size: 13px;
}

.rivalry-empty span {
  font-size: 11px;
}

.receipt-stat:nth-child(2) strong {
  color: var(--archive-cream);
  font-size: 15px;
  font-weight: 900;
}
.rivalry-file {
  min-height: 365px;
}
</style>
