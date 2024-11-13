import {StarIcon, PlayIcon, DocumentTextIcon, SearchIcon, TagIcon, TextIcon, CogIcon} from '@sanity/icons'

import {validateSlug} from '@/utils/validateSlug'

export const artist = {
  name: 'artist',
  type: 'document',
  title: 'Artist',
  icon: StarIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
    },
    {
      title: 'Shows & Sets',
      name: 'related',
      icon: PlayIcon,
    },
    {
      title: 'Tags',
      name: 'tags',
      icon: TagIcon,
    },
    {
      title: 'Settings',
      name: 'settings',
      icon: CogIcon,
    },
    {
      title: 'SEO',
      name: 'seo',
      icon: SearchIcon,
    },
  ],
  fieldsets: [
    {
      title: 'Pool Visibility',
      name: 'pool',
    },
  ],
  fields: [
    {
      title: 'Name',
      name: 'title',
      type: 'string',
      group: 'editorial',
    },
    {
      name: 'slug',
      type: 'slug',
      description: 'callshopradio.com/pool/artist/slug',
      options: {source: 'title'},
      validation: validateSlug,
      group: 'editorial',
      // hidden: ({parent}) => parent?.poolVisibility !== true,
    },
    {
      title: 'Image',
      name: 'image',
      type: 'image',
      group: 'editorial',
    },
    {
      title: 'Description',
      name: 'content',
      type: 'richTextMedia',
      group: 'editorial',
    },
    {
      title: 'Pool Visibility',
      name: 'poolVisibility',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
      options: {layout: 'checkbox'},
    },
    {
      name: 'shows',
      title: 'Shows',
      type: 'array',
      group: 'related',
      of: [
        {
          name: 'show',
          type: 'reference',
          title: 'Show',
          to: [{type: 'show'}],
          options: {
            disableNew: true,
          },
        },
      ],
    },
    {
      name: 'sets',
      title: 'Featured Sets',
      type: 'array',
      group: 'related',
      of: [
        {
          name: 'set',
          type: 'reference',
          title: 'Set',
          to: [{type: 'set'}],
          options: {
            disableNew: true,
          },
        },
      ],
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'tags',
      of: [
        {
          name: 'tag',
          type: 'reference',
          title: 'Tag',
          to: [{type: 'tag.global'}, {type: 'tag.subGenre'}, {type: 'tag.city'}],
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
    //       title: 'Category',
    //       to: [{type: 'category.sub'}],
    //       options: { disableNew: true}
    //     },
    //   ],
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
      title: 'SEO',
      name: 'seo',
      type: 'seo.page',
      group: 'seo',
    },
    {
      title: 'Animations',
      name: 'animations',
      type: 'animations.page',
      group: 'settings',
    },
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      const {title} = selection
      return {
        title: title,
      }
    },
  },
}
