// One source for every schedule surface: navbar dropdown, popup and landing
// strip read the same manager payload and format it the same way.

export interface TimetableEntry {
	id: number;
	startsAt: string;
	endsAt: string;
	title: string | null;
	show: string | null;
	artists: string[] | null;
	genres: string[] | null;
	cover: string | null;
	kind: "replay" | "live";
	onAir: boolean;
	setPath: string | null;
	showPath: string | null;
	poolPath: string | null;
}

export interface TimetablePayload {
	from: string | null;
	to: string | null;
	timezone: string;
	timezoneLabel: string;
	entries: TimetableEntry[];
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Berlin",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
	timeZone: "Europe/Berlin",
	weekday: "short",
	day: "numeric",
	month: "short",
});

export function scheduleTime(iso: string | null): string {
	if (!iso) return "";
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

export function scheduleDay(iso: string | null): string {
	if (!iso) return "";
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

export function scheduleRange(entry: TimetableEntry): string {
	return `${scheduleTime(entry.startsAt)}–${scheduleTime(entry.endsAt)}`;
}

export function minutesOfDay(iso: string): number {
	const parts = timeFormat.formatToParts(new Date(iso));
	const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
	const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
	return hour * 60 + minute;
}

export function entryLabel(entry: TimetableEntry): string {
	return entry.title || entry.show || "Untitled";
}

export function entrySubline(entry: TimetableEntry): string {
	const artists = (entry.artists ?? []).join(", ");
	if (artists) return artists;
	return entry.show || "";
}

/** The next `count` entries that have not ended yet. */
export function upcoming(entries: TimetableEntry[], count = 8, now = new Date()): TimetableEntry[] {
	return entries
		.filter((entry) => new Date(entry.endsAt).getTime() > now.getTime())
		.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
		.slice(0, count);
}

/** Entries in a window around now: past hour to `hoursAhead`. */
export function aroundNow(entries: TimetableEntry[], now = new Date(), hoursAhead = 3): TimetableEntry[] {
	const from = now.getTime() - 60 * 60_000;
	const to = now.getTime() + hoursAhead * 60 * 60_000;
	return entries
		.filter((entry) => {
			const start = new Date(entry.startsAt).getTime();
			const end = new Date(entry.endsAt).getTime();
			return end > from && start < to;
		})
		.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export async function fetchTimetable(from?: string, to?: string): Promise<TimetablePayload> {
	try {
		return await $fetch<TimetablePayload>("/api/timetable", { query: { from, to } });
	} catch {
		return { from: null, to: null, timezone: "Europe/Berlin", timezoneLabel: "GMT+1", entries: [] };
	}
}
