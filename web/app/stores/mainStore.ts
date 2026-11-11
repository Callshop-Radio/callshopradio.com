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
	const menuOpen = ref(false);

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

	function toggleMenu() {
		menuOpen.value = !menuOpen.value;
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
			updateColors();

			// React to changes
			darkModeMediaQuery.addEventListener("change", (e) => {
				isDarkMode.value = e.matches;
				updateColors();
			});
		}
	}

	function updateColors() {
		if (isDarkMode.value) {
			document.documentElement.style.setProperty("--color-bg", "#000");
			document.documentElement.style.setProperty("--color-text", "#fff");
			document.documentElement.style.setProperty(
				"--color-dark-grey",
				"#878787",
			);
			document.documentElement.style.setProperty("--logo-invert", "1");
		} else {
			document.documentElement.style.setProperty("--color-bg", "#fff");
			document.documentElement.style.setProperty("--color-text", "#000");
			document.documentElement.style.setProperty(
				"--color-dark-grey",
				"#525252",
			);
			document.documentElement.style.setProperty("--logo-invert", "0");
		}
	}

	function toggleDarkMode() {
		isDarkMode.value = !isDarkMode.value;
		updateColors();
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
		menuOpen,
		isDarkMode,
		detectSystemDarkMode,
		nuxtServerInit,
		addToRepro,
		setActiveScheduleLocation,
		setCurrentHeroContentType, // Export new function
		updateColors,
		toggleDarkMode,
		toggleMenu,
	};
});
