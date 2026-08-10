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
  .login-shell {
    width: min(980px, calc(100% - 32px));
    margin: 30px auto 56px;
    display: grid;
    gap: 18px;
  }

  .login-hero,
  .login-card {
    overflow: hidden;
    border: 2px solid #080909;
    border-radius: 18px;
    box-shadow: 0 12px 28px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.13);
  }

  .login-hero {
    position: relative;
    padding: 26px;
    background:
      linear-gradient(90deg, rgba(180,19,42,.33), transparent 44%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, #565d59, #222725 48%, #0e1110);
  }

  .hero-bug {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: stretch;
    border-right: 2px solid #080909;
    border-bottom: 2px solid #080909;
    background: #090a0a;
    font-weight: 950;
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .hero-bug span { padding: 9px 12px; background: #bd1730; color: white; }
  .hero-bug strong { padding: 9px 14px; color: #f3cf51; }

  .hero-copy { padding-top: 34px; max-width: 720px; }
  .hero-copy h1 { margin: 4px 0 8px; font-size: clamp(2.8rem, 7vw, 5.4rem); line-height: .9; letter-spacing: -.055em; }
  .hero-copy p { max-width: 62ch; margin: 0; opacity: .74; }

  .hero-flags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
  .hero-flags span {
    padding: 6px 9px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(0,0,0,.25);
    font-size: .75rem;
    font-weight: 800;
  }

  .login-card {
    padding: 22px;
    background:
      repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 4px),
      linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.02)),
      #171b19;
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .eyebrow,
  .kicker {
    color: #f3cf51;
    font-size: .72rem;
    font-weight: 950;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .card-head h2 { margin: 4px 0 0; font-size: 1.8rem; }

  .mode-tabs {
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    border: 1px solid rgba(255,255,255,.13);
    border-radius: 999px;
    background: rgba(0,0,0,.28);
  }

  .mode-tabs button,
  .secondary,
  .show-btn,
  .recovery-link {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .mode-tabs button {
    border: 0;
    border-radius: 999px;
    background: transparent;
    padding: 8px 12px;
    opacity: .7;
    font-weight: 850;
  }

  .mode-tabs button.active { opacity: 1; color: #f5d58a; background: rgba(214,177,94,.12); }

  .alert {
    display: grid;
    gap: 3px;
    padding: 12px 14px;
    margin-bottom: 16px;
    border: 1px solid rgba(227,87,87,.4);
    border-radius: 12px;
    background: rgba(227,87,87,.1);
  }

  .alert strong { color: #ff9a9a; }
  .alert span { opacity: .8; }

  .form { display: grid; gap: 14px; }
  .field { display: grid; gap: 7px; }
  .field > span { font-size: .78rem; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; opacity: .76; }
  .field small, .password-note { opacity: .58; font-size: .76rem; }

  input {
    width: 100%;
    box-sizing: border-box;
    min-height: 46px;
    border: 2px solid #070808;
    border-radius: 10px;
    background: #080a09;
    color: white;
    padding: 10px 12px;
    font: inherit;
    outline: none;
    box-shadow: inset 0 1px 8px rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.08);
  }

  input:focus { border-color: rgba(243,207,81,.65); }

  .password-row { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8px; }
  .show-btn,
  .secondary {
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 10px;
    background: rgba(255,255,255,.05);
    padding: 8px 12px;
    font-weight: 800;
  }

  .password-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }

  .recovery-link {
    justify-self: start;
    border: 0;
    background: transparent;
    padding: 0;
    color: #f5d58a;
    font-weight: 750;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .recovery-intro {
    padding: 12px 14px;
    border-left: 4px solid #f3cf51;
    background: rgba(243,207,81,.06);
  }

  .recovery-intro p { margin: 5px 0 0; opacity: .7; }

  .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  .primary {
    min-height: 44px;
    padding: 9px 18px;
    border: 2px solid #070808;
    border-radius: 10px;
    background: linear-gradient(180deg, #cf243d, #7e0e20);
    color: white;
    font: inherit;
    font-weight: 950;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 3px 8px rgba(0,0,0,.3);
  }

  .primary:disabled { opacity: .5; cursor: wait; }

  @media (max-width: 700px) {
    .login-shell { width: min(100% - 20px, 980px); margin-top: 16px; }
    .login-hero, .login-card { border-radius: 14px; }
    .login-hero { padding: 20px; }
    .hero-copy { padding-top: 48px; }
    .card-head { flex-direction: column; }
    .password-grid { grid-template-columns: 1fr; }
  }
</style>
