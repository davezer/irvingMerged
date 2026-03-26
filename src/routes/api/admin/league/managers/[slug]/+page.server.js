import { getManagerDossierView } from '$lib/server/league/ui';

export async function load({ platform, params, parent }) {
  const db = platform?.env?.DB;
  const dossier = await getManagerDossierView(db, params.slug);
  let parentData = {};
  try {
    parentData = await parent();
  } catch {
    parentData = {};
  }
  return {
    ...parentData,
    dossier
  };
}
