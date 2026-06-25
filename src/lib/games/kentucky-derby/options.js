// src/lib/games/kentucky-derby/options.js

// Manual list from KentuckyDerby.com Derby horses leaderboard.
// Keep ids stable strings. name is display. odds is Morning Line Odds.
const MANUAL_HORSES = [
  { id: 'renegade', name: 'Renegade', odds: '4-1' },
  { id: 'albus', name: 'Albus', odds: '30-1' },
  { id: 'intrepido', name: 'Intrepido', odds: '50-1' },
  { id: 'litmus-test', name: 'Litmus Test', odds: '30-1' },
  { id: 'right-to-party', name: 'Right to Party', odds: '30-1' },
  { id: 'commandment', name: 'Commandment', odds: '6-1' },
  { id: 'danon-bourbon', name: 'Danon Bourbon', odds: '20-1' },
  { id: 'so-happy', name: 'So Happy', odds: '15-1' },
  { id: 'the-puma', name: 'The Puma', odds: '10-1' },
  { id: 'wonder-dean-jpn', name: 'Wonder Dean (JPN)', odds: '30-1' },
  { id: 'incredibolt', name: 'Incredibolt', odds: '20-1' },
  { id: 'chief-wallabee', name: 'Chief Wallabee', odds: '8-1' },
  { id: 'silent-tactic', name: 'Silent Tactic', odds: '20-1' },
  { id: 'potente', name: 'Potente', odds: '20-1' },
  { id: 'emerging-market', name: 'Emerging Market', odds: '15-1' },
  { id: 'pavlovian', name: 'Pavlovian', odds: '30-1' },
  { id: 'six-speed', name: 'Six Speed', odds: '50-1' },
  { id: 'further-ado', name: 'Further Ado', odds: '6-1' },
  { id: 'golden-tempo', name: 'Golden Tempo', odds: '30-1' },
  { id: 'fulleffort', name: 'Fulleffort', odds: '20-1' },
  { id: 'great-white', name: 'Great White', odds: '50-1' },
  { id: 'ocelli', name: 'Ocelli', odds: '50-1' },
  { id: 'robusta', name: 'Robusta', odds: '50-1' },
  { id: 'corona-de-oro', name: 'Corona de Oro', odds: '50-1' }
];

export async function getOptions({ db, event, fetchImpl }) {
  // keep signature consistent even if unused
  void db; void event; void fetchImpl;

  return {
    provider: 'manual',
    cacheKey: 'kentucky-derby:horses:manual:2026:v1',
    options: MANUAL_HORSES,
    mode: 'manual',
    note: 'Manual horse list from KentuckyDerby.com. Pick the winner and enter your wager in points.'
  };
}