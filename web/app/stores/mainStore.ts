/* eslint-disable sort-imports */
import { defineStore } from 'pinia'
import { SITE_OPTIONS_QUERY } from '~~/queries/sanity.queries'

export const useMainStore = defineStore({
	id: 'mainStore',
	state: () => ({
		siteCookieBanner: {},
		siteNav: {},
		siteSettings: {}
	}),
	actions: {
		async nuxtServerInit() {
			const sanity = useSanity()

			const query = groq`${SITE_OPTIONS_QUERY}`
			const data = await sanity.fetch(query)
			this.siteCookieBanner = data?.siteCookieBanner
			this.siteNav = data?.siteNav
			this.siteSettings = data?.siteSettings
		}
	}
})
