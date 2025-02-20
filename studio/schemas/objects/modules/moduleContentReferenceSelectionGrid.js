
import {ProjectsIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleSelectedContentReferenceGrid = {
  title: 'Selected Content Grid',
  name: 'module.contentReferenceGrid',
  type: 'object',
  icon: ProjectsIcon,
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
      title: 'Heading',
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
            title: 'Articles',
            value: 'words',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
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
      hidden: ({parent}) => parent?.type !== 'pool',
    },
    {
      name: 'pool',
      title: 'Pool',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      group: 'editorial',
      hidden: ({parent}) => parent?.type !== 'pool',
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
      group: 'editorial',
      hidden: ({parent}) => parent?.type !== 'words',
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
      group: 'editorial',
      hidden: ({parent}) => parent?.type !== 'shows',
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
      group: 'editorial',
      hidden: ({parent}) => parent?.type !== 'sets',
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
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.module',
    //   group: 'settings',
    // },
  ],
  preview: {
    select: {
      layout: 'layout',
      type: 'type',
    },
    prepare(selection) {
      const {layout, type} = selection

      return {
        title: 'Content Reference Grid',
        subtitle:
          "Large Grid with Filters. Entries from '" +
          type.charAt(0).toUpperCase() +
          type.slice(1) +
          "'.",
      }
    },
  },
}
