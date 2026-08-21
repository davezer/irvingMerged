<script>
	export let data;
	export let form;

	let expandedTrade = null;
	let editingTrade = null;

	function money(value) {
		const amount = Number(value || 0);

		const sign = amount > 0 ? '+' : '';

		return `${sign}$${amount.toFixed(2)}`;
	}

	function normalMoney(value) {
		return `$${Number(value || 0).toFixed(2)}`;
	}

	function today() {
		return new Date().toISOString().slice(0, 10);
	}

	function entryTypeLabel(entry) {
		if (entry?.metadata?.legacyTransactionType) {
			return entry.metadata.legacyTransactionType;
		}

		const labels = {
			opening_balance: 'Opening Balance',

			annual_funding: 'Auction Budget Funded',

			auction_spend: 'Auction Budget Spend',

			trade: 'Futures Trade',

			keeper_signing: 'Keeper Signing',

			keeper_tax: 'Keeper Signing Tax',

			cap_penalty: 'Auction CAP Penalty',

			manual_adjustment: 'Manual Adjustment'
		};

		return labels[entry?.entryType] || String(entry?.entryType || 'Unknown');
	}
</script>

<div class="capital-page">
	<header class="capital-hero">

	<div class="hero-copy">

		<div class="eyebrow">
			League Finance
		</div>

		<h1>
			Draft Capital
		</h1>

		<p>
			The league economy. Every dollar moved,
			spent, traded, adjusted, and accounted for.
		</p>

	</div>


	<div class="hero-side">

		<div class="pending-number">
			<strong>
				{data.pendingTradeCount}
			</strong>

			<span>
				Pending Reviews
			</span>
		</div>


		<div class="hero-year">
			<span>
				Capital Year
			</span>

			<strong>
				{data.capitalYear}
			</strong>
		</div>

	</div>


	<div
		class="hero-watermark"
		aria-hidden="true"
	>
		CAPITAL
	</div>

</header>

	{#if form?.message}
		<div class="notice success">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="notice error">
			{form.error}
		</div>
	{/if}

	<!-- =====================================================
       YEAR / SEASON
       ===================================================== -->

	<form method="GET" class="filter-bar">
		<label>
			Auction Capital Year

			<input type="number" name="capitalYear" value={data.capitalYear} min="2025" max="2040" />
		</label>

		<label>
			Sleeper Trade Season

			<input type="number" name="tradeSeason" value={data.tradeSeason} min="2025" max="2040" />
		</label>

		<button type="submit"> Load </button>
	</form>

	<!-- =====================================================
       ONE-TIME IMPORT
       ===================================================== -->

	<!-- {#if data.year === 2026}
		<section class="card import-card">
			{#if data.legacyImport?.rowCount > 0} -->
				<!-- <div>
					<div class="eyebrow">Migration complete</div>

					<h2>Historical ledger is in D1</h2>

					<p>
						{data.legacyImport.rowCount}
						legacy transactions imported from
						{data.legacyImport.firstDate}
						through
						{data.legacyImport.lastDate}. Opening-balance snapshots have been retired.
					</p>
				</div> -->

				<!-- <div class="migration-complete">✓ FULL HISTORY ACTIVE</div> -->
			<!-- {:else}
				<div>
					<div class="eyebrow">Legacy Migration</div>

					<h2>Backfill complete transaction history</h2>

					<p>
						Upload the exported Google Sheets Ledger CSV. The importer will refuse to commit unless
						all 14 calculated balances exactly match the current D1 capital board.
					</p>
				</div> -->

				<!-- <form
					method="POST"
					action="?/importLegacyLedger"
					enctype="multipart/form-data"
					class="legacy-import-form"
				>
					<input type="hidden" name="futuresYear" value={data.year} />

					<label>
						Ledger CSV

						<input type="file" name="ledgerCsv" accept=".csv,text/csv" required />
					</label>

					<button type="submit" class="gold-button"> Import Complete Ledger </button>
				</form>
			{/if} -->
		<!-- </section>
	{/if} -->

	<!-- =====================================================
       BALANCE BOARD
       ===================================================== -->

	<section class="section">
		<div class="section-head">
			<div>
				<div class="eyebrow">
					{data.capitalYear} Auction Capital
				</div>

				<h2>Capital Board</h2>
			</div>
		</div>

		<div class="balance-grid">
			{#each data.balances as team}
				<article class="balance-card">
					<div class="team-row">
						{#if team.photo}
							<img
  src={team.teamChiclet || team.teamPhoto}
  alt={team.teamName}
/>
						{/if}

						<div>
							<strong>
								{team.teamName}
							</strong>

							<span>
								{team.name}
							</span>
						</div>
					</div>

					<div
						class:negative={team.balance < 0}
						class:positive={team.balance > 200}
						class="capital-number"
					>
						{normalMoney(team.balance)}
					</div>

					<small>
						{team.entryCount}
						ledger
						{team.entryCount === 1 ? 'entry' : 'entries'}
					</small>
				</article>
			{/each}
		</div>
	</section>

	<!-- =====================================================
       SLEEPER TRADE INBOX
       ===================================================== -->

	<section class="section">
		<div class="section-head">
			<div>
				<div class="eyebrow">Sleeper Wire</div>

				<h2>Pending Trade Review</h2>
			</div>

			<span class="count-pill">
				{data.pendingTradeCount}
				pending
			</span>
		</div>

		<div class="trade-stack">
			{#each data.trades as trade}
				<article class:reviewed={trade.reviewStatus !== 'pending'} class="trade-card">
					<button
						type="button"
						class="trade-toggle"
						on:click={() => {
							expandedTrade = expandedTrade === trade.transactionId ? null : trade.transactionId;
						}}
					>
						<div>
							<span class="trade-week">
								{trade.season}
								· Week
								{trade.week ?? '—'}
							</span>

							<strong>
								{trade.teams.map((team) => team.teamName).join(' ↔ ')}
							</strong>
						</div>

						<div class="review-status">
							{#if trade.reviewStatus === 'posted'}
								<span>
									CAPITAL POSTED ✓

									{#if trade.capital}
										· ${trade.capital.amount.toFixed(0)}
									{/if}
								</span>

								<button
									type="button"
									class="trade-edit-button"
									on:click|stopPropagation={() => {
										/*
										 * Make sure this trade is expanded.
										 */
										expandedTrade = trade.transactionId;

										/*
										 * Toggle its edit form.
										 */
										editingTrade =
											editingTrade === trade.transactionId ? null : trade.transactionId;
									}}
								>
									{editingTrade === trade.transactionId ? 'CANCEL' : 'EDIT'}
								</button>
							{:else if trade.reviewStatus === 'no_capital'}
								<span> NO CAPITAL ✓ </span>
							{:else}
								<span> REVIEW </span>
							{/if}
						</div>
					</button>

					{#if expandedTrade === trade.transactionId}
						<div class="trade-body">
							<div class="trade-team-grid">
								{#each trade.teams as team}
									<div class="trade-team">
										<strong>
											{team.teamName}
										</strong>

										<span> Received </span>

										{#if team.received.length}
											{#each team.received as player}
												<div class="player-chip">
													{player.position ? `${player.position} ` : ''}
													{player.name}
												</div>
											{/each}
										{:else}
											<small> No players received </small>
										{/if}
									</div>
								{/each}
							</div>
							{#if trade.reviewStatus === 'posted' && trade.capital}
								<div class="posted-capital-panel">
									<div class="posted-capital-head">
										<div>
											<span> Posted Draft Capital </span>

											<strong>
												${trade.capital.amount.toFixed(2)}
												·
												{trade.capital.futuresYear}
											</strong>
										</div>

										<button
											type="button"
											class="ghost-button"
											on:click={() => {
												editingTrade =
													editingTrade === trade.transactionId ? null : trade.transactionId;
											}}
										>
											{editingTrade === trade.transactionId ? 'Cancel Edit' : 'Edit'}
										</button>
									</div>

									{#if editingTrade === trade.transactionId}
										<form
											method="POST"
											action="?/editTradeCapital"
											class="capital-trade-form edit-capital-form"
										>
											<input type="hidden" name="transactionId" value={trade.transactionId} />

											<input type="hidden" name="season" value={trade.season} />

											<input type="hidden" name="week" value={trade.week ?? ''} />

											<label>
												Auction Capital Year

												<input
													type="number"
													name="futuresYear"
													value={trade.capital.futuresYear}
													required
												/>
											</label>

											<label>
												Capital FROM

												<select name="fromManagerId" required>
													{#each trade.teams as team}
														<option
															value={team.managerId}
															selected={String(team.managerId) ===
																String(trade.capital.fromManagerId)}
														>
															{team.teamName}
														</option>
													{/each}
												</select>
											</label>

											<label>
												Capital TO

												<select name="toManagerId" required>
													{#each trade.teams as team}
														<option
															value={team.managerId}
															selected={String(team.managerId) ===
																String(trade.capital.toManagerId)}
														>
															{team.teamName}
														</option>
													{/each}
												</select>
											</label>

											<label>
												Amount

												<div class="money-input">
													<span>$</span>

													<input
														type="number"
														name="amount"
														min="1"
														step="1"
														value={trade.capital.amount}
														required
													/>
												</div>
											</label>

											<label>
												Date

												<input
													type="date"
													name="transactionDate"
													value={trade.capital.transactionDate || ''}
												/>
											</label>

											<label class="wide">
												Note

												<input
													name="note"
													value={trade.capital.note || ''}
													placeholder="Optional commissioner note"
												/>
											</label>

											<button type="submit" class="gold-button"> Save Changes </button>
										</form>

										<form method="POST" action="?/removeTradeCapital" class="remove-capital-form">
											<input type="hidden" name="transactionId" value={trade.transactionId} />

											<input type="hidden" name="season" value={trade.season} />

											<button type="submit" class="danger-button">
												Remove Capital From Trade
											</button>
										</form>
									{/if}
								</div>
							{/if}

							{#if trade.reviewStatus === 'pending'}
								<div class="trade-actions">
									<form method="POST" action="?/postTradeCapital" class="capital-trade-form">
										<input type="hidden" name="transactionId" value={trade.transactionId} />

										<input type="hidden" name="season" value={trade.season} />

										<input type="hidden" name="week" value={trade.week ?? ''} />

										<label>
											Auction Capital Year

											<input type="number" name="futuresYear" value={data.capitalYear} required />
										</label>

										<label>
											Capital FROM

											<select name="fromManagerId" required>
												<option value=""> Choose team </option>

												{#each trade.teams as team}
													<option value={team.managerId}>
														{team.teamName}
													</option>
												{/each}
											</select>
										</label>

										<label>
											Capital TO

											<select name="toManagerId" required>
												<option value=""> Choose team </option>

												{#each trade.teams as team}
													<option value={team.managerId}>
														{team.teamName}
													</option>
												{/each}
											</select>
										</label>

										<label>
											Amount

											<div class="money-input">
												<span>$</span>

												<input
													type="number"
													name="amount"
													min="1"
													step="1"
													placeholder="20"
													required
												/>
											</div>
										</label>

										<label>
											Date

											<input type="date" name="transactionDate" value={today()} />
										</label>

										<label class="wide">
											Note

											<input
												name="note"
												placeholder="Players involved in trade, other notes, etc..."
											/>
										</label>

										<button type="submit" class="gold-button"> Post Draft Capital </button>
									</form>

									<form method="POST" action="?/noTradeCapital">
										<input type="hidden" name="transactionId" value={trade.transactionId} />

										<input type="hidden" name="season" value={trade.season} />

										<input type="hidden" name="week" value={trade.week ?? ''} />

										<button type="submit" class="ghost-button"> No Capital Included </button>
									</form>
								</div>
							{/if}
						</div>
					{/if}
				</article>
			{/each}

			{#if !data.trades.length}
				<div class="empty">No stored Sleeper trades found for this season.</div>
			{/if}
		</div>
	</section>

	<!-- =====================================================
       MANUAL CONTROLS
       ===================================================== -->

	<section class="control-grid">
		<article class="card">
			<div class="eyebrow">Manual</div>

			<h2>Capital Transfer</h2>

			<form method="POST" action="?/transfer" class="form-grid">
				<label>
					Auction Capital Year

					<input type="number" name="futuresYear" value={data.capitalYear} required />
				</label>

				<label>
					From

					<select name="fromManagerId" required>
						<option value=""> Select team </option>

						{#each data.managers as team}
							<option value={team.id}>
								{team.teamName}
							</option>
						{/each}
					</select>
				</label>

				<label>
					To

					<select name="toManagerId" required>
						<option value=""> Select team </option>

						{#each data.managers as team}
							<option value={team.id}>
								{team.teamName}
							</option>
						{/each}
					</select>
				</label>

				<label>
					Amount

					<div class="money-input">
						<span>$</span>

						<input type="number" name="amount" step="1" min="1" required />
					</div>
				</label>

				<label>
					Date

					<input type="date" name="transactionDate" value={today()} />
				</label>

				<label class="wide">
					Note

					<input name="note" placeholder="Reason for transfer" />
				</label>

				<button type="submit" class="gold-button"> Post Transfer </button>
			</form>
		</article>

		<article class="card">
			<div class="eyebrow">Commissioner Adjustment</div>

			<h2>Ledger Entry</h2>

			<form method="POST" action="?/addEntry" class="form-grid">
				<label>
					Team

					<select name="managerId" required>
						<option value=""> Select team </option>

						{#each data.managers as team}
							<option value={team.id}>
								{team.teamName}
							</option>
						{/each}
					</select>
				</label>

				<label>
					Auction Capital Year

					<input type="number" name="futuresYear" value={data.capitalYear} required />
				</label>

				<label>
					Type

					<select name="entryType">
						<option value="annual_funding"> Annual Funding </option>

						<option value="auction_spend"> Auction Spend </option>

						<option value="keeper_signing"> Keeper Signing </option>

						<option value="keeper_tax"> Keeper Tax </option>

						<option value="cap_penalty"> Cap Penalty </option>

						<option value="manual_adjustment" selected> Manual Adjustment </option>
					</select>
				</label>

				<label>
					Signed amount

					<div class="money-input">
						<span>$</span>

						<input type="number" name="amount" step="1" placeholder="-20 or 20" required />
					</div>
				</label>

				<label>
					Date

					<input type="date" name="transactionDate" value={today()} />
				</label>

				<label class="wide">
					Note

					<input name="note" placeholder="Why is this adjustment being made?" />
				</label>

				<button type="submit" class="gold-button"> Post Entry </button>
			</form>
		</article>
	</section>

	<!-- =====================================================
       LEDGER
       ===================================================== -->

	<section class="section">
		<div class="section-head ledger-section-head">
			<div>
				<div class="eyebrow">Audit Trail</div>

				<h2>
					{data.capitalYear}
					Capital Ledger
				</h2>

				<small class="ledger-subtitle">
					Transactions affecting
					{data.capitalYear}
					auction capital
				</small>
			</div>

			<form method="GET" class="audit-filter">
				<!-- Preserve the other page controls -->
				<input type="hidden" name="capitalYear" value={data.capitalYear} />

				<input type="hidden" name="tradeSeason" value={data.tradeSeason} />

				<label>
					Transaction Year

					<select name="transactionYear" on:change={(event) => event.currentTarget.form.submit()}>
						<option value="all" selected={data.transactionYear == null}> All Years </option>

						{#each data.transactionYears as year}
							<option value={year} selected={Number(data.transactionYear) === Number(year)}>
								{year}
							</option>
						{/each}
					</select>
				</label>
			</form>
		</div>

		<div class="ledger-table">
			<div class="ledger-head">
				<span>Date</span>
				<span>Team</span>
				<span>Type</span>
				<span>Capital</span>
				<span>Amount</span>
				<span>Note</span>
				<span></span>
			</div>

			{#each data.ledger as entry}
				<div class="ledger-row">
					<span>
						{entry.transactionDate || '—'}
					</span>

					<strong>
						{entry.manager?.teamName || entry.managerId}
					</strong>

					<span>
						{entryTypeLabel(entry)}
					</span>

					<span class="capital-year-cell">
						{entry.futuresYear}
					</span>

					<strong class:money-positive={entry.amount > 0} class:money-negative={entry.amount < 0}>
						{money(entry.amount)}
					</strong>

					<span>
						{entry.note || '—'}

						{#if entry.counterparty}
							<small>
								·
								{entry.counterparty.teamName}
							</small>
						{/if}
					</span>

					<form method="POST" action="?/voidEntry">
						<input type="hidden" name="entryId" value={entry.id} />

						<button type="submit" class="tiny-button"> Void </button>
					</form>
				</div>
			{/each}

			{#if !data.ledger.length}
				<div class="empty">No capital entries yet.</div>
			{/if}
		</div>
	</section>
</div>

<style>
	/* ==================================================
	   PAGE
	   ================================================== */

	.capital-page {
		width: 100%;
		max-width: 1460px;

		display: grid;
		gap: 34px;

		margin: 0 auto;

		padding-bottom: 70px;
	}


	h1,
	h2,
	p {
		margin: 0;
	}


	.eyebrow {
		color: var(--brand-gold);

		font-size: .54rem;
		font-weight: 850;
		letter-spacing: .15em;

		text-transform: uppercase;
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.capital-hero {
		position: relative;

		min-height: 235px;

		display: flex;

		align-items: center;
		justify-content: space-between;

		gap: 40px;

		overflow: hidden;

		padding:
			34px
			clamp(28px, 4vw, 48px);

		border-top:
			1px solid
			var(--border-strong);

		border-bottom:
			1px solid
			var(--border-strong);

		background:
			linear-gradient(
				90deg,
				rgba(191,161,106,.045),
				transparent 42%
			);
	}


	.hero-copy {
		position: relative;
		z-index: 2;

		min-width: 0;
	}


	.capital-hero h1 {
		margin-top: 7px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4.5rem,
				7vw,
				7rem
			);

		font-weight: 400;

		line-height: .84;

		letter-spacing: -.025em;

		text-transform: uppercase;
	}


	.capital-hero p {
		max-width: 650px;

		margin-top: 18px;

		color:
			var(--muted);

		font-size: .9rem;

		line-height: 1.55;
	}


	.hero-side {
		position: relative;
		z-index: 2;

		display: flex;

		align-items: stretch;

		gap: 1px;

		flex: 0 0 auto;

		background:
			var(--border);
	}


	.pending-number,
	.hero-year {
		min-width: 135px;

		display: grid;

		align-content: center;

		gap: 4px;

		padding: 17px 19px;

		background:
			#0b0f0e;
	}


	.pending-number strong,
	.hero-year strong {
		color:
			var(--brand-sand);

		font-family:
			var(--font-display);

		font-size: 2.25rem;

		font-weight: 400;

		line-height: 1;
	}


	.pending-number span,
	.hero-year span {
		color:
			var(--brand-stone);

		font-size: .47rem;

		font-weight: 800;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.pending-number strong {
		color:
			var(--brand-gold);
	}


	.hero-watermark {
		position: absolute;

		right: -20px;
		bottom: -55px;

		color:
			rgba(191,161,106,.018);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				9rem,
				16vw,
				15rem
			);

		line-height: 1;

		pointer-events: none;
	}


	/* ==================================================
	   NOTICES
	   ================================================== */

	.notice {
		padding:
			11px 14px;

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(191,161,106,.035);

		color:
			var(--brand-sand);

		font-size: .72rem;

		font-weight: 700;
	}


	.notice.success {
		border-color:
			#8ead91;

		background:
			rgba(142,173,145,.04);
	}


	.notice.error {
		border-color:
			#bd746d;

		background:
			rgba(189,116,109,.05);
	}


	/* ==================================================
	   TOP FILTER BAR
	   ================================================== */

	.filter-bar {
		display: flex;

		flex-wrap: wrap;

		align-items: end;

		gap: 14px;

		padding-bottom: 22px;

		border-bottom:
			1px solid
			var(--border);
	}


	label {
		display: grid;

		gap: 6px;

		color:
			var(--brand-stone);

		font-size: .51rem;

		font-weight: 800;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	input,
	select {
		min-height: 39px;

		box-sizing: border-box;

		outline: 0;

		padding:
			0 10px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		background:
			#0a0e0d;

		color:
			var(--brand-ivory);

		font: inherit;

		font-size: .76rem;
	}


	input:focus,
	select:focus {
		border-color:
			var(--brand-gold);

		box-shadow:
			0 0 0 1px
			rgba(191,161,106,.12);
	}


	select option {
		color: #111;

		background: #fff;
	}


	button {
		cursor: pointer;
	}


	.filter-bar button,
	.gold-button {
		min-height: 39px;

		padding:
			0 14px;

		border:
			1px solid
			var(--brand-gold);

		border-radius: 2px;

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);

		font: inherit;

		font-size: .53rem;

		font-weight: 850;

		letter-spacing: .05em;

		text-transform: uppercase;
	}


	.filter-bar button:hover,
	.gold-button:hover {
		background:
			var(--brand-sand);

		border-color:
			var(--brand-sand);
	}


	/* ==================================================
	   GLOBAL SECTIONS
	   ================================================== */

	.section {
		display: grid;

		gap: 18px;

		padding:
			0 4px
			30px;

		border-bottom:
			1px solid
			var(--border);
	}


	.card {
		background: transparent;

		border: 0;

		border-radius: 0;

		box-shadow: none;
	}


	.section-head {
		display: flex;

		align-items: end;

		justify-content: space-between;

		gap: 20px;
	}


	.section-head h2,
	.card h2 {
		margin-top: 4px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2rem,
				3.4vw,
				3rem
			);

		font-weight: 400;

		line-height: 1;

		text-transform: uppercase;
	}


	/* ==================================================
	   MIGRATION
	   ================================================== */

	.import-card {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 30px;

		padding:
			18px 4px 26px;

		border-bottom:
			1px solid
			var(--border);
	}


	.import-card p {
		max-width: 720px;

		margin-top: 7px;

		color:
			var(--muted);

		font-size: .74rem;

		line-height: 1.55;
	}


	.legacy-import-form {
		display: flex;

		align-items: end;

		flex-wrap: wrap;

		gap: 10px;
	}


	.legacy-import-form input[type='file'] {
		min-width: 300px;

		padding: 8px;
	}


	.migration-complete {
		color:
			#8ead91;

		font-size: .55rem;

		font-weight: 850;

		letter-spacing: .09em;

		white-space: nowrap;

		text-transform: uppercase;
	}


	/* ==================================================
	   CAPITAL BOARD
	   ================================================== */

	.balance-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin-top: 2px;
	}


	.balance-card {
		position: relative;
		min-width: 0;
		min-height: 118px;

		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		align-items: center;
		gap: 7px 16px;

		padding: 16px;

		border: 1px solid var(--border);
		border-radius: var(--radius-sm);

		background:
			linear-gradient(
				180deg,
				rgba(255,255,255,.025),
				rgba(255,255,255,.008)
			),
			var(--panel);

		box-shadow:
			inset 0 1px 0 rgba(255,255,255,.025);

		transition:
			border-color 120ms ease,
			background 120ms ease,
			transform 120ms ease;
	}


	.balance-card:hover {
		transform: translateY(-1px);
		border-color: rgba(191,161,106,.38);

		background:
			linear-gradient(
				180deg,
				rgba(191,161,106,.035),
				rgba(255,255,255,.008)
			),
			var(--panel);
	}


	.balance-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 2px;
		height: 100%;
		background: var(--brand-gold);
		opacity: .42;
	}


	.team-row {
		min-width: 0;

		display: grid;
		grid-template-columns: 52px minmax(0, 1fr);
		align-items: center;
		gap: 11px;

		grid-row: 1 / 3;
	}


	.team-row img {
		width: 52px;
		height: 52px;
		object-fit: contain;
	}


	.team-row > div {
		min-width: 0;
		display: grid;
		gap: 3px;
	}


	.team-row strong {
		color: var(--brand-ivory);
		font-size: .82rem;
		font-weight: 850;
		line-height: 1.15;
		white-space: normal;
		overflow-wrap: anywhere;
	}


	.team-row span {
		color: var(--brand-stone);
		font-size: .64rem;
		line-height: 1.2;
		white-space: normal;
	}


	.capital-number {
		margin: 0;

		color: var(--brand-sand);

		font-family: var(--font-display);
		font-size: clamp(1.85rem, 2vw, 2.2rem);
		font-weight: 400;
		line-height: .95;
		letter-spacing: -.015em;
		text-align: right;
	}


	.capital-number.positive {
		color: #91b89b;
	}


	.capital-number.negative {
		color: #c77d72;
	}


	.balance-card > small {
		color: var(--brand-stone);
		font-size: .55rem;
		font-weight: 750;
		letter-spacing: .04em;
		line-height: 1.2;
		text-align: right;
		text-transform: uppercase;
	}


	/* ==================================================
	   TRADE REVIEW
	   ================================================== */

	.count-pill {
		color:
			var(--brand-gold);

		font-size: .62rem;

		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.trade-stack {
		display: grid;

		border-top:
			1px solid
			var(--border);
	}


	.trade-card {
		overflow: visible;

		border: 0;

		border-bottom:
			1px solid
			var(--border);

		border-radius: 0;

		background: transparent;
	}


	.trade-card.reviewed {
		opacity: .6;
	}


	.trade-toggle {
		width: 100%;

		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 20px;

		padding:
			17px 0;

		border: 0;

		background: transparent;

		color:
			var(--brand-ivory);

		text-align: left;
	}


	.trade-toggle:hover {
		background:
			rgba(191,161,106,.02);
	}


	.trade-toggle > div:first-child {
		display: grid;

		gap: 3px;
	}


	.trade-week {
		color:
			var(--brand-gold);

		font-size: .60rem;

		font-weight: 850;

		letter-spacing: .1em;

		text-transform: uppercase;
	}


	.trade-toggle strong {
		font-size: .98rem;
		line-height: 1.25;
	}


	.review-status {
		display: flex;

		align-items: center;

		gap: 8px;

		color:
			var(--brand-stone);

		font-size: .60rem;

		font-weight: 850;

		letter-spacing: .06em;

		text-transform: uppercase;
	}


	.trade-edit-button {
		padding: 0;

		border: 0;

		background: transparent;

		color:
			var(--brand-gold);

		font: inherit;

		font-size: inherit;

		font-weight: inherit;

		cursor: pointer;
	}


	.trade-edit-button:hover {
		color:
			var(--brand-sand);
	}


	.trade-body {
		padding:
			4px 0 20px;

		border: 0;
	}


	.trade-team-grid {
		display: grid;

		grid-template-columns:
			repeat(
				auto-fit,
				minmax(220px,1fr)
			);

		gap: 24px;

		padding:
			14px 0;

		border-top:
			1px solid
			rgba(191,161,106,.08);

		border-bottom:
			1px solid
			rgba(191,161,106,.08);
	}


	.trade-team {
		display: grid;

		align-content: start;

		gap: 5px;

		padding: 0;

		background: transparent;
	}


	.trade-team > strong {
		color:
			var(--brand-ivory);

		font-size: .90rem;
	}


	.trade-team > span {
		color:
			var(--brand-stone);

		font-size: .56rem;

		font-weight: 800;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.player-chip {
		color:
			var(--brand-sand);

		font-size: .82rem;
	}


	/* ==================================================
	   POSTED CAPITAL
	   ================================================== */

	.posted-capital-panel {
		display: grid;

		gap: 12px;

		margin-top: 16px;

		padding:
			14px 0 0;

		border-top:
			1px solid
			rgba(191,161,106,.16);

		background: transparent;
	}


	.posted-capital-head {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 15px;
	}


	.posted-capital-head > div {
		display: grid;

		gap: 2px;
	}


	.posted-capital-head span {
		color:
			var(--brand-stone);

		font-size: .58rem;

		font-weight: 850;

		letter-spacing: .07em;

		text-transform: uppercase;
	}


	.posted-capital-head strong {
		color:
			var(--brand-gold);

		font-size: .98rem;
	}


	.edit-capital-form {
		padding-top: 13px;

		border-top:
			1px solid
			var(--border);
	}


	.remove-capital-form {
		padding-top: 5px;
	}


	/* ==================================================
	   TRADE / MANUAL FORMS
	   ================================================== */

	.trade-actions {
		display: grid;

		gap: 14px;

		margin-top: 16px;
	}


	.capital-trade-form,
	.form-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 12px 14px;
	}


	.wide {
		grid-column:
			1 / -1;
	}


	.money-input {
		display: grid;

		grid-template-columns:
			auto 1fr;

		align-items: center;

		border:
			1px solid
			var(--border-strong);

		background:
			#0a0e0d;
	}


	.money-input span {
		padding-left: 10px;

		color:
			var(--brand-stone);
	}


	.money-input input {
		border: 0;
	}


	.ghost-button,
	.tiny-button {
		padding:
			7px 10px;

		border:
			1px solid
			var(--border-strong);

		border-radius: 2px;

		background: transparent;

		color:
			var(--brand-sand);

		font: inherit;

		font-size: .52rem;

		font-weight: 800;

		text-transform: uppercase;
	}


	.ghost-button:hover,
	.tiny-button:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	.danger-button {
		min-height: 36px;

		padding:
			0 12px;

		border:
			1px solid
			rgba(189,116,109,.5);

		border-radius: 2px;

		background:
			rgba(189,116,109,.04);

		color:
			#c8847c;

		font: inherit;

		font-size: .52rem;

		font-weight: 850;

		text-transform: uppercase;
	}


	/* ==================================================
	   MANUAL CONTROLS
	   ================================================== */

	.control-grid {
		display: grid;

		grid-template-columns:
			repeat(
				2,
				minmax(0,1fr)
			);

		gap: 48px;

		padding:
			6px 4px 34px;

		border-bottom:
			1px solid
			var(--border);
	}


	.control-grid .card {
		position: relative;

		padding-left: 18px;
	}


	.control-grid .card::before {
		content: '';

		position: absolute;

		top: 0;
		bottom: 0;
		left: 0;

		width: 1px;

		background:
			var(--brand-gold);
	}


	.control-grid .card h2 {
		margin-bottom: 17px;
	}


	/* ==================================================
	   LEDGER
	   ================================================== */

	.ledger-section-head {
		align-items: end;

		gap: 20px;
	}


	.ledger-subtitle {
		display: block;

		margin-top: 5px;

		color:
			var(--brand-stone);

		font-size: .59rem;
	}


	.audit-filter {
		display: flex;

		align-items: end;
	}


	.audit-filter select {
		min-width: 135px;
	}


	.ledger-table {
		overflow-x: auto;

		border-top:
			1px solid
			var(--border);
	}


	.ledger-head,
	.ledger-row {
		min-width: 980px;

		display: grid;

		grid-template-columns:
			110px
			minmax(170px,1.25fr)
			155px
			75px
			100px
			minmax(220px,2fr)
			60px;

		gap: 10px;

		align-items: center;
	}


	.ledger-head {
		min-height: 32px;

		padding:
			6px 4px;

		color:
			var(--brand-stone);

		font-size: .48rem;

		font-weight: 850;

		letter-spacing: .08em;

		text-transform: uppercase;
	}


	.ledger-row {
		min-height: 48px;

		padding:
			7px 4px;

		border-top:
			1px solid
			var(--border);

		color:
			var(--brand-sand);

		font-size: .7rem;
	}


	.ledger-row:hover {
		background:
			rgba(191,161,106,.018);
	}


	.ledger-row span {
		color:
			var(--muted);
	}


	.ledger-row small {
		color:
			var(--brand-stone);
	}


	.capital-year-cell {
		color:
			var(--brand-gold) !important;

		font-weight: 850;
	}


	.money-positive {
		color:
			#94b496;
	}


	.money-negative {
		color:
			#c07a72;
	}


	/* ==================================================
	   EMPTY
	   ================================================== */

	.empty {
		padding:
			25px 0;

		color:
			var(--brand-stone);

		font-size: .72rem;

		text-align: center;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 900px) {

		.capital-hero {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.balance-grid {
			grid-template-columns:
				repeat(2, minmax(0, 1fr));
		}


		.control-grid {
			grid-template-columns:
				1fr;

			gap: 30px;
		}

	}


	@media (max-width: 650px) {

		.capital-page {
			gap: 26px;
		}


		.capital-hero {
			min-height: 0;

			padding:
				28px 20px;
		}


		.capital-hero h1 {
			font-size:
				clamp(
					4rem,
					18vw,
					5.5rem
				);
		}


		.hero-side {
			width: 100%;
		}


		.pending-number,
		.hero-year {
			flex: 1;
			min-width: 0;
		}


		.import-card {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.section-head,
		.ledger-section-head {
			align-items:
				flex-start;

			flex-direction:
				column;
		}


		.capital-trade-form,
		.form-grid {
			grid-template-columns:
				1fr;
		}


		.wide {
			grid-column: auto;
		}


		.trade-toggle {
			align-items:
				flex-start;

			flex-direction:
				column;
		}

	}

	@media (max-width: 1200px) and (min-width: 901px) {
		.balance-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}


	@media (max-width: 560px) {
		.balance-grid {
			grid-template-columns: 1fr;
		}

		.balance-card {
			min-height: 108px;
		}

		.team-row {
			grid-template-columns: 48px minmax(0, 1fr);
		}

		.team-row img {
			width: 48px;
			height: 48px;
		}
	}
</style>
