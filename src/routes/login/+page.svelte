<script>
  let mode = 'returning'; // 'returning' | 'signup'
  let username = '';
  let display_name = '';
  let invite_code = '';
  let personal_code = '';

  let errorMsg = '';
  let createdCode = ''; // shown once after signup
  let busy = false;

  async function submit(e) {
    errorMsg = '';
    createdCode = '';
    busy = true;

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('mode', mode);

    const res = await fetch('/api/auth/login', { method: 'POST', body: fd });

    // If endpoint returns JSON ok
    let j = null;
    try { j = await res.json(); } catch {}

    busy = false;

    if (res.ok && j?.ok) {
      if (j.created_code) {
        createdCode = j.created_code; // show once
        // user is also logged in; you can choose to auto-redirect after they copy
      } else {
        window.location.href = '/';
      }
      return;
    }

    errorMsg = j?.error || `Login failed (${res.status})`;
  }

  function useSignup() {
    mode = 'signup';
    errorMsg = '';
    createdCode = '';
    personal_code = '';
  }

  function useReturning() {
    mode = 'returning';
    errorMsg = '';
    createdCode = '';
    invite_code = '';
    display_name = '';
  }

  async function copyCode() {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
  }
</script>

<div class="wrap">
  <!-- HERO -->
  <div class="hero card card--glow">
    <div class="kicker">Irving Collective</div>
    <h1 class="h1">Offseason Lounge</h1>
    <p class="subtle" style="margin-top:10px; max-width: 56ch;">
      Invite-only. Picks on the felt. Points on the board.
      Bring a username… and the right code.
    </p>

    <div class="meta">
      <span class="pill pill--gold">Members only</span>
      <span class="pill">No email</span>
      <span class="pill">Private session</span>
    </div>
  </div>

  <div class="spacer"></div>

  <!-- LOGIN CARD -->
  <div class="card">
    <div class="head">
      <div>
        <div class="kicker">Access</div>
        <h2 class="h2">{mode === 'signup' ? 'First time' : 'Returning'}</h2>
      </div>

      <div class="segmented" role="tablist" aria-label="Login mode">
        <button
          type="button"
          class="seg"
          class:active={mode === 'returning'}
          on:click={useReturning}
        >
          Returning
        </button>
        <button
          type="button"
          class="seg"
          class:active={mode === 'signup'}
          on:click={useSignup}
        >
          First time
        </button>
      </div>
    </div>

    {#if errorMsg}
      <div class="alert">
        <div class="alert-title">Access denied</div>
        <div class="alert-body">{errorMsg}</div>
      </div>
    {/if}

    <form on:submit|preventDefault={submit} class="form">
      <label class="field">
        <span class="label">Username</span>
        <input
          class="input"
          name="username"
          bind:value={username}
          autocomplete="username"
          placeholder="username"
          required
          disabled={busy}
        />
        <div class="hint">Letters / numbers / underscore. We’ll auto-clean it.</div>
      </label>

      {#if mode === 'signup'}
        <label class="field">
          <span class="label">Display name</span>
          <input
            class="input"
            name="display_name"
            bind:value={display_name}
            autocomplete="nickname"
            placeholder="choose wisely"
            required
            disabled={busy}
          />
          <div class="hint">What everyone sees on the leaderboard.</div>
        </label>

        <label class="field">
          <span class="label">Invite code</span>
          <input
            class="input"
            name="invite_code"
            bind:value={invite_code}
            autocomplete="off"
            placeholder="one-time code"
            required
            disabled={busy}
          />
          <div class="hint">Commissioner issued. One use.</div>
        </label>
      {:else}
        <label class="field">
          <span class="label">Personal code</span>
          <input
            class="input"
            name="personal_code"
            bind:value={personal_code}
            autocomplete="off"
            placeholder="your personal code"
            required
            disabled={busy}
          />
          <div class="hint">Your key to the lounge.</div>
        </label>
      {/if}

      <div class="actions">
        <button class="btn" type="submit" disabled={busy}>
          {#if busy}
            Working…
          {:else if mode === 'signup'}
            Create account
          {:else}
            Enter
          {/if}
        </button>

        <span class="muted">
          {mode === 'signup'
            ? 'You’ll receive a personal code once — save it.'
            : 'Session stays on this device.'}
        </span>
      </div>
    </form>
  </div>

  {#if createdCode}
    <div class="spacer"></div>

    <!-- REVEAL -->
    <div class="card card--glow reveal">
      <div class="kicker">Important</div>
      <h2 class="h2">Save your personal code</h2>
      <p class="subtle" style="margin-top:8px;">
        This is shown once. If you lose it, an admin can reset it.
      </p>

      <div class="codewrap">
        <div class="code" aria-label="Personal code">{createdCode}</div>
        <div class="code-actions">
          <button class="btn btn--ghost" type="button" on:click={copyCode}>
            Copy
          </button>
          <button class="btn" type="button" on:click={() => (window.location.href = '/')}>
            Continue
          </button>
        </div>
      </div>

      <div class="muted" style="margin-top: 10px;">
        Pro move: save it in a password manager.
      </div>
    </div>
  {/if}
</div>

<style>
  .wrap {
    max-width: 860px;
    margin: 28px auto 0;
    padding: 0 18px 40px;
  }

  .hero {
    padding: 26px;
  }

  .meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .spacer { height: 16px; }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  /* Luxe segmented control */
  .segmented {
    display: inline-flex;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.25);
    border-radius: 999px;
    padding: 4px;
    gap: 4px;
  }

  .seg {
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255,255,255,0.75);
    padding: 8px 12px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 750;
    letter-spacing: 0.02em;
    transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
  }

  .seg:hover {
    color: rgba(255,255,255,0.92);
    border-color: rgba(255,255,255,0.14);
    background: rgba(255,255,255,0.03);
  }

  .seg.active {
    color: #f5d58a;
    border-color: rgba(214,177,94,0.35);
    background: rgba(214,177,94,0.10);
  }

  .form {
    display: grid;
    gap: 14px;
    margin-top: 10px;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .label {
    font-weight: 800;
    letter-spacing: 0.02em;
    color: rgba(255,255,255,0.78);
    font-size: 13px;
  }

  .hint {
    font-size: 12px;
    opacity: 0.60;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .alert {
    border: 1px solid rgba(227, 87, 87, 0.35);
    background: rgba(227, 87, 87, 0.10);
    border-radius: 14px;
    padding: 12px 14px;
    margin-top: 12px;
    margin-bottom: 8px;
  }

  .alert-title {
    font-weight: 900;
    letter-spacing: 0.02em;
    color: rgba(227, 87, 87, 0.95);
    margin-bottom: 4px;
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Garamond, Georgia, serif;
  }

  .alert-body {
    color: rgba(255,255,255,0.78);
  }

  .reveal {
    padding: 22px;
  }

  .codewrap {
    margin-top: 12px;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 14px;
    display: grid;
    gap: 12px;
  }

  .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 18px;
    padding: 14px;
    border-radius: 14px;
    border: 1px dashed rgba(214,177,94,0.45);
    background: rgba(214,177,94,0.10);
    letter-spacing: 1px;
    color: rgba(245,213,138,0.95);
    text-align: center;
  }

  .code-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  @media (max-width: 720px) {
    .wrap { margin-top: 16px; }
    .hero { padding: 20px; }
    .reveal { padding: 18px; }
  }
</style>
