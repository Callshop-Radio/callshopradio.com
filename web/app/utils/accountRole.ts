export const ACCOUNT_ROLES = [
	"listener",
	"artist",
	"host",
	"editor",
	"studio",
	"admin",
] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

const LABELS: Record<AccountRole, { de: string; en: string }> = {
	listener: { de: "Hörer", en: "Listener" },
	artist: { de: "Artist", en: "Artist" },
	host: { de: "Host", en: "Host" },
	editor: { de: "Editor", en: "Editor" },
	studio: { de: "Studio", en: "Studio" },
	admin: { de: "Admin", en: "Admin" },
};

export function isAccountRole(value: unknown): value is AccountRole {
	return (
		typeof value === "string" &&
		(ACCOUNT_ROLES as readonly string[]).includes(value)
	);
}

/**
 * The role on the website is a read-only badge. It never unlocks a website
 * feature and it never makes the account a staff login.
 */
export function roleLabel(role: unknown, locale: string): string {
	if (!isAccountRole(role)) return "";
	return LABELS[role][locale === "de" ? "de" : "en"];
}

export function isStaffRole(role: unknown): boolean {
	return isAccountRole(role) && role !== "listener";
}
