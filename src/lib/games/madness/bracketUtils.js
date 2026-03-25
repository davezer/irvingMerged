// src/lib/games/madness/bracketUtils.js

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function makeTeamId(name) {
  return `mm26:${slugify(name)}`;
}

/**
 * Returns:
 *  - options: [{ id, name, region, seed, logoUrl, logo }]
 *  - seeds:   { [id]: { seed, region } }
 */
export function buildFromBracketJson(bracketJson) {
  const srcRegions = bracketJson?.regions || {};

  const outOptions = [];
  const outSeeds = {};

  for (const [regionName, slots] of Object.entries(srcRegions)) {
    for (const slot of slots || []) {
      const seed = Number(slot?.seed);
      if (!Number.isFinite(seed) || seed <= 0) continue;

      if (slot?.team) {
        const name = String(slot.team).trim();
        if (!name) continue;

        const logoUrl = String(slot?.logoUrl || '').trim();
        const id = makeTeamId(name);

        outOptions.push({
          id,
          name,
          region: regionName,
          seed,
          logoUrl,
          logo: logoUrl
        });

        outSeeds[id] = { seed, region: regionName };
        continue;
      }

      if (Array.isArray(slot?.play_in)) {
        for (const item of slot.play_in) {
          let name = '';
          let logoUrl = '';

          if (typeof item === 'string') {
            name = item.trim();
          } else if (item && typeof item === 'object') {
            name = String(item.team || '').trim();
            logoUrl = String(item.logoUrl || '').trim();
          }

          if (!name) continue;

          const id = makeTeamId(name);

          outOptions.push({
            id,
            name,
            region: regionName,
            seed,
            logoUrl,
            logo: logoUrl
          });

          outSeeds[id] = { seed, region: regionName };
        }
      }
    }
  }

  const seen = new Set();
  const options = outOptions.filter((o) => {
    if (!o.id || !o.name) return false;
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  return { options, seeds: outSeeds };
}