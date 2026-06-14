import {
  EyeOpenIcon,
  SearchIcon,
  StarIcon,
  TagIcon,
  TextIcon,
} from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "@/utils/validateSlug";

export const tagSubGenre = defineType({
  name: "tag.subGenre",
  type: "document",
  title: "Genre",
  icon: TagIcon,
  groups: [
    {
      title: "SEO",
      name: "seo",
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
    },
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare(selection) {
      const { title } = selection;
      return {
        title: title,
      };
    },
  },
});
