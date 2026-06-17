/**
 * Fetches all `page`-document slugs from Sanity at build time so they can be
 * registered as ISR routes (same edge-cache + webhook-invalidation model as
 * shows/words/pool). Returns an empty list when Sanity env vars are missing,
 * so the build still succeeds.
 */
import { createClient } from "@sanity/client";

const PAGE_SLUGS_QUERY = `*[
  _type == "page" &&
  defined(slug.current) &&
  !(_id in path("drafts.**"))
].slug.current`;

export async function getPageSlugs(): Promise<string[]> {
	const projectId = process.env.NUXT_SANITY_PROJECT_ID;
	const dataset = process.env.NUXT_SANITY_DATASET;

	if (!projectId || !dataset) {
		console.warn(
			"[page-slugs] NUXT_SANITY_PROJECT_ID/DATASET missing – no page ISR routes.",
		);
		return [];
	}

	const client = createClient({
		projectId,
		dataset,
		apiVersion: "2024-01-01",
		useCdn: false,
	});

	try {
		const slugs = (await client.fetch<string[]>(PAGE_SLUGS_QUERY)) ?? [];
		return slugs.filter(
			(slug): slug is string => typeof slug === "string" && slug.length > 0,
		);
	} catch (err) {
		console.warn("[page-slugs] Sanity fetch failed:", err);
		return [];
	}
}
