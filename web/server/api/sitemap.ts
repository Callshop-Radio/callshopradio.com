import { SITEMAP_QUERY } from "~~/queries/sanity.queries";

export default defineEventHandler(async (event) => {
  const sanity = useSanity();
  const query = groq`${SITEMAP_QUERY}`;

  try {
    const sitemapData = await sanity.fetch(query);

    // Filter out any invalid routes and handle special cases
    const validRoutes = sitemapData
      .filter((route: any) => {
        // Basic validation
        if (
          !route.loc ||
          route.loc === "undefined" ||
          route.loc.startsWith("/api/")
        ) {
          return false;
        }

        // Special handling for sets - they need a parent show
        if (route._type === "set") {
          return route.show && route.show.slug;
        }

        return true;
      })
      .map((route: any) => {
        // Fix set URLs that might have issues
        if (route._type === "set" && route.show && route.show.slug) {
          route.loc = `/shows/${route.show.slug}/${route.slug}`;
        }

        return route;
      });

    // Add static routes specific to Callshop Radio
    const staticRoutes = [
      {
        loc: "/pool",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/schedule",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/shows",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/words",
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      },
    ];

    // Transform data to match @nuxtjs/sitemap format
    const routes = [
      ...validRoutes.map((route: any) => ({
        loc: route.loc,
        lastmod: new Date(route.modifiedAt).toISOString(),
        changefreq: route.changefreq,
        priority: route.priority,
      })),
      ...staticRoutes,
    ];

    // Remove duplicate routes (just in case)
    const uniqueRoutes = routes.filter(
      (route, index, self) =>
        index === self.findIndex((r) => r.loc === route.loc),
    );

    // Format for Nuxt Sitemap module
    const siteUrl =
      process.env.NUXT_PUBLIC_SITE_URL || "https://callshopradio.com";

    return uniqueRoutes.map((route: any) => ({
      url: route.loc, // Using 'url' instead of 'loc' for Nuxt Sitemap
      lastmod: route.lastmod || route.modifiedAt,
      changefreq: route.changefreq,
      priority: route.priority,
    }));
  } catch (error) {
    console.error("Error fetching sitemap data from Sanity:", error);

    // Fallback with basic routes specific to Callshop Radio
    return [
      {
        loc: "/",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        loc: "/pool",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/schedule",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/shows",
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: "/words",
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.8,
      },
    ];
  }
});
