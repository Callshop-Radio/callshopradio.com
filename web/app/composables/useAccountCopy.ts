export function useAccountCopy() {
	const { locale } = useI18n();
	return computed(() => {
		const de = locale.value === "de";
		return {
			save: de ? "Set merken" : "Save set",
			unsave: de ? "Nicht mehr merken" : "Remove from saved",
			unsaveEverywhere: de
				? "Dieses Set steckt in mehreren Listen. Aus allen entfernen?"
				: "This set is in more than one list. Remove it from all of them?",
			signIn: de ? "Anmelden" : "Sign in",
			signInToSave: de ? "Zum Merken anmelden" : "Sign in to save",
			account: de ? "Konto" : "Account",
			lists: de ? "Listen" : "Lists",
			savedSets: de ? "Gemerkte Sets" : "Saved sets",
			profile: de ? "Profil" : "Profile",
			logout: de ? "Abmelden" : "Sign out",
		};
	});
}
