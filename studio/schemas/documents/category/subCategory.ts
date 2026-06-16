import {
  EyeOpenIcon,
  HighlightIcon,
  SearchIcon,
  StarIcon,
  TextIcon,
} from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "@/utils/validateSlug";

export const subCategory = defineType({
  name: "category.sub",
  type: "document",
  title: "Sub Category",
  icon: HighlightIcon,
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
