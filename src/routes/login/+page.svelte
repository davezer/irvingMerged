<script>
  let mode = 'returning'; // returning | signup | recover

  let username = '';
  let display_name = '';
  let invite_code = '';
  let password = '';
  let confirm_password = '';
  let recovery_code = '';
  let new_password = '';
  let new_confirm_password = '';

  let errorMsg = '';
  let busy = false;
  let showPassword = false;

  const titles = {
    returning: 'Member login',
    signup: 'Create account',
    recover: 'Set / reset password'
  };

  function changeMode(next) {
    mode = next;
    errorMsg = '';
    password = '';
    confirm_password = '';
    recovery_code = '';
    new_password = '';
    new_confirm_password = '';
    showPassword = false;
  }

  async function submit(event) {
    errorMsg = '';
    busy = true;

    const fd = new FormData(event.currentTarget);
    fd.set('mode', mode);

    try {
      const res = await fetch('/api/auth/login', { method: 'POST', body: fd });
      let payload = null;
      try { payload = await res.json(); } catch {}

      if (res.ok && payload?.ok) {
        window.location.href = '/';
        return;
      }

      errorMsg = payload?.error || `Login failed (${res.status})`;

      if (payload?.code === 'password_setup_required') {
        changeMode('recover');
        errorMsg = payload.error;
      }
    } catch {
      errorMsg = 'Could not reach the login service. Try again.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="login-shell">
  <section class="login-hero">
    <div class="hero-bug">
      <span>ICL</span>
      <strong>Member Access</strong>
    </div>

    <div class="hero-copy">
      <div class="kicker">Irving Collective</div>
      <h1>Welcome back.</h1>
      <p>Invite-only. League business. Questionable decisions preserved for the record.</p>
    </div>

    <div class="hero-flags">
      <span>Members only</span>
      <span>No email required</span>
      <span>30-day session</span>
    </div>
  </section>

  <section class="login-card">
    <div class="card-head">
      <div>
        <div class="eyebrow">Access desk</div>
        <h2>{titles[mode]}</h2>
      </div>

      <div class="mode-tabs" aria-label="Login mode">
        <button type="button" class:active={mode === 'returning'} on:click={() => changeMode('returning')}>
          Login
        </button>
        <button type="button" class:active={mode === 'signup'} on:click={() => changeMode('signup')}>
          New member
        </button>
      </div>
    </div>

    {#if errorMsg}
      <div class="alert">
        <strong>Access desk</strong>
        <span>{errorMsg}</span>
      </div>
    {/if}

    <form class="form" on:submit|preventDefault={submit}>
      <label class="field">
        <span>Username</span>
        <input
          name="username"
          bind:value={username}
          autocomplete="username"
          placeholder="username"
          required
          disabled={busy}
        />
      </label>

      {#if mode === 'returning'}
        <label class="field">
          <span>Password</span>
          <div class="password-row">
            <input
              name="password"
              bind:value={password}
              type={showPassword ? 'text' : 'password'}
              autocomplete="current-password"
              placeholder="password"
              required
              disabled={busy}
            />
            <button class="show-btn" type="button" on:click={() => (showPassword = !showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button class="recovery-link" type="button" on:click={() => changeMode('recover')}>
          Forgot your password — or never set one?
        </button>
      {:else if mode === 'signup'}
        <label class="field">
          <span>Display name</span>
          <input
            name="display_name"
            bind:value={display_name}
            autocomplete="nickname"
            placeholder="what the league sees"
            required
            disabled={busy}
          />
        </label>

        <label class="field">
          <span>Invite code</span>
          <input
            name="invite_code"
            bind:value={invite_code}
            autocomplete="off"
            placeholder="commissioner-issued code"
            required
            disabled={busy}
          />
          <small>Single-use. This only gets you through registration.</small>
        </label>

        <div class="password-grid">
          <label class="field">
            <span>Choose password</span>
            <input
              name="password"
              bind:value={password}
              type="password"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              disabled={busy}
            />
          </label>

          <label class="field">
            <span>Confirm password</span>
            <input
              name="confirm_password"
              bind:value={confirm_password}
              type="password"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              disabled={busy}
            />
          </label>
        </div>

        <div class="password-note">10+ characters. A passphrase works great.</div>
      {:else}
        <div class="recovery-intro">
          <strong>Legacy member?</strong>
          <p>Your old personal code works here once. After you set a password, that code is retired.</p>
          <p>Already had a password and forgot it? Ask an admin for a one-time recovery code.</p>
        </div>

        <label class="field">
          <span>Personal / recovery code</span>
          <input
            name="recovery_code"
            bind:value={recovery_code}
            autocomplete="one-time-code"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
            disabled={busy}
          />
        </label>

        <div class="password-grid">
          <label class="field">
            <span>New password</span>
            <input
              name="new_password"
              bind:value={new_password}
              type="password"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              disabled={busy}
            />
          </label>

          <label class="field">
            <span>Confirm new password</span>
            <input
              name="new_confirm_password"
              bind:value={new_confirm_password}
              type="password"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              disabled={busy}
            />
          </label>
        </div>
      {/if}

      <div class="actions">
        <button class="primary" type="submit" disabled={busy}>
          {#if busy}
            Working…
          {:else if mode === 'returning'}
            Enter lounge
          {:else if mode === 'signup'}
            Create account
          {:else}
            Set password
          {/if}
        </button>

        {#if mode === 'recover'}
          <button class="secondary" type="button" on:click={() => changeMode('returning')}>
            Back to login
          </button>
        {/if}
      </div>
    </form>
  </section>
</div>

<style>
	/* ==================================================
	   LOGIN PAGE
	   ================================================== */

	.login-shell {
		width:
			min(
				1120px,
				calc(100% - 40px)
			);

		display: grid;

		grid-template-columns:
			minmax(0, 1.15fr)
			minmax(380px, .85fr);

		margin:
			42px auto 72px;

		border:
			1px solid
			var(--border-strong);

		background:
			#090d0c;

		box-shadow:
			0 26px 70px
			rgba(
				0,
				0,
				0,
				.34
			);
	}


	/* ==================================================
	   HERO
	   ================================================== */

	.login-hero {
		position:
			relative;

		min-height:
			600px;

		display:
			flex;

		flex-direction:
			column;

		justify-content:
			space-between;

		overflow:
			hidden;

		padding:
			34px
			clamp(
				28px,
				4vw,
				52px
			)
			42px;

		border-right:
			1px solid
			var(--border);

		background:
			radial-gradient(
				circle at 75% 35%,
				rgba(
					191,
					161,
					106,
					.08
				),
				transparent 38%
			),
			linear-gradient(
				145deg,
				rgba(
					255,
					255,
					255,
					.025
				),
				transparent 58%
			),
			#090d0c;
	}


	.login-hero::after {
		content:
			'ICL';

		position:
			absolute;

		right:
			-24px;

		bottom:
			-65px;

		color:
			rgba(
				191,
				161,
				106,
				.025
			);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				12rem,
				22vw,
				20rem
			);

		font-weight:
			400;

		line-height:
			1;

		pointer-events:
			none;
	}


	.hero-bug {
		position:
			relative;

		z-index:
			2;

		display:
			inline-flex;

		align-items:
			center;

		align-self:
			flex-start;

		gap:
			12px;
	}


	.hero-bug span {
		width:
			48px;

		height:
			48px;

		display:
			grid;

		place-items:
			center;

		border:
			1px solid
			var(--brand-gold);

		color:
			var(--brand-gold);

		font-family:
			var(--font-display);

		font-size:
			1.35rem;

		line-height:
			1;
	}


	.hero-bug strong {
		color:
			var(--brand-stone);

		font-size:
			.58rem;

		font-weight:
			850;

		letter-spacing:
			.13em;

		text-transform:
			uppercase;
	}


	.hero-copy {
		position:
			relative;

		z-index:
			2;

		max-width:
			680px;

		margin:
			auto 0;
	}


	.kicker,
	.eyebrow {
		color:
			var(--brand-gold);

		font-size:
			.58rem;

		font-weight:
			850;

		letter-spacing:
			.16em;

		text-transform:
			uppercase;
	}


	.hero-copy h1 {
		max-width:
			680px;

		margin:
			12px 0 18px;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			clamp(
				4.6rem,
				8vw,
				7.5rem
			);

		font-weight:
			400;

		line-height:
			.82;

		letter-spacing:
			-.025em;

		text-transform:
			uppercase;
	}


	.hero-copy p {
		max-width:
			560px;

		margin:
			0;

		color:
			var(--muted);

		font-size:
			.92rem;

		line-height:
			1.65;
	}


	.hero-flags {
		position:
			relative;

		z-index:
			2;

		display:
			flex;

		flex-wrap:
			wrap;

		gap:
			0;
	}


	.hero-flags span {
		padding:
			0 13px;

		border-right:
			1px solid
			var(--border);

		color:
			var(--brand-stone);

		font-size:
			.53rem;

		font-weight:
			800;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}


	.hero-flags span:first-child {
		padding-left:
			0;
	}


	.hero-flags span:last-child {
		border-right:
			0;
	}


	/* ==================================================
	   LOGIN PANEL
	   ================================================== */

	.login-card {
		display:
			flex;

		flex-direction:
			column;

		justify-content:
			center;

		padding:
			42px
			clamp(
				26px,
				4vw,
				46px
			);

		background:
			linear-gradient(
				180deg,
				rgba(
					255,
					255,
					255,
					.018
				),
				rgba(
					255,
					255,
					255,
					.005
				)
			),
			#0d1110;
	}


	.card-head {
		display:
			flex;

		align-items:
			flex-start;

		justify-content:
			space-between;

		gap:
			16px;

		margin-bottom:
			28px;

		padding-bottom:
			18px;

		border-bottom:
			1px solid
			var(--border);
	}


	.card-head h2 {
		margin:
			7px 0 0;

		color:
			var(--brand-ivory);

		font-family:
			var(--font-display);

		font-size:
			2.15rem;

		font-weight:
			400;

		line-height:
			1;

		text-transform:
			uppercase;
	}


	/* ==================================================
	   MODE TABS
	   ================================================== */

	.mode-tabs {
		display:
			flex;

		align-items:
			center;

		border:
			1px solid
			var(--border-strong);
	}


	.mode-tabs button {
		min-height:
			34px;

		padding:
			0 11px;

		border:
			0;

		border-right:
			1px solid
			var(--border);

		background:
			transparent;

		color:
			var(--brand-stone);

		font:
			inherit;

		font-size:
			.53rem;

		font-weight:
			850;

		letter-spacing:
			.06em;

		text-transform:
			uppercase;

		cursor:
			pointer;
	}


	.mode-tabs button:last-child {
		border-right:
			0;
	}


	.mode-tabs button.active {
		background:
			rgba(
				191,
				161,
				106,
				.10
			);

		color:
			var(--brand-gold);
	}


	/* ==================================================
	   ALERT
	   ================================================== */

	.alert {
		display:
			grid;

		gap:
			4px;

		margin-bottom:
			18px;

		padding:
			12px 14px;

		border-left:
			2px solid
			#bd746d;

		background:
			rgba(
				189,
				116,
				109,
				.055
			);
	}


	.alert strong {
		color:
			#d98b83;

		font-size:
			.62rem;

		letter-spacing:
			.08em;

		text-transform:
			uppercase;
	}


	.alert span {
		color:
			var(--brand-sand);

		font-size:
			.78rem;

		line-height:
			1.4;
	}


	/* ==================================================
	   FORM
	   ================================================== */

	.form {
		display:
			grid;

		gap:
			17px;
	}


	.field {
		display:
			grid;

		gap:
			7px;
	}


	.field > span {
		color:
			var(--brand-stone);

		font-size:
			.55rem;

		font-weight:
			850;

		letter-spacing:
			.09em;

		text-transform:
			uppercase;
	}


	.field small,
	.password-note {
		color:
			var(--muted);

		font-size:
			.68rem;

		line-height:
			1.4;
	}


	input {
		width:
			100%;

		min-height:
			45px;

		box-sizing:
			border-box;

		outline:
			0;

		padding:
			0 12px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			2px;

		background:
			#080c0b;

		color:
			var(--brand-ivory);

		font:
			inherit;

		font-size:
			.82rem;

		box-shadow:
			inset 0 1px 6px
			rgba(
				0,
				0,
				0,
				.4
			);
	}


	input::placeholder {
		color:
			rgba(
				255,
				255,
				255,
				.25
			);
	}


	input:focus {
		border-color:
			var(--brand-gold);

		box-shadow:
			0 0 0 1px
			rgba(
				191,
				161,
				106,
				.10
			);
	}


	input:disabled {
		opacity:
			.55;
	}


	.password-row {
		display:
			grid;

		grid-template-columns:
			minmax(
				0,
				1fr
			)
			auto;

		gap:
			8px;
	}


	.password-grid {
		display:
			grid;

		grid-template-columns:
			repeat(
				2,
				minmax(
					0,
					1fr
				)
			);

		gap:
			12px;
	}


	/* ==================================================
	   SMALL BUTTONS / LINKS
	   ================================================== */

	.show-btn,
	.secondary {
		min-width:
			64px;

		border:
			1px solid
			var(--border-strong);

		border-radius:
			2px;

		background:
			rgba(
				255,
				255,
				255,
				.025
			);

		color:
			var(--brand-sand);

		font:
			inherit;

		font-size:
			.58rem;

		font-weight:
			850;

		letter-spacing:
			.05em;

		text-transform:
			uppercase;

		cursor:
			pointer;
	}


	.show-btn:hover,
	.secondary:hover {
		border-color:
			var(--brand-gold);

		color:
			var(--brand-gold);
	}


	.recovery-link {
		justify-self:
			start;

		padding:
			0;

		border:
			0;

		background:
			transparent;

		color:
			var(--brand-gold);

		font:
			inherit;

		font-size:
			.68rem;

		font-weight:
			750;

		text-decoration:
			none;

		cursor:
			pointer;
	}


	.recovery-link:hover {
		color:
			var(--brand-sand);
	}


	/* ==================================================
	   RECOVERY
	   ================================================== */

	.recovery-intro {
		padding:
			13px 15px;

		border-left:
			2px solid
			var(--brand-gold);

		background:
			rgba(
				191,
				161,
				106,
				.04
			);
	}


	.recovery-intro strong {
		color:
			var(--brand-sand);

		font-size:
			.76rem;
	}


	.recovery-intro p {
		margin:
			5px 0 0;

		color:
			var(--muted);

		font-size:
			.72rem;

		line-height:
			1.45;
	}


	/* ==================================================
	   ACTIONS
	   ================================================== */

	.actions {
		display:
			flex;

		align-items:
			center;

		flex-wrap:
			wrap;

		gap:
			10px;

		margin-top:
			5px;
	}


	.primary {
		min-height:
			43px;

		padding:
			0 18px;

		border:
			1px solid
			var(--brand-gold);

		border-radius:
			2px;

		background:
			var(--brand-gold);

		color:
			var(--brand-charcoal);

		font:
			inherit;

		font-size:
			.62rem;

		font-weight:
			900;

		letter-spacing:
			.07em;

		text-transform:
			uppercase;

		cursor:
			pointer;
	}


	.primary:hover {
		border-color:
			var(--brand-sand);

		background:
			var(--brand-sand);
	}


	.primary:disabled {
		opacity:
			.5;

		cursor:
			wait;
	}


	.secondary {
		min-height:
			43px;

		padding:
			0 15px;
	}


	/* ==================================================
	   RESPONSIVE
	   ================================================== */

	@media (max-width: 860px) {

		.login-shell {
			grid-template-columns:
				1fr;

			width:
				min(
					760px,
					calc(
						100% -
						28px
					)
				);

			margin-top:
				20px;
		}


		.login-hero {
			min-height:
				410px;

			border-right:
				0;

			border-bottom:
				1px solid
				var(--border);
		}


		.login-card {
			padding:
				32px 28px;
		}

	}


	@media (max-width: 560px) {

		.login-shell {
			width:
				calc(
					100% -
					20px
				);

			margin:
				12px auto
				40px;
		}


		.login-hero {
			min-height:
				330px;

			padding:
				22px 20px
				26px;
		}


		.hero-bug span {
			width:
				42px;

			height:
				42px;
		}


		.hero-copy h1 {
			font-size:
				clamp(
					3.6rem,
					18vw,
					5rem
				);
		}


		.hero-copy p {
			font-size:
				.78rem;
		}


		.hero-flags span {
			padding:
				0 8px;

			font-size:
				.46rem;
		}


		.login-card {
			padding:
				26px 20px
				30px;
		}


		.card-head {
			flex-direction:
				column;

			gap:
				14px;
		}


		.password-grid {
			grid-template-columns:
				1fr;
		}


		.mode-tabs {
			width:
				100%;
		}


		.mode-tabs button {
			flex:
				1;
		}

	}
</style>