/**
 * URL-safe slug for a tag title. Tags have no dedicated slug field in Sanity
 * yet, so genre links use a readable, transliterated form of the title
 * (e.g. "UK Garage" -> "uk-garage").
 */
export function tagSlug(value: string): string {
	return String(value || "")
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/ß/g, "ss")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
