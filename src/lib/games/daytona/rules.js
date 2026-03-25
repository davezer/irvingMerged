export const DAYTONA_RULES = {
  title: 'Rules',
  sections: [
    {
      heading: 'How it works',
      bullets: [
        'In “Race, Crash, Cash”, each GM predicts the exact finishing order of the Daytona 500 Top 10.',
        'You score only when a driver finishes in the exact position you predicted. No partial credit.',
        'Each GM also selects one “Chaos Car” that is not included in their Top 10.',
        'If your Chaos Car sneaks into the official Top 10, you lose points based on where it finishes.',
        'A perfect Top 10 prediction scores 500 points, but totals can go negative if chaos strikes.',
        'Each GM is responsible for submitting their Top 10 finish in advance of the race.'
      ]
    }, // :contentReference[oaicite:0]{index=0}

    {
      heading: 'Scoring (exact-position hits only)',
      bullets: [
        'Points are awarded **only** for exact-position hits:',
        'P1: +250',
        'P2: +100',
        'P3: +50',
        'P4: +25',
        'P5: +25',
        'P6–P10: +10 each',
        'Maximum possible score from the Top 10 table: 500 points (perfect Top 10).'
      ]
    }, // :contentReference[oaicite:1]{index=1}

    {
      heading: 'Chaos Car penalties (if it finishes Top 10)',
      bullets: [
        'Your Chaos Car only matters if it finishes in the official Top 10.',
        'If it does, you lose points based on where it finishes:',
        'P1: –250',
        'P2: –100',
        'P3: –50',
        'P4–P10: –50'
      ]
    }, // :contentReference[oaicite:2]{index=2}

    {
      heading: '🔥 Podium Exacta Bonus',
      bullets: [
        'If you correctly predict the exact 1st–2nd–3rd finishing order (all three, in the correct order), you earn a one-time +500 bonus.',
        'The podium is shown as worth 400 base points (1st = 250, 2nd = 100, 3rd = 50), and if you nail the exact 1–2–3 order you get 400 base + 500 bonus = 900 points.',
        'This bonus:',
        '• Applies only when all three podium positions are correct and in order',
        '• Is awarded once per entry',
        '• Stacks with all other Top 10 points',
        '• Still allows Chaos penalties to apply separately'
      ]
    }, // :contentReference[oaicite:3]{index=3}

    {
      heading: 'Example (simple)',
      bullets: [
        'You correctly hit P1 and P5 exactly, and miss everything else:',
        '• P1 exact = +250',
        '• P5 exact = +25',
        'Subtotal = 275',
        'Your Chaos Car finishes 2nd (and was not in your Top 10):',
        '• Chaos penalty (P2) = –100',
        'Final score = 275 – 100 = 175'
      ]
    }
  ]
};
