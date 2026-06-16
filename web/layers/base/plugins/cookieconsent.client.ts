// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { useMainStore } from "~/stores/mainStore";

export default defineNuxtPlugin(async () => {
	const mainStore = useMainStore();
	const { siteCookieBanner: cookieSettings } = mainStore;
	if (!cookieSettings?.useCookieBanner) {
		return;
	}

	const { sections } = JSON.parse(
		cookieSettings?.preferencesModal?.sections?.code ?? '{ "sections": [] }',
	);
	// nuxt-gtag v4 renamed grantConsent → enableAnalytics, revokeConsent → disableAnalytics
	const { enableAnalytics, disableAnalytics } = useGtag();

	function toggleGtag(cookie) {
		const hasGoogleConsent = cookie?.categories?.includes("analytics");
		if (hasGoogleConsent) enableAnalytics();
		else disableAnalytics();
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
			toggleGtag(cookie);
		},

		onConsent: ({ cookie }) => {
			toggleGtag(cookie);
		},

		onChange: ({ cookie }) => {
			toggleGtag(cookie);
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
			default: "en",

			translations: {
				en: {
					consentModal: cookieSettings?.consentModal,
					preferencesModal: {
						title: cookieSettings?.preferencesModal?.title,
						acceptAllBtn: cookieSettings?.preferencesModal?.acceptAllBtn,
						acceptNecessaryBtn:
							cookieSettings?.preferencesModal?.acceptNecessaryBtn,
						savePreferencesBtn:
							cookieSettings?.preferencesModal?.savePreferencesBtn,
						sections: sections,
					},
				},
			},
		},
	};

	await CookieConsent.run(config);

	return {
		provide: {
			CC: CookieConsent,
		},
	};
});
