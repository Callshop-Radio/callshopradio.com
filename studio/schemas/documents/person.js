import {
  StarIcon,
  PlayIcon,
  DocumentTextIcon,
  SearchIcon,
  TagIcon,
  TextIcon,
  CogIcon,
} from '@sanity/icons'

import {validateSlug} from '@/utils/validateSlug'

export const person = {
  name: 'person',
  type: 'document',
  title: 'Person',
  icon: StarIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
    },
    {
      title: 'Shows & Local',
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
      name: 'content',
      type: 'richTextMedia',
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
          to: [
            {type: 'tag.global'},
            {type: 'tag.subGenre'},
            {type: 'tag.city'},
            {type: 'tag.musician'},
            {type: 'tag.service'},
          ],
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
        }).uri({scheme: ['http', 'https','www']}),
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
        }).uri({scheme: ['http', 'https','www']}),
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
        }).uri({scheme: ['http', 'https','www']}),
        },
      ],
    },
    {
      title: 'Modules',
      description: 'Modules for additional content, will appear after person bio',
      name: 'modules',
      type: 'modules',
      group: 'editorial',
    },
    {
      name: 'locals',
      title: 'Local',
      type: 'array',
      group: 'related',
      of: [
        {
          name: 'local',
          type: 'reference',
          title: 'Venue',
          to: [{type: 'local'}],
          options: {
            disableNew: true,
          },
        },
      ],
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
      title: 'Pool Visibility',
      name: 'poolVisibility',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      options: {layout: 'checkbox'},
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
