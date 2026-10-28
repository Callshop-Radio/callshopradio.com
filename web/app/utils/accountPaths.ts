/**
 * Login redirects must stay on this site. A path like `//evil.example` or
 * `https://evil.example` would otherwise turn the login page into an open
 * redirect.
 */
export function safeNextPath(raw: unknown, fallback = "/konto"): string {
	const value = Array.isArray(raw) ? raw[0] : raw;
	if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
	if (!value.startsWith("/")) return fallback;
	if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
	if (value.includes("://") || value.includes("\n") || value.includes("\r")) return fallback;
	return value;
}
