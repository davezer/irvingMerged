import { redirect } from '@sveltejs/kit';

export function load({ params, url }) {
  throw redirect(308, `/league/teams/${params.slug}${url.search || ''}`);
}
