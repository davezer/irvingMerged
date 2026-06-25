<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let data;

  let mobileOpen = false;
  let adminDD;

  const primaryLinks = [
    { href: '/', label: 'Clubhouse' },
    { href: '/league', label: 'League HQ' },
    { href: '/games', label: 'Games' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/history', label: 'History' },
    { href: '/news', label: 'News' }
  ];

  const adminLinks = [
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/league', label: 'League' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/invites', label: 'Invites' }
  ];

  $: path = $page.url.pathname;
  $: user = data?.user || {};

  const isActive = (href) => path === href || (href !== '/' && path.startsWith(`${href}/`));
  const closeMobile = () => (mobileOpen = false);
  const closeAdmin = () => adminDD?.removeAttribute('open');

  function toggleAdmin() {
    if (!adminDD) return;
    adminDD.toggleAttribute('open');
  }

  onMount(() => {
    function onDocPointerDown(event) {
      if (!adminDD?.hasAttribute('open')) return;
      const target = event.target;
      if (!(target instanceof Node && adminDD.contains(target))) closeAdmin();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeAdmin();
        closeMobile();
      }
    }

    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  });

  $: $page.url.pathname, (mobileOpen = false), closeAdmin();
</script>

<div class="app-shell">
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="/" aria-label="Irving Collective home">
        <span class="brand-mark">IC</span>
        <span class="brand-copy">
          <strong>Irving Collective</strong>
          <em>League Lounge</em>
        </span>
      </a>

      <nav class="primary-nav" aria-label="Primary navigation">
        {#each primaryLinks as link}
          <a class:active={isActive(link.href)} href={link.href}>{link.label}</a>
        {/each}
      </nav>

      <div class="right-rail">
        <button
          class="menu-button"
          class:is-open={mobileOpen}
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          on:click={() => (mobileOpen = !mobileOpen)}
        >
          <span></span><span></span><span></span>
        </button>

        <div class="user-chip" title="Signed in">
          <span class="status-dot" aria-hidden="true"></span>
          <span class="user-name">{user.displayName || user.display_name || 'Member'}</span>
          {#if user.role === 'admin'}
            <details class="admin-menu" bind:this={adminDD}>
              <summary on:click|preventDefault={toggleAdmin}>Admin ▾</summary>
              <div class="admin-popover" role="menu" aria-label="Admin menu">
                {#each adminLinks as link}
                  <a class:active={isActive(link.href)} href={link.href}>{link.label}</a>
                {/each}
              </div>
            </details>
          {/if}
        </div>

        <form method="POST" action="/api/auth/logout" class="logout-form">
          <button class="logout-button" type="submit">Logout</button>
        </form>
      </div>
    </div>

    {#if mobileOpen}
      <button class="mobile-scrim" type="button" aria-label="Close menu" on:click={closeMobile}></button>
      <nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation">
        {#each primaryLinks as link}
          <a class:active={isActive(link.href)} href={link.href} on:click={closeMobile}>{link.label}</a>
        {/each}
        {#if user.role === 'admin'}
          <div class="mobile-admin-label">Admin</div>
          {#each adminLinks as link}
            <a class:active={isActive(link.href)} href={link.href} on:click={closeMobile}>{link.label}</a>
          {/each}
        {/if}
      </nav>
    {/if}
  </header>

  <main class="container">
    <slot />
  </main>
</div>

<style>
  .app-shell { min-height: 100vh; }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 80;
    border-bottom: 1px solid rgba(255,255,255,0.10);
    background: rgba(5, 6, 8, 0.70);
    backdrop-filter: blur(18px);
  }

  .topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 12px 18px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 16px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: inherit;
    text-decoration: none;
    min-width: 0;
  }

  .brand:hover { text-decoration: none; }

  .brand-mark {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(245,213,138,0.30);
    background:
      radial-gradient(circle at 30% 0%, rgba(255,255,255,0.18), transparent 45%),
      linear-gradient(145deg, rgba(245,213,138,0.18), rgba(214,177,94,0.06));
    color: var(--gold0);
    font-family: var(--font-serif);
    font-weight: 950;
    letter-spacing: -0.04em;
    box-shadow: 0 18px 40px rgba(0,0,0,0.28);
  }

  .brand-copy { display: grid; gap: 2px; }
  .brand-copy strong { font-family: var(--font-serif); font-size: 1.05rem; line-height: 1; }
  .brand-copy em { color: rgba(255,255,255,0.55); font-size: 0.72rem; font-style: normal; text-transform: uppercase; letter-spacing: 0.18em; }

  .primary-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }

  .primary-nav a,
  .mobile-menu a,
  .admin-popover a {
    color: rgba(255,255,255,0.72);
    text-decoration: none;
    border: 1px solid transparent;
    font-weight: 850;
  }

  .primary-nav a {
    padding: 9px 11px;
    border-radius: 999px;
    font-size: 0.92rem;
  }

  .primary-nav a:hover,
  .primary-nav a.active,
  .mobile-menu a:hover,
  .mobile-menu a.active,
  .admin-popover a:hover,
  .admin-popover a.active {
    color: white;
    border-color: rgba(245,213,138,0.22);
    background: rgba(245,213,138,0.075);
    text-decoration: none;
  }

  .right-rail {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    min-width: 0;
  }

  .user-chip {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    max-width: 260px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    border-radius: 999px;
    padding: 8px 11px;
    box-shadow: 0 12px 34px rgba(0,0,0,0.24);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--green);
    box-shadow: 0 0 0 4px rgba(47,208,127,0.13);
    flex: 0 0 auto;
  }

  .user-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: rgba(255,255,255,0.86);
    font-size: 0.92rem;
    font-weight: 800;
  }

  .logout-button {
    appearance: none;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.035);
    color: rgba(255,255,255,0.78);
    border-radius: 999px;
    padding: 9px 12px;
    font-weight: 850;
    cursor: pointer;
  }

  .logout-button:hover {
    color: white;
    border-color: rgba(245,213,138,0.24);
    background: rgba(245,213,138,0.07);
  }

  .admin-menu { position: relative; }
  .admin-menu > summary { list-style: none; cursor: pointer; color: var(--gold0); font-size: 0.78rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.12em; }
  .admin-menu > summary::-webkit-details-marker { display: none; }

  .admin-popover {
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    min-width: 190px;
    padding: 10px;
    display: grid;
    gap: 7px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 18px;
    background: rgba(5,6,8,0.86);
    backdrop-filter: blur(16px);
    box-shadow: 0 24px 70px rgba(0,0,0,0.45);
  }

  .admin-popover a { padding: 10px 11px; border-radius: 12px; }

  .menu-button {
    display: none;
    width: 44px;
    height: 44px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    place-items: center;
    gap: 4px;
    padding: 11px;
  }

  .menu-button span {
    display: block;
    width: 19px;
    height: 2px;
    border-radius: 999px;
    background: rgba(255,255,255,0.86);
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .menu-button.is-open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
  .menu-button.is-open span:nth-child(2) { opacity: 0; }
  .menu-button.is-open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

  .mobile-scrim {
    position: fixed;
    inset: 0;
    z-index: 81;
    border: 0;
    background: rgba(0,0,0,0.48);
    backdrop-filter: blur(3px);
  }

  .mobile-menu {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    z-index: 82;
    transform: translateX(-50%);
    width: min(1180px, calc(100vw - 24px));
    padding: 12px;
    display: grid;
    gap: 9px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 22px;
    background: rgba(5,6,8,0.88);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 80px rgba(0,0,0,0.55);
  }

  .mobile-menu a {
    padding: 13px;
    border-radius: 15px;
    background: rgba(255,255,255,0.035);
  }

  .mobile-admin-label {
    margin-top: 4px;
    color: var(--gold0);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.72rem;
    font-weight: 950;
    padding: 8px 4px 0;
  }

  @media (max-width: 980px) {
    .topbar-inner { grid-template-columns: auto 1fr; }
    .primary-nav { display: none; }
    .right-rail { justify-content: flex-end; }
    .menu-button { display: grid; }
  }

  @media (max-width: 560px) {
    .topbar-inner { padding: 10px 12px; gap: 10px; }
    .brand-copy em { display: none; }
    .user-chip { max-width: 150px; padding: 8px 10px; }
    .logout-form { display: none; }
  }
</style>
