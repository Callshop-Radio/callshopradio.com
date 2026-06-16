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
		)
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
/** Slim set projection for archive cover-flow slider (autoLoad). */
export const SET_COVER_FLOW_SLIDER_ITEM_QUERY = `{
	_id,
	_type,
	title,
	slug,
	datetime,
	_updatedAt,
	"soundcloud": soundcloud{
		"tracks": tracks[0]{ id, artwork_url }
	},
	persons[]->{
		_id,
		_key,
		title,
		slug,
		poolVisibility
	},
	"tags": tags[]->{
		_id,
		title
	} | order(lower(title)),
	"parentShow": *[_type == "show" && references(^._id)][0]{
		_id,
		title,
		slug,
		image { asset-> }
	}
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
	textTeaser[] ${RICH_TEXT_QUERY},
	"tags": tags[]->{
		_id,
		title
	} | order(lower(title))
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
	textTeaser[] ${RICH_TEXT_QUERY},
	text[] ${RICH_TEXT_QUERY},
	description[] ${RICH_TEXT_QUERY}
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
        text[] ${RICH_TEXT_QUERY},
        link ${SINGLE_LINK_OPTIONAL_QUERY},
        contentReference -> {
            ...,
            _type,
            _id,
            title,
            slug,
            image ${IMAGE_QUERY},
            bio ${RICH_TEXT_QUERY},
            text[] ${RICH_TEXT_QUERY},
            description[] ${RICH_TEXT_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title
            } | order(lower(title)),
            "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
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
            }
        }
        }
    },
    _type == "module.heroEntry" => {
        ...,
        layout,
        type,
        title,
        text[] ${RICH_TEXT_QUERY},
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
                     "city": *[_type == "show" && references(^._id)][0]{
                        ...,
                        title,
                    },
            }
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
