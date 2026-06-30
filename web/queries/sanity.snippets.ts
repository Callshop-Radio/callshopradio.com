export const IMAGE_QUERY = `{
  ...,
  "alt": asset->altText,
	asset->{
		...,
		metadata
	},
}`;

// Shared SoundCloud projection — only the fields actually consumed by components.
// Dropped (zero readers): created_at, tag_list, streamable, purchase_url, genre,
// description, release_year/month/day, license, waveform_url, playback_count,
// favoritings_count. permalink_url is reconstructed client-side from `id`.
export const SOUNDCLOUD_TRACKS_QUERY = `soundcloud{
	_type,
	"tracks": tracks[]{
		id,
		duration,
		title,
		uri,
		"user": user{
			id,
			username,
			permalink_url
		},
		artwork_url,
		stream_url
	}
}`;

/** Inner GROQ select for canonical paths (reused for path + loc). */
export const SITE_PATH_SELECT = `select(
	_type == "home" => "/",
	_type == "page" => "/" + slug.current,
	_type == "show" => "/shows/" + slug.current,
	_type == "set" => "/shows/" + coalesce(show->slug.current, *[_type == "show" && references(^._id)][0].slug.current, "no-show") + "/" + slug.current,
	_type == "person" => "/pool/" + slug.current,
	_type == "venue" => "/pool/" + slug.current,
	_type == "article" => "/words/" + slug.current,
	_type == "pool" => "/pool",
	_type == "words" => "/words",
	_type == "showsArchive" => "/shows",
	_type == "timetable" => "/schedule",
	defined(slug.current) => "/" + slug.current,
	null
)`;

/** Canonical site path for a Sanity document (language-neutral, no locale prefix). */
export const SITE_PATH_FRAGMENT = `
	"path": ${SITE_PATH_SELECT},
	"loc": ${SITE_PATH_SELECT}
`;

/** Linked person/venue with canonical path (artists on sets, related content, etc.). */
export const PERSON_LINK_FRAGMENT = `
	_id,
	title,
	slug,
	poolVisibility,
	${SITE_PATH_FRAGMENT}
`;

/** Parent show on a set with canonical path. */
export const PARENT_SHOW_LINK_FRAGMENT = `
	_id,
	title,
	slug,
	image { asset-> },
	${SITE_PATH_FRAGMENT}
`;

/** Canonical path for an internal link reference (menu, rich text, footer). */
export const LINK_PATH_FRAGMENT = `
		"path": select(
			reference->_type == "home" => "/",
			reference->_type == "page" => "/" + reference->slug.current,
			reference->_type == "showsArchive" => "/shows",
			reference->_type == "show" => "/shows/" + reference->slug.current,
			reference->_type == "set" => "/shows/" + coalesce(*[_type == "show" && references(^.reference._ref)][0].slug.current, "no-show") + "/" + reference->slug.current,
			reference->_type == "words" => "/words",
			reference->_type == "article" => "/words/" + reference->slug.current,
			reference->_type == "pool" => "/pool",
			reference->_type == "person" => "/pool/" + reference->slug.current,
			reference->_type == "venue" => "/pool/" + reference->slug.current,
			reference->_type == "timetable" => "/schedule",
			null
		)
`;

export const LINK_QUERY = `
	...,
	type == "internal" => {
		"linkType": "linkInternal",
		"title": coalesce(
			title,
			reference->title
		),
		"route": select(
			reference->_type == "home" => "index",
			reference->_type == "page" => "slug",
            reference->_type == "showsArchive" => "shows",
            reference->_type == "show" => "shows-slug",
            reference->_type == "set" => "set-slug",
            reference->_type == "words" => "words",
            reference->_type == "article" => "words-slug",
            reference->_type == "pool" => "pool",
            reference->_type == "person" => "pool-slug",
            reference->_type == "venue" => "pool-slug",
            reference->_type == "timetable" => "schedule",
			"index"
		),
		"slug": reference->slug.current,
		"refType": reference->_type,
		"parentSlug": select(
			reference->_type == "set" => *[_type == "show" && references(^.reference._ref)][0].slug.current,
			null
		),
		"setSlug": select(
			reference->_type == "set" => reference->slug.current,
			null
		),
		${LINK_PATH_FRAGMENT}
	},
	type == "external" => {
		...,
		"href": url,
		"title": coalesce(title, url),
	},
	type == "download" => {
		"href": file.asset->url
	},
	_type == "linkCookie" => {
		"linkType": "linkCookie",
	},
`;

export const SINGLE_LINK_QUERY = `{
    ...,
    type == "internal" => {
      "linkType": "linkInternal",
      "title": coalesce(
        title,
        reference->title
      ),
      "route": select(
        reference->_type == "home" => "index",
        reference->_type == "page" => "slug",
        reference->_type == "work" => "work",
        reference->_type == "project" => "work-slug",
        reference->_type == "about" => "about",
        reference->_type == "person" => "about-slug",
        "index"
      ),
      "slug": reference->slug.current
    },
    type == "external" => {
      ...,
      "href": url,
      "title": coalesce(title, url),
    },
    type == "download" => {
      "href": file.asset->url
    },
    type == "function" => {
      ...,
      "func": func
    },
    _type == "linkCookie" => {
      "linkType": "linkCookie",
    },
    _type == "none" => {
      "linkType": "none",
    }
  }`;

export const SINGLE_LINK_OPTIONAL_QUERY = `{
    ...,
    type == "internal" => {
      "linkType": "linkInternal",
      "title": coalesce(
        title,
        reference->title
      ),
      "route": select(
        reference->_type == "home" => "index",
        reference->_type == "page" => "slug",
        reference->_type == "work" => "work",
        reference->_type == "project" => "work-slug",
        reference->_type == "about" => "about",
        reference->_type == "person" => "about-slug",
        "index"
      ),
      "slug": reference->slug.current
    },
    type == "external" => {
      ...,
      "href": url,
      "title": coalesce(title, url),
    },
    type == "download" => {
      "href": file.asset->url
    },
    type == "function" => {
      ...,
      "func": func
    },
  }`;

export const RICH_TEXT_QUERY = `{
	...,
	_type == "block" => {
		...
	},
	markDefs[] {
		...,
		${LINK_QUERY}
	},
	_type == "module.media" => {
		...,
		image ${IMAGE_QUERY},
		video ${IMAGE_QUERY},
	},
	_type == "module.carousel" => {
		...,
		slides[] {
			...,
			image ${IMAGE_QUERY},
			video ${IMAGE_QUERY},
		}
	},
}`;

/** Projection for internationalizedArray* rich text wrapper items. */
export const I18N_RICH_TEXT_VALUE_QUERY = `{
	...,
	value[] ${RICH_TEXT_QUERY}
}`;

/**
 * Set projection for "list view" contexts (Related/More sections, sibling
 * episodes). Deliberately omits content[] and parentShow.content[] which
 * doubled per-set payload by pulling the show's rich text for every item.
 * Used inside sets[]-> sub-projections in SHOW_QUERY, SET_QUERY and the
 * shows[].sets[] chain in POOL_PROFILE_QUERY.
 */
export const SET_LIST_ITEM_QUERY = `{
	_id,
	_type,
	title,
	slug,
	datetime,
	image ${IMAGE_QUERY},
	"soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
	persons[]->{ ${PERSON_LINK_FRAGMENT} },
	"tags": tags[]->{
		_id,
		_type,
		title,
		short
	} | order(lower(title)),
	"parentShow": *[_type == "show" && slug.current != "no-show" && references(^._id)][0]{
		${PARENT_SHOW_LINK_FRAGMENT}
	},
	${SITE_PATH_FRAGMENT}
}`;

/** Slim set projection for archive cover-flow slider (autoLoad). */
export const SET_COVER_FLOW_SLIDER_ITEM_QUERY = `{
	_id,
	_type,
	title,
	slug,
	datetime,
	_updatedAt,
	// Full track projection (array shape) so the cover-flow play button can set
	// a playable track on the store — matching SET_LIST_ITEM_QUERY used by the
	// content grid/teaser. A bare tracks[0]{…} projects an object, so the
	// consumers' tracks[0] access was undefined and playback never started.
	"soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
	persons[]->{
		${PERSON_LINK_FRAGMENT}
	},
	"tags": tags[]->{
		_id,
		title
	} | order(lower(title)),
	"parentShow": *[_type == "show" && slug.current != "no-show" && references(^._id)][0]{
		${PARENT_SHOW_LINK_FRAGMENT}
	},
	${SITE_PATH_FRAGMENT}
}`;

/** Slim article projection for archive cover-flow slider (autoLoad). */
export const ARTICLE_COVER_FLOW_SLIDER_ITEM_QUERY = `{
	_id,
	_type,
	title,
	slug,
	image ${IMAGE_QUERY},
	datetime,
	useTeaserText,
	textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
	"tags": tags[]->{
		_id,
		title
	} | order(lower(title)),
	${SITE_PATH_FRAGMENT}
}`;

/** Slim pool profile projection for archive cover-flow slider (autoLoad). */
export const POOL_COVER_FLOW_SLIDER_ITEM_QUERY = `{
	_id,
	_type,
	title,
	name,
	slug,
	image ${IMAGE_QUERY},
	"tags": tags[]->{
		_id,
		_type,
		title
	} | order(lower(title)),
	location,
	useTeaserText,
	textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
	text[] ${I18N_RICH_TEXT_VALUE_QUERY},
	description[] ${I18N_RICH_TEXT_VALUE_QUERY},
	${SITE_PATH_FRAGMENT}
}`;

export const TAG_QUERY = `
    "availableTags": {
        "genres": *[_type == 'tag.genre']| order(lower(title)) {
            _id,
            _type,
            title,
            "subGenres": subGenres[]->{
                _id,
                _type,
                title
            }
        },
        "subGenres": *[_type == 'tag.subGenre']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "cities": *[_type == 'tag.city']| order(lower(title)) {
            _id,
            _type,
            title,
            short
        },
        "global": *[_type == 'tag.global']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "mood": *[_type == 'tag.mood']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "venue": *[_type == 'tag.venue']| order(lower(title)) {
            _id,
            _type,
            title,
            short
        },
        "musician": *[_type == 'tag.musician']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "article": *[_type == 'tag.article']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "service": *[_type == 'tag.service']| order(lower(title)) {
            _id,
            _type,
            title
        },
        "crafts": *[_type == 'tag.crafts']| order(lower(title)) {
            _id,
            _type,
            title
        }
    }`;

export const MODULE_QUERY = `{
    _type == "module.heroSlider" => {
        ...,
        slides[] {
            ...,
        layout,
        type,
        title,
        text[] ${I18N_RICH_TEXT_VALUE_QUERY},
        link ${SINGLE_LINK_OPTIONAL_QUERY},
        contentReference -> {
            ...,
            _type,
            _id,
            title,
            slug,
            image ${IMAGE_QUERY},
            bio ${RICH_TEXT_QUERY},
            text[] ${I18N_RICH_TEXT_VALUE_QUERY},
            description[] ${I18N_RICH_TEXT_VALUE_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title
            } | order(lower(title)),
            "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
            persons[]->{
                    ${PERSON_LINK_FRAGMENT}
            },
            "parentShow": *[_type == "show" && slug.current != "no-show" && references(^._id)][0]{
                    ${PARENT_SHOW_LINK_FRAGMENT}
            },
            ${SITE_PATH_FRAGMENT}
        }
        }
    },
    _type == "module.heroEntry" => {
        ...,
        layout,
        type,
        title,
        text[] ${I18N_RICH_TEXT_VALUE_QUERY},
        link ${SINGLE_LINK_OPTIONAL_QUERY},
        contentReference -> {
            ...,
            _type,
            _id,
            title,
            slug,
            image ${IMAGE_QUERY},
            bio ${RICH_TEXT_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title
            }| order(lower(title)),
            "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
            persons[]->{
                    ${PERSON_LINK_FRAGMENT}
            },
            "parentShow": *[_type == "show" && slug.current != "no-show" && references(^._id)][0]{
                    ${PARENT_SHOW_LINK_FRAGMENT},
                     "city": *[_type == "show" && slug.current != "no-show" && references(^._id)][0]{
                        ...,
                        title,
                    }
            },
            ${SITE_PATH_FRAGMENT}
        }
    },
	_type == "module.contentReferenceSlider" => {
        ...,
        title,
        type,
        style,
        count,
        poolContentType,
        showTags,
        autoLoad,
        setsContentType[]->{
            ...,
            _id,
            _type,
            title,
            slug,
        },
        // Content items removed - modules self-load with caching
        "poolItems": [],
        "articleItems": [],
        "showItems": [],
        "setItems": []
    },
    _type == "module.contentReferenceGrid" => {
        ...,
        title,
        type,
        style,
        count,
        poolContentType,
        showTags,
        autoLoad,
        ${TAG_QUERY},
        // Content items removed - modules self-load with caching
        "poolItems": [],
        "articleItems": [],
        "showItems": [],
        "setItems": []
    },
}`;

export const SEO_QUERY = `
	"seo": {
		"pageTitle": *[_type == "siteSettings"][0].title,
		"title": coalesce(seo.title, title, *[_type == "siteSettings"][0].title),
		"metaDescription": coalesce(seo.description, *[_type == "siteSettings"][0].seo.description),
		"ogImage": coalesce(
			seo.image.asset->url + "?w=1200&h=630&fit=crop&auto=format&fm=jpg",
			*[_type == "siteSettings"][0].seo.image.asset->url + "?w=1200&h=630&fit=crop&auto=format&fm=jpg"
		)
	}
`;
