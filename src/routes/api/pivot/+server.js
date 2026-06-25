import { json } from '@sveltejs/kit';
import { getDraftMoneySnapshot } from '$lib/server/league/draftMoney.js';

export async function GET({ url, platform, fetch }) {
  const type = url.searchParams.get('type') || 'draftMoney';
  const manager = {
    key: url.searchParams.get('key'),
    managerID: url.searchParams.get('managerID') || url.searchParams.get('managerId'),
    teamName: url.searchParams.get('teamName'),
    liveTeamName: url.searchParams.get('liveTeamName'),
    name: url.searchParams.get('name')
  };
  const year = url.searchParams.get('year') || null;
  const snapshot = await getDraftMoneySnapshot({ env: platform?.env, fetchFn: fetch, manager, year, type });
  return json(snapshot);
}
