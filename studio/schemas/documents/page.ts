import { CogIcon, DocumentTextIcon, SearchIcon, TextIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { validateSlug } from "@/utils/validateSlug";

export const page = defineType({
  name: "page",
  type: "document",
  title: "Page",
  icon: DocumentTextIcon,
  groups: [
    { title: "Editorial", name: "editorial", icon: TextIcon },
    { title: "Settings", name: "settings", icon: CogIcon },
    { title: "SEO", name: "seo", icon: SearchIcon },
  ],
  fields: [
    {
      title: "Title",
      name: "title",
      type: "string",
      group: "editorial",
    },
    {
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: validateSlug,
      group: "editorial",
    },
    {
      title: "Content",
      name: "content",
      type: "internationalizedArrayRichTextMedia",
      group: "editorial",
    },
    {
      title: "Modules",
      name: "modules",
      type: "modules",
      group: "editorial",
    },
    {
      title: "SEO",
      name: "seo",
      type: "seo.page",
      group: "seo",
    },
  ],
  preview: {
    select: { title: "title" },
    prepare(selection) {
      return { title: selection.title };
    },
  },
});
