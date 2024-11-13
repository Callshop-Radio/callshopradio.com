import {
  PlayIcon,
  PinIcon,
  TagIcon,
  DocumentTextIcon,
  SearchIcon,
  TextIcon,
  CogIcon,
} from '@sanity/icons'

import {validateSlug} from '@/utils/validateSlug'

export const venue = {
  name: 'venue',
  type: 'document',
  title: 'Venue',
  icon: PinIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
    },
    {
      title: 'Shows & Artists',
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
      initialValue: true,
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
        },
      ],
    },
    {
      name: 'artists',
      title: 'Artists',
      type: 'array',
      group: 'related',
      of: [
        {
          name: 'artist',
          type: 'reference',
          title: 'Artist',
          to: [{type: 'artist'}],
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
    //   group: 'editorial',
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
