export const COVER_FLOW_ANIMATION_MS = 720;
export const COVER_FLOW_ITEM_COUNT = 10;
/** ID-only candidates fetched in page query; full items loaded client-side. */
export const COVER_FLOW_CANDIDATE_IDS_LIMIT = 60;

export function shuffleArray<T>(items: T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function pickRandomItems<T>(
	items: T[],
	count = COVER_FLOW_ITEM_COUNT,
): T[] {
	return shuffleArray(items).slice(0, Math.min(count, items.length));
}
