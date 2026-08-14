const MatchupRecapSchema = {
	type: 'object',
	additionalProperties: false,
	required: [
		'matchupId',
		'featured',
		'headline',
		'body'
	],
	properties: {
		matchupId: {
			type: 'integer'
		},

		featured: {
			type: 'boolean'
		},

		headline: {
			type: 'string'
		},

		body: {
			type: 'string'
		}
	}
};


const WaiverClaimSchema = {
	type: 'object',
	additionalProperties: false,
	required: [
		'teamName',
		'players',
		'faab',
		'commentary'
	],
	properties: {
		teamName: {
			type: 'string'
		},

		players: {
			type: 'array',
			items: {
				type: 'string'
			}
		},

		faab: {
			type: 'number'
		},

		commentary: {
			type: 'string'
		}
	}
};


const TradeItemSchema = {
	type: 'object',
	additionalProperties: false,
	required: [
		'transactionId',
		'headline',
		'body'
	],
	properties: {
		transactionId: {
			type: 'string'
		},

		headline: {
			type: 'string'
		},

		body: {
			type: 'string'
		}
	}
};


const AwardItemSchema = {
	type: 'object',
	additionalProperties: false,
	required: [
		'title',
		'teamName',
		'body'
	],
	properties: {
		title: {
			type: 'string'
		},

		teamName: {
			type: 'string'
		},

		body: {
			type: 'string'
		}
	}
};


export const WeeklyRecapSchema = {
	type: 'object',
	additionalProperties: false,

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
			type: 'string'
		},

		subtitle: {
			type: 'string'
		},

		opening: {
			type: 'string'
		},

		matchupRecaps: {
			type: 'array',
			items:
				MatchupRecapSchema
		},

		waiverWire: {
			type: 'object',
			additionalProperties: false,

			required: [
				'headline',
				'body',
				'notableClaims'
			],

			properties: {
				headline: {
					type: 'string'
				},

				body: {
					type: 'string'
				},

				notableClaims: {
					type: 'array',
					items:
						WaiverClaimSchema
				}
			}
		},

		tradeDesk: {
			type: 'object',
			additionalProperties: false,

			required: [
				'headline',
				'body',
				'items'
			],

			properties: {
				headline: {
					type: 'string'
				},

				body: {
					type: 'string'
				},

				items: {
					type: 'array',
					items:
						TradeItemSchema
				}
			}
		},

		standings: {
			type: 'object',
			additionalProperties: false,

			required: [
				'headline',
				'body'
			],

			properties: {
				headline: {
					type: 'string'
				},

				body: {
					type: 'string'
				}
			}
		},

		awards: {
			type: 'object',
			additionalProperties: false,

			required: [
				'headline',
				'items'
			],

			properties: {
				headline: {
					type: 'string'
				},

				items: {
					type: 'array',
					items:
						AwardItemSchema
				}
			}
		},

		closing: {
			type: 'string'
		}
	}
};


function numberOrZero(
	value
) {
	const number =
		Number(
			value
		);

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

		teams:
			(
				transaction.teams ||
				[]
			).map(
				(team) => ({
					teamName:
						team.teamName,

					managerName:
						team.managerName
				})
			),

		adds:
			groupPlayers(
				transaction.adds
			),

		drops:
			groupPlayers(
				transaction.drops
			),

		draftPicks:
			transaction.draftPicks ||
			[],

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


export function trimWeeklyRecapPacketForAI(
	packet
) {
	return {
		season:
			packet.season,

		week:
			packet.week,

		league:
			packet.league,

		leagueRules: {
			weeklyStandings:
				'Each team earns two standings decisions every week: one head-to-head result and one top-half scoring result. A weekly result is therefore normally 2-0, 1-1, or 0-2.',

			terminology:
				'FAAB amounts are dollar amounts. Team names and manager names are distinct; prefer team names in headlines and use manager names naturally in prose.'
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
You are the longtime weekly beat writer for the Irving Champions League, a 14-team fantasy football league.

You are not writing a data summary.
You are writing a weekly sports column.

Before writing, silently identify the 1-2 strongest narratives in the supplied facts:
- a standings shakeup
- an absurd matchup
- a brutal loss
- a huge scoring week
- waiver spending
- trade chaos
- lineup regret
- an unusual badge result
- another genuinely notable supplied event

Use those narratives to shape the headline, subtitle, opening, and overall tone.

VOICE:
- Sound like a sharp local sports columnist who has covered this league for years.
- Funny, conversational, confident, occasionally profane when it genuinely improves the line.
- Light trash talk is encouraged.
- Make fun of results, roster decisions, FAAB behavior, and fantasy misfortune more than the actual people.
- Be specific. Jokes should come from the supplied facts.
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
- You may use jokes, metaphors, exaggerations, and editorial observations, but factual claims must be supported by the packet.
- If information is not supplied, leave it out.
- Never turn uncertainty into certainty.

HEADLINE:
- The title should sound like an actual sports-column headline.
- Usually 5-11 words.
- Lead with the strongest story of the week.
- DO NOT use generic titles such as:
  "Irving Champions League Week 8 Recap"
  "Week 8 Recap"
  "Irving Weekly: Week 8"
- Do not put "recap" in the title unless it is part of a joke.
- The subtitle should add 2-3 secondary storylines rather than repeat the title.
- Do not cram every statistic into the subtitle.
- Section headlines should not simply restate the main headline.
- If the main headline already focuses on a standings story, use the Standings Watch headline to highlight a different movement or consequence.

OPENING:
- Open on the strongest narrative, not a transaction count or checklist of everything that occurred.
- Do not begin with "Week X brought..." or "Week X saw..."
- Establish the week's personality in the first 1-2 sentences.
- Fold supporting facts into the opening naturally.
- Do not explain every section of the article in advance.
- Target roughly 80-140 words.

MATCHUPS:
- Produce exactly one matchupRecaps entry for every supplied matchup.
- Use every supplied matchupId exactly once.
- Pick exactly one matchup as featured=true.
- All other matchups must have featured=false.

FEATURED MATCHUP:
- Treat it like the game of the week.
- Target roughly 100-160 words.
- Explain why it mattered or why it was interesting using supplied facts.
- Highlight relevant player performances.
- Use standings consequences, badges, bench mistakes, or weekly-result implications when supplied.

NON-FEATURED MATCHUPS:
- Keep these noticeably tighter than the featured game.
- Target roughly 45-85 words each.
- Do not mechanically list three players from both teams.
- Find the most interesting angle and get out.
- If the matchup was boring, it is okay for the recap to be brief and funny.

LINEUP REGRET:
- Do not claim a bench player would have changed a matchup unless the supplied awards data explicitly establishes a legal replacement that flips the result.
- "Bench Explosion" only means somebody scored heavily on the bench.
- Cap'n Hindsight facts may be described as genuine missed lineup opportunities because those were calculated by league code.

STANDINGS:
- The league awards two standings decisions each week:
  1. head-to-head result
  2. top-half scoring result
- Weekly records are therefore normally 2-0, 1-1, or 0-2.
- Explain this system ONLY when it materially helps explain an unusual result.
- Do not re-explain the two-result format multiple times in the same article.
- Focus on movement: who climbed, who fell, who took first, who preserved position, and who wasted an opportunity.
- Target roughly 70-120 words.

WAIVERS:
- Focus on the biggest FAAB decisions and the most interesting pickups.
- Do not enumerate every free-agent move.
- Prefer 2-4 notable claims unless more are truly important.
- Never confuse a free-agent pickup with a paid waiver claim.
- Do not describe equal total spending as one manager "outspending" another.
- Target the section body to roughly 70-120 words.

NOTABLE WAIVER CLAIM CARDS:
- Commentary should usually be one short sentence.
- Avoid repeating the exact same information already stated in the section body.
- Focus on the price, the player, or why the move stands out from the week's activity.

TRADES:
- Include every supplied trade.
- Trade items should be concise because active weeks may contain many deals.
- Each trade item should usually be 25-60 words.
- Headlines should usually be 4-10 words.
- Do NOT write every trade as:
  "Team A received X. Team B received Y."
- Vary the construction naturally:
  "Amherst landed C.J. Stroud..."
  "Dunedin paid Rico Dowdle and $75..."
  "Nakatomi and Rebel Radio swapped..."
- Accuracy still comes first. If a more natural sentence becomes ambiguous, use the explicit version.
- Do not judge who "won" a trade using future knowledge.
- Do not call a trade a steal, robbery, fleece, disaster, or victory unless the supplied facts themselves establish something that justifies that description.
- Target the Trade Desk introduction to roughly 50-100 words.

DRAFT CAPITAL:
- capitalStatus = "capital" means the trade definitely included draft capital.
- When capitalStatus = "capital", accurately include the supplied year, amount, sender, and receiver when relevant.
- capitalStatus = "no_capital" means the trade was explicitly confirmed to contain no draft capital.
- capitalStatus = "unknown" means the capital component has NOT been established.
- NEVER say "no draft capital was exchanged" when capitalStatus is "unknown".
- If capitalStatus is unknown, omit capital commentary or explicitly say it was not confirmed.

AWARDS:
- Use the supplied awards accurately.
- Rewrite the presentation in your own voice rather than simply copying the supplied reason.
- Repeated instances of the same badge may be grouped into one award item when that reads better.
- Zero Hour and Bye Bye Bye especially may be grouped rather than creating a wall of nearly identical cards.
- Cap'n Hindsight items may remain separate when each tells a distinct matchup story.
- Award commentary should usually be 25-60 words.
- When many Cap'n Hindsight awards exist, feature the 1-3 most dramatic swings in the article.
- Do not feel obligated to create a separate article card for every repeated badge candidate.

CLOSING:
- Do not merely summarize the article again.
- End with a short punchline, lingering storyline, standings tension, or warning for the next week.
- Target roughly 35-70 words.
- Do not use "only time will tell."

STYLE:
- Prefer short and medium paragraphs.
- Prefer vivid specifics over generic adjectives.
- Avoid repeating team names unnecessarily within the same paragraph.
- Use manager names naturally, but team names should remain the primary fantasy identities.
- Avoid explaining obvious arithmetic.
- Do not describe every notable event as historic, wild, insane, massive, or shocking.
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
		`Write the Irving Champions League column for ${packet.season} Week ${packet.week}.`,
		'',
		'Treat this as a sports column, not a database summary.',
		'Choose the strongest story of the week and build the headline/opening around it.',
		'Keep secondary matchup and trade blurbs tight.',
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
								'low'
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
			/*
			 * Keep the raw response
			 * body if it wasn't JSON.
			 */
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
					.toISOString()
		}
	};
}