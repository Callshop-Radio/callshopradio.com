export interface SetPlayable {
	id: string;
	title: string;
	slug: string | null;
	path: string | null;
	show: {
		id?: string;
		title?: string;
		slug?: string | null;
		path?: string | null;
	} | null;
	artists: {
		name: string;
		slug: string | null;
		poolVisibility: boolean;
		path?: string | null;
	}[];
	cover: string | null;
	soundcloudUrl: string | null;
	soundcloudId: string | null;
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
export function toSetPlayable(
	item: unknown,
	cover: string | null,
): SetPlayable {
	const doc = (item ?? {}) as Record<string, unknown>;
	const track = ((
		doc.soundcloud as { tracks?: Array<Record<string, unknown>> } | undefined
	)?.tracks ?? [])[0];
	const showDoc = (doc.parentShow ?? doc.show ?? null) as Record<
		string,
		unknown
	> | null;
	const persons = Array.isArray(doc.persons) ? doc.persons : [];
	const showSlug = slugOf(showDoc?.slug);
	const showPath =
		text(showDoc?.path) || (showSlug ? `/shows/${showSlug}` : null);
	const setSlug = slugOf(doc.slug);
	const setPath =
		text(doc.path) || (setSlug && showPath ? `${showPath}/${setSlug}` : null);

	return {
		id: String(doc._id ?? doc.id ?? ""),
		title: text(doc.title) || text(doc.name),
		slug: setSlug,
		path: setPath,
		show: showDoc
			? {
					id: String(showDoc._id ?? ""),
					title: text(showDoc.title),
					slug: showSlug,
					path: showPath,
				}
			: null,
		artists: persons
			.map((person) => {
				const row = (person ?? {}) as Record<string, unknown>;
				const slug = slugOf(row.slug);
				return {
					name: text(row.title) || text(row.name),
					slug,
					poolVisibility: row.poolVisibility === true,
					path: text(row.path) || (slug ? `/pool/${slug}` : null),
				};
			})
			.filter((artist) => artist.name),
		cover,
		soundcloudUrl: track
			? text(track.permalink_url) ||
				(track.id ? `https://api.soundcloud.com/tracks/${track.id}` : null)
			: null,
		soundcloudId:
			track && track.id !== null && track.id !== undefined
				? String(track.id)
				: null,
		durationMs: Number(track?.duration) || null,
	};
}
