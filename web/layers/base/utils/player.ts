export function formatPlayerTime(seconds: number): string {
	const safe = Math.max(
		0,
		Math.floor(Number.isFinite(seconds) ? seconds : 0),
	);
	const hours = Math.floor(safe / 3600);
	const minutes = Math.floor((safe % 3600) / 60);
	const rest = safe % 60;
	const pad = (value: number) => String(value).padStart(2, "0");
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

export function nextMilestones(percent: number, seen: Set<number>): number[] {
	const crossed: number[] = [];
	for (const milestone of [25, 50, 75, 100]) {
		if (percent >= milestone && !seen.has(milestone)) crossed.push(milestone);
	}
	return crossed;
}
