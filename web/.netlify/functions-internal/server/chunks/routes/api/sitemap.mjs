import { d as defineEventHandler, b as useSanity, e as groq } from '../../nitro/nitro.mjs';
import { S as SITEMAP_QUERY } from '../../_/sanity.queries.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'lru-cache';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import '@sanity/client';

const sitemap = defineEventHandler(async (event) => {
  const sanity = useSanity();
  const query = groq`${SITEMAP_QUERY}`;
  try {
    const sitemapData = await sanity.fetch(query);
    console.log("Fetching sitemap data from Sanity:", sitemapData.length, "items");
    const validRoutes = sitemapData.filter((route) => {
      if (!route.loc || route.loc === "undefined" || route.loc.startsWith("/api/")) {
        return false;
      }
      if (route._type === "set") {
        return route.show && route.show.slug;
      }
      return true;
    }).map((route) => {
      if (route._type === "set" && route.show && route.show.slug) {
        route.loc = `/shows/${route.show.slug}/${route.slug}`;
      }
      return route;
    });
    console.log("Valid routes after filtering:", validRoutes.length);
    const staticRoutes = [
      {
        loc: "/pool",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/schedule",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/shows",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/words",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "weekly",
        priority: 0.8
      }
    ];
    const routes = [
      ...validRoutes.map((route) => ({
        loc: route.loc,
        lastmod: new Date(route.modifiedAt).toISOString(),
        changefreq: route.changefreq,
        priority: route.priority
      })),
      ...staticRoutes
    ];
    const uniqueRoutes = routes.filter(
      (route, index, self) => index === self.findIndex((r) => r.loc === route.loc)
    );
    console.log(`Returning ${uniqueRoutes.length} unique routes for sitemap`);
    const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || "https://callshopradio.com";
    return uniqueRoutes.map((route) => ({
      url: route.loc,
      // Using 'url' instead of 'loc' for Nuxt Sitemap
      lastmod: route.lastmod || route.modifiedAt,
      changefreq: route.changefreq,
      priority: route.priority
    }));
  } catch (error) {
    console.error("Error fetching sitemap data from Sanity:", error);
    return [
      {
        loc: "/",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 1
      },
      {
        loc: "/pool",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/schedule",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/shows",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "daily",
        priority: 0.9
      },
      {
        loc: "/words",
        lastmod: (/* @__PURE__ */ new Date()).toISOString(),
        changefreq: "weekly",
        priority: 0.8
      }
    ];
  }
});

export { sitemap as default };
