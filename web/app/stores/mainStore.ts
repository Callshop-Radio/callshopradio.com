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
  const isPlayerPlaying = ref(false); // Neue Variable für den Abspielstatus
  const isPlayerVisible = ref(true); // Neue Variable für die Sichtbarkeit
  const activeScheduleLocation = ref("channelOne"); // Neue Variable für den aktiven Schedule-Standort
  const isDarkMode = ref(false);
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

  function updateColors() {
    if (isDarkMode.value) {
      document.documentElement.style.setProperty("--color-bg", "#000");
      document.documentElement.style.setProperty("--color-text", "#fff");
      document?.querySelector('.header .logo')?.style.setProperty("filter", "invert(1)");
      document?.querySelector('.header .text-logo')?.style.setProperty("filter", "invert(1)");
    } else {
      document.documentElement.style.setProperty("--color-bg", "#fff");
      document.documentElement.style.setProperty("--color-text", "#000");
      document?.querySelector('.header .logo')?.style.setProperty("filter", "invert(0)");
      document?.querySelector('.header .text-logo')?.style.setProperty("filter", "invert(0)");
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
    menuOpen,
    nuxtServerInit,
    addToRepro,
    setPlayerStatus,
    togglePlayerVisibility,
    resetSoundCloudPlayer,
    setActiveScheduleLocation,
    updateColors,
    toggleDarkMode,
    toggleMenu,
  };
});
