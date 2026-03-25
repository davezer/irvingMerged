// src/lib/events/displayNames.js

export const FUN_EVENT_NAMES = {
  'daytona-500': {
    fun: 'Race, Crash, Cash',
    logo: '/events/RaceCrashCash.png'
  },
  'march-madness': {
    fun: 'March Multiplier Madness',
    logo: '/events/MarchMadness.png'
  },
  'the-masters': {
    fun: 'Masters Panic',
    logo: '/events/MastersPanic.png'
  },
  'kentucky-derby': {
    fun: 'Derby Double Down',
    logo: '/events/DerbyDouble.png'
  },
  'world-cup': {
    fun: 'Final Fifa Frenzy',
    logo: '/events/FinalFifa.png'
  }
};


export function eventDisplay(e) {
  const theme = FUN_EVENT_NAMES?.[e?.slug];
  const official = e?.name ?? '';

  return {
    title: theme?.fun || official,
    subtitle: theme?.fun ? official : null,
    logo: theme?.logo || null
  };
}