import {
  error,
  fail,
  redirect
} from '@sveltejs/kit';

import {
  deleteManualWeeklyDraft,
  getWeeklyPostById,
  publishWeeklyPost,
  saveManualWeeklyPost,
  unpublishWeeklyPost
} from '$lib/server/league/weeklyPostRepository.js';


async function requireManualPost(
  db,
  id
) {
  const post =
    await getWeeklyPostById(
      db,
      id
    );

  if (!post) {
    throw error(
      404,
      'Article not found.'
    );
  }

  if (
    post.sourceType !==
    'manual'
  ) {
    throw error(
      400,
      'AI weekly recaps are edited through the Recap Lab.'
    );
  }

  return post;
}


function formValues(
  form,
  locals
) {
  return {
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
  };
}


export async function load({
  params,
  platform,
  locals
}) {
  const post =
    await requireManualPost(
      platform?.env?.DB,
      params.id
    );

  return {
    post,
    user:
      locals.user
  };
}


export const actions = {
  save: async ({
    params,
    request,
    platform,
    locals
  }) => {
    const db =
      platform?.env?.DB;

    await requireManualPost(
      db,
      params.id
    );

    const form =
      await request.formData();

    try {
      const post =
        await saveManualWeeklyPost(
          db,
          {
            id:
              params.id,

            ...formValues(
              form,
              locals
            )
          }
        );

      return {
        ok:
          true,

        post,

        message:
          'Draft saved.'
      };
    } catch (error) {
      return fail(
        400,
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not save article.'
        }
      );
    }
  },

  publish: async ({
    params,
    request,
    platform,
    locals
  }) => {
    const db =
      platform?.env?.DB;

    await requireManualPost(
      db,
      params.id
    );

    const form =
      await request.formData();

    try {
      /*
       * Save current editor contents first,
       * THEN publish that exact version.
       */
      await saveManualWeeklyPost(
        db,
        {
          id:
            params.id,

          ...formValues(
            form,
            locals
          )
        }
      );

      const post =
        await publishWeeklyPost(
          db,
          params.id
        );

      return {
        ok:
          true,

        post,

        message:
          'Article published.'
      };
    } catch (error) {
      return fail(
        400,
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not publish article.'
        }
      );
    }
  },

    delete: async ({
    params,
    platform
  }) => {
    const db =
      platform?.env?.DB;

    const post =
      await requireManualPost(
        db,
        params.id
      );

    if (
      post.status !==
      'draft'
    ) {
      return fail(
        400,
        {
          error:
            'Published articles must be unpublished before they can be deleted.',
          post
        }
      );
    }

    try {
      await deleteManualWeeklyDraft(
        db,
        params.id
      );
    } catch (error) {
      return fail(
        400,
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not delete draft.',
          post
        }
      );
    }

    throw redirect(
      303,
      '/admin/league/irving-weekly'
    );
  },

  unpublish: async ({
    params,
    platform
  }) => {
    try {
      const post =
        await unpublishWeeklyPost(
          platform?.env?.DB,
          params.id
        );

      return {
        ok:
          true,

        post,

        message:
          'Article returned to draft.'
      };
    } catch (error) {
      return fail(
        400,
        {
          error:
            error instanceof Error
              ? error.message
              : 'Could not unpublish article.'
        }
      );
    }
  }
};