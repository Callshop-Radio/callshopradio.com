import {article} from './article'
import {person} from './person'
import {page} from './page'
import {set} from './set'
import {show} from './show'
import {venue} from './venue'
//categories
import {category} from './category/category'
import {subCategory} from './category/subCategory'
// tags
import {tagArticle} from './tags/tagArticle'
import {tagCrafts} from './tags/tagCrafts'
import {tagCity} from './tags/global/tagCity'
import {tagGenre} from './tags/global/genre'
import {tagGlobal} from './tags/global/global'
import {tagVenue} from './tags/tagVenue'
import {tagMusician} from './tags/tagMusician'
import {tagService} from './tags/tagService'
import {tagMood} from './tags/tagMood'
import {tagSubGenre} from './tags/global/subGenre'

export const documents = [
  person,
  article,
  page,
  show,
  set,
  venue,
  category,
  subCategory,
  tagArticle,
  tagCrafts,
  tagCity,
  tagGenre,
  tagGlobal,
  tagVenue,
  tagMusician,
  tagService,
  tagMood,
  tagSubGenre,
]
