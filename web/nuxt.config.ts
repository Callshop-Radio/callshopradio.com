export default defineNuxtConfig({
	// TODO: Remove this once Nuxt 4 has launched
	future: {
		compatibilityVersion: 4
	},
	site: {
		debug: true
	},
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
		projectId: '0smxd0yv',
		dataset: 'production',
		apiVersion: '2024-01-01',
		useCdn: false,
		perspective: 'published',
		visualEditing: {
			studioUrl: 'http://callshopradio.sanity.studio',
			token: 'sknVx0hvN6esLD66RBQcsYHzltMUPQ0o69eM9Oqgi2V2ITkfRI4CLCyTxLYYoSLtHkAUv2xPXExschz8aME3SGQSPZRh8WPCsqXkNTKnMfQ3k6j7D8Z2Xp9dR5zRhc5XuKBkueZLdoGNXwDvBQ9d4eJ2wHhobdufqGz1xDbnmhmxzYsIeNyE',
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

