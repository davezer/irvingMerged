
import { error } from '@sveltejs/kit';
import { getManagerSnapshot } from '$lib/server/league';
export async function load({ params }) {
  const snapshot = getManagerSnapshot(params.slug);
  if (!snapshot) throw error(404, 'Manager not found');
  return snapshot;
}
