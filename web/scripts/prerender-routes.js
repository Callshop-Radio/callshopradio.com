// Script zum Prerendern aller dynamischen Routen
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NUXT_SANITY_PROJECT_ID || '',
  dataset: process.env.NUXT_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

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
}`

export async function getAllRoutes() {
  try {
    console.log('🔄 Fetching routes from Sanity...')
    const data = await client.fetch(ALL_SLUGS_QUERY)
    
    const routes = [
      // Statische Routen
      '/',
      '/pool',
      '/schedule',
      '/shows',
      '/words',
    ]

    // Dynamische Seiten (pages/[slug].vue)
    if (data.pages && Array.isArray(data.pages)) {
      data.pages.forEach(page => {
        if (page.slug && typeof page.slug === 'string') {
          routes.push(`/${page.slug}`)
        }
      })
      console.log(`📄 Found ${data.pages.length} pages`)
    }

    // Show-Seiten (shows/[slug]/index.vue)
    if (data.shows && Array.isArray(data.shows)) {
      data.shows.forEach(show => {
        if (show.slug && typeof show.slug === 'string') {
          routes.push(`/shows/${show.slug}`)
        }
      })
      console.log(`🎵 Found ${data.shows.length} shows`)
    }

    // Set-Seiten (shows/[slug]/[set]/index.vue)
    if (data.sets && Array.isArray(data.sets)) {
      data.sets.forEach(set => {
        if (set.slug && set.parentShow?.slug && 
            typeof set.slug === 'string' && 
            typeof set.parentShow.slug === 'string') {
          routes.push(`/shows/${set.parentShow.slug}/${set.slug}`)
        }
      })
      console.log(`💿 Found ${data.sets.length} sets`)
    }

    // Pool Items (pool/[slug].vue)
    if (data.poolItems && Array.isArray(data.poolItems)) {
      data.poolItems.forEach(item => {
        if (item.slug && typeof item.slug === 'string') {
          routes.push(`/pool/${item.slug}`)
        }
      })
      console.log(`🏊 Found ${data.poolItems.length} pool items`)
    }

    // Entferne Duplikate und sortiere
    const uniqueRoutes = [...new Set(routes)]
      .filter(route => route && typeof route === 'string')
      .sort()
    
    console.log(`🚀 Total routes to prerender: ${uniqueRoutes.length}`)
    // Debug: zeige erste 10 Routen
    console.log('📋 Sample routes:', uniqueRoutes.slice(0, 10))
    
    return uniqueRoutes
  } catch (error) {
    console.error('❌ Error fetching routes:', error.message)
    console.log('🔄 Falling back to static routes only')
    return [
      '/',
      '/pool',
      '/schedule', 
      '/shows',
      '/words'
    ]
  }
}

// Wenn direkt ausgeführt, zeige alle Routen an
if (import.meta.url === `file://${process.argv[1]}`) {
  getAllRoutes().then(() => {
    console.log('✅ Route discovery completed')
  }).catch(console.error)
}
