export default defineNitroPlugin(async (nitroApp) => {
	// Force sitemap regeneration on close
	nitroApp.hooks.hook("close", async () => {
		try {
			// reserved for sitemap cleanup
		} catch (error) {
			console.error("❌ Error in sitemap plugin:", error);
		}
	});

	// Log sitemap requests
	nitroApp.hooks.hook("request", async (event) => {
		if (event.node.req.url?.includes("/sitemap")) {
			// reserved for sitemap request handling
		}
	});
});
