import { managers } from '$lib/legacy/leagueInfo';

const managerBySleeperId = new Map(managers.map((manager) => [String(manager.managerID), manager]));
const managerBySlug = new Map(managers.map((manager) => [slugify(manager.teamName || manager.name), manager]));
const managerByName = new Map(
  managers.flatMap((manager) => {
    const rows = [[normalize(manager.name), manager]];
    if (manager.teamName) rows.push([normalize(manager.teamName), manager]);
    return rows;
  })
);

function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

export function slugify(value = '') {
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

export function getLegacyManagerProfiles() {
  return managers.map((manager, index) => ({
    ...manager,
    index,
    slug: slugify(manager.teamName || manager.name)
  }));
}

export function getLegacyManagerBySlug(slug) {
  return managerBySlug.get(String(slug || '')) || null;
}

export function getLegacyManagerById(managerId) {
  return managerBySleeperId.get(String(managerId || '')) || null;
}

export function getLegacyManagerByName(value) {
  return managerByName.get(normalize(value)) || null;
}

export function resolveTeamIdentity({ ownerId, sleeperUser = null, roster = null } = {}) {
  const byOwner = ownerId ? managerBySleeperId.get(String(ownerId)) : null;
  const fallbackKey = normalize(
    sleeperUser?.display_name || sleeperUser?.metadata?.team_name || roster?.metadata?.team_name || ''
  );
  const branded = byOwner || managerByName.get(fallbackKey) || null;

  const teamName =
    branded?.teamName ||
    sleeperUser?.metadata?.team_name ||
    roster?.metadata?.team_name ||
    sleeperUser?.display_name ||
    sleeperUser?.username ||
    `Roster ${roster?.roster_id ?? ''}`.trim();

  const managerName = branded?.name || sleeperUser?.display_name || sleeperUser?.username || 'Unknown Manager';
  const teamPhoto = branded?.photo || sleeperAvatarUrl(sleeperUser?.avatar) || null;

  return {
    ownerId: ownerId ? String(ownerId) : null,
    managerId: branded?.managerID || (ownerId ? String(ownerId) : null),
    managerName,
    teamName,
    teamPhoto,
    managerSlug: slugify(branded?.teamName || teamName),
    initials: initials(teamName),
    branded: Boolean(branded)
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
      roster
    });

    rosterMap.set(Number(roster.roster_id), {
      rosterId: Number(roster.roster_id),
      ...identity
    });
  }

  return rosterMap;
}

export function resolveSelectedTeam({ teamParam = null, rosterIdParam = null, rosters = [], users = [] } = {}) {
  const rosterIdentityMap = buildRosterIdentityMap({ rosters, users });
  const rosterIdValue = Number(rosterIdParam);
  if (Number.isFinite(rosterIdValue) && rosterIdentityMap.has(rosterIdValue)) {
    return rosterIdentityMap.get(rosterIdValue);
  }

  const wanted = normalize(teamParam);
  if (!wanted) return null;

  for (const identity of rosterIdentityMap.values()) {
    const probes = [
      normalize(identity.managerSlug),
      normalize(identity.teamName),
      normalize(identity.managerName),
      String(identity.ownerId || ''),
      String(identity.rosterId || '')
    ];
    if (probes.includes(wanted)) return identity;
  }

  const legacy = getLegacyManagerBySlug(wanted) || getLegacyManagerByName(wanted) || getLegacyManagerById(wanted);
  if (!legacy) return null;

  for (const identity of rosterIdentityMap.values()) {
    if (String(identity.ownerId || '') === String(legacy.managerID)) return identity;
  }

  return null;
}
