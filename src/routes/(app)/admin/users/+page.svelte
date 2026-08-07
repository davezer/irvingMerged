<script>
  import Card from '$lib/ui/Card.svelte';

  export let data;

  let msg = '';
  let recoveryCode = '';
  let recoveryUser = '';
  let busyUser = '';

  async function issueRecovery(username) {
    msg = '';
    recoveryCode = '';
    recoveryUser = '';
    busyUser = username;

    try {
      const res = await fetch('/api/admin/reset-login-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const j = await res.json();
      if (!res.ok || !j.ok) {
        msg = j?.error || 'Recovery code failed';
        return;
      }

      recoveryCode = j.recovery_code || j.new_code || '';
      recoveryUser = username;
      msg = `Recovery code issued for ${username}. It is shown once here.`;
    } catch {
      msg = 'Recovery code failed';
    } finally {
      busyUser = '';
    }
  }

  async function copyRecovery() {
    if (!recoveryCode) return;
    await navigator.clipboard.writeText(recoveryCode);
    msg = `Copied recovery code for ${recoveryUser}.`;
  }
</script>

<Card variant="glow">
  <div class="kicker">Commissioner</div>
  <h1 class="h1">Users</h1>
  <p class="subtle" style="margin-top:10px;">
    Password status, legacy accounts, and one-time recovery access.
  </p>
</Card>

<div class="spacer"></div>

<main class="users-shell">
  <div class="section-head">
    <div>
      <div class="kicker">Access control</div>
      <h2>Member accounts</h2>
    </div>
    <p>Issue a recovery code only when somebody needs to set or reset their password.</p>
  </div>

  {#if msg}
    <div class="notice">{msg}</div>
  {/if}

  {#if recoveryCode}
    <section class="recovery-reveal">
      <div>
        <span>One-time recovery code</span>
        <strong>{recoveryUser}</strong>
      </div>
      <code>{recoveryCode}</code>
      <button type="button" on:click={copyRecovery}>Copy code</button>
      <small>
        Give this directly to the user. After they successfully choose a new password, the code is burned.
      </small>
    </section>
  {/if}

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Name</th>
          <th>Role</th>
          <th>Password</th>
          <th>Recovery</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each data.users as user}
          <tr>
            <td><strong>{user.username}</strong></td>
            <td>{user.display_name}</td>
            <td><span class="role">{user.role}</span></td>
            <td>
              {#if Number(user.has_password)}
                <span class="status good">SET</span>
              {:else}
                <span class="status warn">LEGACY</span>
              {/if}
            </td>
            <td>
              {#if Number(user.has_recovery_code)}
                <span class="status ready">CODE READY</span>
              {:else}
                <span class="status muted">NONE</span>
              {/if}
            </td>
            <td class="action-cell">
              <button
                type="button"
                disabled={busyUser === user.username}
                on:click={() => issueRecovery(user.username)}
              >
                {busyUser === user.username ? 'Working…' : 'Issue recovery code'}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<style>
  .spacer { height: 16px; }

  .users-shell {
    max-width: 1040px;
    margin: 28px auto 48px;
    padding: 0 16px;
  }

  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
  }

  .section-head h2 { margin: 4px 0 0; }
  .section-head p { margin: 0; max-width: 520px; opacity: .68; text-align: right; }

  .notice,
  .recovery-reveal,
  .table-wrap {
    border: 1px solid rgba(255,255,255,.13);
    border-radius: 14px;
    background: rgba(0,0,0,.22);
  }

  .notice {
    padding: 12px 14px;
    margin-bottom: 14px;
  }

  .recovery-reveal {
    display: grid;
    grid-template-columns: minmax(140px, .7fr) minmax(220px, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    margin-bottom: 16px;
  }

  .recovery-reveal div { display: grid; gap: 3px; }
  .recovery-reveal span,
  .recovery-reveal small { opacity: .68; }

  .recovery-reveal code {
    padding: 12px;
    border-radius: 10px;
    border: 1px dashed rgba(214,177,94,.5);
    background: rgba(214,177,94,.1);
    color: #f5d58a;
    text-align: center;
    font-size: 1rem;
    letter-spacing: .08em;
  }

  .recovery-reveal small { grid-column: 1 / -1; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px 10px; text-align: left; border-top: 1px solid rgba(255,255,255,.08); }
  thead th { border-top: 0; opacity: .65; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }

  .role,
  .status {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.14);
    font-size: .72rem;
    font-weight: 850;
  }

  .status.good { color: #92e6aa; border-color: rgba(87,194,119,.35); background: rgba(87,194,119,.08); }
  .status.warn { color: #f5d58a; border-color: rgba(214,177,94,.4); background: rgba(214,177,94,.09); }
  .status.ready { color: #a8cfff; border-color: rgba(98,154,222,.4); background: rgba(98,154,222,.08); }
  .status.muted { opacity: .55; }

  .action-cell { text-align: right; white-space: nowrap; }
  button {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.16);
    background: rgba(255,255,255,.04);
    color: inherit;
    cursor: pointer;
    font-weight: 750;
  }
  button:hover:not(:disabled) { border-color: rgba(214,177,94,.5); }
  button:disabled { opacity: .45; cursor: wait; }

  @media (max-width: 720px) {
    .section-head { align-items: flex-start; flex-direction: column; }
    .section-head p { text-align: left; }
    .recovery-reveal { grid-template-columns: 1fr; }
    .recovery-reveal small { grid-column: auto; }
  }
</style>
