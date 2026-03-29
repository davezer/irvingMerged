import { error } from '@sveltejs/kit';
import { getManagerDossierBundle } from '$lib/server/league/managerDossiers.js';

export async function load({ params, url, platform }) {
  const snapshot = await getManagerDossierBundle({ slug: params.slug, url, env: platform?.env });
  if (!snapshot) throw error(404, 'Manager not found');
  return snapshot;
}
