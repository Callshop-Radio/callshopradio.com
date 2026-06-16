import { SearchIcon, TagIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const tagMusician = defineType({
  name: "tag.musician",
  type: "document",
  title: "Musician Tag",
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
