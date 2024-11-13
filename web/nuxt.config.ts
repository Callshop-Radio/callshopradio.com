export default defineNuxtConfig({
	// TODO: Remove this once Nuxt 4 has launched
	devtools: { enabled: true },
	ssr: true,
	app: {
		pageTransition: { name: 'page', mode: 'out-in' }
	},
	modules: [
		'@unocss/nuxt',
		'@unlazy/nuxt',
		'@nuxtjs/sanity',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'nuxt-gtag',
		'@nuxt/eslint',
		// '@nuxtjs/sitemap'
	],
	gtag: {
		id: process.env.NUXT_GTAG_ID,
		initialConsent: false
	},
	sanity: {
		projectId: process.env.NUXT_SANITY_PROJECT_ID,
		dataset: process.env.NUXT_SANITY_DATASET,
		apiVersion: '2024-01-01',
		useCdn: false,
		perspective: 'published',
		visualEditing: {
			studioUrl: process.env.NUXT_SANITY_STUDIO_URL || 'http://localhost:3333',
			token: process.env.NUXT_SANITY_API_READ_TOKEN,
			stega: false // activate once FFox problem has been resolved
		}
	},
	components: [
		{
			path: '~/components',
			pathPrefix: false
		}
	],
	unocss: {
		nuxtLayers: true
	},
	postcss: {
		plugins: {
			'postcss-nested': {},
			'cssnano': {
				preset: 'default'
			},
			'@unocss/postcss': {},
			'postcss-preset-env': {
				stage: 2
			},
			'autoprefixer': {}
		}
	},
	nitro: {
		prerender: {
			crawlLinks: true
		}
	},
	runtimeConfig: {
		public: {
		  baseUrl: process.env.NUXT_PUBLIC_SITE_URL
		}
	},
	build: {
		transpile: ['rxjs']
	},
	routeRules: {
		'/**': { prerender: true }
	}
})

