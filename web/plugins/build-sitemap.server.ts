/* eslint-disable sort-imports -- ~~/queries vs ~~/types with type import */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SITEMAP_QUERY } from "~~/queries/sanity.queries";
import type { SitemapRoute } from "~~/types/sanity";

export default defineNitroPlugin(async (nitroApp) => {
	// Only run during build process
	if (!import.meta.env?.SSR || process.env.NODE_ENV !== "production") {
		return;
	}

	nitroApp.hooks.hook("close", async () => {
		try {
			const sanity = useSanity();
			const query = groq`${SITEMAP_QUERY}`;

			let sitemapData: SitemapRoute[];
			try {
				sitemapData = (await sanity.fetch(query)) as SitemapRoute[];
			} catch (sanityError) {
				console.warn(
					"Warning: Could not fetch sitemap data from Sanity:",
					sanityError,
				);
				sitemapData = [];
			}

			// Filter out invalid routes and handle special cases
			const validRoutes = sitemapData
				.filter((route: SitemapRoute) => {
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
				.map((route: SitemapRoute) => {
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
					modifiedAt: new Date().toISOString(),
					changefreq: "daily",
					priority: 0.9,
				},
				{
					loc: "/schedule",
					modifiedAt: new Date().toISOString(),
					changefreq: "daily",
					priority: 0.9,
				},
				{
					loc: "/shows",
					modifiedAt: new Date().toISOString(),
					changefreq: "daily",
					priority: 0.9,
				},
				{
					loc: "/words",
					modifiedAt: new Date().toISOString(),
					changefreq: "weekly",
					priority: 0.8,
				},
			];

			const allRoutes = [...validRoutes, ...staticRoutes];

			// Remove duplicate routes
			const uniqueRoutes = allRoutes.filter(
				(route, index, self) =>
					index === self.findIndex((r) => r.loc === route.loc),
			);

			const siteUrl =
				process.env.NUXT_PUBLIC_SITE_URL || "https://callshopradio.com";

			// Generate XML
			const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes
	.map(
		(route) => `  <url>
    <loc>${siteUrl}${route.loc}</loc>
    <lastmod>${new Date(route.modifiedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
	)
	.join("\n")}
</urlset>`;

			// Write to dist directory
			const distPath = join(process.cwd(), "dist");
			await mkdir(distPath, { recursive: true });
			await writeFile(join(distPath, "sitemap.xml"), xml, "utf-8");

			const _contentTypes = uniqueRoutes.reduce((acc, route) => {
				const type = route._type || "static";
				acc[type] = (acc[type] || 0) + 1;
				return acc;
			}, {});
		} catch (error) {
			console.error("❌ Error generating static sitemap:", error);

			// Generate fallback sitemap
			const siteUrl =
				process.env.NUXT_PUBLIC_SITE_URL || "https://callshopradio.com";
			const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/pool</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/schedule</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/shows</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/words</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

			try {
				const distPath = join(process.cwd(), "dist");
				await mkdir(distPath, { recursive: true });
				await writeFile(join(distPath, "sitemap.xml"), fallbackXml, "utf-8");
			} catch (writeError) {
				console.error("❌ Could not write fallback sitemap:", writeError);
			}
		}
	});
});
