import {article} from './article'
import {artist} from './artist'
import {page} from './page'
import {set} from './set'
import {show} from './show'
import {venue} from './venue'
//categories
import {category} from './category/category'
import {subCategory} from './category/subCategory'
// tags
import {tagArticle} from './tags/tagArticle'
import {tagArtist} from './tags/tagArtist'
import {tagCity} from './tags/tagCity'
import {tagGenre} from './tags/global/genre'
import {tagGlobal} from './tags/global/global'
import {tagShow} from './tags/tagShow'
import {tagSubGenre} from './tags/global/subGenre'

export const documents = [
  artist,
  article,
  page,
  show,
  set,
  venue,
  category,
  subCategory,
  tagArticle,
  tagArtist,
  tagCity,
  tagGenre,
  tagGlobal,
  tagShow,
  tagSubGenre,
]
