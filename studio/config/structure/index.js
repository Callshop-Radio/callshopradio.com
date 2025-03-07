import {StarIcon, TagsIcon, ControlsIcon, EditIcon, PlayIcon} from '@sanity/icons'

import {articles} from './items/articles'
import {articleTags} from './items/articleTags'
import {craftTags} from './items/craftTags'
import {categories} from './items/categories'
import {cityTags} from './items/cityTags'
import {error} from './items/error'
import {globalTags} from './items/globalTags'
import {genres} from './items/genres'
import {home} from './items/home'
import {venues} from './items/venues'
import {localTags} from './items/localTags'
import {musicianTags} from './items/musicianTags'
import {words} from './items/words'
import {pages} from './items/pages'
import {persons} from './items/persons'
import {pool} from './items/pool'
import {serviceTags} from './items/serviceTags'
import {sets} from './items/sets'
import {shows} from './items/shows'
import {showsArchive} from './items/showsArchive'
import {moodTags} from './items/moodTags'
import {siteCookieBanner} from './items/siteCookieBanner'
import {siteNav} from './items/siteNav'
import {siteFallbacks} from './items/siteFallbacks'
import {siteSettings} from './items/siteSettings'
import {timetable} from './items/timetable'

const hiddenDocTypes = (listItem) => {
  const id = listItem.getId()

  if (!id) {
    return false
  }

  return ![
    'error',
    'person',
    'article',
    'category',
    'category.sub',
    'fallback.content',
    'fallbackGlobal',
    'tag.article',
    'tag.crafts',
    'tag.city',
    'tag.genre',
    'tag.global',
    'tag.venue',
    'tag.musician',
    'tag.service',
    'tag.mood',
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
            .items([pool(S), persons(S), venues(S)]),
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
            .items([
              globalTags(S),
              S.divider(),
              cityTags(S),
              genres(S),
              S.divider(),
              articleTags(S),
              craftTags(S),
              localTags(S),
              musicianTags(S),
              serviceTags(S),
              moodTags(S),
            ]),
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
