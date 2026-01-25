// Script zum Prerendern aller dynamischen Routen
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NUXT_SANITY_PROJECT_ID || "",
  dataset: process.env.NUXT_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

// Query für alle Slugs
const ALL_SLUGS_QUERY = `{
  "pages": *[_type == "page" && defined(slug.current)]{
    "slug": slug.current
  },
  "shows": *[_type == "show" && defined(slug.current)]{
    "slug": slug.current
  },
  "sets": *[_type == "set" && defined(slug.current)]{
    "slug": slug.current,
    "parentShow": *[_type == "show" && references(^._id)][0]{
      "slug": slug.current
    }
  },
  "poolItems": *[_type in ["article", "person", "venue"] && defined(slug.current)]{
    "slug": slug.current,
    "_type": _type
  }
}`;

export async function getAllRoutes() {
  return ["/", "/pool", "/schedule", "/shows", "/words"];
}

// Wenn direkt ausgeführt, zeige alle Routen an
if (import.meta.url === `file://${process.argv[1]}`) {
  getAllRoutes()
    .then(() => {})
    .catch(console.error);
}
