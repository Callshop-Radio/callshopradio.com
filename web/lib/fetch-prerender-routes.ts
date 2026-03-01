/**
 * Lädt die Liste aller gültigen Prerender-Routen aus Sanity (gleiche Logik wie Sitemap).
 * Nur im Build-Kontext (nitro:config) verwenden – nutzt @sanity/client direkt.
 */
import { createClient } from "@sanity/client";
import { SITEMAP_QUERY } from "../queries/sanity.queries";

const STATIC_ROUTES = [
	"/",
	"/sitemap.xml",
	"/pool",
	"/shows",
	"/words",
	"/schedule",
];

type SitemapEntry = {
	_type: string;
	loc: string;
	slug?: string;
	show?: { slug: string };
};

export async function getPrerenderRoutes(): Promise<string[]> {
	const projectId = process.env.NUXT_SANITY_PROJECT_ID;
	const dataset = process.env.NUXT_SANITY_DATASET;

	if (!projectId || !dataset) {
		console.warn(
			"[prerender-routes] NUXT_SANITY_PROJECT_ID/DATASET fehlt – nur statische Routen."
		);
		return [...STATIC_ROUTES];
	}

	const client = createClient({
		projectId,
		dataset,
		apiVersion: "2024-01-01",
		useCdn: false,
	});

	// Sanity API limitiert standardmäßig (~1000); alle Dokumente holen (z. B. 3074+)
	const queryWithLimit = `${SITEMAP_QUERY.trimEnd()} | [0...5000]`;

	let data: SitemapEntry[];
	try {
		data = (await client.fetch(queryWithLimit)) as SitemapEntry[];
	} catch (err) {
		console.warn("[prerender-routes] Sanity-Fetch fehlgeschlagen:", err);
		return [...STATIC_ROUTES];
	}

	// Gleiche Filterlogik wie server/routes/sitemap.xml.ts
	const valid = data
		.filter((route) => {
			if (
				!route.loc ||
				route.loc === "undefined" ||
				route.loc.startsWith("/api/")
			) {
				return false;
			}
			if (route._type === "set") {
				return route.show && route.show.slug;
			}
			return true;
		})
		.map((route) => {
			if (route._type === "set" && route.show?.slug && route.slug) {
				return `/shows/${route.show.slug}/${route.slug}`;
			}
			return route.loc;
		});

	const unique = [...new Set([...STATIC_ROUTES, ...valid])];
	console.log(
		`[prerender-routes] ${unique.length} Routen aus Sanity + statisch (ohne crawlLinks).`
	);
	return unique;
}
