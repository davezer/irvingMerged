export function parseSeasonParam(value, fallbackSeason = new Date().getFullYear()) {
  const n = Number(value);
  return Number.isInteger(n) && n > 2000 && n < 3000 ? n : fallbackSeason;
}

export function getDefaultWeeksForSeason(_season) {
  return Array.from({ length: 18 }, (_, i) => i + 1);
}

export function parseWeeksParam(value, fallbackSeason) {
  if (!value) return getDefaultWeeksForSeason(fallbackSeason);
  const weeks = String(value)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0 && v < 40);
  return weeks.length ? weeks : getDefaultWeeksForSeason(fallbackSeason);
}
