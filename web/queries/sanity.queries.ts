import { defineQuery } from "groq";
import {
	I18N_RICH_TEXT_VALUE_QUERY,
	IMAGE_QUERY,
	LINK_QUERY,
	MODULE_QUERY,
	PARENT_SHOW_LINK_FRAGMENT,
	PERSON_LINK_FRAGMENT,
	SEO_QUERY,
	SET_LIST_ITEM_QUERY,
	SITE_PATH_FRAGMENT,
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
  ${SITE_PATH_FRAGMENT},
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
  // Additional information for better URL generation
  _type == "set" => {
    "show": show->{
      "slug": slug.current
    }
  }
}`;

export const HOMEPAGE_QUERY = `
*[_type == "home"] | order(_updatedAt desc)[0] {
  ...,
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;

export const SLUG_PAGE_QUERY = `
*[_type == "page" && slug.current == $slug] | order(_updatedAt desc)[0] {
  ...,
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY}
}`;

export const SCHEDULE_QUERY = `
*[_type == "timetable"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
  modules [] ${MODULE_QUERY},
  ${SEO_QUERY},
}`;

export const POOLARCHIVE_QUERY = `
*[_type == "pool"] | order(_updatedAt desc)[0] {
  ...,
  backgroundImage ${IMAGE_QUERY},
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
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
          textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
          text[] ${I18N_RICH_TEXT_VALUE_QUERY},
          description[] ${I18N_RICH_TEXT_VALUE_QUERY},
          socials {
            instagram,
            soundcloud,
            nina,
            bandcamp,
            web
          },
          ${SITE_PATH_FRAGMENT}
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
    description[] ${I18N_RICH_TEXT_VALUE_QUERY},
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
    // Add contact data
    contact,
    // Add social media profiles
    socials {
      instagram,
      soundcloud,
      nina,
      bandcamp,
      web
    },
    // Shows for persons and venues
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
      ${SITE_PATH_FRAGMENT},
       sets[]-> ${SET_LIST_ITEM_QUERY} | order(datetime desc)[0...3]
    },
    // Add persons for venues
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
        }| order(lower(title)),
        ${SITE_PATH_FRAGMENT}
      }
    },
    // Add venues for persons
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
        }| order(lower(title)),
        ${SITE_PATH_FRAGMENT}
      }
    },
    modules[] ${MODULE_QUERY},
    "relatedSets": *[_type in ['set'] && references(^._id)] | order(datetime desc) [0...99] ${SET_LIST_ITEM_QUERY},
  "moreContent": *[_type in ['set',] && references(^._id)] | order(datetime desc) [0...99] ${SET_LIST_ITEM_QUERY},
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
    _id,
    _type,
    title,
    name,
    slug,
    image ${IMAGE_QUERY},
    location,
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    ${SITE_PATH_FRAGMENT},
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
                    ${PERSON_LINK_FRAGMENT}
                },
                "tags": tags[]->{
                    ...,
                    _id,
                    title
                }| order(lower(title)),
                "parentShow": *[_type == "show" && references(^._id)][0]{
                    ${PARENT_SHOW_LINK_FRAGMENT}
                },
                ${SITE_PATH_FRAGMENT}
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
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
  modules [] ${MODULE_QUERY},
  sets[]-> ${SET_LIST_ITEM_QUERY} | order(datetime desc),
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
    }| order(lower(title)),
    ${SITE_PATH_FRAGMENT}
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
    }| order(lower(title)),
    ${SITE_PATH_FRAGMENT}
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
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
  modules[] ${MODULE_QUERY},
  "soundcloud": ${SOUNDCLOUD_TRACKS_QUERY},
  "tags": tags[]->{
    ...,
    _id,
    title,
    short
  }| order(lower(title)),
  persons[]->{
    ${PERSON_LINK_FRAGMENT}
  },
  "parentShow": *[_type == "show" && references(^._id)][0]{
    ...,
    _id,
    title,
    slug,
    image { asset-> },
    ${SITE_PATH_FRAGMENT},
    sets[]-> ${SET_LIST_ITEM_QUERY}
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
      ${PERSON_LINK_FRAGMENT}
    },
    "tags": tags[]->{
      _id,
      _type,
      title,
      short
    }| order(lower(title)),
    "parentShow": *[_type == "show" && references(^._id)][0]{
      ${PARENT_SHOW_LINK_FRAGMENT}
    },
    ${SITE_PATH_FRAGMENT},
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
                text[] ${I18N_RICH_TEXT_VALUE_QUERY},
                datetime,
                useTeaserText,
                textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
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
                    ${PERSON_LINK_FRAGMENT}
                },
                ${SITE_PATH_FRAGMENT}
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
    text[] ${I18N_RICH_TEXT_VALUE_QUERY},
    datetime,
    useTeaserText,
    textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
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
        ${PERSON_LINK_FRAGMENT}
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
        _id,
        _type,
        title,
        slug,
        image ${IMAGE_QUERY},
        datetime,
        useTeaserText,
        textTeaser[] ${I18N_RICH_TEXT_VALUE_QUERY},
        persons[]->{
            ${PERSON_LINK_FRAGMENT}
        },
        "tags": tags[]->{
            _id,
            _type,
            title,
            short
        }| order(lower(title)),
        ${SITE_PATH_FRAGMENT},
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
		"schedulePageRefType": schedulePage->_type,
		"schedulePageParentSlug": select(
			schedulePage->_type == "set" => *[_type == "show" && references(^.schedulePage._ref)][0].slug.current,
			null
		),
		"schedulePageSetSlug": select(
			schedulePage->_type == "set" => schedulePage->slug.current,
			null
		),
		"schedulePagePath": select(
			!defined(schedulePage._ref) => "/schedule",
			schedulePage->_type == "home" => "/",
			schedulePage->_type == "page" => "/" + schedulePage->slug.current,
			schedulePage->_type == "showsArchive" => "/shows",
			schedulePage->_type == "show" => "/shows/" + schedulePage->slug.current,
			schedulePage->_type == "set" => "/shows/" + *[_type == "show" && references(^.schedulePage._ref)][0].slug.current + "/" + schedulePage->slug.current,
			schedulePage->_type == "words" => "/words",
			schedulePage->_type == "article" => "/words/" + schedulePage->slug.current,
			schedulePage->_type == "pool" => "/pool",
			schedulePage->_type == "person" => "/pool/" + schedulePage->slug.current,
			schedulePage->_type == "venue" => "/pool/" + schedulePage->slug.current,
			schedulePage->_type == "timetable" => "/schedule",
			"/schedule"
		),
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
        description[] ${I18N_RICH_TEXT_VALUE_QUERY},
    },
    fallbackPerson {
         ...,
        image { asset-> },
        description[] ${I18N_RICH_TEXT_VALUE_QUERY},
    },
    fallbackSet {
      ...,
      image { asset-> },
      description[] ${I18N_RICH_TEXT_VALUE_QUERY},
    },
    fallbackShow {
      ...,
      image { asset-> },
      description[] ${I18N_RICH_TEXT_VALUE_QUERY},
    },
    fallbackVenue {
        ...,
        image { asset-> },
        description[] ${I18N_RICH_TEXT_VALUE_QUERY},
    }
  }
}`;

export const ERROR_PAGE_QUERY = defineQuery(`
*[_type == "error"][0] {
  ...,
  content[] ${I18N_RICH_TEXT_VALUE_QUERY},
}
`);
