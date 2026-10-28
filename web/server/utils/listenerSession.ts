export const LISTENER_COOKIE = "callshop_listener";

const TOKEN_SHAPE = /^lst_[A-Za-z0-9_-]{43}$/;

export function tokenFromCookieHeader(
	cookieHeader: string | undefined,
): string | null {
	if (!cookieHeader) return null;
	for (const part of cookieHeader.split(";")) {
		const index = part.indexOf("=");
		if (index === -1) continue;
		if (part.slice(0, index).trim() !== LISTENER_COOKIE) continue;
		const value = decodeURIComponent(part.slice(index + 1).trim());
		return TOKEN_SHAPE.test(value) ? value : null;
	}
	return null;
}

/** Host-only, HttpOnly, Secure, Lax. maxAge follows the manager's expiry. */
export function sessionCookieOptions(expiresAt: Date, now = Date.now()) {
	const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000));
	return {
		httpOnly: true,
		secure: true,
		sameSite: "lax" as const,
		path: "/",
		maxAge,
	};
}

/**
 * SSR responses must carry the manager's renewal cookie explicitly: the nested
 * fetch does not merge its Set-Cookie into the outer document response.
 */
export function copySetCookies(
	headers: Headers,
	append: (value: string) => void,
): number {
	const values =
		typeof (headers as { getSetCookie?: () => string[] }).getSetCookie ===
		"function"
			? (headers as { getSetCookie: () => string[] }).getSetCookie()
			: [];
	let copied = 0;
	for (const value of values) {
		if (
			value.includes(`${LISTENER_COOKIE}=`) ||
			value.startsWith("callshop_listener=")
		) {
			append(value);
			copied += 1;
		}
	}
	return copied;
}
