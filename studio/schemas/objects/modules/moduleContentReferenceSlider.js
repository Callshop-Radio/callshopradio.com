import {BlockElementIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleContentReferenceSlider = {
  title: 'Content Slider',
  name: 'module.contentReferenceSlider',
  type: 'object',
  icon: BlockElementIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
    },
    {
      title: 'Settings',
      name: 'settings',
      icon: CogIcon,
    },
  ],
  fields: [
    {
      title: 'Headline',
      name: 'title',
      type: 'string',
      group: 'editorial',
    },
    {
      title: 'Content Type',
      name: 'type',
      type: 'string',
      initialValue: 'pool',
      group: 'editorial',
      options: {
        list: [
          {
            title: 'Pool',
            value: 'pool',
          },
          {
            title: 'Sets',
            value: 'sets',
          },
          {
            title: 'Shows',
            value: 'shows',
          },
          {
            title: 'Articles (Words)',
            value: 'words',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Style per Slide',
      name: 'style',
      type: 'string',
      initialValue: 'thumbnails',
      group: 'settings',
      options: {
        list: [
          {
            title: 'Single Image',
            value: 'image',
          },
          {
            title: 'Three Cards',
            value: 'cards',
          },
          {
            title: 'Three Thumbnails',
            value: 'thumbnails',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Number of Slides',
      name: 'count',
      type: 'number',
      initialValue: 9,
      options: {
        list: [
          {value: 3, title: "3"}, {value: 6, title: "6"}, {value: 9, title: "9"}, {value: 12, title: "12"}, {value: 16, title: "16"}
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validate: (Rule) => Rule.required(),
      hidden: ({parent}) =>
        (parent?.autoLoad === false),
    },
    {
      title: 'Pool Content Type',
      name: 'poolContentType',
      type: 'string',
      initialValue: 'all',
      group: 'editorial',
      options: {
        list: [
          {
            title: 'All',
            value: 'all',
          },
          {
            title: 'Persons only',
            value: 'persons',
          },
          {
            title: 'Venues only',
            value: 'venues',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: ({parent}) =>
        (parent?.type === 'pool' && parent?.autoLoad === false || parent?.type !== 'pool'),
    },
    // {
    //   title: 'Genres',
    //   name: 'setsContentType',
    //   type: 'array',
    //   validate: (Rule) => Rule.integer().min(1).max(16),
    //   description: 'Select genres to load sets from. Leave empty to load newest sets.',
    //   group: 'editorial',
    //   of: [
    //     {
    //       name: 'subGenre',
    //       type: 'reference',
    //       title: 'Genre',
    //       to: [{type: 'tag.subGenre'}],
    //       options: {
    //         disableNew: true,
    //       },
    //     },
    //   ],
    //   hidden: ({parent}) =>
    //     (parent?.type === 'sets' && parent?.autoLoad === false || parent?.type !== 'sets'),
    // },
    {
      name: 'pool',
      title: 'Pool',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      validate: (Rule) => Rule.integer().min(1).max(16),
      group: 'editorial',
      hidden: ({parent}) =>
        (parent?.type === 'pool' && parent?.autoLoad === true || parent?.type !== 'pool'),
      of: [
        {
          name: 'person',
          type: 'reference',
          title: 'Person',
          to: [{type: 'person'}],
          options: {
            disableNew: true,
          },
        },
        {
          name: 'venue',
          type: 'reference',
          title: 'Venue',
          to: [{type: 'venue'}],
          options: {
            disableNew: true,
          },
        },
      ],
    },
    {
      name: 'articles',
      title: 'Words',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      validate: (Rule) => Rule.integer().min(1).max(16),
      group: 'editorial',
      hidden: ({parent}) =>
        (parent?.type === 'words' && parent?.autoLoad === true) || parent?.type !== 'words',
      of: [
        {
          name: 'article',
          type: 'reference',
          title: 'Article',
          to: [{type: 'article'}],
          options: {
            disableNew: true,
          },
        },
      ],
    },
    {
      name: 'shows',
      title: 'Shows',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      validate: (Rule) => Rule.integer().min(1).max(16),
      group: 'editorial',
      hidden: ({parent}) =>
        (parent?.type === 'shows' && parent?.autoLoad === true) || parent?.type !== 'shows',
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
      title: 'Sets',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      validate: (Rule) => Rule.integer().min(1).max(16),
      group: 'editorial',
      hidden: ({parent}) =>
        (parent?.type === 'sets' && parent?.autoLoad === true) || parent?.type !== 'sets',
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
      title: 'Auto load content',
      description: 'Disable to manually select content.',
      name: 'autoLoad',
      type: 'boolean',
      initialValue: true,
      group: 'editorial',
      options: {
        layout: 'checkbox',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Show Tags',
      description: 'Disable to hide tags.',
      name: 'showTags',
      type: 'boolean',
      initialValue: true,
      group: 'editorial',
      options: {
        layout: 'checkbox',
      },
  },
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.module',
    //   group: 'settings',
    // },
  ],
  preview: {
    select: {
      style: 'style',
      type: 'type',
    },
    prepare(selection) {
      const {style, type} = selection

      return {
        title: 'Content Slider',
        subtitle:
          "'" + type.charAt(0).toUpperCase() + type.slice(1) + "', displayed as " + style + '.',
      }
    },
  },
}
