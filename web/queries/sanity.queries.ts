import {
  LINK_QUERY,
  IMAGE_QUERY,
  RICH_TEXT_QUERY,
  SEO_QUERY,
  MODULE_QUERY,
} from "./sanity.snippets";

export const SITEMAP_QUERY = `
*[_type in ["home", "page"]] | order(_updatedAt desc)[] {
  "modifiedAt": _updatedAt,
  "loc": "/" + slug.current,
  _type == "home" => {
    "loc": "/",
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
  content[] ${RICH_TEXT_QUERY},
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
    count,
    "pool": select(
      autoLoad == true => *[_type in ['person', 'venue'] && poolVisibility == true] | order(_updatedAt desc) {
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
          "tags": tags[]->{
              ...,
              _id,
              title
          }| order(lower(title)),
          location,
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
        waveform_url,
        stream_url,
        playback_count,
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
    count,
    "sets": select(
            autoLoad == true => *[_type == 'set' && datetime != null] | order(datetime desc) {
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
      },
    },
    "parentShow": *[_type == "show" && references(^._id)][0]{
          ...,
          _id,
          title,
          slug,
          image { asset-> },
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
        waveform_url,
        stream_url,
        playback_count,
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
