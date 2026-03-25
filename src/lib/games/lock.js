export function isEventLocked(event, nowSec) {
  if (!event) return false;
  const manualLock = Number(event.manual_lock ?? 0) === 1;
  const manualUnlock = Number(event.manual_unlock ?? 0) === 1;

  if (manualLock) return true;
  if (manualUnlock) return false;

  const lockAt = Number(event.lock_at ?? 0);
  if (!lockAt) return false;

  return Number(nowSec) >= lockAt;
}
