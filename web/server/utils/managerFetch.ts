const EXACT_ROUTES = new Set([
	"POST auth/request-code",
	"POST auth/verify",
	"POST auth/logout",
	"GET status",
	"GET me",
	"PATCH me",
	"DELETE me",
	"GET me/export",
	"GET me/avatar",
	"PUT me/avatar",
	"DELETE me/avatar",
	"GET me/saved",
	"GET me/saved-ids",
	"GET lists",
	"POST lists",
	"PATCH lists/order",
]);

const PATTERN_ROUTES: Array<{ pattern: RegExp; methods: string[] }> = [
	{ pattern: /^me\/saved\/[^/]+$/, methods: ["PUT", "DELETE"] },
	{ pattern: /^lists\/[^/]+$/, methods: ["GET", "PATCH", "DELETE"] },
	{ pattern: /^lists\/[^/]+\/items$/, methods: ["POST"] },
	{ pattern: /^lists\/[^/]+\/items\/[^/]+$/, methods: ["DELETE"] },
	{ pattern: /^lists\/[^/]+\/order$/, methods: ["PATCH"] },
];

/** Strips the BFF prefix and rejects traversal or empty segments. */
export function normalizeAccountPath(path: string): string {
	const prefix = "/api/account/";
	const withoutQuery = String(path ?? "").split("?")[0] ?? "";
	const rest = withoutQuery.startsWith(prefix)
		? withoutQuery.slice(prefix.length)
		: "";
	const trimmed = rest.replace(/\/+$/, "");
	if (trimmed.length === 0 || trimmed.startsWith("/")) return "";
	if (
		trimmed.includes("//") ||
		trimmed.split("/").some((part) => part === ".." || part === ".")
	) {
		return "";
	}
	return trimmed;
}

export function isAllowedAccountRoute(method: string, path: string): boolean {
	const verb = String(method ?? "").toUpperCase();
	const route = path.trim();
	if (route.length === 0) return false;
	if (EXACT_ROUTES.has(`${verb} ${route}`)) return true;
	return PATTERN_ROUTES.some(
		(entry) => entry.methods.includes(verb) && entry.pattern.test(route),
	);
}

/** Only these headers reach the manager; nothing from the browser is copied. */
export function upstreamHeaders({
	token,
	ipKey,
	clientSecret,
	contentType,
	accept,
}: {
	token?: string | null;
	ipKey?: string | null;
	clientSecret: string;
	contentType?: string;
	accept?: string;
}): Record<string, string> {
	const headers: Record<string, string> = {
		"x-listener-client": clientSecret,
		accept: accept && accept.startsWith("image/") ? accept : "application/json",
	};
	if (token) headers.authorization = `Bearer ${token}`;
	if (ipKey) headers["x-listener-ip-key"] = ipKey;
	if (contentType)
		headers["content-type"] = (contentType.split(";")[0] ?? "")
			.trim()
			.toLowerCase();
	return headers;
}

export function originAllowed(
	origin: string | undefined,
	allowed: string,
): boolean {
	if (!origin) return false;
	const list = String(allowed ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
	return list.includes(origin);
}
