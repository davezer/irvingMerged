import { writable } from 'svelte/store';

const initialState = {
	open: false,
	playerId: null,
	season: null,
	context: null
};

export const playerModal = writable(initialState);

export function openPlayerModal(
	playerId,
	{
		season = null,
		context = null
	} = {}
) {
	const cleanPlayerId =
		String(playerId ?? '').trim();

	if (
		!cleanPlayerId ||
		cleanPlayerId === '0'
	) {
		return;
	}

	playerModal.set({
		open: true,
		playerId: cleanPlayerId,
		season:
			season == null
				? null
				: Number(season),
		context:
			context || null
	});
}

export function closePlayerModal() {
	playerModal.set(initialState);
}