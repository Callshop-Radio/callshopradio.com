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

	let data: SitemapEntry[];
	try {
		data = (await client.fetch(SITEMAP_QUERY)) as SitemapEntry[];
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

	const defaultRoutes = [...new Set([...STATIC_ROUTES, ...valid])];

	// i18n prefix_except_default: Deutsche URLs (/de, /de/shows/…) müssen auch geprerendert werden,
	// sonst liefern Permalinks wie /de/shows/xyz 404
	const deRoutes = defaultRoutes.flatMap((r) =>
		r === "/" ? ["/de"] : [`/de${r}`]
	);
	const allRoutes = [...defaultRoutes, ...deRoutes];

	console.log(
		`[prerender-routes] ${allRoutes.length} Routen (${defaultRoutes.length} en + ${deRoutes.length} de).`
	);
	return allRoutes;
}
