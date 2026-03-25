import { getNewsPosts } from '$lib/server/league';
export const load = async () => ({ posts: getNewsPosts() });
