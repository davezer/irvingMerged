import { getHistoryModules, getRecordsBoard, getRivalries } from '$lib/server/league';

export const load = async () => ({
  modules: getHistoryModules(),
  records: getRecordsBoard().slice(0, 2),
  rivalries: getRivalries().slice(0, 2)
});
