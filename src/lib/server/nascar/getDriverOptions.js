// src/lib/server/nascar/getDriverOptions.js
export async function getDriverOptionsForEvent({ event, fetchImpl }) {
  // Only Daytona currently
  if (!event || event.type !== 'daytona') {
    return { options: [], mode: '', note: '' };
  }

  if (typeof fetchImpl !== 'function') {
    return {
      options: [],
      mode: 'error',
      note: 'fetchImpl was not provided (must pass SvelteKit load()/action fetch).'
    };
  }

  try {
    // ✅ MUST use SvelteKit fetch for relative URL
    const res = await fetchImpl(`/api/events/${event.slug}/options`);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        options: [],
        mode: 'error',
        note: body?.error || `Failed to load options (${res.status})`
      };
    }

    return {
      options: Array.isArray(body.options) ? body.options : [],
      mode: body.mode || '',
      note: body.note || ''
    };
  } catch (err) {
    return {
      options: [],
      mode: 'error',
      note: err?.message || 'Failed to load options'
    };
  }
}