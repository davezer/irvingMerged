// src/lib/games/kentucky-derby/options.js

// Manual list (swap in the real field once you have it).
// Keep ids stable strings. name is display.
const MANUAL_HORSES = [
  { id: 'h_1', name: 'Neighked Ambition' },
  { id: 'h_2', name: 'Hoof Hearted' },
  { id: 'h_3', name: 'Whiskey Reins' },
  { id: 'h_4', name: 'Hooves Wide Shut' },
  { id: 'h_5', name: 'Saddle Me Maybe' },
  { id: 'h_6', name: 'Talk Derby To Me' },
  { id: 'h_7', name: 'Neigh Means Neigh' },
  { id: 'h_8', name: 'Stirrup Some Fun' },
  { id: 'h_9', name: 'Crop It Like It’s Hot' },
  { id: 'h_10', name: 'Reincheck Your Texts' },
  { id: 'h_11', name: 'Unbridled After Hours' },
  { id: 'h_12', name: 'Consent Is King' },
  { id: 'h_13', name: 'Mane Character Energy' },
  { id: 'h_14', name: 'Pasture Bedtime' },
  { id: 'h_15', name: 'Stud Muffin Mirage' },
  { id: 'h_16', name: 'Derby Night Walk of Shame' },
  { id: 'h_17', name: 'Gallop & Garter' },
  { id: 'h_18', name: 'Kentucky Fried Thoroughbred' },
  { id: 'h_19', name: 'Two In The Pink (Silks)' },
  { id: 'h_20', name: 'Spank You, Next' }
];

export async function getOptions({ db, event, fetchImpl }) {
  // keep signature consistent even if unused
  void db; void event; void fetchImpl;

  return {
    provider: 'manual',
    cacheKey: 'kentucky-derby:horses:manual:v1',
    options: MANUAL_HORSES,
    mode: 'manual',
    note: 'Manual horse list (temporary). Pick the winner and enter your wager in points.'
  };
}
