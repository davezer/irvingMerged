<script>
  import { resolve } from '$app/paths';
  import { eventDisplay } from '$lib/events/displayNames';
  import RoundTracker from '$lib/games/madness/RoundTracker.svelte';
  import FuturePointsPanel from '$lib/games/madness/picks/FuturePointsPanel.svelte';
  import FatePathCard from '$lib/games/madness/picks/FatePathCard.svelte';
  import TeamImpactPanel from '$lib/games/madness/picks/TeamImpactPanel.svelte';
  import { createPicksBoardContext, teamIdOf } from '$lib/games/madness/picksBoard.js';
  import MastersPicksBoard from '$lib/games/masters/PicksBoard.svelte';

  export let data;

  const { event, locked, results, entries = [] } = data;
  const names = eventDisplay(event);
  const resultsPayload = results?.payload || null;

  const board = createPicksBoardContext({ entries, resultsPayload });

  const {
    completedRoundIndex,
    completedRoundLabel,
    teamPickMap,
    teamStats,
    mostPickedTeams,
    highestSeedPicked,
    survivingLongshots,
    graveyardTeam,
    ownershipByRound,
    enrichedEntries,
    boldestEntry,
    chalkiestEntry,
    mostAliveEntry,
    seedOf,
    pointsSoFar,
    teamStatus,
    stageLabel,
    buildTeamImpact
  } = board;

  let selectedImpactTeamId = mostPickedTeams[0]?.id || '';

  $: if (!teamStats.some((row) => row.id === selectedImpactTeamId)) {
    selectedImpactTeamId = mostPickedTeams[0]?.id || teamStats[0]?.id || '';
  }

  function prettyLock(ts) {
    if (!ts) return '';
    return new Date(Number(ts) * 1000).toLocaleString();
  }

  function badgeList(entry) {
    const badges = [];

    const aliveNow = displayAliveCount(entry);

    if (aliveNow === 4) badges.push({ label: 'All 4 alive', tone: 'green' });
    if (displayEntryIsBusted(entry)) badges.push({ label: 'Busted', tone: 'red' });
    if (boldestEntry && entry.user_id === boldestEntry.user_id) badges.push({ label: 'Boldest card', tone: 'gold' });
    if (chalkiestEntry && entry.user_id === chalkiestEntry.user_id) badges.push({ label: 'Chalk king', tone: 'muted' });
    if (displayMostAliveEntry && entry.user_id === displayMostAliveEntry.user_id) badges.push({ label: 'Most alive', tone: 'green' });

    const highestSeedOnCard = Math.max(
      0,
      ...((entry.selectedTeams || []).map((t) => Number(seedOf(t) || 0)))
    );
    if (highestSeedOnCard >= 10) {
      badges.push({ label: `Longshot ${highestSeedOnCard}`, tone: 'gold' });
    }

    return badges.slice(0, 5);
  }

  function fmtAvgSeed(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
  }

  function fmtTeamName(team) {
    return team?.name || team?.abbr || teamIdOf(team) || 'Team';
  }

  function teamOwners(team) {
    const row = teamPickMap.get(teamIdOf(team));
    return row?.owners || [];
  }

  const eliminatedByTeamId = resultsPayload?.eliminatedByTeamId || {};

  function isEliminatedTeamId(id) {
    return !!eliminatedByTeamId?.[id];
  }

  function isManuallyEliminated(team) {
    return isEliminatedTeamId(teamIdOf(team));
  }

  function displayTeamStatus(team) {
    return isManuallyEliminated(team) ? 'eliminated' : teamStatus(team);
  }

  function displayStageLabel(team) {
    return isManuallyEliminated(team) ? 'Out' : stageLabel(team);
  }

  function displayAliveCount(entry) {
    return (entry?.selectedTeams || []).filter((team) => displayTeamStatus(team) !== 'eliminated').length;
  }

  function displayEntryIsBusted(entry) {
    return displayAliveCount(entry) === 0 && completedRoundIndex >= 0;
  }

  $: displayMostPickedTeams = mostPickedTeams.map((row) => ({
    ...row,
    status: isEliminatedTeamId(row.id) ? 'eliminated' : row.status,
    stage: isEliminatedTeamId(row.id) ? 'Out' : row.stage
  }));

  $: displaySurvivingLongshots = survivingLongshots.filter((row) => !isEliminatedTeamId(row.id));

  $: displayMostAliveEntry = [...enrichedEntries]
    .sort((a, b) => displayAliveCount(b) - displayAliveCount(a) || (b.scoreTotal || 0) - (a.scoreTotal || 0))[0] || null;

  $: rawTeamImpact = selectedImpactTeamId ? buildTeamImpact(selectedImpactTeamId) : null;
  $: selectedTeamImpact = rawTeamImpact
    ? {
        ...rawTeamImpact,
        status: isEliminatedTeamId(rawTeamImpact.id) ? 'eliminated' : rawTeamImpact.status,
        stage: isEliminatedTeamId(rawTeamImpact.id) ? 'Out' : rawTeamImpact.stage
      }
    : null;
</script>
