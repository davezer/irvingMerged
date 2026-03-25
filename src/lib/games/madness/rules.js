export const MADNESS_RULES = {
  title: 'Rules',
  sections: [
    {
      heading: 'How it works',
      bullets: [
        'Each of the 14 Irving League GM’s will select 4 NCAA tournament teams.',
        'You score points every time one of your teams wins a game in the NCAA Men’s Basketball Tournament.',
        'Points are calculated using a simple but powerful formula: the round multiplier × the team’s seed number.',
        'As teams advance, the rewards grow fast — early wins matter, but deep tournament runs by higher seeds can completely change the leaderboard.'
      ]
    }, // :contentReference[oaicite:0]{index=0}

    {
      heading: 'Scoring',
      bullets: [
        'Round multipliers:',
        'Round 1 (Round of 64): 1×',
        'Round 2 (Round of 32): 2×',
        'Round 3 (Sweet 16): 3×',
        'Round 4 (Elite 8): 4×',
        'Round 5 (Final Four): 6×',
        'Round 6 (Championship): 10×',
        'Points Per Win Formula:',
        'Points = Team Seed × Round Multiplier'
      ]
    }, // :contentReference[oaicite:1]{index=1}

    {
      heading: 'Example',
      bullets: [
        'If a 4-seed wins:',
        'Round 1: 4 × 1 = 4 pts',
        'Round 2: 4 × 2 = 8 pts',
        'Round 3: 4 × 3 = 12 pts',
        'Total after 3 wins = 24 points'
      ]
    } // :contentReference[oaicite:2]{index=2}
  ],

  // Component-friendly grid data (same numbers as the PDF table)
  pointsGrid: {
    title: 'Points Earned for a Win by Seed',
    columns: ['Seed', 'R1 (1×)', 'R2 (2×)', 'R3 (3×)', 'R4 (4×)', 'R5 (6×)', 'R6 (10×)'],
    rows: [
      [1, 1, 2, 3, 4, 6, 10],
      [2, 2, 4, 6, 8, 12, 20],
      [3, 3, 6, 9, 12, 18, 30],
      [4, 4, 8, 12, 16, 24, 40],
      [5, 5, 10, 15, 20, 30, 50],
      [6, 6, 12, 18, 24, 36, 60],
      [7, 7, 14, 21, 28, 42, 70],
      [8, 8, 16, 24, 32, 48, 80],
      [9, 9, 18, 27, 36, 54, 90],
      [10, 10, 20, 30, 40, 60, 100],
      [11, 11, 22, 33, 44, 66, 110],
      [12, 12, 24, 36, 48, 72, 120],
      [13, 13, 26, 39, 52, 78, 130],
      [14, 14, 28, 42, 56, 84, 140],
      [15, 15, 30, 45, 60, 90, 150]
    ]
  }
}; // :contentReference[oaicite:3]{index=3}
