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
			signInTitle: de ? "Anmelden" : "Sign in",
			signInIntro: de
				? "Anmelden oder registrieren. E-Mail eingeben und Login-Code erhalten."
				: "Sign in or sign up. Enter your email and receive a login code.",
			resend: de ? "Code erneut senden" : "Resend code",
			codeHint: de
				? "Wir schicken dir einen sechsstelligen Code per Mail."
				: "We'll email you a six-digit code.",
			codeSentFor: de ? "Code für" : "Code for",
			account: de ? "Konto" : "Account",
			lists: de ? "Listen" : "Lists",
			savedSets: de ? "Gemerkte Sets" : "Saved sets",
			profile: de ? "Profil" : "Profile",
			logout: de ? "Abmelden" : "Sign out",
			email: de ? "E-Mail" : "Email",
			sendCode: de ? "Code per Mail senden" : "Send code by email",
			code: de ? "Anmeldecode" : "Sign-in code",
			verify: de ? "Anmelden" : "Sign in",
			changeEmail: de ? "Andere E-Mail verwenden" : "Use another email",
			codeSent: de
				? "Wir haben einen sechsstelligen Code geschickt. Er ist zehn Minuten gültig."
				: "We sent a six-digit code. It is valid for ten minutes.",
			codeFailed: de
				? "Code ungültig oder abgelaufen."
				: "Code invalid or expired.",
			mailFailed: de
				? "Anmelde-Mails sind gerade nicht verfügbar. Bitte später erneut."
				: "Sign-in mail is unavailable right now. Please try again later.",
			privacyAccept: de ? "Ich akzeptiere die" : "I accept the",
			privacyLink: de ? "Datenschutzerklärung" : "privacy policy",
			privacyRequired: de
				? "Bitte bestätige zuerst die Datenschutzerklärung."
				: "Please accept the privacy policy first.",
			name: de ? "Name" : "Name",
			language: de ? "Sprache" : "Language",
			saveChanges: de ? "Speichern" : "Save",
			saved: de ? "Gespeichert." : "Saved.",
			avatar: de ? "Profilbild" : "Profile picture",
			uploadAvatar: de ? "Bild wählen" : "Choose image",
			removeAvatar: de ? "Bild entfernen" : "Remove picture",
			exportData: de ? "Meine Daten herunterladen" : "Download my data",
			deleteAccount: de ? "Konto löschen" : "Delete account",
			deleteConfirm: de
				? "Konto wirklich löschen? Listen und gemerkte Sets werden entfernt."
				: "Delete the account? Lists and saved sets will be removed.",
			newList: de ? "Neue Liste" : "New list",
			listName: de ? "Listenname" : "List name",
			create: de ? "Anlegen" : "Create",
			rename: de ? "Umbenennen" : "Rename",
			remove: de ? "Entfernen" : "Remove",
			delete: de ? "Löschen" : "Delete",
			emptyList: de
				? "Diese Liste ist noch leer."
				: "This list is still empty.",
			noLists: de ? "Noch keine eigenen Listen." : "No custom lists yet.",
			back: de ? "Zurück" : "Back",
			avatarType: de ? "Nur JPEG, PNG oder WebP." : "Only JPEG, PNG or WebP.",
			unavailable: de
				? "Kontodaten sind gerade nicht erreichbar."
				: "Account data is unavailable right now.",
			overview: de ? "Übersicht" : "Overview",
			manageLists: de ? "Listen verwalten" : "Manage lists",
			openLists: de ? "Meine Listen" : "My lists",
			nameTaken: de
				? "Diesen Listennamen gibt es schon."
				: "This list name already exists.",
			logoutFailed: de
				? "Lokal abgemeldet, aber der Server konnte die Sitzung nicht widerrufen."
				: "Signed out locally, but the server could not revoke the session.",
			addToList: de ? "Zu Liste hinzufügen" : "Add to list",
			add: de ? "Hinzufügen" : "Add",
			role: de ? "Rolle" : "Role",
			inviteTitle: de ? "Einladung" : "Invitation",
			inviteIntro: de
				? "Du wurdest in den Show Manager eingeladen. Setze zuerst ein Passwort."
				: "You have been invited to the Show Manager. Set a password first.",
			inviteChecking: de
				? "Einladung wird geprüft …"
				: "Checking the invitation …",
			inviteInvalid: de
				? "Diese Einladung ist ungültig, abgelaufen oder schon benutzt."
				: "This invitation is invalid, expired or already used.",
			invitePassword: de ? "Neues Passwort" : "New password",
			invitePasswordHint: de
				? "Mindestens 12 Zeichen. Es gibt keine weiteren Regeln."
				: "At least 12 characters. There are no further rules.",
			invitePasswordTooShort: de
				? "Das Passwort braucht mindestens 12 Zeichen."
				: "The password needs at least 12 characters.",
			inviteAccept: de ? "Passwort speichern" : "Save password",
			inviteTwoFactorTitle: de ? "Zwei-Faktor einrichten" : "Set up two-factor",
			inviteTwoFactorIntro: de
				? "Trage diesen Schlüssel in deiner Authenticator-App ein und bestätige den sechsstelligen Code."
				: "Add this key to your authenticator app and confirm the six-digit code.",
			inviteSecret: de ? "Schlüssel" : "Key",
			inviteOpenApp: de ? "In der App öffnen" : "Open in the app",
			inviteCode: de ? "Code aus der App" : "Code from the app",
			inviteConfirm: de ? "Bestätigen" : "Confirm",
			inviteCodeFailed: de
				? "Der Code stimmt nicht. Uhrzeit der App prüfen und erneut versuchen."
				: "The code is wrong. Check the app's clock and try again.",
			inviteDone: de ? "Zwei-Faktor ist aktiv" : "Two-factor is active",
			inviteDoneIntro: de
				? "Speichere die Wiederherstellungscodes. Sie werden nur einmal angezeigt."
				: "Save the recovery codes. They are shown only once.",
			inviteRecoveryCodes: de ? "Wiederherstellungscodes" : "Recovery codes",
			inviteManagerLogin: de
				? "Melde dich jetzt im Show Manager mit Passwort und Zwei-Faktor an."
				: "Now sign in to the Show Manager with your password and two-factor code.",
			inviteGoAccount: de ? "Zum Konto" : "Go to the account",
		};
	});
}
