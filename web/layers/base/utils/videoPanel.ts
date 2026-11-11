const MIN_WIDTH = 280;
const MAX_WIDTH = 640;
const VIEWPORT_GAP = 48;

export function clampVideoWidth(width: number, viewport: number): number {
	const ceiling = Math.min(
		MAX_WIDTH,
		Math.max(MIN_WIDTH, viewport - VIEWPORT_GAP),
	);
	const safeWidth = Number.isFinite(width) ? Math.round(width) : MIN_WIDTH;
	return Math.min(Math.max(safeWidth, MIN_WIDTH), ceiling);
}

export function videoHeightForWidth(width: number): number {
	return Math.round((width * 9) / 16);
}

export function hlsRetryDelay(attempt: number): number | null {
	return [2000, 4000, 8000][attempt] ?? null;
}

export function shouldOpenVideo({
	live,
	since,
	dismissedSince,
}: {
	live: boolean;
	since: string | null;
	dismissedSince: string | null;
}): boolean {
	return Boolean(live) && since !== dismissedSince;
}
