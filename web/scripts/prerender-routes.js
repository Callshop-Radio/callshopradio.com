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
    if (data.pages) {
      data.pages.forEach(page => {
        routes.push(`/${page.slug}`)
      })
    }

    // Show-Seiten (shows/[slug]/index.vue)
    if (data.shows) {
      data.shows.forEach(show => {
        routes.push(`/shows/${show.slug}`)
      })
    }

    // Set-Seiten (shows/[slug]/[set]/index.vue)
    if (data.sets) {
      data.sets.forEach(set => {
        if (set.parentShow?.slug) {
          routes.push(`/shows/${set.parentShow.slug}/${set.slug}`)
        }
      })
    }

    // Pool Items (pool/[slug].vue)
    if (data.poolItems) {
      data.poolItems.forEach(item => {
        routes.push(`/pool/${item.slug}`)
      })
    }

    // Entferne Duplikate und sortiere
    const uniqueRoutes = [...new Set(routes)].sort()
    
    // console.log(`🚀 Found ${uniqueRoutes.length} routes to prerender:`)
    // uniqueRoutes.forEach(route => console.log(`  - ${route}`))
    
    return uniqueRoutes
  } catch (error) {
    console.error('Error fetching routes:', error)
    return ['/'] // Fallback
  }
}

// Wenn direkt ausgeführt, zeige alle Routen an
if (import.meta.url === `file://${process.argv[1]}`) {
  getAllRoutes().then(() => {
    console.log('✅ Route discovery completed')
  }).catch(console.error)
}
