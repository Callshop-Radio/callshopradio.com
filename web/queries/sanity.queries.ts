import {
  LINK_QUERY,
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
