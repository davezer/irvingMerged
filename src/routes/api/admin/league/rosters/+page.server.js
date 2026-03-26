import { getRosterView } from '$lib/server/league/ui';

export async function load({ platform }) {
  const db = platform?.env?.DB;
  const view = await getRosterView(db);
  return { ...view };
}
