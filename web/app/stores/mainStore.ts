import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SITE_OPTIONS_QUERY, FALLBACK_QUERY } from '~~/queries/sanity.queries'

export const useMainStore = defineStore('mainStore', () => {
  // state als refs
  const siteCookieBanner = ref({})
  const siteNav = ref({})
  const siteSettings = ref({})
  const siteFallbacks = ref({})
  const link = ref('')
  const titel = ref('')
  const active = ref(false)

  // actions als Funktionen
  async function nuxtServerInit() {
    const sanity = useSanity()
    const query = groq`${SITE_OPTIONS_QUERY}`
    const data = await sanity.fetch(query)
    
    siteCookieBanner.value = data?.siteCookieBanner
    siteNav.value = data?.siteNav
    siteSettings.value = data?.siteSettings
    siteFallbacks.value = data?.siteFallbacks
    console.log(siteFallbacks.value);
    
  }

  function addToRepro(payload) {
    link.value = payload.link
    titel.value = payload.name
    active.value = payload.active
  }

  // Expose everything
  return {
    siteCookieBanner,
    siteNav,
    siteSettings,
    siteFallbacks,
    link,
    titel,
    active,
    nuxtServerInit,
    addToRepro
  }
})