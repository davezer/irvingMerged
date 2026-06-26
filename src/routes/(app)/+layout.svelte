<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let data;

  let mobileOpen = false;
  let adminDD;

  const primaryLinks = [
    { href: '/', label: 'Clubhouse' },
    { href: '/league', label: 'Irving Champions League', navClass: 'league-link' },
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

  const tickerItems = [
    { type: 'live', label: 'LIVE' },
    { type: 'strong', label: 'IRVING STREET PROGRAMMING NETWORK' },
    { type: 'dot' },
    { type: 'live', label: 'ISPN' },
    { type: 'dot' },
    { type: 'strong', label: 'IRVING CHAMPIONS LEAGUE' },
    { type: 'live', label: 'LIVE' },
    { type: 'strong', label: 'IRVING GENTLEMENS COLLECTIVE' },
    { type: 'dot' },
    { type: 'strong', label: 'SET YOUR LINEUPS' },
    { type: 'dot' },
    { type: 'strong', label: 'TRADE' },
    { type: 'dot' },
    { type: 'strong', label: 'BET' },
    { type: 'dot' }
  ];

  const tickerRepeats = [0, 1, 2];

  $: path = $page.url.pathname;
  $: user = data?.user || {};
  $: username = user.displayName || user.display_name || 'Member';

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

  $: if (path) {
    mobileOpen = false;
    closeAdmin();
  }
</script>

<div class="app-shell">
  <header class="topbar">
    

    <div class="topbar-inner">
      <a class="brand" href="/" aria-label="Irving Collective home">
        <span class="brand-mark">ICN</span>
        <span class="brand-copy">
          <strong>Irving Collective</strong>
          <em>Champions League | Offseason Lounge</em>
        </span>
      </a>

      <nav class="primary-nav" aria-label="Primary navigation">
        {#each primaryLinks as link}
          <a class:active={isActive(link.href)} class:league-link={link.href === '/league'} href={link.href}>{link.label}</a>
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
          <span class="user-name">{username}</span>
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
  .app-shell {
    min-height: 100vh;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 80;
    border-bottom: 3px solid #070808;
    background: linear-gradient(180deg, #4e5552, #1c2220 54%, #080909);
    box-shadow: 0 2px 0 rgba(255,255,255,0.16) inset, 0 14px 30px rgba(0,0,0,0.42);
  }

  .broadcast-ticker {
    width: 100%;
    height: 28px;
    overflow: hidden;
    background: linear-gradient(180deg, #252b28 0%, #080909 52%, #151817 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.28);
    border-bottom: 2px solid #000;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -1px 0 rgba(0, 0, 0, 0.9);
    white-space: nowrap;
  }

  .ticker-track {
    display: flex;
    width: max-content;
    height: 100%;
    animation: ticker-scroll 42s linear infinite;
  }

  .ticker-group {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    padding-right: 14px;
    min-width: max-content;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: 0.08em;
    color: #f5f3df;
    text-transform: uppercase;
    text-shadow: 1px 1px 0 #000;
  }

  .ticker-group strong {
    color: #ffd84a;
  }

  .ticker-live {
    display: inline-grid;
    place-items: center;
    height: 20px;
    min-width: 44px;
    padding: 0 8px;
    color: #fff;
    background: linear-gradient(180deg, #ef3340 0%, #a90418 100%);
    border: 1px solid #3b0007;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.55);
  }

  .ticker-dot {
    color: #c8c8bc;
  }

  .broadcast-ticker:hover .ticker-track {
    animation-play-state: paused;
  }

  @keyframes ticker-scroll {
    from {
      transform: translateX(0);
    }

    to {
      transform: translateX(-33.333%);
    }
  }

  .topbar-inner {
    max-width: 1880px;
    margin: 0 auto;
    padding: 10px 18px 12px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    color: inherit;
    text-decoration: none;
    min-width: 0;
  }

  .brand:hover {
    text-decoration: none;
  }

  .brand-mark {
    width: 54px;
    height: 36px;
    display: grid;
    place-items: center;
    border: 2px solid #050505;
    border-radius: 5px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.22), transparent 38%),
      linear-gradient(90deg, var(--bug-red), var(--bug-red-dark));
    color: white;
    font-family: var(--font-score);
    font-size: 0.92rem;
    font-weight: 950;
    letter-spacing: -0.04em;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.36),
      inset 0 -2px 0 rgba(0,0,0,0.42),
      0 10px 22px rgba(0,0,0,0.34);
  }

  .brand-copy {
    display: grid;
    gap: 1px;
  }

  .brand-copy strong {
    font-family: var(--font-score);
    font-size: 1.02rem;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .brand-copy em {
    color: var(--bug-yellow);
    font-size: 0.68rem;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    white-space: nowrap;
  }

  .primary-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .primary-nav a,
  .mobile-menu a,
  .admin-popover a {
    color: rgba(247,245,235,0.80);
    text-decoration: none;
    border: 1px solid #050606;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .primary-nav a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-height: 38px;
    padding: 8px 10px;
    border-radius: 5px;
    background: linear-gradient(180deg, #606865, #272d2c 50%, #0f1111);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.58);
    font-size: 0.78rem;
    line-height: 1;
    white-space: nowrap;
  }

  .primary-nav a.league-link {
    min-width: 188px;
    padding-inline: 13px;
    letter-spacing: 0.01em;
  }

  .primary-nav a:hover,
  .primary-nav a.active,
  .mobile-menu a:hover,
  .mobile-menu a.active,
  .admin-popover a:hover,
  .admin-popover a.active {
    color: white;
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
    text-decoration: none;
  }

  .right-rail {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
    min-width: 0;
  }

  .user-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 260px;
    border: 1px solid #050606;
    background: linear-gradient(180deg, #f4f3ea, #a9ada8 52%, #3f4643);
    color: #111;
    border-radius: 5px;
    padding: 7px 9px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 0 rgba(0,0,0,0.26);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--bug-green);
    box-shadow: 0 0 0 3px rgba(69,161,106,0.20);
    flex: 0 0 auto;
  }

  .user-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #111;
    font-size: 0.84rem;
    font-family: var(--font-score);
    font-weight: 950;
    text-transform: uppercase;
  }

  .logout-button,
  .menu-button {
    appearance: none;
    border: 1px solid #050606;
    background: linear-gradient(180deg, #606865, #272d2c 50%, #0f1111);
    color: white;
    border-radius: 5px;
    padding: 8px 11px;
    font-family: var(--font-score);
    font-size: 0.78rem;
    font-weight: 950;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.58);
  }

  .logout-button:hover {
    background: linear-gradient(180deg, var(--bug-red), var(--bug-red-dark));
  }

  .admin-menu {
    position: relative;
  }

  .admin-menu > summary {
    list-style: none;
    cursor: pointer;
    color: #111;
    font-family: var(--font-score);
    font-size: 0.72rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .admin-menu > summary::-webkit-details-marker {
    display: none;
  }

  .admin-popover {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    min-width: 190px;
    padding: 8px;
    display: grid;
    gap: 6px;
    border: 2px solid #050606;
    border-radius: 8px;
    background: linear-gradient(180deg, #4e5552, #1c2220 54%, #080909);
    box-shadow: 0 24px 70px rgba(0,0,0,0.55);
  }

  .admin-popover a {
    padding: 10px;
    border-radius: 5px;
    background: linear-gradient(180deg, #606865, #272d2c 50%, #0f1111);
  }

  .menu-button {
    display: none;
    width: 44px;
    height: 38px;
    place-items: center;
    gap: 4px;
    padding: 9px;
  }

  .menu-button span {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: white;
    transition: transform 160ms ease, opacity 160ms ease;
  }

  .menu-button.is-open span:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }

  .menu-button.is-open span:nth-child(2) {
    opacity: 0;
  }

  .menu-button.is-open span:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }

  .mobile-scrim {
    position: fixed;
    inset: 0;
    z-index: 81;
    border: 0;
    background: rgba(0,0,0,0.58);
  }

  .mobile-menu {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    z-index: 82;
    transform: translateX(-50%);
    width: min(1180px, calc(100vw - 24px));
    padding: 10px;
    display: grid;
    gap: 8px;
    border: 2px solid #050606;
    border-radius: 10px;
    background: linear-gradient(180deg, #4e5552, #1c2220 54%, #080909);
    box-shadow: 0 24px 80px rgba(0,0,0,0.65);
  }

  .mobile-menu a {
    padding: 13px;
    border-radius: 5px;
    background: linear-gradient(180deg, #606865, #272d2c 50%, #0f1111);
  }

  .mobile-admin-label {
    margin-top: 4px;
    color: var(--bug-yellow);
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-family: var(--font-score);
    font-size: 0.72rem;
    font-weight: 950;
    padding: 8px 4px 0;
  }

  .container {
    width: 85%;
    margin: 0 auto;
    padding: 0 0 56px;
  }

  @media (max-width: 1180px) {
    .topbar-inner {
      gap: 10px;
    }

    .brand-copy strong {
      font-size: 0.94rem;
    }

    .brand-copy em {
      font-size: 0.62rem;
    }

    .primary-nav {
      gap: 5px;
    }

    .primary-nav a {
      padding-inline: 8px;
      font-size: 0.72rem;
    }

    .primary-nav a.league-link {
      min-width: 170px;
      padding-inline: 10px;
    }

    .right-rail {
      gap: 7px;
    }
  }

  @media (max-width: 1060px) {
    .primary-nav a.league-link {
      min-width: auto;
    }
  }

  @media (max-width: 980px) {
    .topbar-inner {
      grid-template-columns: auto 1fr;
    }

    .primary-nav {
      display: none;
    }

    .right-rail {
      justify-content: flex-end;
    }

    .menu-button {
      display: grid;
    }
  }

  @media (max-width: 560px) {
    .broadcast-ticker {
      display: none;
    }

    .topbar-inner {
      padding: 10px 12px;
      gap: 10px;
    }

    .brand-copy em {
      display: none;
    }

    .brand-mark {
      width: 48px;
    }

    .user-chip {
      max-width: 135px;
      padding: 7px 8px;
    }

    .logout-form {
      display: none;
    }

    .container {
      width: min(100% - 20px, 1180px);
      padding-top: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ticker-track {
      animation: none;
    }
  }
</style>
