export default defineNuxtRouteMiddleware(async (to) => {
	const account = useAccountStore();
	if (account.sessionState === "unknown") await account.loadSession();
	if (account.sessionState !== "authenticated") {
		return navigateTo(
			useLocalePath()({ path: "/konto/anmelden", query: { next: to.fullPath } }),
		);
	}
});
