<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import PlayerModal from '$lib/components/league/PlayerModal.svelte';
  import { openPlayerModal } from '$lib/stores/playerModal.js';

  export let data;

  let mobileOpen = false;
  let adminDD;

  const primaryLinks = [
	{
		href: '/',
		label: 'Clubhouse'
	},

	{
		href: '/league',
		label: 'League'
	},

	{
		href: '/league/weekly',
		label: 'The Irving Weekly'
	},

	{
		href: '/games',
		label: 'Games'
	},

	{
		href: '/history',
		label: 'History'
	},

	{
		href: '/league/parlay',
		label: 'Parlay'
	},

	{
		href: '/league/constitution',
		label: 'Constitution'
	}
];

  const adminLinks = [
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/league', label: 'League' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/invites', label: 'Invites' }
  ];





  $: path = $page.url.pathname;
  $: user = data?.user || {};
  $: username = user.displayName || user.display_name || 'Member';

  const isActive = (
  href
) => {
  if (
    href ===
    '/league'
  ) {
    return (
      path ===
        '/league' ||
      (
        path.startsWith(
          '/league/'
        ) &&
        !path.startsWith(
          '/league/weekly'
        )
      )
    );
  }

  return (
    path === href ||
    (
      href !== '/' &&
      path.startsWith(
        `${href}/`
      )
    ) ||
    (
      href === '/games' &&
      path.startsWith(
        '/leaderboard'
      )
    )
  );
};
  const closeMobile = () => (mobileOpen = false);
  const closeAdmin = () => adminDD?.removeAttribute('open');

  function toggleAdmin() {
    if (!adminDD) return;
    adminDD.toggleAttribute('open');
  }

  function getPlayerTrigger(target) {
	if (!target || typeof target.closest !== 'function') {
		return null;
	}

	return target.closest('[data-player-id]');
}

function openPlayerFromTrigger(trigger, event) {
	const playerId =
	String(
		trigger?.getAttribute('data-player-id') ||
			''
	).trim();

if (
	!playerId ||
	playerId === '0'
) {
	return;
}

	const rawSeason = Number(
		trigger.getAttribute('data-player-season')
	);

	const season = Number.isFinite(rawSeason) && rawSeason > 0
		? rawSeason
		: new Date().getFullYear();

	event?.preventDefault();

	openPlayerModal(playerId, {
		season
	});
}

  onMount(() => {
	function onDocPointerDown(event) {
		if (!adminDD?.hasAttribute('open')) return;

		const target = event.target;

		if (
			!(
				target instanceof Node &&
				adminDD.contains(target)
			)
		) {
			closeAdmin();
		}
	}

	function onPlayerClick(event) {
		/*
		 * Preserve browser behavior for:
		 * ctrl-click, cmd-click, shift-click, etc.
		 */
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		const trigger =
			getPlayerTrigger(event.target);

		if (!trigger) return;

		openPlayerFromTrigger(
			trigger,
			event
		);
	}

	function onKeyDown(event) {
		if (event.key === 'Escape') {
			closeAdmin();
			closeMobile();
			return;
		}

		if (
			event.key === 'Enter' ||
			event.key === ' '
		) {
			const trigger =
				getPlayerTrigger(
					event.target
				);

			if (!trigger) return;

			openPlayerFromTrigger(
				trigger,
				event
			);
		}
	}

	document.addEventListener(
		'pointerdown',
		onDocPointerDown,
		true
	);

	document.addEventListener(
		'click',
		onPlayerClick
	);

	document.addEventListener(
		'keydown',
		onKeyDown,
		true
	);

	return () => {
		document.removeEventListener(
			'pointerdown',
			onDocPointerDown,
			true
		);

		document.removeEventListener(
			'click',
			onPlayerClick
		);

		document.removeEventListener(
			'keydown',
			onKeyDown,
			true
		);
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
      <a
	class="brand"
	href="/"
	aria-label="Irving Collective home"
>
	<span
		class="brand-mark"
		aria-hidden="true"
	>
		<span>ICL</span>
	</span>

	<span class="brand-copy">
		<strong>
			Irving Collective
		</strong>

		<em>
			Est. 2003
		</em>
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
          <form
	method="POST"
	action="/api/auth/logout"
	class="mobile-logout-form"
>
	<button
		type="submit"
		class="mobile-logout-button"
	>
		Logout
	</button>
</form>
        </div>

        <form method="POST" action="/api/auth/logout" class="logout-form">
          <button class="logout-button" type="submit">Logout</button>
        </form>
      </div>
    </div>

   {#if mobileOpen}
	<button
		class="mobile-scrim"
		type="button"
		aria-label="Close menu"
		on:click={closeMobile}
	></button>

	<nav
		id="mobile-menu"
		class="mobile-menu"
		aria-label="Mobile navigation"
	>
		{#each primaryLinks as link}
			<a
				class:active={isActive(link.href)}
				href={link.href}
				on:click={closeMobile}
			>
				{link.label}
			</a>
		{/each}

		{#if user.role === 'admin'}
			<div class="mobile-admin-label">
				Admin
			</div>

			{#each adminLinks as link}
				<a
					class:active={isActive(link.href)}
					href={link.href}
					on:click={closeMobile}
				>
					{link.label}
				</a>
			{/each}
		{/if}

		<form
			method="POST"
			action="/api/auth/logout"
			class="mobile-logout-form"
		>
			<button
				class="mobile-logout-button"
				type="submit"
			>
				Logout
			</button>
		</form>
	</nav>
{/if}
  </header>

  <main class="container">
    <slot />
  </main>
</div>
<PlayerModal />

<style>
  .app-shell {
    min-height: 100vh;
  }

.topbar {
	position:
		sticky;

	top:
		0;

	z-index:
		80;

	border-bottom:
		1px solid
		var(--border-strong);

	background:
		rgba(11, 13, 13, 0.97);

	backdrop-filter:
		blur(14px);

	box-shadow:
		0 14px 34px
		rgba(0,0,0,.34);
}

.broadcast-ticker {
	width: 100%;
	height: 28px;
	overflow: hidden;

	background:
		#050709;

	border-top:
		1px solid
		rgba(255,255,255,.08);

	border-bottom:
		1px solid
		#000;

	box-shadow:
		inset 0 -1px 0
		rgba(17,133,200,.18);

	white-space:
		nowrap;
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
	display:
		inline-flex;

	align-items:
		center;

	gap:
		13px;

	min-width:
		0;

	color:
		inherit;

	text-decoration:
		none;
}

.brand:hover {
	text-decoration:
		none;
}

.brand-mark {
	display:
		grid;

	place-items:
		center;

	width:
		48px;

	height:
		48px;

	flex:
		0 0 48px;

	border:
		1px solid
		var(--brand-gold);

	background:
		var(--brand-charcoal);

	color:
		var(--brand-gold);
}

.brand-mark span {
	font-family:
		var(--font-display);

	font-size:
		1.65rem;

	line-height:
		1;

	letter-spacing:
		0.04em;
}

.brand-copy {
	display:
		grid;

	gap:
		3px;
}

.brand-copy strong {
	color:
		var(--brand-ivory);

	font-family:
		var(--font-display);

	font-size:
		1.35rem;

	font-weight:
		400;

	line-height:
		1;

	letter-spacing:
		0.055em;

	text-transform:
		uppercase;

	white-space:
		nowrap;
}

.brand-copy em {
	color:
		var(--brand-gold);

	font-family:
		var(--font-body);

	font-size:
		0.57rem;

	font-style:
		normal;

	font-weight:
		600;

	text-transform:
		uppercase;

	letter-spacing:
		0.2em;

	white-space:
		nowrap;
}

  .primary-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }



  .mobile-logout-form {
	margin-top: 6px;
	padding-top: 10px;

	border-top:
		1px solid
		rgba(
			255,
			255,
			255,
			0.12
		);
}

.mobile-logout-form {
	display: none;
}

.mobile-logout-button {
	width: 100%;

	padding: 13px;

	border:
		1px solid
		#050606;

	border-radius: 5px;

	background:
		linear-gradient(
			180deg,
			var(--bug-red),
			var(--bug-red-dark)
		);

	color: white;

	font-family:
		var(--font-score);

	font-size: 0.78rem;

	font-weight: 950;

	text-transform: uppercase;

	letter-spacing: 0.04em;

	cursor: pointer;

	box-shadow:
		inset 0 1px 0 rgba(255,255,255,0.22),
		inset 0 -2px 0 rgba(0,0,0,0.58);
}

.mobile-logout-button:hover {
	filter: brightness(1.12);
}

.primary-nav a {
	position:
		relative;

	display:
		inline-flex;

	align-items:
		center;

	justify-content:
		center;

	flex:
		0 0 auto;

	min-height:
		42px;

	padding:
		8px 10px;

	border:
		0;

	border-radius:
		0;

	background:
		transparent;

	box-shadow:
		none;

	color:
		rgba(242,236,226,.66);

	font-family:
		var(--font-body);

	font-size:
		0.66rem;

	font-weight:
		600;

	line-height:
		1;

	letter-spacing:
		0.09em;

	text-transform:
		uppercase;

	white-space:
		nowrap;
}

.primary-nav a::after {
	content:
		'';

	position:
		absolute;

	left:
		10px;

	right:
		10px;

	bottom:
		2px;

	height:
		1px;

	background:
		var(--brand-gold);

	transform:
		scaleX(0);

	transform-origin:
		center;

	transition:
		transform 150ms ease;
}

.primary-nav a:hover,
.primary-nav a.active {
	color:
		var(--brand-ivory);

	background:
		transparent;

	box-shadow:
		none;
}

.primary-nav a:hover::after,
.primary-nav a.active::after {
	transform:
		scaleX(1);
}
  .right-rail {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 9px;
    min-width: 0;
  }

  :global([data-player-id]) {
	cursor: pointer;
}

:global([data-player-id]:focus-visible) {
	outline: 2px solid var(--bug-yellow, #ffd34d);
	outline-offset: -2px;
}










.logout-button,
.menu-button {
	appearance:
		none;

	border:
		1px solid
		var(--border);

	border-radius:
		4px;

	background:
		var(--brand-charcoal);

	color:
		var(--brand-ivory);

	padding:
		8px 11px;

	font-family:
		var(--font-body);

	font-size:
		0.66rem;

	font-weight:
		700;

	letter-spacing:
		0.07em;

	text-transform:
		uppercase;

	cursor:
		pointer;

	box-shadow:
		none;
}

.logout-button:hover,
.menu-button:hover {
	border-color:
		var(--brand-gold);

	color:
		var(--brand-gold);
}


.admin-menu {
	position: relative;
	flex: 0 0 auto;
}

.admin-menu > summary {
	display: inline-flex;
	align-items: center;
	gap: 4px;

	list-style: none;
	cursor: pointer;

	color: var(--brand-gold) !important;

	font-family: var(--font-body);
	font-size: 0.64rem;
	font-weight: 700;

	letter-spacing: 0.08em;
	text-transform: uppercase;

	white-space: nowrap;
}

.admin-menu > summary::-webkit-details-marker {
	display: none;
}

.admin-popover {
	position: absolute;

	top: calc(100% + 12px);
	right: 0;

	z-index: 100;

	display: grid;
	grid-template-columns: 1fr;

	gap: 5px;

	width: 190px;
	min-width: 190px;

	padding: 7px;

	border:
		1px solid
		var(--border-strong);

	border-radius:
		var(--radius-md);

	background:
		var(--brand-charcoal);

	box-shadow:
		0 24px 70px
		rgba(0, 0, 0, 0.58);
}

.admin-popover a {
	display: block;

	width: 100%;

	padding: 10px 11px;

	border:
		1px solid
		rgba(191, 161, 106, 0.14);

	border-radius: 4px;

	background: transparent;

	color:
		var(--brand-ivory) !important;

	font-family:
		var(--font-body);

	font-size: 0.68rem;

	font-weight: 700;

	letter-spacing: 0.07em;

	line-height: 1;

	text-align: left;

	text-decoration: none;

	text-transform: uppercase;

	white-space: nowrap;
}

.admin-popover a:hover,
.admin-popover a.active {
	border-color:
		var(--brand-gold);

	background:
		rgba(191, 161, 106, 0.08);

	color:
		var(--brand-gold) !important;
}


.user-chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;

	min-width: 155px;
	max-width: 220px;

	padding: 6px 10px;

	border:
		1px solid
		var(--border);

	border-radius: 4px;

	background:
		var(--brand-charcoal);

	color:
		var(--brand-ivory);

	box-shadow: none;
}

.user-name {
	overflow: hidden;

	color:
		var(--brand-ivory) !important;

	font-family:
		var(--font-body);

	font-size: 0.72rem;

	font-weight: 800;

	letter-spacing: 0.06em;

	line-height: 1;

	text-overflow: ellipsis;
	text-transform: uppercase;
	white-space: nowrap;
}

.status-dot {
	width: 7px;
	height: 7px;

	flex: 0 0 7px;

	border-radius: 50%;

	background: var(--success);

	box-shadow:
		0 0 0 2px
		rgba(111, 150, 125, 0.16);
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
    .mobile-logout-form {
	display: block;
	margin-top: 6px;
	padding-top: 10px;

	border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.mobile-logout-button {
	width: 100%;

	padding: 13px;

	border: 1px solid #050606;
	border-radius: 5px;

	background:
		linear-gradient(
			180deg,
			var(--bug-red),
			var(--bug-red-dark)
		);

	color: white;

	font-family: var(--font-score);
	font-size: 0.78rem;
	font-weight: 950;

	text-transform: uppercase;

	cursor: pointer;

	box-shadow:
		inset 0 1px 0 rgba(255,255,255,0.22),
		inset 0 -2px 0 rgba(0,0,0,0.58);
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
      width: 42px;
      flex: 0 0 42px;
    }

    .user-chip {
	display: none;
}

    .logout-form {
      display: none;
    }

    .container {
      width: min(100% - 20px, 1180px);
      padding-top: 14px;
    }

    .topbar-inner {
	grid-template-columns:
		minmax(0, 1fr)
		auto;

	width: 100%;
	padding: 10px 12px;
	gap: 8px;
}

.right-rail {
	width: auto;
	flex: 0 0 auto;
}

.brand {
	min-width: 0;
	overflow: hidden;
}

.brand-copy {
	min-width: 0;
	overflow: hidden;
}

.brand-copy strong {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	font-size: 0.82rem;
}

.menu-button {
	flex: 0 0 44px;
}
  }

  @media (prefers-reduced-motion: reduce) {
    .ticker-track {
      animation: none;
    }
  }
</style>
