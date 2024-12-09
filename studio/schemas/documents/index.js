import {article} from './article'
import {person} from './person'
import {page} from './page'
import {set} from './set'
import {show} from './show'
import {local} from './local'
//categories
import {category} from './category/category'
import {subCategory} from './category/subCategory'
// tags
import {tagArticle} from './tags/tagArticle'
import {tagArtist} from './tags/tagArtist'
import {tagCity} from './tags/global/tagCity'
import {tagGenre} from './tags/global/genre'
import {tagGlobal} from './tags/global/global'
import {tagLocal} from './tags/tagLocal'
import {tagMusician} from './tags/tagMusician'
import {tagService} from './tags/tagService'
import {tagShow} from './tags/tagShow'
import {tagSubGenre} from './tags/global/subGenre'

export const documents = [
  person,
  article,
  page,
  show,
  set,
  local,
  category,
  subCategory,
  tagArticle,
  tagArtist,
  tagCity,
  tagGenre,
  tagGlobal,
  tagLocal,
  tagMusician,
  tagService,
  tagShow,
  tagSubGenre,
]
