import { getKeeperDeskBundle } from '$lib/server/league/keeperDesk.js';

export async function load({ url, platform }) {
  return getKeeperDeskBundle({ url, env: platform?.env });
}
