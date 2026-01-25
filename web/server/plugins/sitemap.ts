export default defineNitroPlugin(async (nitroApp) => {
  // Force sitemap regeneration on close
  nitroApp.hooks.hook("close", async () => {
    try {
    } catch (error) {
      console.error("❌ Error in sitemap plugin:", error);
    }
  });

  // Log sitemap requests
  nitroApp.hooks.hook("request", async (event) => {
    if (event.node.req.url?.includes("/sitemap")) {
    }
  });
});
