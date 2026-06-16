import {
	IMAGE_QUERY,
	LINK_QUERY,
	MODULE_QUERY,
	RICH_TEXT_QUERY,
	SEO_QUERY,
	SOUNDCLOUD_TRACKS_QUERY,
} from "./sanity.snippets";

export const SITEMAP_QUERY = `
*[
  _type in [
    "home", 
    "page", 
    "show", 
    "set", 
    "person", 
    "venue", 
    "article",
    "pool", 
    "timetable", 
    "words", 
    "showsArchive"
  ] && 
  defined(slug.current) && 
  !(_id in path("drafts.**"))
] | order(_updatedAt desc) {
  _type,
  "slug": slug.current,
  "modifiedAt": _updatedAt,
  "loc": select(
    _type == "home" => "/",
    _type == "page" => "/" + slug.current,
    _type == "show" => "/shows/" + slug.current,
    _type == "set" => "/shows/" + show->slug.current + "/" + slug.current,
    _type == "person" => "/pool/" + slug.current,
    _type == "venue" => "/pool/" + slug.current,
    _type == "article" => "/words/" + slug.current,
    _type == "pool" => "/pool",
    _type == "timetable" => "/schedule",
    _type == "showsArchive" => "/shows",
    _type == "words" => "/words",
    "/" + slug.current
  ),
  "changefreq": select(
    _type == "home" => "daily",
    _type == "show" => "weekly",
    _type == "set" => "weekly",
    _type == "person" => "monthly",
    _type == "venue" => "monthly",
    _type == "article" => "weekly",
    _type == "timetable" => "daily",
    _type == "pool" => "weekly",
    _type == "showsArchive" => "daily",
    _type == "words" => "weekly",
    "monthly"
  ),
  "priority": select(
    _type == "home" => 1.0,
    _type == "show" => 0.9,
    _type == "set" => 0.8,
    _type == "person" => 0.7,
    _type == "venue" => 0.7,
    _type == "article" => 0.8,
    _type == "timetable" => 0.9,
    _type == "pool" => 0.8,
    _type == "showsArchive" => 0.9,
    _type == "words" => 0.8,
    0.8
  ),
  // Zusätzliche Informationen für bessere URL-Generierung
  _type == "set" => {
    "show": show->{
      "slug": slug.current
    }
  }
}`;

export const HOMEPAGE_QUERY = `
*[_type == "home"] | order(_updatedAt desc)[0] {
  ...,
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;

export const SLUG_PAGE_QUERY = `
*[_type == "page" && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  content[] {
    ...,
    value[] ${RICH_TEXT_QUERY},
  },
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY}
}`;

export const SCHEDULE_QUERY = `
*[_type == "timetable"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;

export const POOLARCHIVE_QUERY = `
*[_type == "pool"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    "pool": select(
      autoLoad == true => [],
      profiles[]->{
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
              _type,
              title
          }| order(lower(title)),
          location,
          useTeaserText,
          textTeaser[] ${RICH_TEXT_QUERY},
          text[] ${RICH_TEXT_QUERY},
          description[] ${RICH_TEXT_QUERY},
          socials {
            instagram,
            soundcloud,
            nina,
            bandcamp,
            web
          }
      }
    ),
  }
}`;

export const POOL_PROFILE_QUERY = `
  *[_type in ['person', 'venue'] && slug.current == $slug][0] {
    ...,
    _id,
    _type,
    title,
    name,
    slug,
    image ${IMAGE_QUERY},
    description[] ${RICH_TEXT_QUERY},
    "cityTags": *[_id in ^.tags[]._ref && _type == "tag.city"] {
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "otherTags": *[_id in ^.tags[]._ref && _type != "tag.city"] {
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "tags": tags[]->{
      ...,
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    location,
    // Kontaktdaten hinzufügen
    contact,
    // Social Media Profile hinzufügen
    socials {
      instagram,
      soundcloud,
      nina,
      bandcamp,
      web
    },
    // Shows für Personen und Veranstaltungsorte
    "shows": shows[]->{
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
       sets[]->{
                _id,
                _type,
                title,
                slug,
                "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
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
            } | order(datetime desc)[0...3]
    },
    // Personen für Veranstaltungsorte hinzufügen
    _type == 'venue' => {
      "persons": persons[]->{
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        "tags": tags[]->{
          _id,
          _type,
          title,
          short
        }| order(lower(title))
      }
    },
    // Veranstaltungsorte für Personen hinzufügen
    _type == 'person' => {
      "venues": venues[]->{
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        location,
        "tags": tags[]->{
          _id,
          _type,
          title,
          short
        }| order(lower(title))
      }
    },
    modules[] ${MODULE_QUERY},
    "relatedSets": *[_type in ['set'] && references(^._id)] | order(datetime desc) [0...99] {
      ...,
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      datetime,
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
      "parentShow": *[_type == "show" && references(^._id)][0]{
        ...,
        _id,
        title,
        slug
      },
      persons[]->{
        ...,
        _id,
        title
      },
  },
  "moreContent": *[_type in ['set',] && references(^._id)] | order(datetime desc) [0...99] {
      ...,
      _id,
      _type,
      title,
      slug,
      image ${IMAGE_QUERY},
      datetime,
      "tags": tags[]->{
        _id,
        _type,
        title,
        short
      }| order(lower(title)),
      "parentShow": *[_type == "show" && references(^._id)][0]{
        ...,
        _id,
        title,
        slug
      },
      persons[]->{
        ...,
        _id,
        title
      },
  },
"relatedContent": *[
    _type in ['person','venue'] && poolVisibility == true && 
    slug.current != $slug && 
    (
      count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0 || 
      count((persons[]->._id)[@ in ^.^.persons[]->._id]) > 0
    )
  ] | order(
    count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
    count((persons[]->._id)[@ in ^.^.persons[]->._id]) desc,
    datetime desc
  )[0...12] {
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
        artwork_url,
        stream_url,
        title
      }
    },
    persons[]->{
      _id,
      title,
      slug,
      poolVisibility
    },
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      slug,
      image { asset-> },
    },
    "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id]),
    "matchingArtistsCount": count((persons[]->._id)[@ in ^.^.persons[]->._id])
  },
    ${SEO_QUERY}
  }
`;

export const SHOWSARCHIVE_QUERY = `
*[_type == "showsArchive"] | order(_updatedAt desc)[0] {
  ...,
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    "sets": select(
            autoLoad == true => [],
            sets[]->{
                _id,
                _type,
                title,
                slug,
                "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
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
  }
}`;

export const SHOW_QUERY = `
*[_type == "show" && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  _id,
  _type,
  title,
  slug,
  image ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules [] ${MODULE_QUERY},
  sets[]->{
    ...,
    _id,
    _type,
    title,
    slug,
    datetime,
    image ${IMAGE_QUERY},
    "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
    "parentShow": *[_type == "show" && references(^._id)][0]{
          ...,
          _id,
          title,
          slug,
          image { asset-> },
          content[] ${RICH_TEXT_QUERY}
    },
    persons[]->{
      ...,
      _id,
      title,
      slug
    },
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  } | order(datetime desc),
  persons[]->{
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  },
  venues[]->{
    ...,
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    location,
    "tags": tags[]->{
      _id,
      title,
      short
    }| order(lower(title))
  },
  "tags": tags[]->{
    _id,
    _type,
    title,
    short
  }| order(lower(title)),
  socials {
    instagram,
    soundcloud,
    nina,
    bandcamp,
    web
  },
  ${SEO_QUERY}
}`;

export const SET_QUERY = `
*[_type == 'set' && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  _id,
  _type,
  title,
  additionalTitle,
  slug,
  datetime,
  image ${IMAGE_QUERY},
  content[] ${RICH_TEXT_QUERY},
  modules[] ${MODULE_QUERY},
  "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  }| order(lower(title)),
  persons[]->{
    ...,
    _id,
    title,
    slug
  },
  "parentShow": *[_type == "show" && references(^._id)][0]{
    ...,
    _id,
    title,
    slug,
    image { asset-> },
    sets[]->{
      ...,
      _id,
      _type,
      title,
      slug,
      "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
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
  },
  "relatedContent": *[
    _type == 'set' && 
    slug.current != $slug && 
    (
      count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0 || 
      count((persons[]->._id)[@ in ^.^.persons[]->._id]) > 0
    )
  ] | order(
    count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
    count((persons[]->._id)[@ in ^.^.persons[]->._id]) desc,
    datetime desc
  )[0...12] {
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
        artwork_url,
        stream_url,
        title
      }
    },
    persons[]->{
      _id,
      title,
      slug,
      poolVisibility
    },
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      slug,
      image { asset-> },
    },
    "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id]),
    "matchingArtistsCount": count((persons[]->._id)[@ in ^.^.persons[]->._id])
  },
  ${SEO_QUERY}
}`;

export const WORDS_QUERY = `
*[_type == "words"] | order(_updatedAt desc)[0] {
  ...,
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
  slider{
    ...,
    "articles": select(
            autoLoad == true => [],
            articles[]->{
                ...,
                _id,
                _type,
                title,
                slug,
                image ${IMAGE_QUERY},
                text[] ${RICH_TEXT_QUERY},
                datetime,
                useTeaserText,
                textTeaser[] ${RICH_TEXT_QUERY},
                contentReferences[]->{
                    ...,
                },
                autoRelatedArticles,
                relatedArticles[]->{
                    ...,
                },
                socials {
                  instagram,
                  soundcloud,
                  nina,
                  bandcamp,
                  web
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
            }
        )
  }
}`;

export const ENTRY_QUERY = `
*[_type == "article" && slug.current == $slug] | order(_updatedAt desc)[0] {
    ...,
    _id,
    _type,
    title,
    slug,
    image ${IMAGE_QUERY},
    text[] {
      ...,
     value[] ${RICH_TEXT_QUERY},
    },
    datetime,
    useTeaserText,
    textTeaser[] ${RICH_TEXT_QUERY},
    contentReferences[]->{
        ...,
    },
    autoRelatedArticles,
    relatedArticles[]->{
        ...,
    },
    socials {
      instagram,
      soundcloud,
      nina,
      bandcamp,
      web
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
    modules[] ${MODULE_QUERY},
    "relatedContent": *[
        _type == 'article' && 
        slug.current != $slug && 
        count((tags[]->._id)[@ in ^.^.tags[]->._id]) > 0
    ] | order(
        count((tags[]->._id)[@ in ^.^.tags[]->._id]) desc,
        datetime desc
    )[0...12] {
        ...,
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        datetime,
        useTeaserText,
        textTeaser[] ${RICH_TEXT_QUERY},
        persons[]->{
            _id,
            title,
            slug
        },
        "tags": tags[]->{
            _id,
            _type,
            title,
            short
        }| order(lower(title)),
        "matchingTagsCount": count((tags[]->._id)[@ in ^.^.tags[]->._id])
    },
    ${SEO_QUERY}
}`;

export const SITE_OPTIONS_QUERY = `{
  "siteCookieBanner" : *[_type == "siteCookieBanner"][0] {
    ...,
  },
  "siteNav" : *[_type == "siteNav"][0] {
    ...,
    mainMenu[] {
      ...,
      ${LINK_QUERY}
    },
    "schedulePageRoute": select(
			schedulePage->_type == "home" => "index",
			schedulePage->_type == "page" => "slug",
            schedulePage->_type == "showsArchive" => "shows",
            schedulePage->_type == "show" => "shows-slug",
            schedulePage->_type == "set" => "set-slug",
            schedulePage->_type == "words" => "words",
            schedulePage->_type == "article" => "words-slug",
            schedulePage->_type == "pool" => "pool",
            schedulePage->_type == "person" => "pool-slug",
            schedulePage->_type == "venue" => "pool-slug",
            schedulePage->_type == "timetable" => "schedule",
			"index"
		),
		"schedulePageSlug": schedulePage->slug.current,
    discordLink,
    footerMenu[] {
      ...,
      ${LINK_QUERY}
    }
  },
  "siteSettings" : *[_type == "siteSettings"][0] {
    ...,
    favicon {
      ...,
      asset->
    },
  },
  "siteFallbacks": *[_type == "fallbackGlobal"][0]{
    ...,
    fallbackArticle {
        ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    },
    fallbackPerson {
         ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    },
    fallbackSet {
      ...,
      image { asset-> },
      description[] ${RICH_TEXT_QUERY},
    },
    fallbackShow {
      ...,
      image { asset-> },
      description[] ${RICH_TEXT_QUERY},
    },
    fallbackVenue {
        ...,
        image { asset-> },
        description[] ${RICH_TEXT_QUERY},
    }
  }
}`;

export const ERROR_PAGE_QUERY = `
*[_type == "error"][0] {
  ...,
  content[] ${RICH_TEXT_QUERY},
}
`;

// Search autocomplete query - fetches from person, set, show, venue, article
export const SEARCH_AUTOCOMPLETE_QUERY = `
*[
  _type in ["person", "set", "show", "venue", "article"] &&
  title match $searchTerm + "*"
] | order(_updatedAt desc)[0...$limit] {
  _id,
  _type,
  title,
  "slug": slug,
  "image": image {
    asset-> {
      _id,
      url
    }
  },
  datetime,
  additionalTitle,
  _type == "set" => {
    "parentShow": *[_type == "show" && references(^._id)][0]{
      _id,
      title,
      "slug": slug.current
    }
  }
}`;
