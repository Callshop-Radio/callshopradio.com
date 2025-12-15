/**
 * Module-Specific Queries
 * 
 * Optimized queries for each content type that modules can fetch independently.
 * These queries match the original MODULE_QUERY data structure.
 */

import { IMAGE_QUERY, RICH_TEXT_QUERY } from './sanity.snippets';

// ==================== SET QUERIES ====================

/**
 * Query for set listings - matches original MODULE_QUERY structure
 */
export const SET_LIST_QUERY = `
*[_type == 'set' && datetime != null] 
| order(datetime desc)[$start...$end] {
  ...,
  _id,
  _type,
  title,
  slug,
  datetime,
  _updatedAt,
  _createdAt,
  image ${IMAGE_QUERY},
  "soundcloud": soundcloud{
    _type,
    "tracks": tracks[]{
      id,
      created_at,
      duration,
      tag_list,
      streamable,
      purchase_url,
      genre,
      title,
      description,
      release_year,
      release_month,
      release_day,
      license,
      uri,
      permalink_url,
      "user": user{
        id,
        username,
        permalink_url
      },
      artwork_url,
      waveform_url,
      stream_url,
      playback_count,
      favoritings_count
    }
  },
  "tags": tags[]->{
    ...,
    _id,
    _type,
    title,
    short
  } | order(lower(title)),
  persons[]->{
    ...,
    _id,
    title
  },
  "parentShow": *[_type == "show" && references(^._id)][0]{
    ...,
    _id,
    title,
    slug,
    image { asset-> },
    "tags": tags[]->{
      ...,
      _id,
      _type,
      title,
      short
    } | order(lower(title)),
  }
}
`;

/**
 * Count query for sets pagination
 */
export const SET_COUNT_QUERY = `
count(*[_type == 'set' && datetime != null])
`;

// ==================== POOL QUERIES ====================

/**
 * Query for pool items (persons and venues) - matches original MODULE_QUERY
 */
export const POOL_LIST_QUERY = `
*[_type in $types && poolVisibility == true] 
| order(_updatedAt desc)[$start...$end] {
  ...,
  _id,
  _type,
  title,
  name,
  slug,
  image ${IMAGE_QUERY},
  datetime,
  _updatedAt,
  _createdAt,
  "tags": tags[]->{
    ...,
    _id,
    title
  } | order(lower(title)),
  location
}
`;

/**
 * Count query for pool pagination
 */
export const POOL_COUNT_QUERY = `
count(*[_type in $types && poolVisibility == true])
`;

// ==================== ARTICLE QUERIES ====================

/**
 * Query for article listings - matches original MODULE_QUERY
 */
export const ARTICLE_LIST_QUERY = `
*[_type == 'article'] 
| order(datetime desc)[$start...$end] {
  ...,
  _id,
  _type,
  title,
  datetime,
  slug,
  image ${IMAGE_QUERY},
  useTeaserText,
  textTeaser[] ${RICH_TEXT_QUERY},
  text[] ${RICH_TEXT_QUERY},
  description[] ${RICH_TEXT_QUERY},
  _updatedAt,
  _createdAt,
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title))
}
`;

/**
 * Count query for articles pagination
 */
export const ARTICLE_COUNT_QUERY = `
count(*[_type == 'article'])
`;

// ==================== SHOW QUERIES ====================

/**
 * Query for show listings - matches original MODULE_QUERY
 */
export const SHOW_LIST_QUERY = `
*[_type == 'show'] 
| order(datetime desc)[$start...$end] {
  ...,
  _id,
  _type,
  title,
  slug,
  datetime,
  _updatedAt,
  _createdAt,
  image ${IMAGE_QUERY},
  description[] ${RICH_TEXT_QUERY},
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title))
}
`;

/**
 * Count query for shows pagination
 */
export const SHOW_COUNT_QUERY = `
count(*[_type == 'show'])
`;

// ==================== LIGHTWEIGHT MODULE METADATA ====================

/**
 * Module metadata query - replaces heavy MODULE_QUERY for initial page load
 * Content is fetched separately by each module
 */
export const MODULE_METADATA_QUERY = `{
  _type == "module.heroSlider" => {
    _type,
    _key,
    // Hero slides still need full data (usually just 1-3 items)
    slides[] {
      layout,
      type,
      title,
      contentReference->{ 
        _id, 
        _type,
        title,
        slug 
      }
    }
  },
  _type == "module.heroEntry" => {
    _type,
    _key,
    layout,
    type,
    title,
    contentReference->{ 
      _id, 
      _type,
      title,
      slug 
    }
  },
  _type == "module.contentReferenceSlider" => {
    _type,
    _key,
    title,
    type,
    style,
    count,
    poolContentType,
    showTags,
    autoLoad
    // NO content items - fetched by module
  },
  _type == "module.contentReferenceGrid" => {
    _type,
    _key,
    title,
    type,
    style,
    count,
    poolContentType,
    showTags,
    autoLoad
    // NO content items - fetched by module
  }
}`;

// ==================== QUERY BUILDERS ====================

/**
 * Build a query for specific content type
 */
export const buildModuleQuery = (
  type: 'sets' | 'pool' | 'shows' | 'words',
  options: {
    start?: number;
    end?: number;
    contentType?: string | string[];
  } = {}
) => {
  const { start = 0, end = 24 } = options;
  
  switch (type) {
    case 'sets':
      return {
        query: SET_LIST_QUERY,
        params: { start, end }
      };
    case 'pool':
      return {
        query: POOL_LIST_QUERY,
        params: { 
          start, 
          end,
          types: options.contentType 
            ? [options.contentType] 
            : ['person', 'venue']
        }
      };
    case 'shows':
      return {
        query: SHOW_LIST_QUERY,
        params: { start, end }
      };
    case 'words':
      return {
        query: ARTICLE_LIST_QUERY,
        params: { start, end }
      };
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
};
