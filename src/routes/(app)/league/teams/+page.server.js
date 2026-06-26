import { getTeamsIndexBundle } from '$lib/server/league/franchisePages.js';
import { getDraftMoneySnapshot } from '$lib/server/league/draftMoney.js';

function cardManagerShape(card = {}, dossier = {}) {
  return {
    ...dossier,
    slug: card.slug || dossier.slug,
    name: card.managerName || dossier.name,
    teamName: card.teamName || dossier.teamName,
    liveTeamName: card.teamName || dossier.liveTeamName,
    managerID: dossier.managerID,
    managerId: dossier.managerId,
    id: dossier.id
  };
}

async function draftMoneyForCard({ card, dossier, env, fetchFn, season }) {
  try {
    const snapshot = await getDraftMoneySnapshot({
      env,
      fetchFn,
      manager: cardManagerShape(card, dossier),
      year: season,
      type: 'draftMoney'
    });

    return {
      value: snapshot?.value ?? null,
      source: snapshot?.source || null,
      error: snapshot?.error || null
    };
  } catch (error) {
    console.warn(`[teams] Draft money lookup failed for ${card?.teamName || card?.managerName || 'unknown team'}:`, error);
    return {
      value: null,
      source: 'unavailable',
      error: 'Draft money lookup failed.'
    };
  }
}

export async function load({ url, platform, fetch }) {
  const env = platform?.env;
  const bundle = await getTeamsIndexBundle({ url, env });
  const season = url.searchParams.get('season') || bundle.season;

  const dossiersBySlug = new Map((bundle.dossiers || []).map((row) => [row.slug, row]));
  const cards = [];

  // Sequential on purpose: getDraftMoneySnapshot caches the pivot payload after the
  // first fetch, so this avoids hammering the Google Apps Script 14 times at once.
  for (const card of bundle.cards || []) {
    const dossier = dossiersBySlug.get(card.slug) || {};
    const draftMoney = await draftMoneyForCard({
      card,
      dossier,
      env,
      fetchFn: fetch,
      season
    });

    cards.push({
      ...card,
      futureDraftDollars: draftMoney.value,
      draftMoney
    });
  }

  return {
    ...bundle,
    season,
    cards
  };
}
