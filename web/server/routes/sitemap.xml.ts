import { SITEMAP_QUERY } from '~~/queries/sanity.queries'

export default defineEventHandler(async (event) => {
	// Set headers for XML response
	setHeader(event, 'content-type', 'application/xml; charset=utf-8')
	setHeader(event, 'cache-control', 'max-age=3600')
  
	const sanity = useSanity()
	const query = groq`${SITEMAP_QUERY}`
  
	try {
		const sitemapData = await sanity.fetch(query)
    
		// Filter out invalid routes and handle special cases
		const validRoutes = sitemapData.filter((route: any) => {
			// Basic validation
			if (!route.loc || route.loc === 'undefined' || route.loc.startsWith('/api/')) {
				return false
			}
      
			// Special handling for sets - they need a parent show
			if (route._type === 'set') {
				return route.show && route.show.slug
			}
      
			return true
		}).map((route: any) => {
			// Fix set URLs that might have issues
			if (route._type === 'set' && route.show && route.show.slug) {
				route.loc = `/shows/${route.show.slug}/${route.slug}`
			}
      
			return route
		})
    
		// Add static routes specific to Callshop Radio
		const staticRoutes = [
			{
				loc: '/pool',
				modifiedAt: new Date().toISOString(),
				changefreq: 'daily',
				priority: 0.9
			},
			{
				loc: '/schedule',
				modifiedAt: new Date().toISOString(),
				changefreq: 'daily',
				priority: 0.9
			},
			{
				loc: '/shows',
				modifiedAt: new Date().toISOString(),
				changefreq: 'daily',
				priority: 0.9
			},
			{
				loc: '/words',
				modifiedAt: new Date().toISOString(),
				changefreq: 'weekly',
				priority: 0.8
			}
		]
    
		const allRoutes = [...validRoutes, ...staticRoutes]
    
		// Remove duplicate routes
		const uniqueRoutes = allRoutes.filter((route, index, self) => 
			index === self.findIndex((r) => r.loc === route.loc)
		)
    
		const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://callshopradio.com'
    
		// Generate XML sitemap
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes.map(route => `  <url>
    <loc>${siteUrl}${route.loc}</loc>
    <lastmod>${new Date(route.modifiedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

		return xml
    
	} catch (error) {
		console.error('Error generating sitemap.xml:', error)
    
		// Fallback sitemap with essential routes
		const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://callshopradio.com'
		const currentDate = new Date().toISOString().split('T')[0]
    
		const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/pool</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/schedule</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/shows</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${siteUrl}/words</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`

		return fallbackXml
	}
})
