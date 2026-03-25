import { redirect } from '@sveltejs/kit';

export function load({ locals }) {
  if (!locals.user) throw redirect(303, '/login');
  if (locals.user.role !== 'admin') throw redirect(303, '/');
  return { user: locals.user };
}
