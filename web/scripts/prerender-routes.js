// Script zum Prerendern aller dynamischen Routen
// Sanity client and ALL_SLUGS_QUERY reserved for future dynamic route discovery

export async function getAllRoutes() {
  return ["/", "/pool", "/schedule", "/shows", "/words"];
}

// Wenn direkt ausgeführt, zeige alle Routen an
if (import.meta.url === `file://${process.argv[1]}`) {
  getAllRoutes()
    .then(() => {})
    .catch(console.error);
}
