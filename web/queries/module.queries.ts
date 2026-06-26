/**
 * Module-Specific Queries
 *
 * Optimized queries for each content type that modules can fetch independently.
 * These queries match the original MODULE_QUERY data structure.
 */

import {
	I18N_RICH_TEXT_VALUE_QUERY,
	IMAGE_QUERY,
	PERSON_LINK_FRAGMENT,
	SITE_PATH_FRAGMENT,
} from "./sanity.snippets";

// ==================== SET QUERIES ====================

/**
 * Query for set listings - matches original MODULE_QUERY structure
 */
// Breakdown for dynamic composition
export const SET_BASE_FILTER = "_type == 'set' && datetime != null";

export const SET_PROJECTION = `{
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
      duration,
      title,
      uri,
      permalink_url,
      "user": user{
        id,
        username,
        permalink_url
      },
      artwork_url,
      stream_url
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
    ${PERSON_LINK_FRAGMENT}
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
    ${SITE_PATH_FRAGMENT}
  },
  ${SITE_PATH_FRAGMENT}
}`;

/**
 * Query for set listings - matches original MODULE_QUERY structure
 */
export const SET_LIST_QUERY = `*[${SET_BASE_FILTER}] | order(datetime desc)[$start...$end] ${SET_PROJECTION}`;

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
export const POOL_BASE_FILTER = "_type in $types && poolVisibility == true";

export const POOL_PROJECTION = `{
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
  location,
  ${SITE_PATH_FRAGMENT}
}`;

export const POOL_LIST_QUERY = `*[${POOL_BASE_FILTER}] | order(_updatedAt desc)[$start...$end] ${POOL_PROJECTION}`;

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
export const ARTICLE_BASE_FILTER = "_type == 'article'";

export const ARTICLE_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  datetime,
  slug,
  image ${IMAGE_QUERY},
  useTeaserText,
  textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
  text[] ${I18N_RICH_TEXT_VALUE_QUERY},
  description[] ${I18N_RICH_TEXT_VALUE_QUERY},
  _updatedAt,
  _createdAt,
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title)),
  ${SITE_PATH_FRAGMENT}
}`;

export const ARTICLE_LIST_QUERY = `*[${ARTICLE_BASE_FILTER}] | order(datetime desc)[$start...$end] ${ARTICLE_PROJECTION}`;

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
export const SHOW_BASE_FILTER = "_type == 'show'";

export const SHOW_PROJECTION = `{
  ...,
  _id,
  _type,
  title,
  slug,
  datetime,
  _updatedAt,
  _createdAt,
  image ${IMAGE_QUERY},
  description[] ${I18N_RICH_TEXT_VALUE_QUERY},
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  } | order(lower(title)),
  ${SITE_PATH_FRAGMENT}
}`;

export const SHOW_LIST_QUERY = `*[${SHOW_BASE_FILTER}] | order(datetime desc)[$start...$end] ${SHOW_PROJECTION}`;

/**
 * Count query for shows pagination
 */
export const SHOW_COUNT_QUERY = `
count(*[_type == 'show'])
`;

// ==================== QUERY BUILDERS ====================

/**
 * Build a query for specific content type
 */
export const buildModuleQuery = (
	type: "sets" | "pool" | "shows" | "words",
	options: {
		start?: number;
		end?: number;
		contentType?: string | string[];
		filterTags?: string[];
		filterOrTags?: string[][]; // Array of OR groups (e.g. [[GenreA, GenreB], [CityX, CityY]])
	} = {},
) => {
	const { start = 0, end = 24, filterTags = [], filterOrTags = [] } = options;

	// Build dynamic filters
	let filterString = "";

	// AND logic: Match specific tags
	if (filterTags.length > 0) {
		filterTags.forEach((tagId) => {
			// Using references() to match if the document references the tag
			filterString += ` && references("${tagId}")`;
		});
	}

	// OR logic: Process each group
	if (filterOrTags.length > 0) {
		filterOrTags.forEach((group) => {
			if (group.length > 0) {
				const quotedIds = group.map((id) => `"${id}"`).join(", ");
				filterString += ` && references(${quotedIds})`;
			}
		});
	}

	const buildParams = { start, end };
	const getQuery = (
		baseFilter: string,
		projection: string,
		orderBy: string = "order(datetime desc)",
	) => ({
		query: `*[${baseFilter}${filterString}] | ${orderBy}[$start...$end] ${projection}`,
		countQuery: `count(*[${baseFilter}${filterString}])`,
		params: buildParams,
	});

	switch (type) {
		case "sets":
			return getQuery(SET_BASE_FILTER, SET_PROJECTION);

		case "pool": {
			const poolParams = {
				...buildParams,
				types: options.contentType
					? Array.isArray(options.contentType)
						? options.contentType
						: [options.contentType]
					: ["person", "venue"],
			};
			return {
				query: `*[${POOL_BASE_FILTER}${filterString}] | order(_updatedAt desc)[$start...$end] ${POOL_PROJECTION}`,
				countQuery: `count(*[${POOL_BASE_FILTER}${filterString}])`,
				params: poolParams,
			};
		}

		case "shows":
			return getQuery(SHOW_BASE_FILTER, SHOW_PROJECTION);

		case "words":
			return getQuery(ARTICLE_BASE_FILTER, ARTICLE_PROJECTION);

		default:
			throw new Error(`Unknown content type: ${type}`);
	}
};
