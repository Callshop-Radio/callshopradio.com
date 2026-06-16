import {
  EyeOpenIcon,
  HighlightIcon,
  SearchIcon,
  StarIcon,
  TextIcon,
} from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "@/utils/validateSlug";

export const category = defineType({
  name: "category",
  type: "document",
  title: "Category",
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
      title: "Titel",
      name: "title",
      type: "string",
    },
    {
      title: "Sub Categories",
      name: "subCategories",
      type: "array",
      of: [
        {
          title: "Sub Category",
          type: "reference",
          to: [{ type: "category.sub" }],
          options: {
            disableNew: false,
          },
        },
      ],
      validation: (Rule) => Rule.unique(),
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
