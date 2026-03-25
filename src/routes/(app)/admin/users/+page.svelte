<script>
  import Card from '$lib/ui/Card.svelte';
  export let data;
  

  let msg = '';
  let newCode = '';

  async function reset(username) {
    msg = '';
    newCode = '';

    const res = await fetch('/api/admin/reset-login-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username })
    });

    const j = await res.json();
    if (!res.ok || !j.ok) {
      msg = j?.error || 'Reset failed';
      return;
    }

    newCode = j.new_code;
    msg = `Reset code for ${username}. Copy it now — it’s shown once.`;
  }
</script>

<Card variant="glow">
  <div class="kicker">Commissioner</div>
  <h1 class="h1">Users</h1>
  <p class="subtle" style="margin-top:10px;">Handle business. Quietly.</p>
</Card>

<div style="height:16px;"></div>

<main style="max-width: 900px; margin: 40px auto; padding: 0 16px;">
  <h1>Users</h1>
  <p style="opacity:.7">Reset a user’s personal code if they lost it.</p>

  {#if msg}
    <p style="margin: 10px 0; opacity: .9">{msg}</p>
  {/if}

  {#if newCode}
    <div style="padding: 12px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; margin-bottom: 14px;">
      <div style="opacity:.7; margin-bottom: 6px;">New code:</div>
      <div style="font-family: ui-monospace, Menlo, monospace; font-size: 18px; letter-spacing: 1px;">
        {newCode}
      </div>
    </div>
  {/if}

  <table style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="text-align:left; opacity:.7;">
        <th style="padding: 10px 6px;">Username</th>
        <th style="padding: 10px 6px;">Name</th>
        <th style="padding: 10px 6px;">Role</th>
        <th style="padding: 10px 6px;"></th>
      </tr>
    </thead>
    <tbody>
      {#each data.users as u}
        <tr style="border-top: 1px solid rgba(255,255,255,.10);">
          <td style="padding: 10px 6px;">{u.username}</td>
          <td style="padding: 10px 6px;">{u.display_name}</td>
          <td style="padding: 10px 6px;">{u.role}</td>
          <td style="padding: 10px 6px; text-align:right;">
            <button on:click={() => reset(u.username)}>Reset code</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  button { padding: 8px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,.14); background: transparent; color: inherit; cursor: pointer; }
  button:hover { border-color: rgba(255,255,255,.25); }
</style>
