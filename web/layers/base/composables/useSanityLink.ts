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

/** Map Sanity `route` + slugs to a site path (without locale prefix). */
export const resolveSanityInternalPath = ({
	route = "index",
	slug,
	parentSlug,
	setSlug,
}: SanityInternalLink): string => {
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
			const showSlug = parentSlug ?? slug;
			const episodeSlug = setSlug ?? slug;
			if (showSlug && episodeSlug && showSlug !== episodeSlug) {
				return `/shows/${showSlug}/${episodeSlug}`;
			}
			if (showSlug) return `/shows/${showSlug}`;
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

	const localizedSanityPath = (link: SanityInternalLink): string =>
		localePath(resolveSanityInternalPath(link));

	return {
		localizedSanityPath,
		resolveSanityInternalPath,
	};
};
