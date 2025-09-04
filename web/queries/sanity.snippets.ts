export const IMAGE_QUERY = `{
  ...,
  "alt": asset->altText,
	asset->,
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
        "poolItems": select(
            type == 'pool' && autoLoad == true => *[_type in ['person', 'venue'] && poolVisibility == true] | order(_updatedAt desc) {
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
                }| order(lower(title)),
                location
            },
            pool[]->{
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
                }| order(lower(title)),
                location,
            }
        ),
        "articleItems": select(
            type == 'words' && autoLoad == true => *[_type == 'article'] | order(datetime desc) {
                ...,
                _id,
                _type,
                title,
                datetime,
                slug,
                useTeaserText,
                textTeaser[] ${RICH_TEXT_QUERY},
                text[] ${RICH_TEXT_QUERY},
                _updatedAt,
                _createdAt,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
            },
            articles[]->{
                ...,
                _id,
                _type,
                title,
                slug,
                datetime,
                useTeaserText,
                textTeaser[] ${RICH_TEXT_QUERY},
                text[] ${RICH_TEXT_QUERY},
                _updatedAt,
                _createdAt,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }
            }
        ),
        "showItems": select(
            type == 'shows' && autoLoad == true => *[_type == 'show'] | order(datetime desc) {
                _id,
                _type,
                title,
                slug,
                datetime,
                _updatedAt,
                _createdAt,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
            },
            shows[]->{
                ...,
                _id,
                _type,
                title,
                slug,
                datetime,
                _updatedAt,
                _createdAt,
                image { asset-> },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
            }
        ),
        "setItems": select(
            type == 'sets' && autoLoad == true => *[_type == 'set' && datetime != null] | order(datetime desc) {
                ...,
                _id,
                _type,
                title,
                slug,
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
                    title
                }| order(lower(title)),
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
                    "city": *[_type == "tag.city" && references(^._id)][0]{
                        _id,
                        _type,
                        title,
                        short
                    },
                }
            },
            sets[]->{
                _id,
                _type,
                title,
                slug,
                datetime,
                _updatedAt,
                _createdAt,
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
                persons[]->{
                    ...,
                    _id,
                    title
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                "parentShow": *[_type == "show" && references(^._id)][0]{
                    ...,
                    _id,
                    title,
                    slug,
                    image { asset-> },
                }
            }
        )
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
        "poolItems": *[_type in ['person', 'venue'] && poolVisibility == true] | order(_updatedAt desc) {
            ...,
            _id,
            _type,
            title,
            name,
            slug,
            image ${IMAGE_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title,
                short
            }| order(lower(title)),
            location
        },
        "articleItems": *[_type == 'article'] | order(_updatedAt desc){
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
            _updatedAt,
            "tags": tags[]->{
                ...,
                _id,
                title,
                short
            }| order(lower(title)),
        },
        "showItems": *[_type == 'show'] | order(datetime desc) {
            ...,
            _id,
            _type,
            title,
            slug,
            image ${IMAGE_QUERY},
            description ${RICH_TEXT_QUERY},
            "tags": tags[]->{
                ...,
                _id,
                title,
                short
            }| order(lower(title)),
        },
        "setItems": *[_type == 'set'] | order(datetime desc){
            ...,
            _id,
            _type,
            title,
            slug,
            datetime,
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
                title,
                short
            }| order(lower(title)),
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
                }| order(lower(title)),
            }
        }
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
