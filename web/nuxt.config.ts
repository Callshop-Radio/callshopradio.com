import { getPrerenderRoutes } from './lib/fetch-prerender-routes'

export default defineNuxtConfig({
	// TODO: Remove this once Nuxt 4 has launched
	future: {
		compatibilityVersion: 4
	},
	site: {
		debug: false,
		url: process.env.NUXT_PUBLIC_SITE_URL || 'https://callshopradio.com'
	},

	sitemap: {
		sources: ['/api/sitemap']
	},
	devtools: { enabled: false },
	ssr: true,
	// Optimiert für SSG
	experimental: {
		payloadExtraction: false
	},
	app: {
		pageTransition: { name: 'page', mode: 'out-in' }
	},

	sourcemap: {
		server: false,
		client: false
	},
	modules: [
		'@unocss/nuxt',
		'@unlazy/nuxt',
		'@nuxtjs/sanity',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'nuxt-gtag',
		'@nuxt/eslint',
		'@nuxtjs/i18n',
		'@nuxtjs/sitemap'
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
			cssnano: {
				preset: [
					'default',
					{
						discardComments: {
							removeAll: true
						}
					}
				]
			},
			'@unocss/postcss': {},
			'postcss-preset-env': {
				stage: 2
			},
			autoprefixer: {}
		}
	},

	i18n: {
		strategy: 'prefix_except_default',
		locales: [
			{
				code: 'en',
				iso: 'en-US',
				name: 'English'
			},
			{
				code: 'de',
				iso: 'de-DE',
				name: 'Deutsch'
			}
		],
		defaultLocale: 'en',
		detectBrowserLanguage: false,
		// Bestehende i18n-Konfiguration...
		bundle: {
			optimizeTranslationDirective: false // Explizit deaktivieren, um die Warnung zu beseitigen
		}
	},

	nitro: {
		prerender: {
			crawlLinks: true,
			concurrency: 5,
			failOnError: false,
			routes: ['/', '/sitemap.xml'],
			ignore: ['/api/**']
		},
		experimental: {
			wasm: true
		},
		// Cache-Storage Konfiguration
		storage: {
			cache: {
				driver: 'lru-cache',
				max: 1000
			}
		},
		// Entwicklungs-Storage (Filesystem-basiert)
		devStorage: {
			cache: {
				driver: 'fs',
				base: '.cache/nitro'
			}
		},
		rollupConfig: {
			external: ['framer-motion'],
			output: {
				globals: {
					'framer-motion': 'FramerMotion'
				}
			}
		}
	},

	runtimeConfig: {
		// Server-only secrets
		sanityWebhookSecret: process.env.SANITY_WEBHOOK_SECRET,
		public: {
			baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
			libretimeApiKey: process.env.NUXT_LIBRETIME_API_KEY
		}
	},

	// Note: vue-ssr-carousel should be added to modules array if still needed

	build: {
		transpile: ['rxjs']
	},

	webpack: {
		optimization: {
			splitChunks: {
				chunks: 'all',
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
						maxSize: 244000
					}
				}
			}
		}
	},

	vite: {
		build: {
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						if (id.includes('node_modules')) {
							return 'vendor'
						}
					}
				},
				onwarn(warning, warn) {
					// Suppress "use client" warnings from framer-motion
					if (
						warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
            warning.message.includes('use client')
					) {
						return
					}
					warn(warning)
				}
			}
		},
		optimizeDeps: {
			include: ['vue', 'vue-router']
		},
		ssr: {
			noExternal: [
				// Include framer-motion in SSR bundle to avoid directive warnings
				'framer-motion'
			]
		}
	},

	routeRules: {
		// === Statische Seiten (bei Build generiert) ===
		'/': { prerender: true },
		'/sitemap.xml': {
			prerender: true,
			headers: {
				'content-type': 'application/xml; charset=utf-8',
				'cache-control': 'max-age=3600'
			}
		},

		// === Content-Seiten (alle vorgerendert als statisches HTML) ===
		'/pool': { prerender: true },
		'/pool/**': { prerender: true },
		'/shows': { prerender: true },
		'/shows/**': { prerender: true },
		'/words': { prerender: true },
		'/words/**': { prerender: true },
		'/schedule': { prerender: true },

		// === Suche (client-side only, kein Pre-Rendering) ===
		'/search': { ssr: false },
		'/de/search': { ssr: false },

		// === API-Routen ===
		'/api/**': { cors: true }
	},

	compatibilityDate: '2024-12-19',

	hooks: {
		async 'prerender:routes'(ctx) {
			const routes = await getPrerenderRoutes()
			for (const route of routes) {
				ctx.routes.add(route)
			}
		}
	}
})
