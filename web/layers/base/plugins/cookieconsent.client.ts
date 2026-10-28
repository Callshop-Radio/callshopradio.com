// @ts-nocheck
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { useMainStore } from "~/stores/mainStore";

export default defineNuxtPlugin(async () => {
	const mainStore = useMainStore();
	const { siteCookieBanner: cookieSettings } = mainStore;
	const route = useRoute();
	const nuxtApp = useNuxtApp();

	// nuxt-gtag v4 renamed grantConsent → enableAnalytics, revokeConsent → disableAnalytics.
	// `initialize()` is required because gtag runs in manual mode: the script is
	// not loaded until the user grants the "analytics" category.
	const { gtag, initialize, enableAnalytics, disableAnalytics } = useGtag();
	const { setAnalyticsConsent } = useAnalyticsConsent();

	const CONSENT_DENIED = {
		analytics_storage: "denied",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	};
	const CONSENT_GRANTED = {
		...CONSENT_DENIED,
		analytics_storage: "granted",
	};

	// Queue the Consent Mode default exactly once, before gtag.js can load.
	// Keeping this here (instead of gtag.initCommands) guarantees the denied
	// default is never queued after a granted update, regardless of plugin order.
	let consentDefaultQueued = false;
	let consentDefaultPending = false;

	function queueConsentDefault() {
		if (consentDefaultQueued || typeof window === "undefined") return;
		consentDefaultQueued = true;
		if (window.dataLayer) {
			gtag("consent", "default", CONSENT_DENIED);
			return;
		}
		// nuxt-gtag has not created its dataLayer yet. Remember the command and
		// push it after initialize() has queued js/config, so it is never lost.
		consentDefaultPending = true;
	}

	function flushConsentDefault() {
		if (!consentDefaultPending) return;
		window.dataLayer = window.dataLayer || [];
		consentDefaultPending = false;
		gtag("consent", "default", CONSENT_DENIED);
	}

	queueConsentDefault();

	let lastPageView = "";
	let lastConsentState = null;

	function clearGoogleAnalyticsCookies() {
		if (typeof document === "undefined") return;
		for (const entry of document.cookie.split(";")) {
			const name = entry.split("=")[0]?.trim();
			if (!name || !/^_ga/.test(name)) continue;
			// biome-ignore lint/suspicious/noDocumentCookie: legacy GA cookies must be expired synchronously; the Cookie Store API is not available in every supported browser
			document.cookie = `${name}=; Max-Age=0; path=/`;
			// biome-ignore lint/suspicious/noDocumentCookie: same as above
			document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
			// biome-ignore lint/suspicious/noDocumentCookie: same as above
			document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}`;
		}
	}

	function trackPageView() {
		if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
		const path = `${window.location.pathname}${window.location.search}`;
		if (path === lastPageView) return;
		lastPageView = path;
		gtag("event", "page_view", {
			page_location: window.location.href,
			page_title: document.title,
			page_path: path,
		});
	}

	// Nuxt updates document.title via useHead slightly after page:finish. Wait
	// for the new title (max ~400 ms) so the page_view is not labelled with the
	// previous page's title.
	function schedulePageView(waitForTitle = false) {
		if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
		const path = `${window.location.pathname}${window.location.search}`;
		const initialTitle = document.title;
		let attempts = 0;

		const sendWhenReady = () => {
			if (!hasAnalyticsConsent()) return;
			if (`${window.location.pathname}${window.location.search}` !== path)
				return;
			attempts += 1;
			if (!waitForTitle || document.title !== initialTitle || attempts >= 8) {
				trackPageView();
				return;
			}
			setTimeout(sendWhenReady, 50);
		};

		setTimeout(sendWhenReady, 0);
	}

	function applyAnalyticsConsent(cookie) {
		const granted = Boolean(cookie?.categories?.includes("analytics"));
		const changed = lastConsentState !== granted;
		lastConsentState = granted;
		setAnalyticsConsent(granted);

		if (granted) {
			// Order matters: initialize() queues js/config (with
			// send_page_view: false), then the denied default and the granted
			// update are queued before the explicit page_view.
			initialize();
			flushConsentDefault();
			if (changed) {
				gtag("consent", "update", CONSENT_GRANTED);
				enableAnalytics();
			}
			schedulePageView();
			return;
		}

		flushConsentDefault();
		if (changed) {
			gtag("consent", "update", CONSENT_DENIED);
			disableAnalytics();
			clearGoogleAnalyticsCookies();
		}
		lastPageView = "";
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

	// GA4's automatic page_view is disabled (send_page_view: false), so SPA
	// navigations are sent explicitly. The path check above dedupes the initial
	// page view when both onConsent and the router hook fire.
	nuxtApp.hook("page:finish", () => {
		if (!hasAnalyticsConsent()) return;
		schedulePageView(true);
	});

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
						"Mit deiner Einwilligung nutzen wir Google Analytics 4 (Google Ireland Limited) und Umami (eigener Server), um Seitenaufrufe und Interaktionen wie Wiedergaben, Suchen und Filter zu messen. Vor deiner Einwilligung werden keine Analysedaten erhoben. Du kannst die Einwilligung jederzeit widerrufen.",
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
						"With your consent, we use Google Analytics 4 (Google Ireland Limited) and Umami (our own server) to measure page views and interactions such as plays, searches and filters. No analytics data is collected before you consent. You can withdraw your consent at any time.",
					linkedCategory: "analytics",
				},
			];

	let sections = fallbackSections;
	try {
		const parsed = JSON.parse(
			cookieSettings?.preferencesModal?.sections?.code ?? '{ "sections": [] }',
		);
		if (Array.isArray(parsed?.sections) && parsed.sections.length > 0) {
			sections = parsed.sections;
		}
	} catch {
		// Keep the fallback when the CMS JSON is malformed.
	}

	const cmsConsentDescription =
		cookieSettings?.consentModal?.description?.trim() ?? "";
	const consentDescription =
		cmsConsentDescription.length > 60
			? cmsConsentDescription
			: isGerman
				? "Wir verwenden technisch notwendige Cookies für den Betrieb der Website. Mit deiner Einwilligung nutzen wir außerdem Google Analytics 4 und Umami, um die Nutzung der Website und unserer Sendungen zu verstehen. Du kannst deine Auswahl jederzeit ändern oder widerrufen."
				: "We use technically necessary cookies to operate this website. With your consent, we also use Google Analytics 4 and Umami to understand how the site and our shows are used. You can change or withdraw your choice at any time.";

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

	if (sections !== fallbackSections) {
		// CMS sections are English-only; use them for the English modal.
		translations.en.preferencesModal.sections = sections;
	}

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
