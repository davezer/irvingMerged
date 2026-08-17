import {
	getManagers
} from '$lib/server/league';


function parseChampionshipYears(manager) {
	const raw =
		manager?.championship?.years;

	if (!raw) {
		return [];
	}

	return String(raw)
		.split(',')
		.map((value) =>
			Number(value.trim())
		)
		.filter((value) =>
			Number.isInteger(value)
		);
}


function championshipLeagueForYear(
	manager,
	year
) {
	return (
		manager?.championship
			?.leagueByYear?.[year] ||
		manager?.championship?.league ||
		'Legacy'
	);
}


function buildChampionships(managers) {
	return managers
		.flatMap((manager) => {
			const years =
				parseChampionshipYears(
					manager
				);

			return years.map(
				(year) => ({
					year,

					league:
						championshipLeagueForYear(
							manager,
							year
						),

					managerId:
						manager.managerID,

					managerName:
						manager.name,

					teamName:
						manager.teamName,

					photo:
						manager.photo,

					slug:
						manager.slug
				})
			);
		})
		.sort((a, b) => {
			return (
				b.year - a.year ||
				a.league.localeCompare(
					b.league
				)
			);
		});
}


function buildTitleLeaders(
	managers
) {
	return managers
		.map((manager) => {
			const years =
				parseChampionshipYears(
					manager
				);

			const titles =
				years
					.map((year) => ({
						year,

						league:
							championshipLeagueForYear(
								manager,
								year
							)
					}))
					.sort(
						(a, b) =>
							b.year - a.year
					);

			return {
				managerId:
					manager.managerID,

				managerName:
					manager.name,

				teamName:
					manager.teamName,

				photo:
					manager.photo,

				slug:
					manager.slug,

				titles,

				count:
					titles.length
			};
		})
		.filter(
			(manager) =>
				manager.count > 0
		)
		.sort((a, b) => {
			return (
				b.count - a.count ||
				(
					b.titles[0]?.year ||
					0
				) -
					(
						a.titles[0]?.year ||
						0
					)
			);
		});
}


function buildLeagueTotals(
	championships
) {
	const totals =
		new Map();

	for (
		const title of
		championships
	) {
		totals.set(
			title.league,

			(
				totals.get(
					title.league
				) || 0
			) + 1
		);
	}

	return [
		...totals.entries()
	]
		.map(
			([league, count]) => ({
				league,
				count
			})
		)
		.sort(
			(a, b) =>
				b.count - a.count
		);
}


export const load = async () => {
	const managers =
		getManagers();

	const championships =
		buildChampionships(
			managers
		);

	const titleLeaders =
		buildTitleLeaders(
			managers
		);

	const leagueTotals =
		buildLeagueTotals(
			championships
		);

	const years =
		[
			...new Set(
				championships.map(
					(title) =>
						title.year
				)
			)
		];


	return {
		championships,

		titleLeaders,

		leagueTotals,

		years,

		stats: {
			totalTitles:
				championships.length,

			champions:
				titleLeaders.length,

			seasons:
				years.length,

			firstYear:
				years.length
					? Math.min(
							...years
						)
					: null,

			latestYear:
				years.length
					? Math.max(
							...years
						)
					: null
		}
	};
};