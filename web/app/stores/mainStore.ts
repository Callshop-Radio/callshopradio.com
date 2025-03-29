import { defineStore } from "pinia";
import { ref } from "vue";
import { SITE_OPTIONS_QUERY } from "~~/queries/sanity.queries";

export const useMainStore = defineStore("mainStore", () => {
  // state als refs
  const siteCookieBanner = ref({});
  const siteNav = ref({});
  const siteSettings = ref({});
  const siteFallbacks = ref({});
  const link = ref("");
  const titel = ref("");
  const currentTrack = ref(null);
  const active = ref(false);
  const isPlayerPlaying = ref(false);
  const isPlayerVisible = ref(true);
  const activeScheduleLocation = ref("channelOne");
  const activeStreamingChannel = ref("channelOne");
  const currentHeroContentType = ref(""); // Neue Variable für den aktuellen Content-Typ im Hero
  const isDarkMode = ref();
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

  function addToRepro(payload) {
    link.value = payload.link;
    titel.value = payload.name;
    active.value = payload.active;
  }

  function setPlayerStatus(isPlaying) {
    isPlayerPlaying.value = isPlaying;
  }

  function togglePlayerVisibility() {
    isPlayerVisible.value = !isPlayerVisible.value;
  }

  function resetSoundCloudPlayer() {
    currentTrack.value = null;
  }

  function setActiveScheduleLocation(location) {
    activeScheduleLocation.value = location;
  }

  function toggleMenu() {
    menuOpen.value = !menuOpen.value;
  }

  function setActiveStreamingChannel(channel) {
    activeStreamingChannel.value = channel;
  }

  // Neue Funktion zum Setzen des aktuellen Hero Content Types
  function setCurrentHeroContentType(type) {
    currentHeroContentType.value = type;
  }

  function detectSystemDarkMode() {
    // Prüfen ob im Browser-Kontext
    if (process.client) {
      // MediaQueryList-Objekt erstellen, um Systemeinstellung zu prüfen
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
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
