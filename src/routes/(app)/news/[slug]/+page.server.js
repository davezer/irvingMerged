import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/league';

export async function load({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) throw error(404, 'Post not found');
  return { post };
}
