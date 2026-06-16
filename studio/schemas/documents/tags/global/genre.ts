import { SearchIcon, TagIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const tagGenre = defineType({
  name: "tag.genre",
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
    {
      title: "Sub Genres",
      name: "subGenres",
      type: "array",
      of: [
        {
          title: "Sub Genre",
          type: "reference",
          to: [{ type: "tag.subGenre" }],
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
