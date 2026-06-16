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

/** Minimal current track shape for SoundCloud / repro */
export interface CurrentTrack {
	link?: string;
	name?: string;
	[key: string]: unknown;
}

export const useMainStore = defineStore("mainStore", () => {
	// state als refs
	const siteCookieBanner = ref<Record<string, unknown>>({});
	const siteNav = ref<Record<string, unknown>>({});
	const siteSettings = ref<Record<string, unknown>>({});
	const siteFallbacks = ref<SiteFallbacks | Record<string, unknown>>({});
	const link = ref("");
	const titel = ref("");
	const currentTrack = ref<CurrentTrack | null>(null);
	const active = ref(false);
	const isPlayerPlaying = ref(false);
	const isPlayerVisible = ref(true);
	const activeScheduleLocation = ref("channelOne");
	const activeStreamingChannel = ref("channelOne");
	const currentHeroContentType = ref("");
	const isDarkMode = ref<boolean | undefined>(undefined);
	const menuOpen = ref(false);

	// actions als Funktionen
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

	function setPlayerStatus(isPlaying: boolean) {
		isPlayerPlaying.value = isPlaying;
	}

	function togglePlayerVisibility() {
		isPlayerVisible.value = !isPlayerVisible.value;
	}

	function resetSoundCloudPlayer() {
		currentTrack.value = null;
	}

	function setActiveScheduleLocation(location: string) {
		activeScheduleLocation.value = location;
	}

	function toggleMenu() {
		menuOpen.value = !menuOpen.value;
	}

	function setActiveStreamingChannel(channel: string) {
		activeStreamingChannel.value = channel;
	}

	function setCurrentHeroContentType(type: string) {
		currentHeroContentType.value = type;
	}

	function detectSystemDarkMode() {
		// Prüfen ob im Browser-Kontext
		if (import.meta.client) {
			// MediaQueryList-Objekt erstellen, um Systemeinstellung zu prüfen
			const darkModeMediaQuery = window.matchMedia(
				"(prefers-color-scheme: dark)",
			);

			// isDarkMode anhand des System-Darkmode setzen
			isDarkMode.value = darkModeMediaQuery.matches;

			// Farben aktualisieren
			updateColors();

			// Auf Änderungen reagieren
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
			document
				?.querySelector(".header .logo")
				?.style.setProperty("filter", "invert(1)");
			document
				?.querySelector(".header .text-logo")
				?.style.setProperty("filter", "invert(1)");
		} else {
			document.documentElement.style.setProperty("--color-bg", "#fff");
			document.documentElement.style.setProperty("--color-text", "#000");
			document
				?.querySelector(".header .logo")
				?.style.setProperty("filter", "invert(0)");
			document
				?.querySelector(".header .text-logo")
				?.style.setProperty("filter", "invert(0)");
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
		currentTrack,
		link,
		titel,
		active,
		isPlayerPlaying,
		isPlayerVisible,
		activeScheduleLocation,
		activeStreamingChannel,
		currentHeroContentType, // Neue Variable exportieren
		menuOpen,
		isDarkMode,
		detectSystemDarkMode,
		nuxtServerInit,
		addToRepro,
		setPlayerStatus,
		togglePlayerVisibility,
		resetSoundCloudPlayer,
		setActiveScheduleLocation,
		setCurrentHeroContentType, // Neue Funktion exportieren
		updateColors,
		toggleDarkMode,
		toggleMenu,
		setActiveStreamingChannel,
	};
});
