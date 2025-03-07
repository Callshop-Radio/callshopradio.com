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

export const MODULE_QUERY = `{
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
            type == 'pool' && autoLoad == true => *[_type in ['person', 'venue']] | order(_updatedAt desc) {
                ...,
                _id,
                _type,
                title,
                name,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                },
                location
            },
            pool[]->{
                ...,
                _id,
                _type,
                title,
                name,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                },
                location
            }
        ),
        "articleItems": select(
            type == 'words' && autoLoad == true => *[_type == 'article'] | order(publishedAt desc) {
                _id,
                _type,
                title,
                slug,
                publishedAt,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }
            },
            articles[]->{
                _id,
                _type,
                title,
                slug,
                publishedAt,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }
            }
        ),
        "showItems": select(
            type == 'shows' && autoLoad == true => *[_type == 'show'] | order(publishedAt desc) {
                _id,
                _type,
                title,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }
            },
            shows[]->{
                _id,
                _type,
                title,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }
            }
        ),
        "setItems": select(
            type == 'sets' && autoLoad == true && count(setsContentType) == 0 => *[_type == 'set'] | order(publishedAt desc) {
                _id,
                _type,
                title,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                },
                "genres": genres[]->{
                    ...,
                    _id,
                    title
                }
            },
            type == 'sets' && autoLoad == true && count(setsContentType) > 0 => *[_type == 'set' && count(genres[]->_id in ^.^.setsContentType[]->_id) > 0] | order(publishedAt desc) {
                _id,
                _type,
                title,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                },
                "genres": genres[]->{
                    ...,
                    _id,
                    title
                }
            },
            sets[]->{
                _id,
                _type,
                title,
                slug,
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                },
                "genres": genres[]->{
                    ...,
                    _id,
                    title
                }
            }
        )
    }
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
