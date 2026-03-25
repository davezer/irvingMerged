
import { error } from '@sveltejs/kit';
import { getNewsPosts } from '$lib/server/league';
export async function load({ params }) {
  const post = getNewsPosts().find((p) => p.slug === params.slug);
  if (!post) throw error(404, 'Post not found');
  return { post };
}
