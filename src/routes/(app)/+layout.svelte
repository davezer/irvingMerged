<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  export let data; // contains { user } from (app)/+layout.server.js

  let adminDD;

  function closeAdminDD() {
    adminDD?.removeAttribute('open');
  }

  function toggleAdminDD(forceOpen) {
    if (!adminDD) return;
    if (forceOpen === true) adminDD.setAttribute('open', '');
    else if (forceOpen === false) adminDD.removeAttribute('open');
    else adminDD.toggleAttribute('open');
  }

  let mobileOpen = false;
  const closeMobile = () => (mobileOpen = false);

  onMount(() => {
    function onDocPointerDown(e) {
      // close admin dropdown when clicking outside
      if (adminDD?.hasAttribute('open')) {
        const t = e.target;
        if (!(t instanceof Node && adminDD.contains(t))) closeAdminDD();
      }
    }

    function onDocKeyDown(e) {
      if (e.key === 'Escape') {
        closeAdminDD();
        closeMobile();
      }
    }

    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onDocKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onDocKeyDown, true);
    };
  });

  $: path = $page.url.pathname;
  const isActive = (href) => path === href || (href !== '/' && path.startsWith(href + '/'));

  // close menu when route changes
  $: $page.url.pathname, (mobileOpen = false);

  const primaryLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/league', label: 'League' },
    { href: '/games', label: 'Games' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/news', label: 'News' },
    { href: '/history', label: 'History' }
  ];
</script>

<div class="shell">
  <header class="topbar">
    <div class="topbar-inner">
      <!-- Brand -->
      <a class="brand" href="/">
        <div class="brand-title">Irving Collective</div>
        <div class="brand-tag">League Lounge</div>
      </a>

      <!-- Desktop nav -->
      <nav class="primary-nav desktop-only" aria-label="Primary">
        {#each primaryLinks as l}
          <a class={"navlink " + (isActive(l.href) ? 'active' : '')} href={l.href}>
            {l.label}
          </a>
        {/each}
      </nav>

      <!-- Mobile: hamburger left, user right -->
      <div class="control-row">
        <div class="mobile-only">
          <button
            class={"hamburger " + (mobileOpen ? 'is-open' : '')}
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            on:click={() => (mobileOpen = !mobileOpen)}
          >
            <span class="hamburger__bars" aria-hidden="true">
              <span class="hamburger__bar"></span>
              <span class="hamburger__bar"></span>
              <span class="hamburger__bar"></span>
            </span>
          </button>
        </div>

        <div class="user">
          <div class="user-chip" title="Signed in">
            <span class="user-dot" aria-hidden="true"></span>
            <span class="user-name">{data?.user?.displayName}</span>

            {#if data?.user?.role === 'admin'}
              <!-- Admin dropdown lives on the ADMIN pill -->
              <details class="user-admin" bind:this={adminDD}>
                <summary
                  class="user-role user-role--click"
                  on:click|preventDefault={() => toggleAdminDD()}
                  aria-label="Admin menu"
                >
                  ADMIN <span class="user-role__chev">▾</span>
                </summary>

                <div class="user-admin__menu" role="menu" aria-label="Admin menu">
                  <a class={isActive('/admin/events') ? 'active' : ''} href="/admin/events">Events</a>
                  <a class={isActive('/admin/league') ? 'active' : ''} href="/admin/league">League</a>
                  <a class={isActive('/admin/users') ? 'active' : ''} href="/admin/users">Users</a>
                  <a class={isActive('/admin/invites') ? 'active' : ''} href="/admin/invites">Invites</a>
                </div>
              </details>
            {/if}
          </div>

          <form method="POST" action="/api/auth/logout">
            <button class="btn btn--ghost" type="submit">Logout</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Mobile drawer lives under the header, centered to your layout width -->
    {#if mobileOpen}
      <div class="mobile-backdrop" on:click={closeMobile} aria-hidden="true"></div>

      <nav id="mobile-nav" class="mobile-drawer" aria-label="Menu">
        <div class="mobile-drawer__inner">
          {#each primaryLinks as l}
            <a
              class={"mobile-link " + (isActive(l.href) ? 'active' : '')}
              href={l.href}
              on:click={closeMobile}
            >
              {l.label}
            </a>
          {/each}
        </div>
      </nav>
    {/if}
  </header>

  <main class="container">
    <slot />
  </main>
</div>

<style>
  /* Shell */
  .shell { min-height: 100vh; }

  /* Topbar */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(10px);
    background: rgba(7, 8, 10, 0.62);
    border-bottom: 1px solid rgba(255,255,255,0.10);
    overflow: visible; /* important for the absolute drawer */
  }

  .topbar-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 14px 18px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 14px;
  }

  /* Brand */
  .brand {
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    border-radius: 16px;
    border: 1px solid transparent;
    width: fit-content;
  }

  .brand:hover {
    border-color: rgba(214,177,94,0.25);
    background: rgba(214,177,94,0.06);
  }

  .brand-title {
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Garamond, Georgia, serif;
    letter-spacing: 0.5px;
    font-size: 18px;
    line-height: 1.1;
  }

  .brand-tag {
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.6;
  }

  /* Responsive helpers */
  .desktop-only { display: flex; }
  .mobile-only { display: none; }
  @media (max-width: 720px) {
    .desktop-only { display: none; }
    .mobile-only { display: block; }
  }

  /* Desktop nav */
  .primary-nav { gap: 16px; align-items: center; justify-content: center; }
  .navlink {
    font-weight: 800;
    opacity: 0.8;
    text-decoration: none;
    padding: 8px 10px;
    border-radius: 12px;
    border: 1px solid transparent;
    transition: border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
  }
  .navlink:hover { opacity: 1; border-color: rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); }
  .navlink.active { opacity: 1; border-color: rgba(212,175,55,0.22); background: rgba(212,175,55,0.08); }

  /* Mobile control row */
  .control-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }

  /* User area */
  .user {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
  }

  .user-chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.03);
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  }

  .user-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #2fd07f;
    box-shadow: 0 0 0 3px rgba(47,208,127,0.14);
  }

  .user-name {
    opacity: 0.92;
    font-weight: 650;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #f5d58a;
    border-left: 1px solid rgba(255,255,255,0.10);
    padding-left: 10px;
    opacity: 0.9;
  }

  /* Button fallback */
  .btn {
    appearance: none;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent;
    color: rgba(255,255,255,0.9);
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 650;
    transition: border-color 0.14s ease, background 0.14s ease, transform 0.12s ease;
  }

  .btn:hover {
    border-color: rgba(214,177,94,0.35);
    background: rgba(214,177,94,0.08);
    color: rgba(255,255,255,0.95);
  }

  .btn--ghost { background: transparent; }

  /* ✅ Sexy hamburger (3 bars, tight spacing, true X) */
  .hamburger{
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.12);
    background:
      radial-gradient(140% 140% at 20% 20%, rgba(212,175,55,0.10), transparent 55%),
      rgba(0,0,0,0.18);
    display: grid;
    place-items: center;
    position: relative;
    z-index: 140; /* always above menu/backdrop */
    box-shadow:
      0 18px 55px rgba(0,0,0,0.40),
      inset 0 0 0 1px rgba(255,255,255,0.03);
    transition: transform 120ms ease, border-color 140ms ease, background 140ms ease;
  }

  .hamburger:hover{
    border-color: rgba(212,175,55,0.28);
    background:
      radial-gradient(140% 140% at 20% 20%, rgba(212,175,55,0.14), transparent 55%),
      rgba(0,0,0,0.22);
  }

  .hamburger:active{ transform: translateY(1px); }

  .hamburger:focus-visible{
    outline: none;
    box-shadow:
      0 18px 55px rgba(0,0,0,0.40),
      0 0 0 3px rgba(212,175,55,0.18),
      inset 0 0 0 1px rgba(255,255,255,0.03);
  }

  .hamburger__bars{
    width: 18px;
    display: grid;
    gap: 4px; /* tighter, sexier */
  }

  .hamburger__bar{
    height: 2px;
    width: 18px;
    border-radius: 999px;
    background: rgba(255,255,255,0.86);
    transition: transform 170ms ease, opacity 170ms ease, background 170ms ease;
    transform-origin: center;
  }

  .hamburger.is-open .hamburger__bar:nth-child(1){
    transform: translateY(6px) rotate(45deg);
    background: rgba(212,175,55,0.95);
  }
  .hamburger.is-open .hamburger__bar:nth-child(2){
    opacity: 0;
  }
  .hamburger.is-open .hamburger__bar:nth-child(3){
    transform: translateY(-6px) rotate(-45deg);
    background: rgba(212,175,55,0.95);
  }

  /* Mobile backdrop */
  .mobile-backdrop{
    position: fixed;
    inset: 0;
    z-index: 110;
    background: rgba(0,0,0,0.42);
    backdrop-filter: blur(2px);
  }

  /* Mobile drawer: under header, aligned to site width */
  .mobile-drawer{
    position: absolute;               /* ✅ relative to sticky header */
    top: calc(100% + 10px);           /* ✅ always below header, even when it wraps */
    left: 50%;
    transform: translateX(-50%);
    width: min(1100px, calc(100vw - 24px));
    z-index: 120;                     /* below hamburger, above backdrop */
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(0,0,0,0.68);
    backdrop-filter: blur(12px);
    overflow: hidden;
    box-shadow:
      0 22px 70px rgba(0,0,0,0.55),
      inset 0 0 0 1px rgba(255,255,255,0.03);
    animation: menuIn 140ms ease-out;
  }

  @keyframes menuIn{
    from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  .mobile-drawer__inner{
    display: grid;
    padding: 10px;
    gap: 10px;
  }

  .mobile-link{
    padding: 12px 12px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 900;
    opacity: 0.92;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.18);
    transition: transform 120ms ease, border-color 120ms ease, background 120ms ease, opacity 120ms ease;
  }

  .mobile-link:hover{
    opacity: 1;
    border-color: rgba(212,175,55,0.20);
    background: rgba(212,175,55,0.06);
    transform: translateY(-1px);
  }

  .mobile-link.active{
    border-color: rgba(212,175,55,0.28);
    background: rgba(212,175,55,0.10);
    opacity: 1;
  }

  /* Container fallback */
  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 22px 18px 42px;
  }

  /* Mobile layout tweaks */
  @media (max-width: 860px) {
    .topbar-inner {
      grid-template-columns: 1fr;
      grid-auto-rows: auto;
      align-items: stretch;
    }

    .control-row {
      width: 100%;
      justify-content: space-between; /* hamburger left, user right */
    }

    .user-chip { padding: 7px 10px; }
    .btn { padding: 9px 10px; }
  }

  @media (max-width: 420px) {
    .user-name { max-width: 110px; }
  }

  /* Admin dropdown on the ADMIN pill */
  .user-admin { position: relative; display: inline-block; }
  .user-admin > summary { list-style: none; }
  .user-admin > summary::-webkit-details-marker { display: none; }

  .user-role--click{
    cursor: pointer;
    user-select: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .user-role__chev{
    font-size: 12px;
    opacity: 0.85;
    transform: translateY(1px);
    transition: transform 140ms ease, opacity 140ms ease;
  }

  .user-admin[open] .user-role__chev{
    transform: translateY(1px) rotate(180deg);
    opacity: 1;
  }

  .user-admin__menu{
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 190px;
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(12px);
    box-shadow:
      0 18px 60px rgba(0,0,0,0.45),
      inset 0 0 0 1px rgba(255,255,255,0.03);
    z-index: 150; /* above everything */
    display: grid;
    gap: 8px;
    transform-origin: top right;
    animation: adminIn 120ms ease-out;
  }

  @keyframes adminIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .user-admin__menu a{
    text-decoration: none;
    color: rgba(255,255,255,0.92);
    padding: 10px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
    transition: border-color 0.18s ease, background 0.18s ease, transform 0.10s ease;
  }

  .user-admin__menu a:hover{
    border-color: rgba(214,177,94,0.28);
    background: rgba(214,177,94,0.06);
    transform: translateY(-1px);
  }

  .user-admin__menu a.active{
    border-color: rgba(214,177,94,0.48);
    background: rgba(214,177,94,0.12);
  }
</style>
