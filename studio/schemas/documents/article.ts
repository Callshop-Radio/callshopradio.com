import {
  CogIcon,
  DocumentTextIcon,
  EditIcon,
  SearchIcon,
  TagIcon,
  TextIcon,
  TransferIcon,
} from "@sanity/icons";
import { defineType } from "sanity";
import { validateSlug } from "@/utils/validateSlug";

export const article = defineType({
  name: "article",
  type: "document",
  title: "Article",
  icon: EditIcon,
  groups: [
    {
      title: "Editorial",
      name: "editorial",
      icon: TextIcon,
    },
    {
      title: "Tags",
      name: "tags",
      icon: TagIcon,
    },
    {
      title: "Related",
      name: "related",
      icon: TransferIcon,
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
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: validateSlug,
      group: "editorial",
    },
    {
      name: "datetime",
      type: "datetime",
      description:
        'If no date is chosen the website will use "date created" instead.',
      title: "Date",
      group: "editorial",
    },
    {
      title: "Article Main Image",
      name: "image",
      type: "image",
      group: "editorial",
    },
    {
      title: "Socials",
      name: "socials",
      type: "object",
      group: "editorial",
      fields: [
        {
          name: "instagram",
          type: "url",
          title: "Instagram",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === "external" && !value) {
                return "This field is required";
              }
              return true;
            }).uri({ scheme: ["http", "https", "www"] }),
        },
        {
          name: "soundcloud",
          type: "url",
          title: "Soundcloud",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === "external" && !value) {
                return "This field is required";
              }
              return true;
            }).uri({ scheme: ["http", "https", "www"] }),
        },
        {
          name: "nina",
          type: "url",
          title: "Nina",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === "external" && !value) {
                return "This field is required";
              }
              return true;
            }).uri({ scheme: ["http", "https", "www"] }),
        },
        {
          name: "bandcamp",
          type: "url",
          title: "Bandcamp",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === "external" && !value) {
                return "This field is required";
              }
              return true;
            }).uri({ scheme: ["http", "https", "www"] }),
        },
        {
          name: "web",
          type: "url",
          title: "Website",
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === "external" && !value) {
                return "This field is required";
              }
              return true;
            }).uri({ scheme: ["http", "https", "www"] }),
        },
      ],
    },
    {
      title: "Article Text",
      name: "text",
      type: "internationalizedArrayRichTextMedia",
      group: "editorial",
    },
    {
      title: "Use alternative teaser text",
      type: "boolean",
      name: "useTeaserText",
      initialValue: false,
      options: { layout: "checkbox" },
      group: "editorial",
    },
    {
      title: "Teaser Text",
      name: "textTeaser",
      description:
        'Will be used for content preview alongside the webste. If empty or not used,"Article Text" will be used for preview.',
      type: "internationalizedArrayRichText",
      group: "editorial",
      hidden: ({ parent }) => parent?.useTeaserText !== true,
    },
    {
      name: "contentReferences",
      title: "Article References",
      type: "array",
      description:
        "Persons, shows or locals the article is about/referring to.",
      group: "related",
      of: [
        {
          name: "contentReference",
          type: "reference",
          title: "Content Reference",
          to: [{ type: "person" }, { type: "show" }, { type: "venue" }],
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
      title: "Auto Load Related Articles",
      name: "autoRelatedArticles",
      description:
        "Related articles will be automatically generated from tags & categories. Disable to choose related articles manually.",
      type: "boolean",
      initialValue: true,
      group: "related",
      options: { layout: "checkbox" },
    },
    {
      name: "relatedArticles",
      title: "Related Content",
      type: "array",
      group: "related",
      of: [
        {
          name: "relatedArticle",
          type: "reference",
          title: "Refers to:",
          // validation: (Rule) => Rule.required(),
          to: [{ type: "article" }],
        },
      ],
      hidden: ({ parent }) => parent?.autoRelatedArticles !== false,
    },
    {
      title: "Tags",
      name: "tags",
      type: "array",
      group: "tags",
      of: [
        {
          name: "tag",
          type: "reference",
          title: "Tags",
          to: [
            { type: "tag.global" },
            { type: "tag.article" },
            { type: "tag.city" },
            { type: "tag.subGenre" },
          ],
        },
      ],
    },
    // {
    //   name: 'categories',
    //   title: 'Categories',
    //   type: 'array',
    //   group: 'tags',
    //   of: [
    //     {
    //       name: 'category',
    //       type: 'reference',
    //       title: 'Categories',
    //       to: [{type: 'category.sub'}],
    //       options: { disableNew: true}
    //     },
    //   ],
    // },
    // {
    //   title: 'Pool Visibility',
    //   name: 'poolVisibility',
    //   type: 'boolean',
    //   group: 'settings',
    //   initialValue: true,
    //   group: 'settings',
    // },
    // {
    //   name: 'category',
    //   type: 'reference',
    //   title: 'Category',
    //   validation: (Rule) => Rule.required(),
    //   to: {type: 'category.sub'},
    //   group: 'editorial',
    // },
    // {
    //   name: 'tags',
    //   type: 'reference',
    //   title: 'Category',
    //   validation: (Rule) => Rule.required(),
    //   to: {type: 'tag'},
    //   group: 'editorial',
    // },
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
