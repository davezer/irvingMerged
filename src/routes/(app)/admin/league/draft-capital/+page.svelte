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
		<div>
			<div class="eyebrow">League Finance</div>

			<h1>Draft Capital Control Room</h1>
		</div>

		<div class="hero-stat">
			<strong>
				{data.pendingTradeCount}
			</strong>

			<span> trades awaiting review </span>
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

	{#if data.year === 2026}
		<section class="card import-card">
			{#if data.legacyImport?.rowCount > 0}
				<div>
					<div class="eyebrow">Migration complete</div>

					<h2>Historical ledger is in D1</h2>

					<p>
						{data.legacyImport.rowCount}
						legacy transactions imported from
						{data.legacyImport.firstDate}
						through
						{data.legacyImport.lastDate}. Opening-balance snapshots have been retired.
					</p>
				</div>

				<div class="migration-complete">✓ FULL HISTORY ACTIVE</div>
			{:else}
				<div>
					<div class="eyebrow">Legacy Migration</div>

					<h2>Backfill complete transaction history</h2>

					<p>
						Upload the exported Google Sheets Ledger CSV. The importer will refuse to commit unless
						all 14 calculated balances exactly match the current D1 capital board.
					</p>
				</div>

				<form
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
			{/if}
		</section>
	{/if}

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
							<img src={team.photo} alt="" />
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
	.capital-page {
		display: grid;
		gap: 22px;
		padding-bottom: 40px;
	}

	.capital-hero,
	.card,
	.section {
		border: 2px solid #080909;
		border-radius: 10px;
		background: linear-gradient(180deg, #343a37, #121514 42%, #090b0a);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.12),
			0 12px 30px rgba(0, 0, 0, 0.32);
	}

	.capital-hero {
		display: flex;
		justify-content: space-between;
		gap: 24px;
		align-items: center;
		padding: 24px;
	}

	.capital-hero h1,
	.section h2,
	.card h2 {
		margin: 4px 0;
		color: #fff;
	}

	.capital-hero p {
		margin: 6px 0 0;
		color: rgba(255, 255, 255, 0.58);
	}

	.eyebrow {
		color: var(--bug-yellow, #ffd43b);
		font-weight: 900;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.hero-stat {
		display: grid;
		justify-items: end;
	}

	.hero-stat strong {
		color: var(--bug-yellow, #ffd43b);
		font-size: 2rem;
	}

	.hero-stat span {
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.72rem;
		text-transform: uppercase;
	}

	.notice {
		padding: 12px 15px;
		border-radius: 7px;
		font-weight: 800;
	}

	.success {
		background: rgba(41, 160, 90, 0.16);
		border: 1px solid rgba(41, 160, 90, 0.55);
	}

	.error {
		background: rgba(200, 45, 40, 0.16);
		border: 1px solid rgba(200, 45, 40, 0.55);
	}

	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: end;
	}

	label {
		display: grid;
		gap: 5px;
		color: rgba(255, 255, 255, 0.65);
		font-size: 0.72rem;
		font-weight: 850;
		text-transform: uppercase;
	}

	input,
	select {
		min-height: 38px;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 5px;
		background: #101312;
		color: white;
		padding: 0 10px;
	}

	button {
		cursor: pointer;
	}

	.filter-bar button,
	.gold-button {
		min-height: 38px;
		border: 2px solid #080909;
		border-radius: 5px;
		padding: 0 14px;
		background: linear-gradient(180deg, #ffd84c, #b98d0a);
		color: #090a09;
		font-weight: 950;
	}

	.import-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		padding: 18px;
	}

	.import-card p {
		max-width: 650px;
		margin-bottom: 0;
		color: rgba(255, 255, 255, 0.55);
	}

	.section {
		padding: 18px;
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}

	.balance-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 10px;
	}

	.legacy-import-form {
		display: flex;
		gap: 12px;
		align-items: end;
		flex-wrap: wrap;
	}

	.legacy-import-form input[type='file'] {
		padding: 8px;
		min-width: 300px;
	}

	.migration-complete {
		color: #57e991;
		font-weight: 950;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}

	.balance-card {
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 7px;
		background: rgba(0, 0, 0, 0.22);
	}

	.team-row {
		display: grid;
		grid-template-columns: 38px 1fr;
		gap: 9px;
		align-items: center;
	}

	.team-row img {
		width: 38px;
		height: 38px;
		object-fit: contain;
	}

	.team-row div {
		display: grid;
	}

	.team-row span {
		color: rgba(255, 255, 255, 0.48);
		font-size: 0.7rem;
	}

	.capital-number {
		margin-top: 13px;
		color: white;
		font-size: 1.6rem;
		font-weight: 950;
	}

	.capital-number.positive {
		color: #58dc8c;
	}

	.capital-number.negative {
		color: #ff6560;
	}

	.balance-card small {
		color: rgba(255, 255, 255, 0.42);
	}

	.count-pill {
		padding: 5px 9px;
		border-radius: 99px;
		background: rgba(255, 212, 59, 0.12);
		color: var(--bug-yellow, #ffd43b);
		font-size: 0.7rem;
		font-weight: 900;
	}
	.posted-capital-panel {
		display: grid;
		gap: 12px;

		margin-top: 14px;
		padding: 13px;

		border: 1px solid rgba(53, 199, 255, 0.22);

		border-radius: 7px;

		background: rgba(53, 199, 255, 0.045);
	}

	.posted-capital-head {
		display: flex;

		justify-content: space-between;

		align-items: center;

		gap: 15px;
	}

  .trade-edit-button {
  padding: 0;

  border: 0;

  background:
    transparent;

  color:
    #35c7ff;

  font:
    inherit;

  font-weight:
    950;

  text-transform:
    uppercase;

  cursor:
    pointer;
}


.trade-edit-button:hover {
  color:
    #ffffff;

  text-decoration:
    underline;
}


.review-status {
  display:
    flex;

  align-items:
    center;

  gap:
    5px;
}

	.posted-capital-head > div {
		display: grid;
		gap: 2px;
	}

	.posted-capital-head span {
		color: rgba(255, 255, 255, 0.48);

		font-size: 0.66rem;

		font-weight: 900;

		text-transform: uppercase;
	}

	.posted-capital-head strong {
		color: #35c7ff;

		font-size: 1rem;
	}

	.edit-capital-form {
		padding-top: 12px;

		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.remove-capital-form {
		padding-top: 10px;
	}

	.danger-button {
		min-height: 36px;

		padding: 0 13px;

		border: 1px solid rgba(255, 105, 100, 0.55);

		border-radius: 5px;

		background: rgba(180, 30, 30, 0.16);

		color: #ff6964;

		font-weight: 900;

		cursor: pointer;
	}
	.trade-stack {
		display: grid;
		gap: 9px;
	}

	.trade-card {
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 7px;
		background: rgba(0, 0, 0, 0.24);
	}

	.trade-card.reviewed {
		opacity: 0.56;
	}

	.trade-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		gap: 15px;
		padding: 13px;
		border: 0;
		background: transparent;
		color: white;
		text-align: left;
	}

	.trade-toggle > div:first-child {
		display: grid;
		gap: 4px;
	}

	.trade-week {
		color: var(--bug-yellow, #ffd43b);
		font-size: 0.66rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.review-status {
		color: #35c7ff;
		font-size: 0.67rem;
		font-weight: 950;
	}

	.trade-body {
		padding: 13px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.trade-team-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 10px;
	}

	.trade-team {
		display: grid;
		gap: 6px;
		padding: 11px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.04);
	}

	.trade-team > span {
		color: rgba(255, 255, 255, 0.48);
		font-size: 0.66rem;
		text-transform: uppercase;
	}

	.player-chip {
		font-size: 0.82rem;
	}

	.trade-actions {
		display: grid;
		gap: 12px;
		margin-top: 14px;
	}

	.capital-trade-form,
	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.wide {
		grid-column: 1 / -1;
	}

	.money-input {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 5px;
		background: #101312;
	}

	.money-input span {
		padding-left: 10px;
		color: rgba(255, 255, 255, 0.5);
	}

	.money-input input {
		border: 0;
	}

	.ghost-button,
	.tiny-button {
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.05);
		color: white;
		padding: 8px 11px;
	}

	.control-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}

	.control-grid .card {
		padding: 18px;
	}

	.ledger-table {
		overflow-x: auto;
	}

	.ledger-head,
	.ledger-row {
		min-width: 980px;

		display: grid;

		grid-template-columns:
			110px
			minmax(170px, 1.25fr)
			155px
			75px
			100px
			minmax(220px, 2fr)
			60px;

		gap: 10px;

		align-items: center;
	}

	.ledger-head {
		padding: 8px 10px;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.65rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	.ledger-row {
		padding: 9px 10px;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		font-size: 0.8rem;
	}

	.ledger-row span {
		color: rgba(255, 255, 255, 0.63);
	}

	.ledger-row small {
		color: rgba(255, 255, 255, 0.4);
	}

	.capital-year-cell {
		color: var(--bug-yellow, #ffd43b) !important;

		font-weight: 950;
	}

	.ledger-subtitle {
		display: block;

		margin-top: 4px;

		color: rgba(255, 255, 255, 0.45);
	}

	.ledger-section-head {
		gap: 20px;
	}

	.audit-filter {
		display: flex;
		align-items: end;
	}

	.audit-filter select {
		min-width: 135px;
	}

	.money-positive {
		color: #55dc89;
	}

	.money-negative {
		color: #ff6964;
	}

	.empty {
		padding: 22px;
		text-align: center;
		color: rgba(255, 255, 255, 0.42);
	}

	@media (max-width: 800px) {
		.capital-hero,
		.import-card {
			align-items: flex-start;
			flex-direction: column;
		}

		.hero-stat {
			justify-items: start;
		}

		.control-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 560px) {
		.capital-trade-form,
		.form-grid {
			grid-template-columns: 1fr;
		}

		.wide {
			grid-column: auto;
		}
	}
</style>
