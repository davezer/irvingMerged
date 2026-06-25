import { getMastersField } from '$lib/server/providers/masters.js';

const MANUAL_GOLFERS = [
  { id: '9478', name: 'Scottie Scheffler', country: 'United States' },
  { id: '3470', name: 'Rory McIlroy', country: 'Northern Ireland' },
  { id: '9780', name: 'Jon Rahm', country: 'Spain' },
  { id: '10140', name: 'Xander Schauffele', country: 'United States' },
  { id: '10577', name: 'Bryson DeChambeau', country: 'United States' },
  { id: '6798', name: 'Jordan Spieth', country: 'United States' }
];

export async function getOptions({ db, event, fetchImpl }) {
  const out = await getMastersField({ db, event, fetchImpl });

  if (Array.isArray(out?.options) && out.options.length) {
    return out;
  }

  return {
    provider: out?.provider || 'masters',
    cacheKey: out?.cacheKey || 'masters:field:espn-direct:v4',
    options: MANUAL_GOLFERS,
    mode: out?.mode === 'error' ? 'manual:fallback' : out?.mode || 'manual',
    note: out?.note
      ? `${out.note} Falling back to the emergency manual shortlist.`
      : 'Emergency manual golfer shortlist (fallback while the live field is unavailable).'
  };
}
