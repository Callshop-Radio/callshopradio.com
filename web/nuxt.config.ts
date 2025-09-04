export default defineNuxtConfig({
  // TODO: Remove this once Nuxt 4 has launched
  future: {
    compatibilityVersion: 4,
  },
  site: {
    debug: false,
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://callshopradio.com',
  },

  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL || 'https://callshopradio.com',
    gzip: true,
    sources: [
      '/api/sitemap'
    ]
  },
  devtools: { enabled: false },
  ssr: true,
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },
  modules: [
    "@unocss/nuxt",
    "@unlazy/nuxt",
    "@nuxtjs/sanity",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "nuxt-gtag",
    "@nuxt/eslint",
    "@nuxtjs/i18n",
    "@nuxtjs/sitemap"
  ],

  gtag: {
    id: process.env.NUXT_GTAG_ID,
    initialConsent: false,
  },

  sanity: {
    projectId: process.env.NUXT_SANITY_PROJECT_ID,
    dataset: process.env.NUXT_SANITY_DATASET,
    apiVersion: "2024-01-01",
    useCdn: false,
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
    prerender: {
      crawlLinks: false, // Verhindert Memory-intensives Crawling
      concurrency: 4, // Leicht erhöht für bessere Performance
      // Explizite Routes zum Prerendern
      routes: [
        '/',
        '/pool',
        '/schedule',
        '/shows',
        '/words',
        '/sitemap.xml',
        // Dynamische Routen werden durch hooks erfasst
      ],
      // Ignoriere bestimmte Routen falls nötig
      ignore: [
        '/api/**'
      ]
    },
    experimental: {
      wasm: true
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

  hooks: {
    async 'nitro:config'(nitroConfig) {
      try {
        const { getAllRoutes } = await import('./scripts/prerender-routes.js')
        const allRoutes = await getAllRoutes()
        if (nitroConfig.prerender?.routes) {
          nitroConfig.prerender.routes = [
            ...nitroConfig.prerender.routes,
            ...allRoutes
          ]
          // kill duplicate routes
          nitroConfig.prerender.routes = [...new Set(nitroConfig.prerender.routes)]
          console.log(`🎯 Total routes to prerender: ${nitroConfig.prerender.routes.length}`)
        }
      } catch (error) {
        console.error('❌ Error loading dynamic routes:', error)
      }
    }
  },

  runtimeConfig: {
    public: {
      baseUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

  buildModules: ["vue-ssr-carousel/nuxt"],

  build: {
    transpile: ["rxjs"],
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
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
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
    "/**": { prerender: true },
    "/sitemap.xml": { 
      headers: { 
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "max-age=3600"
      }
    },
  },

  compatibilityDate: "2024-12-19",
});
