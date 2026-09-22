const MatchupRecapSchema = {
  type:
    'object',

  additionalProperties:
    false,

  required: [
    'matchupId',
    'featured',
    'headline',
    'body'
  ],

  properties: {
    matchupId: {
      type:
        'integer'
    },

    featured: {
      type:
        'boolean'
    },

    headline: {
      type:
        'string'
    },

    body: {
      type:
        'string'
    }
  }
};


const WaiverClaimSchema = {
  type:
    'object',

  additionalProperties:
    false,

  required: [
    'teamName',
    'players',
    'faab',
    'commentary'
  ],

  properties: {
    teamName: {
      type:
        'string'
    },

    players: {
      type:
        'array',

      items: {
        type:
          'string'
      }
    },

    faab: {
      type:
        'number'
    },

    commentary: {
      type:
        'string'
    }
  }
};


const TradeItemSchema = {
  type:
    'object',

  additionalProperties:
    false,

  required: [
    'transactionId',
    'headline',
    'body'
  ],

  properties: {
    transactionId: {
      type:
        'string'
    },

    headline: {
      type:
        'string'
    },

    body: {
      type:
        'string'
    }
  }
};


const AwardItemSchema = {
  type:
    'object',

  additionalProperties:
    false,

  required: [
    'title',
    'teamName',
    'body'
  ],

  properties: {
    title: {
      type:
        'string'
    },

    teamName: {
      type:
        'string'
    },

    body: {
      type:
        'string'
    }
  }
};


export const WeeklyRecapSchema = {
  type:
    'object',

  additionalProperties:
    false,

  required: [
    'title',
    'subtitle',
    'opening',
    'matchupRecaps',
    'waiverWire',
    'tradeDesk',
    'standings',
    'awards',
    'closing'
  ],

  properties: {
    title: {
      type:
        'string'
    },

    subtitle: {
      type:
        'string'
    },

    opening: {
      type:
        'string'
    },

    matchupRecaps: {
      type:
        'array',

      items:
        MatchupRecapSchema
    },

    waiverWire: {
      type:
        'object',

      additionalProperties:
        false,

      required: [
        'headline',
        'body',
        'notableClaims'
      ],

      properties: {
        headline: {
          type:
            'string'
        },

        body: {
          type:
            'string'
        },

        notableClaims: {
          type:
            'array',

          items:
            WaiverClaimSchema
        }
      }
    },

    tradeDesk: {
      type:
        'object',

      additionalProperties:
        false,

      required: [
        'headline',
        'body',
        'items'
      ],

      properties: {
        headline: {
          type:
            'string'
        },

        body: {
          type:
            'string'
        },

        items: {
          type:
            'array',

          items:
            TradeItemSchema
        }
      }
    },

    standings: {
      type:
        'object',

      additionalProperties:
        false,

      required: [
        'headline',
        'body'
      ],

      properties: {
        headline: {
          type:
            'string'
        },

        body: {
          type:
            'string'
        }
      }
    },

    awards: {
      type:
        'object',

      additionalProperties:
        false,

      required: [
        'headline',
        'items'
      ],

      properties: {
        headline: {
          type:
            'string'
        },

        items: {
          type:
            'array',

          items:
            AwardItemSchema
        }
      }
    },

    closing: {
      type:
        'string'
    }
  }
};


function numberOrZero(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


function playerForAI(
  player
) {
  if (!player) {
    return null;
  }

  return {
    name:
      player.name,

    position:
      player.position ||
      null,

    fantasyPoints:
      player.fantasyPoints ??
      null
  };
}


function topScorers(
  players = [],
  limit = 3
) {
  return [
    ...players
  ]
    .filter(
      (player) =>
        Number.isFinite(
          Number(
            player
              ?.fantasyPoints
          )
        )
    )
    .sort(
      (a, b) =>
        numberOrZero(
          b.fantasyPoints
        ) -
        numberOrZero(
          a.fantasyPoints
        )
    )
    .slice(
      0,
      limit
    )
    .map(
      playerForAI
    );
}


function lowestStarter(
  players = []
) {
  const player =
    [
      ...players
    ]
      .filter(
        (entry) =>
          Number.isFinite(
            Number(
              entry
                ?.fantasyPoints
            )
          )
      )
      .sort(
        (a, b) =>
          numberOrZero(
            a.fantasyPoints
          ) -
          numberOrZero(
            b.fantasyPoints
          )
      )[0] ||
    null;

  return playerForAI(
    player
  );
}


function sideForAI(
  side
) {
  if (!side) {
    return null;
  }

  return {
    rosterId:
      side.rosterId,

    teamName:
      side.teamName,

    managerName:
      side.managerName,

    score:
      side.score,

    topStarters:
      topScorers(
        side.starters,
        3
      ),

    lowestStarter:
      lowestStarter(
        side.starters
      ),

    topBench:
      topScorers(
        side.bench,
        2
      )
  };
}


function groupPlayers(
  groups = []
) {
  return groups.map(
    (group) => ({
      rosterId:
        group.rosterId,

      teamName:
        group.teamName,

      managerName:
        group.managerName,

      players:
        (
          group.players ||
          []
        ).map(
          (player) => ({
            name:
              player.name,

            position:
              player.position ||
              null
          })
        )
    })
  );
}


function waiverForAI(
  transaction
) {
  return {
    id:
      String(
        transaction.id
      ),

    summary:
      transaction.summary ||
      '',

    adds:
      groupPlayers(
        transaction.adds
      ),

    drops:
      groupPlayers(
        transaction.drops
      ),

    faab:
      (
        transaction.faab ||
        []
      ).map(
        (row) => ({
          teamName:
            row.teamName,

          managerName:
            row.managerName,

          amount:
            numberOrZero(
              row.amount
            )
        })
      )
  };
}


function freeAgentForAI(
  transaction
) {
  return {
    id:
      String(
        transaction.id
      ),

    summary:
      transaction.summary ||
      '',

    adds:
      groupPlayers(
        transaction.adds
      ),

    drops:
      groupPlayers(
        transaction.drops
      )
  };
}


function playersForRoster(
  groups,
  rosterId
) {
  return (
    groups ||
    []
  )
    .filter(
      (group) =>
        Number(
          group.rosterId
        ) ===
        Number(
          rosterId
        )
    )
    .flatMap(
      (group) =>
        (
          group.players ||
          []
        ).map(
          (player) => ({
            name:
              player.name,

            position:
              player.position ||
              null
          })
        )
    );
}


function tradeSidesForAI(
  transaction,
  review
) {
  const capital =
    review?.capital ||
    null;

  return (
    transaction.teams ||
    []
  ).map(
    (team) => {
      const managerId =
        String(
          team.managerId ||
          ''
        );

      const teamName =
        team.teamName ||
        null;

      const receivesCapital =
        capital &&
        (
          (
            managerId &&
            String(
              capital.toManagerId ||
              ''
            ) ===
            managerId
          ) ||
          (
            !managerId &&
            capital.to
              ?.teamName ===
            teamName
          )
        )
          ? {
              year:
                capital.futuresYear,

              amount:
                numberOrZero(
                  capital.amount
                )
            }
          : null;

      const sendsCapital =
        capital &&
        (
          (
            managerId &&
            String(
              capital.fromManagerId ||
              ''
            ) ===
            managerId
          ) ||
          (
            !managerId &&
            capital.from
              ?.teamName ===
            teamName
          )
        )
          ? {
              year:
                capital.futuresYear,

              amount:
                numberOrZero(
                  capital.amount
                )
            }
          : null;

      const receivesDraftPicks =
        (
          transaction.draftPicks ||
          []
        )
          .filter(
            (pick) =>
              pick.currentOwner ===
              teamName
          )
          .map(
            (pick) =>
              pick.label
          );

      const sendsDraftPicks =
        (
          transaction.draftPicks ||
          []
        )
          .filter(
            (pick) =>
              pick.previousOwner ===
                teamName &&
              pick.currentOwner !==
                teamName
          )
          .map(
            (pick) =>
              pick.label
          );

      return {
        rosterId:
          team.rosterId,

        managerId:
          managerId ||
          null,

        teamName,

        managerName:
          team.managerName,

        receives:
          playersForRoster(
            transaction.adds,
            team.rosterId
          ),

        sends:
          playersForRoster(
            transaction.drops,
            team.rosterId
          ),

        receivesDraftPicks,
        sendsDraftPicks,
        receivesCapital,
        sendsCapital
      };
    }
  );
}


function tradeForAI(
  transaction
) {
  const review =
    transaction
      .draftCapitalReview ||
    null;

  const capitalStatus =
    review?.capital
      ? 'capital'
      : review?.status ===
          'no_capital'
        ? 'no_capital'
        : 'unknown';

  return {
    id:
      String(
        transaction.id
      ),

    summary:
      transaction.summary ||
      '',

    /*
     * THIS is the authoritative direction of the trade.
     *
     * The writer should narrate from sides[].receives / sends,
     * not attempt to reverse-engineer direction from raw adds/drops.
     */
    sides:
      tradeSidesForAI(
        transaction,
        review
      ),

    capitalStatus,

    capitalReviewStatus:
      review?.status ||
      'unknown',

    capital:
      review?.capital
        ? {
            futuresYear:
              review
                .capital
                .futuresYear,

            amount:
              review
                .capital
                .amount,

            fromTeam:
              review
                .capital
                .from
                ?.teamName ||
              null,

            toTeam:
              review
                .capital
                .to
                ?.teamName ||
              null
          }
        : null
  };
}


function movementForAI(
  row
) {
  return {
    teamName:
      row.teamName,

    managerName:
      row.managerName,

    beforeRank:
      row.beforeRank,

    afterRank:
      row.afterRank,

    change:
      row.change,

    beforeRecord:
      row.beforeRecord,

    weekRecord:
      row.weekRecord,

    afterRecord:
      row.afterRecord,

    h2hResult:
      row.h2hResult,

    topHalfResult:
      row.topHalfResult,

    weekScore:
      row.weekScore,

    pointsFor:
      row.pointsFor
  };
}


function badgeForAI(
  badge
) {
  return {
    title:
      badge.badgeTitle,

    teamName:
      badge.teamName,

    managerName:
      badge.managerName,

    reason:
      badge.reason,

    metadata:
      badge.metadata ||
      {}
  };
}


function teamMemoryForAI(
  team
) {
  if (!team) {
    return null;
  }

  return {
    managerName:
      team.managerName,

    teamName:
      team.teamName,

    fantasyStart:
      team.fantasyStart ||
      null,

    yearsOfService:
      team.yearsOfService ||
      null,

    persona:
      team.persona ||
      null,

    philosophy:
      team.philosophy ||
      null,

    championships:
      team.championships ||
      [],

    defendingChampion:
      Boolean(
        team.defendingChampion
      ),

    rival:
      team.rival ||
      null,

    previousSeasonSnapshot:
      team.previousSeasonSnapshot ||
      null,

    currentSeasonForm:
      team.currentSeasonForm ||
      null,

    draftCapital:
      team.draftCapital ||
      null,

    recordedDraftCapitalTrades:
      team.recordedDraftCapitalTrades ||
      null,

    editorialNotes:
      team.editorialNotes ||
      []
  };
}


function buildWriterBrief(
  packet
) {
  const memory =
    packet
      ?.league
      ?.beatWriterContext ||
    null;

  if (!memory) {
    return null;
  }

  return {
    purpose:
      memory.purpose ||
      'Institutional Irving League context.',

    directives:
      memory.writerDirectives ||
      [],

    archiveCoverage:
      memory.archiveCoverage ||
      null,

    capitalSnapshot:
      memory.capitalSnapshot ||
      null,

    priorityStoryHooks:
      memory.priorityStoryHooks ||
      [],

    currentMatchupSeries:
      memory.currentMatchupSeries ||
      [],

    currentMatchupLore:
      memory.currentMatchupLore ||
      [],

    teams:
      (
        memory.teams ||
        []
      )
        .map(
          teamMemoryForAI
        )
        .filter(
          Boolean
        )
  };
}


function matchupMemoryForAI(
  matchup,
  writerBrief
) {
  if (
    !writerBrief
  ) {
    return null;
  }

  const series =
    (
      writerBrief
        .currentMatchupSeries ||
      []
    ).find(
      (row) =>
        Number(
          row.matchupId
        ) ===
        Number(
          matchup.matchupId
        )
    ) ||
    null;

  const balancedLore =
    (
      writerBrief
        .currentMatchupLore ||
      []
    ).find(
      (row) =>
        Number(
          row.matchupId
        ) ===
        Number(
          matchup.matchupId
        )
    ) ||
    null;

  const teamByName =
    new Map(
      (
        writerBrief.teams ||
        []
      ).map(
        (team) => [
          team.teamName,
          team
        ]
      )
    );

  return {
    /*
     * balancedLore is the preferred context source.
     * It is produced side-by-side so BOTH franchises enter
     * the matchup prompt with equal editorial weight.
     */
    balancedLore,

    series,

    leftTeamMemory:
      teamMemoryForAI(
        teamByName.get(
          matchup.left
            ?.teamName
        )
      ),

    rightTeamMemory:
      teamMemoryForAI(
        teamByName.get(
          matchup.right
            ?.teamName
        )
      )
  };
}


export function trimWeeklyRecapPacketForAI(
  packet
) {
  const writerBrief =
    buildWriterBrief(
      packet
    );

  return {
    season:
      packet.season,

    week:
      packet.week,

    league: {
      id:
        packet.league
          ?.id ||
        null,

      name:
        packet.league
          ?.name ||
        'Irving Championship League'
    },

    /*
     * Put the brain NEAR THE TOP instead of burying it inside league.
     * The writer is explicitly instructed to read this before box scores.
     */
    writerBrief,

    leagueRules: {
      weeklyStandings:
        'Each team earns two standings decisions every week: one head-to-head result and one top-half scoring result. A weekly result is therefore normally 2-0, 1-1, or 0-2.',

      terminology:
        'FAAB amounts are dollar amounts. Draft capital is future auction money and is not FAAB. Team names and manager names are distinct; prefer team names in headlines and use manager names naturally in prose.',

      transactionWindow:
        packet
          .transactions
          ?.editorialWindow ||
        null
    },

    summary:
      packet.summary,

    matchups:
      (
        packet.matchups ||
        []
      ).map(
        (matchup) => ({
          matchupId:
            matchup.matchupId,

          winnerName:
            matchup.winnerName,

          margin:
            matchup.margin,

          totalScore:
            matchup.totalScore,

          left:
            sideForAI(
              matchup.left
            ),

          right:
            sideForAI(
              matchup.right
            ),

          historicalContext:
            matchupMemoryForAI(
              matchup,
              writerBrief
            )
        })
      ),

    highlights: {
      highestScore:
        packet
          .storyFacts
          ?.scoring
          ?.highestScore ||
        null,

      lowestScore:
        packet
          .storyFacts
          ?.scoring
          ?.lowestScore ||
        null,

      highestScoringLoser:
        packet
          .storyFacts
          ?.scoring
          ?.highestScoringLoser ||
        null,

      benchExplosion:
        packet
          .storyFacts
          ?.scoring
          ?.benchExplosion ||
        null,

      biggestClimber:
        packet
          .storyFacts
          ?.standings
          ?.biggestClimber ||
        null,

      biggestFaller:
        packet
          .storyFacts
          ?.standings
          ?.biggestFaller ||
        null,

      biggestFaabSpend:
        packet
          .storyFacts
          ?.faab
          ?.biggestSpend ||
        null
    },

    standings: {
      medianScore:
        packet
          .standings
          ?.medianScore ??
        null,

      movement:
        (
          packet
            .standings
            ?.movement ||
          []
        ).map(
          movementForAI
        )
    },

    transactions: {
      editorialWindow:
        packet
          .transactions
          ?.editorialWindow ||
        null,

      waivers:
        (
          packet
            .transactions
            ?.waivers ||
          []
        ).map(
          waiverForAI
        ),

      freeAgents:
        (
          packet
            .transactions
            ?.freeAgents ||
          []
        ).map(
          freeAgentForAI
        ),

      trades:
        (
          packet
            .transactions
            ?.trades ||
          []
        ).map(
          tradeForAI
        )
    },

    awards:
      (
        packet
          .storyFacts
          ?.weeklyAwards
          ?.all ||
        []
      ).map(
        badgeForAI
      ),

    warnings: [
      ...(
        packet
          .storyFacts
          ?.warnings ||
        []
      ),

      ...(
        packet
          .enrichment
          ?.warnings ||
        []
      )
    ]
  };
}


const WRITER_INSTRUCTIONS = `
You are Eli Lang, the longtime weekly beat writer for the Irving Championship League, a 14-team fantasy football league.

You are NOT writing a database summary.
You are writing a league sports column by somebody who knows these franchises, their baggage, their rivalries, and why this week's results matter.

MOST IMPORTANT WORKFLOW:
1. READ writerBrief FIRST.
2. Then read the current-week matchup, standings, transaction, and award facts.
3. Ask: "Why does this matter in the larger Irving story?"
4. Build the article around the answer.

THE LEAGUE BRAIN:
- writerBrief is first-class source material, not optional flavor.
- priorityStoryHooks are SHORT week-level angles. They are NOT the complete league memory and must not monopolize the article.
- currentMatchupLore is the balanced matchup-by-matchup memory desk. It carries BOTH franchises side-by-side, including commissioner editorial notes.
- currentMatchupSeries contains available head-to-head history.
- each matchup also includes historicalContext. Prefer historicalContext.balancedLore when deciding which lore applies to that matchup.
- editorialNotes are commissioner-approved league lore and context.
- BEFORE writing each matchup, inspect BOTH teams in balancedLore. Give both sides equal consideration.
- Do not repeatedly return to one franchise's lore simply because that franchise appears in priorityStoryHooks.
- Across a normal article with useful memory available, aim for roughly 2-4 natural historical/contextual callbacks spread across multiple relevant teams or matchups.
- If the featured matchup or opening has a directly relevant rivalry, title-window, championship, rebuild, capital, or series beat, use at least one such beat there.
- If another matchup has strong supplied lore, use it there rather than recycling the featured team's history again.
- Do NOT force history where it does not illuminate the current event.
- Do NOT dump biographies, title lists, or trivia.
- Make the history feel remembered, not pasted in.

VOICE:
- Sound like a sharp local sports columnist who has covered this league for years.
- Funny, conversational, confident, occasionally profane when it genuinely improves the line.
- Light trash talk is encouraged.
- Make fun of results, roster decisions, FAAB behavior, and fantasy misfortune more than the actual people.
- Be specific. Jokes should come from supplied facts or supplied league lore.
- Do not force a joke into every paragraph.
- Vary sentence rhythm and joke structure.
- Do not sound like an announcer reading a box score.
- Do not sound like corporate sports copy.

AVOID THESE AI HABITS:
- "What a week"
- "rollercoaster"
- "only time will tell"
- "one thing is certain"
- "when the dust settled"
- "at the end of the day"
- "sent a message to the league"
- repeatedly saying somebody "made a statement"
- repeatedly calling things "chaos"
- repeatedly saying a manager "opened the wallet"
- fake quotes
- invented motivations
- melodramatic filler

FACT RULES:
- The supplied JSON is authoritative.
- NEVER invent scores, players, transactions, FAAB amounts, standings, records, rankings, injuries, NFL performances, rivalries, history, quotes, or motivations.
- Do not use outside NFL knowledge.
- Do not infer facts from a player's reputation or real-world career.
- Editorial notes MAY establish context or cause/effect because the commissioner explicitly supplied them.
- Automatic historical data establishes prior results and trends, not motives.
- If archive coverage does not include a manager's whole career, say "in the available archive" rather than "all time."
- If information is not supplied, leave it out.
- Never turn uncertainty into certainty.

HEADLINE:
- The title should sound like an actual sports-column headline.
- Usually 5-11 words.
- Lead with the strongest story of the week.
- DO NOT use generic titles such as:
  "Irving Championship League Week 8 Recap"
  "Week 8 Recap"
  "Irving Weekly: Week 8"
- Do not put "recap" in the title unless it is part of a joke.
- The subtitle should add 2-3 secondary storylines rather than repeat the title.
- Do not cram every statistic into the subtitle.

OPENING:
- Open on the strongest narrative, not a transaction count or checklist.
- Do not begin with "Week X brought..." or "Week X saw..."
- Establish the week's personality in the first 1-2 sentences.
- When a current result connects directly to supplied league history, use that connection early.
- Target roughly 80-140 words.

MATCHUPS:
- Produce exactly one matchupRecaps entry for every supplied matchup.
- Use every supplied matchupId exactly once.
- Pick exactly one matchup as featured=true.
- All other matchups must have featured=false.

FEATURED MATCHUP:
- Treat it like the game of the week.
- Target roughly 100-160 words.
- Explain why it mattered using both current facts and relevant supplied league memory.
- Highlight relevant player performances.
- Use standings consequences, rivalry context, prior meetings, title/rebuild context, badges, or weekly-result implications when supplied.

NON-FEATURED MATCHUPS:
- Target roughly 45-85 words each.
- Do not mechanically list players.
- Find the most interesting angle and get out.
- If historical context adds something real, use one clean callback rather than a history dump.

LINEUP REGRET:
- Do not claim a bench player would have changed a matchup unless supplied awards data explicitly establishes a legal replacement that flips the result.
- "Bench Explosion" only means somebody scored heavily on the bench.
- Cap'n Hindsight facts may be described as genuine missed lineup opportunities because those were calculated by league code.

STANDINGS:
- The league awards two standings decisions each week:
  1. head-to-head result
  2. top-half scoring result
- Weekly records are therefore normally 2-0, 1-1, or 0-2.
- Explain this system ONLY when materially useful.
- Focus on movement and consequence.
- Target roughly 70-120 words.

WAIVERS:
- The supplied waiver/free-agent list has already been assigned to the correct Irving editorial week.
- Do NOT second-guess or reassign it based on the Sleeper transaction round.
- Focus on the biggest FAAB decisions and most interesting pickups.
- Do not enumerate every free-agent move.
- Prefer 2-4 notable claims unless more are truly important.
- Never confuse a free-agent pickup with a paid waiver claim.
- Target the section body to roughly 70-120 words.

NOTABLE WAIVER CLAIM CARDS:
- Commentary should usually be one short sentence.
- Avoid repeating the exact same information already stated in the section body.
- Focus on the price, player, or why the move stands out.

TRADES — CRITICAL DIRECTION RULE:
- Include every supplied trade.
- Each trade contains sides[].
- sides[].receives means EXACTLY what that team RECEIVED.
- sides[].sends means EXACTLY what that team SENT AWAY.
- sides[].receivesCapital means capital that team RECEIVED.
- sides[].sendsCapital means capital that team SENT AWAY.
- NEVER reverse a trade.
- NEVER infer direction from prose, summary text, or player reputation.
- If there is any ambiguity, write the explicit construction:
  "Team A received X; Team B received Y."
- Trade items should usually be 25-60 words.
- Headlines should usually be 4-10 words.
- Do not judge who "won" a trade using future knowledge.

DRAFT CAPITAL:
- capitalStatus = "capital" means the trade definitely included draft capital.
- Accurately preserve the supplied year, amount, sender, and receiver.
- capitalStatus = "no_capital" means no draft capital.
- capitalStatus = "unknown" means the capital component has NOT been established.
- NEVER turn unknown into "no capital."
- Draft capital is future auction money, NOT FAAB.

AWARDS:
- Use supplied awards accurately.
- Rewrite the presentation in your own voice rather than simply copying the supplied reason.
- Repeated instances may be grouped when that reads better.
- Award commentary should usually be 25-60 words.

CLOSING:
- Do not merely summarize the article.
- End with a short punchline, lingering storyline, standings tension, or next-week pressure.
- Target roughly 35-70 words.
- Do not use "only time will tell."

STYLE:
- Prefer short and medium paragraphs.
- Prefer vivid specifics over generic adjectives.
- Avoid repeating team names unnecessarily.
- Use manager names naturally, but team names remain the primary fantasy identities.
- Avoid explaining obvious arithmetic.
- Let truly strange facts carry their own weight.
- The complete article should feel substantial but brisk.
`;


function extractOutputText(
  response
) {
  const parts =
    [];

  for (
    const item of
      response?.output ||
    []
  ) {
    if (
      item?.type !==
      'message'
    ) {
      continue;
    }

    for (
      const content of
        item.content ||
      []
    ) {
      if (
        content?.type ===
        'refusal'
      ) {
        throw new Error(
          content.refusal ||
          'OpenAI refused to generate the recap.'
        );
      }

      if (
        content?.type ===
          'output_text' &&
        typeof content.text ===
          'string'
      ) {
        parts.push(
          content.text
        );
      }
    }
  }

  return parts
    .join('')
    .trim();
}


function assertRecapShape(
  recap
) {
  if (
    !recap ||
    typeof recap !==
      'object' ||
    Array.isArray(
      recap
    )
  ) {
    throw new Error(
      'OpenAI returned an invalid recap object.'
    );
  }

  for (
    const field of [
      'title',
      'subtitle',
      'opening',
      'closing'
    ]
  ) {
    if (
      typeof recap[field] !==
        'string'
    ) {
      throw new Error(
        `OpenAI recap is missing "${field}".`
      );
    }
  }

  if (
    !Array.isArray(
      recap.matchupRecaps
    )
  ) {
    throw new Error(
      'OpenAI recap is missing matchupRecaps.'
    );
  }

  if (
    !recap.waiverWire ||
    typeof recap.waiverWire !==
      'object'
  ) {
    throw new Error(
      'OpenAI recap is missing waiverWire.'
    );
  }

  if (
    !recap.tradeDesk ||
    typeof recap.tradeDesk !==
      'object'
  ) {
    throw new Error(
      'OpenAI recap is missing tradeDesk.'
    );
  }

  if (
    !recap.standings ||
    typeof recap.standings !==
      'object'
  ) {
    throw new Error(
      'OpenAI recap is missing standings.'
    );
  }

  if (
    !recap.awards ||
    typeof recap.awards !==
      'object'
  ) {
    throw new Error(
      'OpenAI recap is missing awards.'
    );
  }
}


export async function generateWeeklyRecap({
  packet,
  apiKey
} = {}) {
  if (!packet) {
    throw new Error(
      'Weekly recap packet is required.'
    );
  }

  const cleanApiKey =
    String(
      apiKey ||
      ''
    ).trim();

  if (!cleanApiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured.'
    );
  }

  const aiPacket =
    trimWeeklyRecapPacketForAI(
      packet
    );

  const userPrompt = [
    `Write the Irving Championship League column for ${packet.season} Week ${packet.week}.`,
    '',
    'READ writerBrief FIRST. Treat it as the league beat writer memory that explains why current events matter.',
    'Then use the current-week facts to write the column.',
    'This should feel like the writer has covered these managers for years, not like a box-score generator.',
    '',
    'AUTHORITATIVE WEEKLY PACKET:',
    JSON.stringify(
      aiPacket
    )
  ].join(
    '\n'
  );

  const response =
    await fetch(
      'https://api.openai.com/v1/responses',
      {
        method:
          'POST',

        headers: {
          authorization:
            `Bearer ${cleanApiKey}`,

          'content-type':
            'application/json',

          accept:
            'application/json'
        },

        body:
          JSON.stringify({
            model:
              'gpt-5.6-terra',

            reasoning: {
              effort:
                'medium'
            },

            store:
              false,

            input: [
              {
                role:
                  'system',

                content: [
                  {
                    type:
                      'input_text',

                    text:
                      WRITER_INSTRUCTIONS
                  }
                ]
              },

              {
                role:
                  'user',

                content: [
                  {
                    type:
                      'input_text',

                    text:
                      userPrompt
                  }
                ]
              }
            ],

            text: {
              format: {
                type:
                  'json_schema',

                name:
                  'irving_weekly_recap',

                strict:
                  true,

                schema:
                  WeeklyRecapSchema
              }
            }
          })
      }
    );

  const rawBody =
    await response.text();

  if (!response.ok) {
    const requestId =
      response.headers.get(
        'x-request-id'
      );

    let message =
      rawBody;

    try {
      const parsedError =
        JSON.parse(
          rawBody
        );

      message =
        parsedError
          ?.error
          ?.message ||
        parsedError
          ?.message ||
        rawBody;
    } catch {
      // Keep raw body.
    }

    throw new Error(
      [
        `OpenAI request failed with HTTP ${response.status}.`,

        message ||
          null,

        requestId
          ? `Request ID: ${requestId}`
          : null
      ]
        .filter(
          Boolean
        )
        .join(
          ' '
        )
    );
  }

  let responseJson;

  try {
    responseJson =
      JSON.parse(
        rawBody
      );
  } catch {
    throw new Error(
      'OpenAI returned a non-JSON Responses API payload.'
    );
  }

  if (
    responseJson?.error
  ) {
    throw new Error(
      responseJson
        .error
        .message ||
      'OpenAI returned an error.'
    );
  }

  if (
    responseJson?.status ===
    'incomplete'
  ) {
    const reason =
      responseJson
        ?.incomplete_details
        ?.reason;

    throw new Error(
      `OpenAI response was incomplete${
        reason
          ? `: ${reason}`
          : '.'
      }`
    );
  }

  const outputText =
    extractOutputText(
      responseJson
    );

  if (!outputText) {
    throw new Error(
      'OpenAI returned no recap text.'
    );
  }

  let recap;

  try {
    recap =
      JSON.parse(
        outputText
      );
  } catch {
    throw new Error(
      'OpenAI returned recap text that was not valid JSON.'
    );
  }

  assertRecapShape(
    recap
  );

  return {
    recap,

    meta: {
      responseId:
        responseJson.id ||
        null,

      model:
        responseJson.model ||
        'gpt-5.6-terra',

      generatedAt:
        new Date()
          .toISOString(),

      writerBriefUsed:
        Boolean(
          aiPacket.writerBrief
        )
    }
  };
}
