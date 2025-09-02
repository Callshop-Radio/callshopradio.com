export default defineNitroPlugin(async (nitroApp) => {
  console.log('🗺️ Sitemap plugin loaded')

  // Force sitemap regeneration on close
  nitroApp.hooks.hook('close', async () => {
    try {
      console.log('🔄 Sitemap plugin shutting down...')
    } catch (error) {
      console.error('❌ Error in sitemap plugin:', error)
    }
  })

  // Log sitemap requests
  nitroApp.hooks.hook('request', async (event) => {
    if (event.node.req.url?.includes('/sitemap')) {
      console.log('🗺️ Sitemap request:', event.node.req.url)
    }
  })
})
