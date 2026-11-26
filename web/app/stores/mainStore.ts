import { defineStore } from "pinia";
import { ref } from "vue";
import { SITE_OPTIONS_QUERY } from "~~/queries/sanity.queries";
import type { SiteFallbacks } from "~~/types/sanity";

/** Payload for addToRepro (repro list / current track info) */
export interface AddToReproPayload {
	link: string;
	name: string;
	active: boolean;
}

export const useMainStore = defineStore("mainStore", () => {
	// state as refs
	const siteCookieBanner = ref<Record<string, unknown>>({});
	const siteNav = ref<Record<string, unknown>>({});
	const siteSettings = ref<Record<string, unknown>>({});
	const siteFallbacks = ref<SiteFallbacks | Record<string, unknown>>({});
	const link = ref("");
	const titel = ref("");
	const active = ref(false);
	const activeScheduleLocation = ref("channelOne");
	const currentHeroContentType = ref("");
	const isDarkMode = ref<boolean | undefined>(undefined);

	// actions as functions
	async function nuxtServerInit() {
		const sanity = useSanity();
		const query = groq`${SITE_OPTIONS_QUERY}`;
		const data = await sanity.fetch(query);

		siteCookieBanner.value = data?.siteCookieBanner;
		siteNav.value = data?.siteNav;
		siteSettings.value = data?.siteSettings;
		siteFallbacks.value = data?.siteFallbacks;
	}

	function addToRepro(payload: AddToReproPayload) {
		link.value = payload.link;
		titel.value = payload.name;
		active.value = payload.active;
	}

	function setActiveScheduleLocation(location: string) {
		activeScheduleLocation.value = location;
	}

	function setCurrentHeroContentType(type: string) {
		currentHeroContentType.value = type;
	}

	function detectSystemDarkMode() {
		// Check whether in browser context
		if (import.meta.client) {
			// Create MediaQueryList object to check the system setting
			const darkModeMediaQuery = window.matchMedia(
				"(prefers-color-scheme: dark)",
			);

			// Set isDarkMode based on the system dark mode
			isDarkMode.value = darkModeMediaQuery.matches;

			// Update colors
			applyTheme();

			// React to changes
			darkModeMediaQuery.addEventListener("change", (e) => {
				isDarkMode.value = e.matches;
				applyTheme();
			});
		}
	}

	function applyTheme() {
		/* The palette lives in CSS: every colour token is a light-dark() pair and
		   color-scheme decides which value applies. The store only pins the scheme
		   on <html>; it never writes a colour. */
		document.documentElement.dataset.theme = isDarkMode.value
			? "dark"
			: "light";
	}

	function toggleDarkMode() {
		isDarkMode.value = !isDarkMode.value;
		applyTheme();
	}

	return {
		siteCookieBanner,
		siteNav,
		siteSettings,
		siteFallbacks,
		link,
		titel,
		active,
		activeScheduleLocation,
		currentHeroContentType, // Export new variable
		isDarkMode,
		detectSystemDarkMode,
		nuxtServerInit,
		addToRepro,
		setActiveScheduleLocation,
		setCurrentHeroContentType, // Export new function
		applyTheme,
		toggleDarkMode,
	};
});
