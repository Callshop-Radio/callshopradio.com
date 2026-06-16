import { article } from "./article";
import { category } from "./category/category";
import { subCategory } from "./category/subCategory";
import { page } from "./page";
import { person } from "./person";
import { set } from "./set";
import { show } from "./show";
import { tagGenre } from "./tags/global/genre";
import { tagGlobal } from "./tags/global/global";
import { tagSubGenre } from "./tags/global/subGenre";
import { tagCity } from "./tags/global/tagCity";
import { tagArticle } from "./tags/tagArticle";
import { tagCrafts } from "./tags/tagCrafts";
import { tagMood } from "./tags/tagMood";
import { tagMusician } from "./tags/tagMusician";
import { tagService } from "./tags/tagService";
import { tagVenue } from "./tags/tagVenue";
import { venue } from "./venue";

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
];
