// @ts-nocheck
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { useMainStore } from "~/stores/mainStore";

export default defineNuxtPlugin(async () => {
	const mainStore = useMainStore();
	const { siteCookieBanner: cookieSettings } = mainStore;
	const route = useRoute();
	const { setAnalyticsConsent } = useAnalyticsConsent();

	// The only analytics provider is the self-hosted Umami instance, loaded by
	// umami.client.ts. This plugin owns the consent flag it reads.
	function applyAnalyticsConsent(cookie) {
		setAnalyticsConsent(Boolean(cookie?.categories?.includes("analytics")));
	}

	// Honor an existing consent cookie even when the CMS banner settings are not
	// in the payload. Client-rendered routes such as /search (ssr: false) do not
	// run nuxtServerInit, so `siteCookieBanner` is empty there. Reading the
	// library's own cookie directly keeps the analytics state correct on a hard
	// reload even when CookieConsent.run() never runs on that page.
	function readConsentCookie() {
		try {
			const match = document.cookie.match(/(?:^|;\s*)cc_cookie=([^;]+)/);
			if (!match) return null;
			return JSON.parse(decodeURIComponent(match[1]));
		} catch {
			return null;
		}
	}

	const existingConsent = readConsentCookie();
	if (existingConsent) applyAnalyticsConsent(existingConsent);

	if (!cookieSettings?.useCookieBanner) {
		return;
	}

	const isGerman = route.path === "/de" || route.path.startsWith("/de/");

	const fallbackSections = isGerman
		? [
				{
					title: "Technisch notwendig",
					description:
						"Diese Cookies sind für den Betrieb der Website erforderlich (z. B. zum Speichern deiner Cookie-Auswahl). Sie können nicht deaktiviert werden.",
					linkedCategory: "necessary",
				},
				{
					title: "Analyse",
					description:
						"Mit deiner Einwilligung nutzen wir Umami (unser eigener Server), um Seitenaufrufe und Interaktionen wie Wiedergaben, Suchen und Filter zu messen. Vor deiner Einwilligung werden keine Analysedaten erhoben. Du kannst die Einwilligung jederzeit widerrufen.",
					linkedCategory: "analytics",
				},
			]
		: [
				{
					title: "Strictly necessary",
					description:
						"These cookies are required for the website to function (e.g. remembering your cookie choice). They cannot be disabled.",
					linkedCategory: "necessary",
				},
				{
					title: "Analytics",
					description:
						"With your consent, we use Umami (our own server) to measure page views and interactions such as plays, searches and filters. No analytics data is collected before you consent. You can withdraw your consent at any time.",
					linkedCategory: "analytics",
				},
			];

	// The CMS preference copy still described Google Analytics. It is not used:
	// the fallback sections above are the single source for the modal text.

	// The CMS consent copy still named Google Analytics; the Umami-only text
	// below is the single source for the modal description.
	const consentDescription = isGerman
		? "Wir verwenden technisch notwendige Cookies für den Betrieb der Website. Mit deiner Einwilligung nutzen wir außerdem Umami, um die Nutzung der Website und unserer Sendungen zu verstehen. Du kannst deine Auswahl jederzeit ändern oder widerrufen."
		: "We use technically necessary cookies to operate this website. With your consent, we also use Umami to understand how the site and our shows are used. You can change or withdraw your choice at any time.";

	const translations = {
		en: {
			consentModal: {
				title: "Cookies and analytics",
				description: consentDescription,
				acceptAllBtn:
					cookieSettings?.consentModal?.acceptAllBtn || "Accept all",
				acceptNecessaryBtn:
					cookieSettings?.consentModal?.acceptNecessaryBtn ||
					"Accept necessary",
				showPreferencesBtn:
					cookieSettings?.consentModal?.showPreferencesBtn || "Preferences",
			},
			preferencesModal: {
				title: cookieSettings?.preferencesModal?.title || "Preferences",
				acceptAllBtn:
					cookieSettings?.preferencesModal?.acceptAllBtn || "Accept all",
				acceptNecessaryBtn:
					cookieSettings?.preferencesModal?.acceptNecessaryBtn ||
					"Accept necessary",
				savePreferencesBtn:
					cookieSettings?.preferencesModal?.savePreferencesBtn ||
					"Save preferences",
				sections: fallbackSections,
			},
		},
		de: {
			consentModal: {
				title: "Cookies und Analyse",
				description: consentDescription,
				acceptAllBtn: "Alle akzeptieren",
				acceptNecessaryBtn: "Nur notwendige",
				showPreferencesBtn: "Einstellungen",
			},
			preferencesModal: {
				title: "Einstellungen",
				acceptAllBtn: "Alle akzeptieren",
				acceptNecessaryBtn: "Nur notwendige",
				savePreferencesBtn: "Auswahl speichern",
				sections: fallbackSections,
			},
		},
	};

	const config = {
		// https://cookieconsent.orestbida.com/reference/configuration-reference.html#guioptions
		guiOptions: {
			consentModal: {
				layout: "box",
				position: "bottom right",
			},
			preferencesModal: {
				layout: "box",
			},
		},

		onFirstConsent: ({ cookie }) => {
			applyAnalyticsConsent(cookie);
		},

		onConsent: ({ cookie }) => {
			applyAnalyticsConsent(cookie);
		},

		onChange: ({ cookie }) => {
			applyAnalyticsConsent(cookie);
		},

		categories: {
			necessary: {
				readOnly: true,
				enabled: true,
			},
			analytics: {
				// Umami sets no cookies of its own. Older visitors may still carry
				// Google Analytics cookies from before the switch; clear them.
				autoClear: {
					cookies: [
						{
							name: /^(_ga|_gid)/,
						},
					],
				},
			},
		},

		language: {
			default: isGerman ? "de" : "en",
			translations,
		},
	};

	await CookieConsent.run(config);

	return {
		provide: {
			CC: CookieConsent,
		},
	};
});
