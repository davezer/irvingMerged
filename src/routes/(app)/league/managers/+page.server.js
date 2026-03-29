import { getManagersIndexBundle } from '$lib/server/league/managerDossiers.js';

export async function load({ url, platform }) {
  return getManagersIndexBundle({ url, env: platform?.env });
}
