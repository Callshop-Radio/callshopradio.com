export type SanityInternalRoute =
	| "index"
	| "slug"
	| "shows"
	| "shows-slug"
	| "shows-slug-set"
	| "set-slug"
	| "words"
	| "words-slug"
	| "pool"
	| "pool-slug"
	| "schedule"
	| string;

export type SanityInternalLink = {
	route?: SanityInternalRoute;
	slug?: string;
	parentSlug?: string;
	setSlug?: string;
};

export type SanitySlug = string | { current?: string } | null | undefined;

export type SanityLinkInput = {
	type?: string;
	href?: string;
	url?: string;
	route?: SanityInternalRoute;
	slug?: SanitySlug;
	parentSlug?: string;
	setSlug?: string;
	refType?: string;
	reference?: {
		_type?: string;
		_ref?: string;
		slug?: { current?: string };
	};
};

const ROUTE_BY_REF_TYPE: Record<string, SanityInternalRoute> = {
	home: "index",
	page: "slug",
	showsArchive: "shows",
	show: "shows-slug",
	set: "set-slug",
	words: "words",
	article: "words-slug",
	pool: "pool",
	person: "pool-slug",
	venue: "pool-slug",
	timetable: "schedule",
};

/** Read `slug.current` or a plain string slug. */
export const getSlugCurrent = (slug?: SanitySlug): string | undefined => {
	if (!slug) return undefined;
	if (typeof slug === "string") return slug || undefined;
	return slug.current || undefined;
};

/** Normalize Sanity link objects (menu items, portable-text markDefs). */
export const normalizeSanityInternalLink = (
	link: SanityLinkInput,
): Required<Pick<SanityInternalLink, "route">> & SanityInternalLink => {
	const refType =
		link.refType ||
		(link.reference?._type && link.reference._type !== "reference"
			? link.reference._type
			: undefined);

	let route = link.route || (refType ? ROUTE_BY_REF_TYPE[refType] : undefined);
	const slug =
		getSlugCurrent(link.slug) ||
		getSlugCurrent(link.reference?.slug) ||
		undefined;

	const parentSlug = link.parentSlug || undefined;
	let setSlug = link.setSlug || undefined;

	if (route === "set-slug" || refType === "set") {
		route = "set-slug";
		setSlug = setSlug || slug;
		return {
			route,
			slug: undefined,
			parentSlug,
			setSlug,
		};
	}

	return {
		route: route || "index",
		slug,
		parentSlug,
		setSlug,
	};
};

/** Map Sanity `route` + slugs to a site path (without locale prefix). */
export const resolveSanityInternalPath = (link: SanityLinkInput): string => {
	const {
		route = "index",
		slug,
		parentSlug,
		setSlug,
	} = normalizeSanityInternalLink(link);

	switch (route) {
		case "index":
			return "/";
		case "slug":
			return slug ? `/${slug}` : "/";
		case "shows":
			return "/shows";
		case "shows-slug":
			return slug ? `/shows/${slug}` : "/shows";
		case "set-slug":
		case "shows-slug-set": {
			const showSlug = parentSlug;
			const episodeSlug = setSlug || slug;
			if (showSlug && episodeSlug) {
				return `/shows/${showSlug}/${episodeSlug}`;
			}
			if (episodeSlug) return `/shows/${episodeSlug}`;
			return "/shows";
		}
		case "words":
			return "/words";
		case "words-slug":
			return slug ? `/words/${slug}` : "/words";
		case "pool":
			return "/pool";
		case "pool-slug":
			return slug ? `/pool/${slug}` : "/pool";
		case "schedule":
			return "/schedule";
		default:
			return "/";
	}
};

export const useSanityLink = () => {
	const localePath = useLocalePath();

	const localizedSanityPath = (link: SanityLinkInput): string =>
		localePath(resolveSanityInternalPath(link));

	return {
		localizedSanityPath,
		normalizeSanityInternalLink,
		resolveSanityInternalPath,
		getSlugCurrent,
	};
};
