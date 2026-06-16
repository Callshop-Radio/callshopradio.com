import { getPrerenderRoutes } from "./lib/fetch-prerender-routes";

export default defineNuxtConfig({
	// TODO: Remove this once Nuxt 4 has launched
	future: {
		compatibilityVersion: 4,
	},
	site: {
		debug: false,
		url: process.env.NUXT_PUBLIC_SITE_URL || "https://callshopradio.com",
	},

	sitemap: {
		sources: ["/api/sitemap"],
	},
	devtools: { enabled: false },
	ssr: true,
	// Optimiert für SSG
	experimental: {
		payloadExtraction: false,
		// After deploys, stale tabs may request removed _nuxt/* chunks → hard reload.
		emitRouteChunkError: "automatic",
	},
	app: {
		pageTransition: { name: "page" },
		head: {
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1, viewport-fit=cover",
				},
			],
			link: [
				// Preload above-the-fold faces (body + nav/track-name) so text swaps in fast
				{
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: "/fonts/Icona-Sans-Regular.woff2",
					crossorigin: "",
				},
				{
					rel: "preload",
					as: "font",
					type: "font/woff2",
					href: "/fonts/Icona-Sans-Semibold.woff2",
					crossorigin: "",
				},
			],
		},
	},

	sourcemap: {
		server: false,
		client: false,
	},
	modules: [
		"@unocss/nuxt",
		"@unlazy/nuxt",
		"@nuxtjs/sanity",
		"@pinia/nuxt",
		"@vueuse/nuxt",
		"nuxt-gtag",
		"@nuxtjs/i18n",
		"@nuxtjs/sitemap",
	],

	gtag: {
		id: process.env.NUXT_GTAG_ID,
		initialConsent: false,
	},

	sanity: {
		projectId: process.env.NUXT_SANITY_PROJECT_ID,
		dataset: process.env.NUXT_SANITY_DATASET,
		apiVersion: "2024-01-01",
		useCdn: true,
		perspective: "published",
		visualEditing: {
			studioUrl: process.env.NUXT_SANITY_STUDIO_URL || "http://localhost:3333",
			token: process.env.NUXT_SANITY_API_READ_TOKEN,
			stega: false, // activate once FFox problem has been resolved
		},
	},

	components: [
		{
			path: "~/components",
			pathPrefix: false,
		},
	],

	unocss: {
		nuxtLayers: true,
	},

	postcss: {
		plugins: {
			"postcss-nested": {},
			cssnano: {
				preset: [
					"default",
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			},
			"@unocss/postcss": {},
			"postcss-preset-env": {
				stage: 2,
			},
			autoprefixer: {},
		},
	},

	i18n: {
		strategy: "prefix_except_default",
		locales: [
			{
				code: "en",
				iso: "en-US",
				name: "English",
			},
			{
				code: "de",
				iso: "de-DE",
				name: "Deutsch",
			},
		],
		defaultLocale: "en",
		detectBrowserLanguage: false,
		// Bestehende i18n-Konfiguration...
		bundle: {
			optimizeTranslationDirective: false, // Explizit deaktivieren, um die Warnung zu beseitigen
		},
	},

	nitro: {
		// Must match Netlify deploy output (dist/ + .netlify/functions-internal/).
		// Env var alone is fragile; Netlify sets NETLIFY=true at build time.
		preset:
			process.env.NITRO_PRESET || (process.env.NETLIFY ? "netlify" : undefined),
		prerender: {
			crawlLinks: true,
			concurrency: 5,
			failOnError: false,
			routes: ["/", "/sitemap.xml"],
			ignore: ["/api/**", "/de/**", "/de"],
		},
		experimental: {
			wasm: true,
		},
		// Cache-Storage Konfiguration
		storage: {
			cache: {
				driver: "lru-cache",
				max: 1000,
			},
		},
		// Entwicklungs-Storage (Filesystem-basiert)
		devStorage: {
			cache: {
				driver: "fs",
				base: ".cache/nitro",
			},
		},
		rollupConfig: {
			external: ["framer-motion"],
			output: {
				globals: {
					"framer-motion": "FramerMotion",
				},
			},
		},
	},

	runtimeConfig: {
		// Server-only secrets — never exposed to the client bundle.
		sanityWebhookSecret: process.env.SANITY_WEBHOOK_SECRET,
		libretimeApiKey: process.env.NUXT_LIBRETIME_API_KEY,
		public: {
			baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
		},
	},

	// Note: vue-ssr-carousel should be added to modules array if still needed

	build: {
		transpile: ["rxjs"],
	},

	vite: {
		build: {
			chunkSizeWarningLimit: 1000,
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						if (id.includes("node_modules")) {
							return "vendor";
						}
					},
				},
				onwarn(warning, warn) {
					// Suppress "use client" warnings from framer-motion
					if (
						warning.code === "MODULE_LEVEL_DIRECTIVE" &&
						warning.message.includes("use client")
					) {
						return;
					}
					warn(warning);
				},
			},
		},
		optimizeDeps: {
			// Vite 8 trips on the CJS-as-default-export interop in some
			// transitively-bundled lodash submodules used by Sanity's
			// @sanity/visual-editing + @sanity/mutate stack. Pre-bundling
			// these via esbuild rewrites them to proper ESM with a default
			// export, fixing runtime errors like
			// `does not provide an export named 'default'`.
			include: [
				"vue",
				"vue-router",
				"@sanity/client",
				"@sanity/image-url",
				"@nuxtjs/sanity > @sanity/client > @sanity/visual-editing",
				"@nuxtjs/sanity > @sanity/visual-editing > @sanity/insert-menu",
				"@nuxtjs/sanity > @sanity/visual-editing > @sanity/mutate > lodash/groupBy.js",
				"@nuxtjs/sanity > @sanity/visual-editing > @sanity/ui > styled-components",
				"@nuxtjs/sanity > @sanity/visual-editing > @sanity/visual-editing > react-is",
				"@nuxtjs/sanity > @sanity/visual-editing > react",
				"@nuxtjs/sanity > @sanity/visual-editing > react-compiler-runtime",
				"@nuxtjs/sanity > @sanity/visual-editing > react-dom",
				"@nuxtjs/sanity > @sanity/visual-editing > react-dom/client",
				"@nuxtjs/sanity > @sanity/visual-editing > react/jsx-runtime",
				"embla-carousel-vue",
				"hls.js",
				"plyr",
				"vanilla-cookieconsent",
			],
		},
		ssr: {
			noExternal: [
				// Include framer-motion in SSR bundle to avoid directive warnings
				"framer-motion",
			],
		},
	},

	routeRules: {
		// === Statische Seiten (bei Build generiert) ===
		"/": { prerender: true },
		"/sitemap.xml": { prerender: true },

		// === Content-Seiten (alle vorgerendert als statisches HTML) ===
		"/pool": { prerender: true },
		"/pool/**": { prerender: true },
		"/shows": { prerender: true },
		"/shows/**": { prerender: true },
		"/words": { prerender: true },
		"/words/**": { prerender: true },
		"/schedule": { prerender: true },

		// === Suche (client-side only, kein Pre-Rendering) ===
		"/search": { ssr: false },
		"/de/search": { ssr: false },

		// === API-Routen ===
		"/api/**": { cors: true },
	},

	compatibilityDate: "2024-12-19",

	hooks: {
		async "prerender:routes"(ctx) {
			const routes = await getPrerenderRoutes();
			for (const route of routes) {
				ctx.routes.add(route);
			}
		},
	},
});
