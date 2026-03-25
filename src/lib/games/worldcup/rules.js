export const WORLDCUP_RULES = {
  title: 'Rules',
  sections: [
    {
      heading: 'How it works',
      bullets: [
        'The FIFA World Cup Survivor Elimination Challenge is an elimination-style game where every Irving League GM starts in the tournament and must submit one team pick each round.',
        'In the Group Stage, each GM selects one team to survive group play (advance out of their group) to earn 50 points and remain eligible to continue.',
        'After that, the game becomes sudden-death: in each knockout round, every remaining GM selects one team, and if that team wins and advances, the GM survives and scores the round’s points — but if the team loses, that GM is eliminated from the game entirely.',
        'Points increase each round to reward late-stage survival.',
        'GMs can never use the same team twice for the entire World Cup, meaning every pick matters and the best players must balance safety early with upside later.'
      ]
    },
    {
      heading: 'Scoring (Fixed Milestone Point Structure)',
      bullets: [
        'Points are awarded only if you survive / win the round:',
        'Survive Group Stage: 50 points',
        'Knockout Stage Round of 32: 100 points',
        'Knockout Stage Round of 16: 100 points',
        'Quarterfinals: 250 points',
        'Semifinals: 300 points',
        'Final: 400 points'
      ]
    }
  ],

  pointsByRound: [
    { key: 'group', label: 'Group Stage (Advance from Group)', points: 50 },
    { key: 'r32', label: 'Knockout Stage Round of 32', points: 100 },
    { key: 'r16', label: 'Knockout Stage Round of 16', points: 100 },
    { key: 'qf', label: 'Quarterfinals', points: 250 },
    { key: 'sf', label: 'Semifinals', points: 300 },
    { key: 'final', label: 'Final', points: 400 }
  ],

  exampleRun: {
    title: 'Example run (shows survival + no-reuse locks)',
    columns: ['Tournament Round', 'Points', 'GM Pick (1 Team)', 'Team Result', 'GM Status', 'Notes (No Reuse Rule)'],
    rows: [
      [
        'Group Stage (Advance from Group)',
        50,
        'Brazil',
        'Advanced',
        'Alive',
        'Brazil is now locked (cannot be picked again).'
      ],
      ['Round of 32', 100, 'France', 'Win', 'Alive', 'France is now locked.'],
      ['Round of 16', 100, 'Spain', 'Win', 'Alive', 'Spain is now locked.'],
      ['Quarterfinal', 250, 'Argentina', 'Win', 'Alive', 'Argentina is now locked.'],
      ['Semifinal', 300, 'England', 'Loss', 'Eliminated', 'GM is eliminated.'],
      ['Final', 400, '—', '—', '—', 'GM cannot pick (already eliminated).']
    ]
  }
};
