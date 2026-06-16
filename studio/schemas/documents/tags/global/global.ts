import {
  EyeOpenIcon,
  SearchIcon,
  StarIcon,
  TagIcon,
  TextIcon,
} from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "@/utils/validateSlug";

export const tagGlobal = defineType({
  name: "tag.global",
  type: "document",
  title: "Global Tag",
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
