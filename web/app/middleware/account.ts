export default defineNuxtRouteMiddleware(async (to) => {
	const account = useAccountStore();
	if (account.sessionState === "unknown") await account.loadSession();

	if (account.sessionState === "unavailable") {
		// An outage is not a logout: keep the visitor on an error page instead
		// of sending them through a login they do not need.
		throw createError({
			statusCode: 503,
			statusMessage: "Konto vorübergehend nicht erreichbar.",
		});
	}

	if (account.sessionState !== "authenticated") {
		return navigateTo(
			useLocalePath()({
				path: "/konto/anmelden",
				query: { next: to.fullPath },
			}),
		);
	}
});
