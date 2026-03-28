import { managers } from '$lib/legacy/leagueInfo';

const managerBySleeperId = new Map(
  managers.map((manager) => [String(manager.managerID), manager])
);

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function initials(value = '') {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
}

function sleeperAvatarUrl(avatarId) {
  return avatarId ? `https://sleepercdn.com/avatars/thumbs/${avatarId}` : null;
}

export function resolveTeamIdentity({ ownerId, sleeperUser = null, metadata = null }) {
  const branded = ownerId ? managerBySleeperId.get(String(ownerId)) : null;
  const sleeperTeamName =
    sleeperUser?.metadata?.team_name ||
    metadata?.team_name ||
    sleeperUser?.display_name ||
    sleeperUser?.username ||
    null;

  const teamName = branded?.teamName || sleeperTeamName || 'Unknown Team';
  const managerName = branded?.name || sleeperUser?.display_name || sleeperUser?.username || 'Unknown Manager';
  const teamPhoto = branded?.photo || sleeperAvatarUrl(sleeperUser?.avatar) || null;

  return {
    ownerId: ownerId ? String(ownerId) : null,
    managerId: branded?.managerID || (ownerId ? String(ownerId) : null),
    managerName,
    teamName,
    teamPhoto,
    managerSlug: slugify(branded?.teamName || teamName),
    initials: initials(teamName)
  };
}

export function buildRosterIdentityMap({ rosters = [], users = [] }) {
  const userById = new Map(users.map((user) => [String(user.user_id), user]));
  const rosterMap = new Map();

  for (const roster of rosters) {
    const ownerId = roster?.owner_id ? String(roster.owner_id) : null;
    const identity = resolveTeamIdentity({
      ownerId,
      sleeperUser: ownerId ? userById.get(ownerId) || null : null,
      metadata: roster?.metadata || null
    });

    rosterMap.set(Number(roster.roster_id), {
      ...identity,
      rosterId: Number(roster.roster_id)
    });
  }

  return rosterMap;
}
