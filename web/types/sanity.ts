/**
 * Shared Sanity/content types for composables and modules.
 * Used to replace explicit `any` and centralise duplicate interfaces.
 */

/** Slug from Sanity (e.g. slug.current) */
export interface Slug {
	current?: string
}

/** Tag (tag.city, tag.genre, etc.) – title can be string or i18n/portable text */
export interface Tag {
	_id?: string
	_type?: string
	title?: string | Array<{ value?: string }>
	name?: string
	short?: string
	subGenres?: Tag[]
}

/** Image with optional asset (url, altText) */
export interface Image {
	asset?: {
		url?: string
		altText?: string
	}
	alt?: string
}

/** Content item from search/pool/show/article/set – minimal shape for navigation and display */
export interface ContentItem {
	_id?: string
	_type?: string
	title?: string
	name?: string
	slug?: Slug
	tags?: Tag[]
	parentShow?: { slug?: Slug; title?: string; tags?: Tag[]; image?: Image }
	image?: Image
	mainImage?: Image
	soundcloud?: { artwork_url?: string; tracks?: unknown[] }
	datetime?: string
	_updatedAt?: string
	_createdAt?: string
	[key: string]: unknown
}

/** Sitemap route as returned by SITEMAP_QUERY */
export interface SitemapRoute {
	_type: string
	slug?: string
	loc: string
	modifiedAt?: string
	changefreq?: string
	priority?: number
	show?: { slug?: string }
}

/** Normalised sitemap entry (url, lastmod, etc.) for Nuxt sitemap / API response */
export interface SitemapEntry {
	url?: string
	loc?: string
	lastmod?: string
	changefreq?: string
	priority?: number
}

/** Minimal Sanity rich text block for limitTextBlocks (children with text) */
export interface RichTextBlock {
	children?: Array<{ text?: string }>
}

/** Fallback images per content type – used by mainStore.siteFallbacks */
export interface SiteFallbacks {
	fallbackArticle?: { image?: { asset?: { url?: string } } }
	fallbackPerson?: { image?: { asset?: { url?: string } } }
	fallbackSet?: { image?: { asset?: { url?: string } } }
	fallbackShow?: { image?: { asset?: { url?: string } } }
	fallbackVenue?: { image?: { asset?: { url?: string } } }
	[key: string]: unknown
}
