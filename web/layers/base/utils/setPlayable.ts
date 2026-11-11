export interface SetPlayable {
	id: string;
	title: string;
	slug: string | null;
	show: { id?: string; title?: string; slug?: string | null } | null;
	artists: { name: string; slug: string | null; poolVisibility: boolean }[];
	cover: string | null;
	soundcloudUrl: string | null;
	durationMs: number | null;
}

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function slugOf(value: unknown): string | null {
	if (typeof value === "string") return text(value) || null;
	if (value && typeof value === "object" && "current" in value) {
		return text((value as { current?: unknown }).current) || null;
	}
	return null;
}

/** The Sanity card already carries everything the row needs; no fetch on click. */
export function toSetPlayable(item: unknown, cover: string | null): SetPlayable {
	const doc = (item ?? {}) as Record<string, unknown>;
	const track = (
		(doc.soundcloud as { tracks?: Array<Record<string, unknown>> } | undefined)
			?.tracks ?? []
	)[0];
	const showDoc = (doc.parentShow ?? doc.show ?? null) as Record<string, unknown> | null;
	const persons = Array.isArray(doc.persons) ? doc.persons : [];

	return {
		id: String(doc._id ?? doc.id ?? ""),
		title: text(doc.title) || text(doc.name),
		slug: slugOf(doc.slug),
		show: showDoc
			? {
					id: String(showDoc._id ?? ""),
					title: text(showDoc.title),
					slug: slugOf(showDoc.slug),
				}
			: null,
		artists: persons
			.map((person) => {
				const row = (person ?? {}) as Record<string, unknown>;
				return {
					name: text(row.title) || text(row.name),
					slug: slugOf(row.slug),
					poolVisibility: row.poolVisibility === true,
				};
			})
			.filter((artist) => artist.name),
		cover,
		soundcloudUrl: track
			? text(track.permalink_url) ||
				(track.id ? `https://api.soundcloud.com/tracks/${track.id}` : null)
			: null,
		durationMs: Number(track?.duration) || null,
	};
}
