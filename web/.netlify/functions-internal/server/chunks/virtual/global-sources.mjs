const sources = [
    {
        "sourceType": "user",
        "fetch": "/api/sitemap"
    },
    {
        "context": {
            "name": "sitemap:urls",
            "description": "Set with the `sitemap.urls` config."
        },
        "urls": [],
        "sourceType": "user"
    },
    {
        "context": {
            "name": "nuxt:pages",
            "description": "Generated from your static page files.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:pages'] }`."
            ]
        },
        "urls": [
            {
                "loc": "/",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/"
                    }
                ]
            },
            {
                "loc": "/de",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/"
                    }
                ]
            },
            {
                "loc": "/pool",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/pool"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/pool"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/pool"
                    }
                ]
            },
            {
                "loc": "/de/pool",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/pool"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/pool"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/pool"
                    }
                ]
            },
            {
                "loc": "/shows",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/shows"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/shows"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/shows"
                    }
                ]
            },
            {
                "loc": "/de/shows",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/shows"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/shows"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/shows"
                    }
                ]
            },
            {
                "loc": "/words",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/words"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/words"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/words"
                    }
                ]
            },
            {
                "loc": "/de/words",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/words"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/words"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/words"
                    }
                ]
            },
            {
                "loc": "/search",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/search"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/search"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/search"
                    }
                ]
            },
            {
                "loc": "/de/search",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/search"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/search"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/search"
                    }
                ]
            },
            {
                "loc": "/schedule",
                "_sitemap": "en-US",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/schedule"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/schedule"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/schedule"
                    }
                ]
            },
            {
                "loc": "/de/schedule",
                "_sitemap": "de-DE",
                "alternatives": [
                    {
                        "hreflang": "en-US",
                        "href": "/schedule"
                    },
                    {
                        "hreflang": "de-DE",
                        "href": "/de/schedule"
                    },
                    {
                        "hreflang": "x-default",
                        "href": "/schedule"
                    }
                ]
            },
            {
                "loc": "/sitemap.xml",
                "_sitemap": "en-US"
            },
            {
                "loc": "/de/sitemap.xml",
                "_sitemap": "en-US"
            }
        ],
        "sourceType": "app"
    },
    {
        "context": {
            "name": "nuxt:route-rules",
            "description": "Generated from your route rules config.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:route-rules'] }`."
            ]
        },
        "urls": [
            "/",
            "/pool",
            "/shows",
            "/words",
            "/schedule",
            "/search",
            "/de/search"
        ],
        "sourceType": "app"
    },
    {
        "context": {
            "name": "nuxt:prerender",
            "description": "Generated at build time when prerendering.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:prerender'] }`."
            ]
        },
        "urls": [
            "/",
            {
                "loc": "/",
                "_sitemap": "en-US",
                "images": [
                    {
                        "loc": "https://cdn.sanity.io/images/0smxd0yv/production/58ce2e1aa2f82f9378b637d2313ec0fd5fce429c-6667x6667.jpg"
                    },
                    {
                        "loc": "https://cdn.sanity.io/images/0smxd0yv/production/abdc814cfd61b82dd52342f1b061d4231cb869b7-960x1280.jpg"
                    },
                    {
                        "loc": "https://cdn.sanity.io/images/0smxd0yv/production/0a45fdcb357f68912fee38d68c8ed0cef67773e9-1080x1080.jpg"
                    }
                ]
            }
        ],
        "sourceType": "app"
    }
];

export { sources };
