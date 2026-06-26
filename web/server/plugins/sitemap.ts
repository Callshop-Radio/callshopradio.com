export default defineNitroPlugin(async (nitroApp) => {
	// Force sitemap regeneration on close
	nitroApp.hooks.hook("close", async () => {
		// reserved for sitemap cleanup
	});

	// Log sitemap requests
	nitroApp.hooks.hook("request", async (event) => {
		if (event.node.req.url?.includes("/sitemap")) {
			// reserved for sitemap request handling
		}
	});
});
