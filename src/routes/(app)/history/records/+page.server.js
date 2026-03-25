import { getRecordsBoard } from '$lib/server/league';
export const load = async () => ({ records: getRecordsBoard() });
