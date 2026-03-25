import { getAdminLeagueDeck } from '$lib/server/league';

export function load() {
  return {
    deck: getAdminLeagueDeck()
  };
}