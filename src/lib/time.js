const ET_TZ = 'America/New_York';

export function formatET(unixSec) {
  if (!unixSec) return '';
  const d = new Date(unixSec * 1000);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(d);
}

export function isLocked(unixSec) {
  return Math.floor(Date.now() / 1000) >= Number(unixSec);
}
