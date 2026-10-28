export const INVITE_TOKEN_PATTERN = /^inv_[A-Za-z0-9_-]{43}$/;
export const MIN_INVITE_PASSWORD = 12;

export type InviteStep =
	| "checking"
	| "invalid"
	| "password"
	| "twofactor"
	| "done"
	| "error";

/** The token is in the path, never in a query string or a fragment. */
export function inviteTokenFromRoute(param: unknown): string | null {
	const value = Array.isArray(param) ? param[0] : param;
	if (typeof value !== "string") return null;
	const token = value.trim();
	return INVITE_TOKEN_PATTERN.test(token) ? token : null;
}

/**
 * Password policy for the invitation: length 12, nothing else. The manager
 * enforces the same rule, so a client cannot weaken it.
 */
export function passwordProblem(value: unknown): string | null {
	const password = String(value ?? "");
	if (password.length < MIN_INVITE_PASSWORD) return "short";
	if (password.length > 200) return "long";
	return null;
}

/** Small, explicit state machine so the page cannot skip a step. */
export function inviteStep({
	checked = false,
	invalid = false,
	accepted = false,
	confirmed = false,
	failed = false,
}: {
	checked?: boolean;
	invalid?: boolean;
	accepted?: boolean;
	confirmed?: boolean;
	failed?: boolean;
}): InviteStep {
	if (invalid) return "invalid";
	if (failed) return "error";
	if (!checked) return "checking";
	if (confirmed) return "done";
	if (accepted) return "twofactor";
	return "password";
}

/** `[[code]]` groups are what an authenticator app accepts; keep it simple. */
export function normalizeTotpCode(value: unknown): string {
	return String(value ?? "").replace(/\s+/g, "");
}

export function isTotpCode(value: unknown): boolean {
	return /^\d{6}$/.test(normalizeTotpCode(value));
}
