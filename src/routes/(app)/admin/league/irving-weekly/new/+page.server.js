import {
  fail,
  redirect
} from '@sveltejs/kit';

import {
  saveManualWeeklyPost
} from '$lib/server/league/weeklyPostRepository.js';


export function load({
  locals
}) {
  return {
    user:
      locals.user
  };
}


export const actions = {
  create: async ({
    request,
    platform,
    locals
  }) => {
    const form =
      await request.formData();

    try {
      const post =
        await saveManualWeeklyPost(
          platform?.env?.DB,
          {
            title:
              form.get('title'),

            subtitle:
              form.get('subtitle'),

            excerpt:
              form.get('excerpt'),

            body:
              form.get('body'),

            slug:
              form.get('slug'),

            postType:
              form.get('postType'),

            authorName:
              form.get('authorName'),

            authorUserId:
              locals.user?.id
          }
        );

      throw redirect(
        303,
        `/admin/league/irving-weekly/${post.id}`
      );
    } catch (error) {
      if (
        error?.status === 303
      ) {
        throw error;
      }

      return fail(
        400,
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not create article.'
        }
      );
    }
  }
};