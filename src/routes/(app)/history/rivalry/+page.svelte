<script>
	export let data;


	$: rivalries =
		data?.rivalries ?? [];

	$: stats =
		data?.stats ?? {
			files: 0,
			meetings: 0,
			playoffMeetings: 0,
			mostPlayed: '—'
		};


	function score(value) {
		const number =
			Number(value);

		return Number.isFinite(number)
			? number.toFixed(2)
			: '0.00';
	}


	function rivalryNumber(index) {
		return String(
			index + 1
		).padStart(
			2,
			'0'
		);
	}
</script>


<svelte:head>
	<title>
		Rivalry Files | Irving Collective
	</title>
</svelte:head>


<div class="rivalry-page">


	<!-- ================================================
	     HERO
	     ================================================ -->

	<section class="rivalry-hero">

		<div class="hero-topline">

			<div class="section-kicker">
				Irving Collective Archives
			</div>

			<div class="hero-document">
				Conflict Division
				<span>•</span>
				{data.mergerStartYear}–Present
			</div>

		</div>


		<div class="hero-main">

			<div>

				<div class="eyebrow">
					Rivalry
				</div>

				<h1>
					Rivalry
					<span>Files</span>
				</h1>

				<p>
					Every grudge has a story.
					These are the receipts.
				</p>

			</div>


			<div class="hero-stamp">

				<span>
					Active Files
				</span>

				<strong>
					{stats.files}
				</strong>

				<small>
					Permanent rivalry
					dossiers
				</small>

			</div>

		</div>


		<div class="hero-stats">

			<div>
				<strong>
					{stats.files}
				</strong>

				<span>
					Rivalry files
				</span>
			</div>


			<div>
				<strong>
					{stats.meetings}
				</strong>

				<span>
					Meetings on file
				</span>
			</div>


			<div>
				<strong>
					{stats.playoffMeetings}
				</strong>

				<span>
					Playoff meetings
				</span>
			</div>


			<div class="wide-stat">
				<strong>
					{stats.mostPlayed}
				</strong>

				<span>
					Most played rivalry
				</span>
			</div>

		</div>

	</section>



	<!-- ================================================
	     FILE INDEX
	     ================================================ -->

	<section class="file-index">

		<div>

			<div class="section-kicker">
				Case Index
			</div>

			<span>
				Jump to rivalry file
			</span>

		</div>


		<div class="index-links">

			{#each rivalries as rivalry, index}

				<a
					href={`#rivalry-${index + 1}`}
				>
					<span>
						{rivalryNumber(index)}
					</span>

					{rivalry.left.teamName}
					vs
					{rivalry.right.teamName}
				</a>

			{/each}

		</div>

	</section>



	<!-- ================================================
	     RIVALRY FILES
	     ================================================ -->

	<section class="rivalry-files">

		{#each rivalries as rivalry, index}

			<article
				id={`rivalry-${index + 1}`}
				class="rivalry-file"
			>


				<!-- FILE HEADER -->

				<header class="file-header">

					<div>

						<div class="file-number">
							Rivalry File
							{rivalryNumber(index)}
						</div>

						<span>
							{data.mergerStartYear}
							—
							Present
						</span>

					</div>


					<div class="file-status">
						{rivalry.hasData
							? 'ACTIVE FILE'
							: 'AWAITING FIRST MEETING'}
					</div>

				</header>



				<!-- MATCHUP -->

				<div class="matchup-board">


					<div class="team-side">

						{#if rivalry.left.photo}

							<img
								src={rivalry.left.photo}
								alt=""
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



					<div class="series-center">

						<span>
							H2H SERIES
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


						<small>
							{rivalry.seriesLeader ||
								'No meetings on file'}
						</small>

					</div>



					<div class="team-side right">

						<div>

							<strong>
								{rivalry.right.teamName}
							</strong>

							<span>
								{rivalry.right.name}
							</span>

						</div>


						{#if rivalry.right.photo}

							<img
								src={rivalry.right.photo}
								alt=""
							/>

						{/if}

					</div>

				</div>



				{#if rivalry.hasData}


					<!-- SUMMARY -->

					<div class="summary-grid">

						<div>
							<span>
								Meetings
							</span>

							<strong>
								{rivalry.meetings}
							</strong>
						</div>


						<div>
							<span>
								Total Points
							</span>

							<strong>
								{score(
									rivalry.leftPoints
								)}
								—
								{score(
									rivalry.rightPoints
								)}
							</strong>
						</div>


						<div>
							<span>
								Current Streak
							</span>

							<strong>
								{rivalry.currentStreak?.label ||
									'—'}
							</strong>
						</div>


						<div>
							<span>
								Playoff Meetings
							</span>

							<strong>
								{rivalry.playoffMeetings}
							</strong>
						</div>

					</div>



					<!-- MEETING HISTORY -->

					<div class="meeting-ledger">

						<div class="ledger-heading">

							<div>

								<div class="section-kicker">
									Meeting Ledger
								</div>

								<h3>
									Head-to-Head History
								</h3>

							</div>


							<span>
								{rivalry.meetingHistory.length}
								{rivalry.meetingHistory.length === 1
									? ' game'
									: ' games'}
							</span>

						</div>



						<div class="meeting-table">

							<div class="meeting-head">

								<span>
									Season
								</span>

								<span>
									Week
								</span>

								<span>
									Winner
								</span>

								<span>
									Score
								</span>

								<span>
									Margin
								</span>

							</div>


							{#each rivalry.meetingHistory as meeting}

								<div class="meeting-row">

									<div>
										{meeting.season}
									</div>


									<div>

										Week
										{meeting.week}

										{#if meeting.playoff}

											<span class="playoff-tag">
												PLAYOFFS
											</span>

										{/if}

									</div>


									<strong>
										{meeting.winner}
									</strong>


									<div class="meeting-score">

										{score(
											meeting.leftScore
										)}

										<span>—</span>

										{score(
											meeting.rightScore
										)}

									</div>


									<div>
										{score(
											meeting.margin
										)}
									</div>

								</div>

							{/each}

						</div>

					</div>



					<!-- RECEIPTS -->

					<div class="file-receipts">

						<div>

							<span>
								Biggest Margin
							</span>

							<strong>
								{score(
									rivalry.biggestBlowout
										?.margin
								)}
							</strong>

							<small>
								{rivalry.biggestBlowout
									? `${rivalry.biggestBlowout.season} · Week ${rivalry.biggestBlowout.week}`
									: '—'}
							</small>

						</div>


						<div>

							<span>
								Last Meeting
							</span>

							<strong>
								{rivalry.lastMeeting
									? `${score(rivalry.lastMeeting.leftScore)} — ${score(rivalry.lastMeeting.rightScore)}`
									: '—'}
							</strong>

							<small>
								{rivalry.lastMeeting
									? `${rivalry.lastMeeting.season} · Week ${rivalry.lastMeeting.week}`
									: '—'}
							</small>

						</div>

					</div>


				{:else}


					<div class="empty-file">

						<div class="section-kicker">
							No Receipts Yet
						</div>

						<strong>
							The rivalry exists.
							The merged-era meeting
							does not.
						</strong>

					</div>


				{/if}


				<!-- FLAVOR -->

				<footer class="file-footer">

					<div>
						<span>
							File Notes
						</span>

						<p>
							{rivalry.subhead}
						</p>
					</div>


					<div>
						<span>
							Statements on Record
						</span>

						<p>
							{rivalry.stakes}
						</p>
					</div>

				</footer>


			</article>

		{/each}

	</section>


</div>



<style>

	:global(body) {
		--rival-gold: #d6b15e;
		--rival-gold-bright: #edcc7d;
		--rival-cream: #f2eee4;
		--rival-ink: #0b0e0d;
		--rival-line: rgba(214,177,94,.27);
	}


	.rivalry-page {
		display: grid;
		gap: 58px;

		padding-bottom: 75px;
	}


	.section-kicker,
	.eyebrow,
	.file-number {
		color:
			var(--rival-gold);

		font-size: 11px;
		font-weight: 900;

		letter-spacing: .18em;
		text-transform: uppercase;
	}



	/* ================================================
	   HERO
	   ================================================ */

	.rivalry-hero {
		padding:
			24px 28px 0;

		border-top:
			1px solid
			rgba(214,177,94,.55);

		border-bottom:
			1px solid
			rgba(214,177,94,.38);

		background:
			radial-gradient(
				circle at 80% 25%,
				rgba(214,177,94,.10),
				transparent 32%
			),
			linear-gradient(
				135deg,
				rgba(255,255,255,.035),
				rgba(255,255,255,.008)
			);
	}


	.hero-topline {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		padding-bottom: 18px;

		border-bottom:
			1px solid
			rgba(255,255,255,.09);
	}


	.hero-document {
		color:
			rgba(255,255,255,.40);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: .12em;
		text-transform: uppercase;
	}


	.hero-document span {
		margin: 0 8px;

		color:
			var(--rival-gold);
	}


	.hero-main {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 40px;

		min-height: 285px;

		padding:
			36px 8px;
	}


	.hero-main h1 {
		margin:
			6px 0 14px;

		color:
			var(--rival-cream);

		font-size:
			clamp(
				60px,
				7vw,
				108px
			);

		line-height: .88;

		letter-spacing: -.04em;

		text-transform: uppercase;
	}


	.hero-main h1 span {
		display: block;

		color:
			var(--rival-gold);
	}


	.hero-main p {
		margin: 0;

		color:
			rgba(255,255,255,.60);

		font-size: 18px;
	}


	.hero-stamp {
		display: grid;

		min-width: 215px;

		padding: 25px;

		border:
			1px solid
			rgba(214,177,94,.24);
	}


	.hero-stamp > span {
		color:
			var(--rival-gold);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .13em;
		text-transform: uppercase;
	}


	.hero-stamp strong {
		margin-top: 5px;

		color:
			var(--rival-gold-bright);

		font-size: 64px;
		line-height: 1;
	}


	.hero-stamp small {
		margin-top: 7px;

		color:
			rgba(255,255,255,.38);

		font-size: 11px;
	}


	.hero-stats {
		display: grid;

		grid-template-columns:
			.7fr
			.8fr
			.8fr
			1.7fr;

		border-top:
			1px solid
			rgba(255,255,255,.09);
	}


	.hero-stats > div {
		display: grid;
		gap: 3px;

		padding:
			18px 16px;

		border-right:
			1px solid
			rgba(255,255,255,.08);
	}


	.hero-stats > div:last-child {
		border-right: 0;
	}


	.hero-stats strong {
		color:
			var(--rival-gold-bright);

		font-size: 24px;
		line-height: 1.15;
	}


	.hero-stats .wide-stat strong {
		font-size: 15px;
	}


	.hero-stats span {
		color:
			rgba(255,255,255,.40);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: .09em;
		text-transform: uppercase;
	}



	/* ================================================
	   INDEX
	   ================================================ */

	.file-index {
		display: grid;
		grid-template-columns:
			190px
			minmax(0,1fr);

		gap: 30px;

		padding-bottom: 20px;

		border-bottom:
			1px solid
			var(--rival-line);
	}


	.file-index > div:first-child {
		display: grid;
		align-content: start;
		gap: 5px;
	}


	.file-index > div:first-child > span {
		color:
			rgba(255,255,255,.45);

		font-size: 12px;
	}


	.index-links {
		display: grid;
		grid-template-columns:
			repeat(
				3,
				minmax(0,1fr)
			);

		gap: 1px;

		background:
			rgba(255,255,255,.08);
	}


	.index-links a {
		display: flex;
		align-items: center;

		gap: 9px;

		min-height: 48px;

		padding:
			9px 12px;

		background:
			var(--rival-ink);

		color:
			rgba(255,255,255,.65);

		font-size: 11px;
		font-weight: 700;

		text-decoration: none;
	}


	.index-links a:hover {
		color:
			var(--rival-cream);

		background:
			rgba(214,177,94,.055);
	}


	.index-links a span {
		color:
			var(--rival-gold);

		font-size: 10px;
		font-weight: 900;
	}



	/* ================================================
	   FILES
	   ================================================ */

	.rivalry-files {
		display: grid;
		gap: 35px;
	}


	.rivalry-file {
		scroll-margin-top: 90px;

		border:
			1px solid
			rgba(255,255,255,.10);

		background:
			linear-gradient(
				145deg,
				rgba(255,255,255,.025),
				rgba(255,255,255,.006)
			);
	}


	.file-header {
		display: flex;
		align-items: center;
		justify-content:
			space-between;

		gap: 20px;

		padding:
			18px 22px;

		border-bottom:
			1px solid
			rgba(255,255,255,.08);
	}


	.file-header > div:first-child {
		display: flex;
		align-items: center;

		gap: 15px;
	}


	.file-header > div:first-child > span {
		color:
			rgba(255,255,255,.38);

		font-size: 10px;
		font-weight: 800;

		letter-spacing: .11em;
		text-transform: uppercase;
	}


	.file-status {
		color:
			rgba(255,255,255,.38);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .10em;
		text-transform: uppercase;
	}



	/* ================================================
	   MATCHUP
	   ================================================ */

	.matchup-board {
		display: grid;

		grid-template-columns:
			minmax(0,1fr)
			190px
			minmax(0,1fr);

		align-items: center;

		gap: 30px;

		min-height: 185px;

		padding:
			28px 30px;
	}


	.team-side {
		display: flex;
		align-items: center;

		gap: 17px;

		min-width: 0;
	}


	.team-side.right {
		flex-direction: row-reverse;
		text-align: right;
	}


	.team-side img {
		flex: none;

		width: 78px;
		height: 78px;

		object-fit: contain;
	}


	.team-side > div {
		display: grid;
		gap: 4px;

		min-width: 0;
	}


	.team-side strong {
		color:
			var(--rival-cream);

		font-size: 20px;
		line-height: 1.2;
	}


	.team-side span {
		color:
			rgba(255,255,255,.48);

		font-size: 13px;
	}


	.series-center {
		display: grid;

		justify-items: center;

		text-align: center;
	}


	.series-center > span {
		color:
			var(--rival-gold);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .15em;
		text-transform: uppercase;
	}


	.series-record {
		display: flex;
		align-items: center;

		gap: 12px;

		margin-top: 5px;
	}


	.series-record strong {
		color:
			var(--rival-cream);

		font-size: 54px;
		line-height: 1;
	}


	.series-record i {
		color:
			var(--rival-gold);

		font-size: 24px;
		font-style: normal;
	}


	.series-center small {
		margin-top: 8px;

		color:
			rgba(255,255,255,.44);

		font-size: 11px;
	}



	/* ================================================
	   SUMMARY
	   ================================================ */

	.summary-grid {
		display: grid;
		grid-template-columns:
			repeat(
				4,
				minmax(0,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.08);

		border-bottom:
			1px solid
			rgba(255,255,255,.08);
	}


	.summary-grid > div {
		display: grid;
		gap: 5px;

		padding:
			18px 22px;

		border-right:
			1px solid
			rgba(255,255,255,.07);
	}


	.summary-grid > div:last-child {
		border-right: 0;
	}


	.summary-grid span,
	.file-receipts span,
	.file-footer span {
		color:
			rgba(255,255,255,.38);

		font-size: 10px;
		font-weight: 900;

		letter-spacing: .11em;
		text-transform: uppercase;
	}


	.summary-grid strong {
		color:
			var(--rival-cream);

		font-size: 16px;
	}



	/* ================================================
	   MEETING LEDGER
	   ================================================ */

	.meeting-ledger {
		padding:
			25px 22px;
	}


	.ledger-heading {
		display: flex;
		align-items: flex-end;
		justify-content:
			space-between;

		gap: 20px;

		margin-bottom: 15px;
	}


	.ledger-heading h3 {
		margin:
			4px 0 0;

		color:
			var(--rival-cream);

		font-size: 27px;
		text-transform: uppercase;
	}


	.ledger-heading > span {
		color:
			rgba(255,255,255,.42);

		font-size: 11px;
	}


	.meeting-table {
		border-top:
			2px solid
			var(--rival-gold);
	}


	.meeting-head,
	.meeting-row {
		display: grid;

		grid-template-columns:
			100px
			160px
			minmax(220px,1fr)
			180px
			100px;

		align-items: center;

		gap: 15px;
	}


	.meeting-head {
		min-height: 42px;

		padding:
			0 14px;

		border-bottom:
			1px solid
			rgba(255,255,255,.09);

		color:
			rgba(255,255,255,.36);

		font-size: 9px;
		font-weight: 900;

		letter-spacing: .11em;
		text-transform: uppercase;
	}


	.meeting-row {
		min-height: 62px;

		padding:
			8px 14px;

		border-bottom:
			1px solid
			rgba(255,255,255,.065);

		color:
			rgba(255,255,255,.62);

		font-size: 12px;
	}


	.meeting-row strong {
		color:
			var(--rival-cream);

		font-size: 13px;
	}


	.meeting-score {
		color:
			var(--rival-cream);

		font-size: 14px;
		font-weight: 800;
	}


	.meeting-score span {
		margin: 0 5px;

		color:
			var(--rival-gold);
	}


	.playoff-tag {
		display: inline-block;

		margin-left: 7px;

		padding:
			3px 5px;

		border:
			1px solid
			rgba(214,177,94,.35);

		color:
			var(--rival-gold);

		font-size: 8px;
		font-weight: 900;

		letter-spacing: .08em;
	}



	/* ================================================
	   RECEIPTS
	   ================================================ */

	.file-receipts {
		display: grid;
		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.08);
	}


	.file-receipts > div {
		display: grid;
		gap: 4px;

		padding:
			20px 22px;

		border-right:
			1px solid
			rgba(255,255,255,.07);
	}


	.file-receipts > div:last-child {
		border-right: 0;
	}


	.file-receipts strong {
		color:
			var(--rival-gold-bright);

		font-size: 23px;
	}


	.file-receipts small {
		color:
			rgba(255,255,255,.42);

		font-size: 11px;
	}



	/* ================================================
	   FOOTER
	   ================================================ */

	.file-footer {
		display: grid;
		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		border-top:
			1px solid
			rgba(255,255,255,.08);

		background:
			rgba(0,0,0,.10);
	}


	.file-footer > div {
		padding:
			18px 22px;

		border-right:
			1px solid
			rgba(255,255,255,.07);
	}


	.file-footer > div:last-child {
		border-right: 0;
	}


	.file-footer p {
		margin:
			6px 0 0;

		color:
			rgba(255,255,255,.55);

		font-size: 12px;
		line-height: 1.5;
	}


	.empty-file {
		display: grid;
		gap: 7px;

		padding:
			30px;

		border-top:
			1px solid
			rgba(255,255,255,.08);
	}


	.empty-file strong {
		color:
			rgba(255,255,255,.68);

		font-size: 15px;
	}



	/* ================================================
	   RESPONSIVE
	   ================================================ */

	@media (max-width: 1000px) {

		.file-index {
			grid-template-columns: 1fr;
		}


		.index-links {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.meeting-table {
			overflow-x: auto;
		}


		.meeting-head,
		.meeting-row {
			min-width: 800px;
		}

	}


	@media (max-width: 760px) {

		.hero-main {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.hero-stats {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.matchup-board {
			grid-template-columns: 1fr;
		}


		.series-center {
			justify-items:
				start;

			text-align: left;
		}


		.team-side.right {
			flex-direction: row;
			text-align: left;
		}


		.summary-grid {
			grid-template-columns:
				repeat(
					2,
					minmax(0,1fr)
				);
		}


		.file-footer {
			grid-template-columns: 1fr;
		}

	}


	@media (max-width: 520px) {

		.rivalry-page {
			gap: 42px;
		}


		.rivalry-hero {
			padding:
				20px 16px 0;
		}


		.hero-topline {
			align-items:
				flex-start;

			gap: 12px;
		}


		.hero-document {
			text-align: right;
		}


		.hero-stats {
			grid-template-columns: 1fr;
		}


		.index-links {
			grid-template-columns: 1fr;
		}


		.summary-grid {
			grid-template-columns: 1fr;
		}


		.file-receipts {
			grid-template-columns: 1fr;
		}


		.team-side img {
			width: 62px;
			height: 62px;
		}


		.team-side strong {
			font-size: 17px;
		}

	}

</style>