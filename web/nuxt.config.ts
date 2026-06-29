import { getPageSlugs } from "./lib/fetch-page-slugs";

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
	// Optimized for SSG
	experimental: {
		payloadExtraction: false,
		// After deploys, stale tabs may request removed _nuxt/* chunks → hard reload.
		emitRouteChunkError: "automatic",
	},
	app: {
		// `out-in`: the leaving page fully unmounts before the entering one
		// renders. Only one page is ever in the DOM, so there's no two-pages-
		// in-flow stacking (which shifted the top spacing) and no lingering
		// leave element capturing clicks (which broke links). Kept snappy via
		// a short per-phase duration in transitions.postcss; the formerly slow
		// feel came from the 2-3s Sanity cold-hit between phases, now served
		// from the persistent Blob cache. Same-route param changes still
		// animate because the inner page is keyed via `page-key` in app.vue.
		pageTransition: { name: "page", mode: "out-in" },
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
		// Visual Editing disabled — @nuxtjs/sanity v2 pulls @sanity/visual-editing
		// 5, whose React+lodash+react-compiler-runtime subtree breaks Vite 8
		// dev with cascading CJS/ESM-interop errors. Re-enable once you actually
		// need preview-in-studio and we'll tackle the bundling separately.
		visualEditing: false,
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
		// Existing i18n configuration...
		bundle: {
			optimizeTranslationDirective: false, // Explicitly disable to get rid of the warning
		},
	},

	nitro: {
		// Must match Netlify deploy output (dist/ + .netlify/functions-internal/).
		// Env var alone is fragile; Netlify sets NETLIFY=true at build time.
		preset:
			process.env.NITRO_PRESET || (process.env.NETLIFY ? "netlify" : undefined),
		prerender: {
			// crawlLinks disabled: content routes are ISR (rendered on-demand at the
			// edge), only `/sitemap.xml` is statically generated at build.
			crawlLinks: false,
			concurrency: 5,
			failOnError: false,
			routes: ["/sitemap.xml"],
			ignore: ["/api/**", "/de/**", "/de"],
		},
		experimental: {
			wasm: true,
		},
		// Cache storage configuration.
		//
		// `cache` is Nitro's AUTOMATIC route/render cache (keys `nitro:routes:*`).
		// It MUST use a driver that never throws on write: Nitro writes the
		// rendered response inside `renderRoute` WITHOUT guarding that write, so
		// any storage error there is unhandled and crashes the whole render
		// (HTTP 500). Netlify Blobs throws "Token expired" on long-lived function
		// instances (the unstorage driver caches the store + its short-lived
		// context token for the instance lifetime), which previously 500'd every
		// cache-miss render. So `cache` stays in-memory. Real cross-instance ISR
		// is handled by Netlify's edge cache (Netlify-CDN-Cache-Control headers +
		// tag purge in /api/revalidate), which is independent of this layer.
		//
		// `sanity` is the cross-deploy Sanity-detail cache, used EXPLICITLY by
		// /api/sanity/detail/[type] — which wraps every Blob op in try/catch, so a
		// Blob failure there only degrades to a live Sanity fetch and never
		// crashes a render. On Netlify it is a site-scoped Blob store; locally LRU.
		storage: {
			cache: { driver: "lru-cache", max: 1000 },
			sanity: process.env.NETLIFY
				? {
						driver: "netlifyBlobs",
						// Named store = site-scoped, persistent across deploys.
						name: "sanity-cache",
						// Strong read-after-write — the driver defaults to "eventual",
						// which made cache writes unreadable on the next request
						// (different Function instance), so the cache appeared cold
						// again on every reload despite being written.
						consistency: "strong",
					}
				: {
						driver: "lru-cache",
						max: 1000,
					},
		},
		// Development storage (filesystem-based)
		devStorage: {
			cache: {
				driver: "fs",
				base: ".cache/nitro",
			},
			sanity: {
				driver: "fs",
				base: ".cache/sanity",
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
		// Netlify Personal Access Token + Site ID for edge cache purge (tag-based).
		// Optional — webhook still clears local Nitro LRU even when these are unset.
		netlifyPurgeToken: process.env.NETLIFY_PURGE_TOKEN,
		netlifySiteId: process.env.NETLIFY_SITE_ID,
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
			include: [
				"vue",
				"vue-router",
				"@sanity/client",
				"@sanity/image-url",
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
		// === Sitemap (generated at build time) ===
		"/sitemap.xml": { prerender: true },

		// === Content pages (ISR on Netlify Edge, tag-based invalidation via /api/revalidate) ===
		"/": { isr: true, headers: { "Netlify-Cache-Tag": "home" } },
		"/pool": { isr: true, headers: { "Netlify-Cache-Tag": "pool" } },
		"/pool/**": { isr: true, headers: { "Netlify-Cache-Tag": "pool" } },
		"/shows": { isr: true, headers: { "Netlify-Cache-Tag": "shows" } },
		"/shows/**": { isr: true, headers: { "Netlify-Cache-Tag": "shows" } },
		"/words": { isr: true, headers: { "Netlify-Cache-Tag": "words" } },
		"/words/**": { isr: true, headers: { "Netlify-Cache-Tag": "words" } },
		"/schedule": { isr: true, headers: { "Netlify-Cache-Tag": "schedule" } },

		// === Search (client-side only, no pre-rendering) ===
		"/search": { ssr: false },
		"/de/search": { ssr: false },

		// === API routes ===
		"/api/**": { cors: true },
	},

	compatibilityDate: "2024-12-19",

	hooks: {
		// Register every `page`-document slug as an ISR route at build time so
		// editorial pages share the edge-cache + webhook-invalidation model used
		// by shows/words/pool. Without this they fall through to uncached SSR.
		async "nitro:config"(nitroConfig) {
			const slugs = await getPageSlugs();
			nitroConfig.routeRules ||= {};
			for (const slug of slugs) {
				nitroConfig.routeRules[`/${slug}`] = {
					isr: true,
					headers: { "Netlify-Cache-Tag": "page" },
				};
			}
		},
	},
});
