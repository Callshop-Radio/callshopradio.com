import { CogIcon, SearchIcon, TextIcon, UlistIcon } from "@sanity/icons";
import { defineType } from "sanity";

const TITLE = "Words Page";

export const words = defineType({
  name: "words",
  type: "document",
  title: TITLE,
  icon: UlistIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
    {
      title: "Settings",
      name: "settings",
      icon: CogIcon,
    },
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
      group: "editorial",
    },
    {
      title: "Intro Slider",
      name: "slider",
      type: "object",
      group: "editorial",
      fields: [
        {
          title: "Auto load content",
          description: "Disable to manually select content.",
          name: "autoLoad",
          type: "boolean",
          initialValue: true,
          options: {
            layout: "checkbox",
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: "articles",
          title: "Articles",
          description: "Only selected content below will be displayed.",
          type: "array",
          validate: (Rule) => Rule.integer().min(2).max(10),
          hidden: ({ parent }) => parent?.autoLoad !== false,
          of: [
            {
              name: "article",
              type: "reference",
              title: "Article",
              to: [{ type: "article" }],
              options: {
                disableNew: true,
              },
            },
          ],
        },
      ],
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
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.page',
    //   group: 'settings',
    // },
    {
      name: "color",
      title: "Page Color",
      type: "color",
      group: "settings",
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      };
    },
  },
});
