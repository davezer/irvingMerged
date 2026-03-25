<script>
  import Card from '$lib/ui/Card.svelte';
  export let data;

  let role = 'gm';
  let expires_days = 0;

  let msg = '';
  let newCode = '';

  async function createInvite() {
    msg = '';
    newCode = '';

    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role, expires_days })
    });

    const j = await res.json();
    if (!res.ok || !j.ok) {
      msg = j?.error || 'Failed to create invite';
      return;
    }

    newCode = j.code;
    msg = `Created ${j.role.toUpperCase()} invite.`;
    // optional: refresh list
    location.reload();
  }

  function fmt(ts) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleString('en-US', { timeZone: 'America/New_York' });
  }
</script>
<Card variant="glow">
  <div class="kicker">Commissioner</div>
  <h1 class="h1">Invites</h1>
  <p class="subtle" style="margin-top:10px;">Private access only.</p>
</Card>

<div style="height:16px;"></div>

<main style="max-width: 980px; margin: 40px auto; padding: 0 16px;">
  <h1>Invites</h1>
  <p style="opacity:.7">Create single-use invite codes for new users.</p>

  <section style="margin: 16px 0; padding: 14px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px;">
    <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
      <label style="display:grid; gap:6px;">
        <span style="opacity:.7;">Role</span>
        <select bind:value={role}>
          <option value="gm">GM</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label style="display:grid; gap:6px;">
        <span style="opacity:.7;">Expires (days, optional)</span>
        <input type="number" min="0" bind:value={expires_days} />
      </label>

      <button on:click={createInvite}>Create invite</button>
    </div>

    {#if msg}
      <p style="margin: 10px 0 0; opacity:.9">{msg}</p>
    {/if}

    {#if newCode}
      <div style="margin-top:10px; padding: 10px; border: 1px dashed rgba(255,255,255,.2); border-radius: 10px;">
        <div style="opacity:.7; margin-bottom:6px;">New invite code:</div>
        <div style="font-family: ui-monospace, Menlo, monospace; font-size: 18px; letter-spacing: 1px;">{newCode}</div>
      </div>
    {/if}
  </section>

  <table style="width:100%; border-collapse: collapse;">
    <thead>
      <tr style="text-align:left; opacity:.7;">
        <th style="padding: 10px 6px;">Code</th>
        <th style="padding: 10px 6px;">Role</th>
        <th style="padding: 10px 6px;">Created</th>
        <th style="padding: 10px 6px;">Used</th>
      </tr>
    </thead>
    <tbody>
      {#each data.invites as i}
        <tr style="border-top: 1px solid rgba(255,255,255,.10);">
          <td style="padding: 10px 6px; font-family: ui-monospace, Menlo, monospace;">{i.code}</td>
          <td style="padding: 10px 6px;">{i.role}</td>
          <td style="padding: 10px 6px;">{fmt(i.created_at)}</td>
          <td style="padding: 10px 6px;">
            {#if i.used_at}
              {fmt(i.used_at)}
            {:else}
              <span style="opacity:.6;">—</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  select, input {
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.14);
    background: transparent;
    color: inherit;
  }
  button {
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.14);
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  button:hover { border-color: rgba(255,255,255,.25); }
</style>
