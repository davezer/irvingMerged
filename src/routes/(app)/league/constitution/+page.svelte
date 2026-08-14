<svelte:head>
	<title>
		League Constitution | Irving Champions League
	</title>

	<meta
		name="description"
		content="Official Irving Champions League constitution and league rules."
	/>
</svelte:head>

<div class="constitution-page">

	<header class="constitution-header">
		<div>
			<div class="eyebrow">
				League Governance
			</div>

			<h1>
				League Constitution
			</h1>

			<p>
				The official rules, procedures, and laws of the
				Irving Champions League.
			</p>
		</div>

		<a
			class="open-button"
			href="https://docs.google.com/document/d/e/2PACX-1vQrprI-QZtCpV4usAki6N1cTIvwEJLdDewAlJwJRpBu29qqS5iIg9l78D8ryO0Xc57fqEChNy6SuV3u/pub"
			target="_blank"
			rel="noopener noreferrer"
		>
			Open Full Document
		</a>
	</header>


	<section class="document-shell">
		<div class="document-bar">
			<div>
				<span class="status-dot"></span>

				Official League Document
			</div>

			<span>
				Irving Champions League
			</span>
		</div>

		<iframe
			src="https://docs.google.com/document/d/e/2PACX-1vQrprI-QZtCpV4usAki6N1cTIvwEJLdDewAlJwJRpBu29qqS5iIg9l78D8ryO0Xc57fqEChNy6SuV3u/pub?embedded=true"
			title="Irving Champions League Constitution"
			class="google-doc-iframe"
		></iframe>
	</section>

</div>


<style>
	.constitution-page {
		display: grid;
		gap: 18px;

		max-width: 1450px;

		margin: 0 auto;

		padding-bottom: 60px;
	}


	/* ======================================================
	   HEADER
	   ====================================================== */

	.constitution-header {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 24px;

		padding: 23px 26px;

		border:
			2px solid #070808;

		border-radius:
			18px;

		background:
			radial-gradient(
				circle at 0% 100%,
				rgba(0, 190, 230, .15),
				transparent 32%
			),
			linear-gradient(
				180deg,
				#46504d,
				#202523 45%,
				#111413
			);

		box-shadow:
			var(--shadow-panel);
	}

	.eyebrow {
		color:
			var(--bug-yellow);

		font-family:
			var(--font-score);

		font-size:
			.68rem;

		font-weight:
			950;

		letter-spacing:
			.13em;

		text-transform:
			uppercase;
	}

	h1 {
		margin:
			6px 0 0;

		font-family:
			var(--font-display);

		font-size:
			clamp(
				2.6rem,
				5vw,
				4.4rem
			);

		line-height:
			.95;
	}

	.constitution-header p {
		margin:
			10px 0 0;

		color:
			var(--muted);

		line-height:
			1.5;
	}

	.open-button {
		flex:
			0 0 auto;

		padding:
			11px 16px;

		border:
			2px solid #070808;

		border-radius:
			9px;

		background:
			linear-gradient(
				180deg,
				#f5c85a,
				#d99e24
			);

		color:
			#080908;

		font-family:
			var(--font-score);

		font-size:
			.7rem;

		font-weight:
			950;

		text-decoration:
			none;

		text-transform:
			uppercase;

		box-shadow:
			inset 0 1px 0
			rgba(255,255,255,.3);

		transition:
			transform .12s ease,
			filter .12s ease;
	}

	.open-button:hover {
		transform:
			translateY(-1px);

		filter:
			brightness(1.07);
	}


	/* ======================================================
	   DOCUMENT
	   ====================================================== */

	.document-shell {
		overflow: hidden;

		border:
			2px solid #070808;

		border-radius:
			16px;

		background:
			#161a18;

		box-shadow:
			var(--shadow-panel);
	}

	.document-bar {
		display: flex;

		align-items: center;

		justify-content: space-between;

		gap: 20px;

		padding:
			11px 15px;

		border-bottom:
			1px solid
			rgba(255,255,255,.12);

		background:
			linear-gradient(
				180deg,
				#343b39,
				#242927
			);

		color:
			var(--muted);

		font-family:
			var(--font-score);

		font-size:
			.64rem;

		font-weight:
			900;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}

	.document-bar > div {
		display: flex;

		align-items: center;

		gap: 8px;
	}

	.status-dot {
		width: 7px;

		height: 7px;

		border-radius:
			999px;

		background:
			#57dd86;

		box-shadow:
			0 0 8px
			rgba(87,221,134,.75);
	}

	.google-doc-iframe {
		display: block;

		width: 100%;

		height:
			calc(100vh - 245px);

		min-height:
			800px;

		border:
			0;

		background:
			#fff;
	}


	/* ======================================================
	   MOBILE
	   ====================================================== */

	@media (
		max-width: 700px
	) {
		.constitution-header {
			display: grid;
		}

		.open-button {
			width:
				max-content;
		}

		.document-bar {
			align-items:
				start;

			flex-direction:
				column;
		}

		.google-doc-iframe {
			height:
				75vh;

			min-height:
				650px;
		}
	}
</style>