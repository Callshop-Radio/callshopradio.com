export function formatPlayerTime(seconds: number): string {
	const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const rest = safe % 60;
	const pad = (value: number) => String(value).padStart(2, "0");
	return hours > 0
		? `${hours}:${pad(minutes)}:${pad(rest)}`
		: `${minutes}:${pad(rest)}`;
}

export interface StreamShowProgress {
	percent: number;
	endMs: number;
}

/**
 * Live shows know their occurrence window. The feed carries the elapsed and
 * total seconds at `updatedAt`; adding the time since then keeps the bar and
 * the "until" label moving between 20 s polls.
 */
export function streamShowProgress(
	feed:
		| {
				state: string;
				updatedAt: string;
				progress: {
					elapsedSeconds: number;
					durationSeconds: number;
				} | null;
		  }
		| null
		| undefined,
	nowMs: number = Date.now(),
): StreamShowProgress | null {
	if (feed?.state !== "live" || !feed.progress) return null;
	const { elapsedSeconds, durationSeconds } = feed.progress;
	if (
		!Number.isFinite(elapsedSeconds) ||
		!Number.isFinite(durationSeconds) ||
		durationSeconds <= 0
	) {
		return null;
	}
	const updatedAt = Date.parse(feed.updatedAt);
	if (!Number.isFinite(updatedAt)) return null;
	const driftSeconds = Math.max(0, (nowMs - updatedAt) / 1000);
	const elapsed = Math.min(
		durationSeconds,
		Math.max(0, elapsedSeconds + driftSeconds),
	);
	const percent = Math.min(100, Math.max(0, (elapsed / durationSeconds) * 100));
	return {
		percent,
		endMs: updatedAt + (durationSeconds - elapsedSeconds) * 1000,
	};
}

export function nextMilestones(percent: number, seen: Set<number>): number[] {
	const crossed: number[] = [];
	for (const milestone of [25, 50, 75, 100]) {
		if (percent >= milestone && !seen.has(milestone)) crossed.push(milestone);
	}
	return crossed;
}
