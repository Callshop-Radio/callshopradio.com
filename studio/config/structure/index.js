import {StarIcon, TagsIcon, ControlsIcon, EditIcon, PlayIcon} from '@sanity/icons'

import {error} from './items/error'
import {artists} from './items/artists'
import {articles} from './items/articles'
import {articleTags} from './items/articleTags'
import {artistTags} from './items/artistTags'
import {cityTags} from './items/cityTags'
import {globalTags} from './items/globalTags'
import {categories} from './items/categories'
import {genres} from './items/genres'
import {home} from './items/home'
import {pool} from './items/pool'
import {showsArchive} from './items/showsArchive'
import {timetable} from './items/timetable'
import {words} from './items/words'
import {pages} from './items/pages'
import {sets} from './items/sets'
import {shows} from './items/shows'
import {showTags} from './items/showTags'
import {siteCookieBanner} from './items/siteCookieBanner'
import {siteNav} from './items/siteNav'
import {siteFallbacks} from './items/siteFallbacks'
import {siteSettings} from './items/siteSettings'
import {venues} from './items/venues'

const hiddenDocTypes = (listItem) => {
  const id = listItem.getId()

  if (!id) {
    return false
  }

  return ![
    'error',
    'artist',
    'article',
    'category',
    'category.sub',
    'fallback.content',
    'fallback.global',
    'tag.article',
    'tag.artist',
    'tag.city',
    'tag.genre',
    'tag.global',
    'tag.show',
    'tag.subGenre',
    'home',
    'pool',
    'show',
    'showsArchive',
    'timetable',
    'words',
    'media.tag',
    'page',
    'set',
    'siteNav',
    'siteCookieBanner',
    'siteSettings',
    'venue',
  ].includes(id)
}

export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      home(S),
      S.listItem()
        .title('Pool')
        .icon(StarIcon)
        .child(
          S.list()
            .title('Pool')
            .items([pool(S), artists(S), venues(S)]),
        ),
      S.listItem()
        .title('Shows')
        .icon(PlayIcon)
        .child(
          S.list()
            .title('Shows')
            .items([showsArchive(S), shows(S), sets(S)]),
        ),
      S.listItem()
        .title('Words')
        .icon(EditIcon)
        .child(
          S.list()
            .title('Words')
            .items([words(S), articles(S)]),
        ),
      S.divider(),
      S.listItem()
      .title('Tags')
      .icon(TagsIcon)
      .child(
        S.list()
          .title('Tags')
          .items([globalTags(S), S.divider(), genres(S),cityTags(S),S.divider(), articleTags(S), artistTags(S), showTags(S),]),
      ),
      S.divider(),
      timetable(S),
      S.divider(),
      pages(S),
      S.divider(),
      // siteNav(S),
      // siteSettings(S),
      // Settings

      S.listItem()
        .title('Settings')
        .icon(ControlsIcon)
        .child(
          S.list()
            .title('Settings')
            .items([siteSettings(S), siteNav(S), siteFallbacks(S)]),
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(hiddenDocTypes),
    ])
