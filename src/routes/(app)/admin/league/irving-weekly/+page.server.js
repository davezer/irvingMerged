import {
  listWeeklyPostsAdmin
} from '$lib/server/league/weeklyPostRepository.js';


export async function load({
  platform
}) {
  const db =
    platform?.env?.DB;

  const posts =
    await listWeeklyPostsAdmin(
      db
    );

  return {
    posts
  };
}