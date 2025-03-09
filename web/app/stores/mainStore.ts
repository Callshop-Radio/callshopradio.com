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

  // Expose everything
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
    nuxtServerInit,
    addToRepro,
    setPlayerStatus,
    togglePlayerVisibility,
  };
});
