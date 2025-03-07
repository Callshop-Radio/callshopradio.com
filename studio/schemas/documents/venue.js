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
      title: 'Shows & Persons',
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
      description: 'callshopradio.com/pool/person/slug',
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
      name: 'description',
      type: 'internationalizedArrayRichText',
      group: 'editorial',
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
          to: [{type: 'tag.global'}, {type: 'tag.subGenre'}, {type: 'tag.city'}, {type: 'tag.service'}, {type: 'tag.venue'}],
        },
      ],
    },
    {
      title: 'Contact',
      name: 'contact',
      description: 'Must be mail or phone number, no empty spaces.',
      type: 'string',
      group: 'editorial',
    },
    {
      title: 'Socials',
      name: 'socials',
      type: 'object',
      group: 'editorial',
      fields: [
        {
          name: 'instagram',
          type: 'url',
          title: 'Instagram',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === 'external' && !value) {
                return 'This field is required'
              }
              return true
            }).uri({scheme: ['http', 'https', 'www']}),
        },
        {
          name: 'soundcloud',
          type: 'url',
          title: 'Soundcloud',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === 'external' && !value) {
                return 'This field is required'
              }
              return true
            }).uri({scheme: ['http', 'https', 'www']}),
        },
        {
          name: 'nina',
          type: 'url',
          title: 'Nina',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === 'external' && !value) {
                return 'This field is required'
              }
              return true
            }).uri({scheme: ['http', 'https', 'www']}),
        },
        {
          name: 'bandcamp',
          type: 'url',
          title: 'Bandcamp',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === 'external' && !value) {
                return 'This field is required'
              }
              return true
            }).uri({scheme: ['http', 'https', 'www']}),
        },
        {
          name: 'web',
          type: 'url',
          title: 'Website',
          validation: (Rule) =>
            Rule.custom((value, context) => {
              if (context.parent.type === 'external' && !value) {
                return 'This field is required'
              }
              return true
            }).uri({scheme: ['http', 'https', 'www']}),
        },
      ],
    },
    {
      title: 'Modules',
      description: 'Modules for additional content, will appear between local bio and related content',
      name: 'modules',
      type: 'modules',
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
      name: 'persons',
      title: 'Persons',
      type: 'array',
      group: 'related',
      of: [
        {
          name: 'person',
          type: 'reference',
          title: 'Person',
          to: [{type: 'person'}],
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
