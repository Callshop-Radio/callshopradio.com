export type SanitySlug = string | { current?: string } | null | undefined;

/** Read `slug.current` or a plain string slug. */
export const getSlugCurrent = (slug?: SanitySlug): string | undefined => {
	if (!slug) return undefined;
	if (typeof slug === "string") return slug || undefined;
	return slug.current || undefined;
};
