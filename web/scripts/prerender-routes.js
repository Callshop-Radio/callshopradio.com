// Script to prerender all dynamic routes
// Sanity client and ALL_SLUGS_QUERY reserved for future dynamic route discovery

export async function getAllRoutes() {
	return ["/", "/pool", "/schedule", "/shows", "/words"];
}

// When run directly, show all routes
if (import.meta.url === `file://${process.argv[1]}`) {
	getAllRoutes()
		.then(() => {})
		.catch(console.error);
}
