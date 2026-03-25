// src/lib/games/masters/options.js

// Manual list for now.
// Later: replace with Masters feed normalization + caching.
const MANUAL_GOLFERS = [
  // id should be stable string keys; name is display; optional meta is fine.
  // Replace these with real Masters player ids once you wire the feed.
  { id: 'scottie_scheffler', name: 'Scottie Scheffler' },
  { id: 'rory_mcilroy', name: 'Rory McIlroy' },
  { id: 'jon_rahm', name: 'Jon Rahm' },
  { id: 'xander_schauffele', name: 'Xander Schauffele' }
  // ...
];

export async function getOptions({ db, event, fetchImpl }) {
  // keep signature consistent with other games even if unused for now
  void db; void event; void fetchImpl;

  return {
    provider: 'manual',
    cacheKey: 'masters-golfers:manual:v1',
    options: MANUAL_GOLFERS,
    mode: 'manual',
    note: 'Manual golfer list (temporary until Masters feed is wired).'
  };
}
