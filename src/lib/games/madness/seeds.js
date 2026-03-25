// src/lib/games/madness/seeds.js
import BRACKET from '$lib/games/madness/data/2026_ncaa_mens_tournament_seeds.json';
import { buildFromBracketJson } from '$lib/games/madness/bracketUtils.js';

export async function fetchSeedsFromProvider() {
  const built = buildFromBracketJson(BRACKET);

  return {
    seeds: built.seeds, // { [teamId]: { seed, region } }
    source: 'local-json',
    note: `Loaded seeds for ${Object.keys(built.seeds).length} teams`
  };
}

// ✅ MUST be exported with this exact name
export function parseSeedsJson(raw) {
  try {
    const parsed = JSON.parse(raw);

    // If they pasted the bracket JSON format, convert it
    if (parsed?.regions && typeof parsed.regions === 'object' && !parsed?.seeds) {
      const built = buildFromBracketJson(parsed);
      return built.seeds;
    }

    // Otherwise allow old formats
    const seedsIn =
      parsed?.seeds && typeof parsed.seeds === 'object' ? parsed.seeds : parsed;

    const out = {};
    for (const [teamId, v] of Object.entries(seedsIn || {})) {
      const seedNum = Number(v?.seed ?? v);
      if (!Number.isFinite(seedNum) || seedNum <= 0) continue;

      out[String(teamId)] = {
        seed: seedNum,
        region: v?.region != null ? String(v.region) : null
      };
    }
    return out;
  } catch {
    return null;
  }
}