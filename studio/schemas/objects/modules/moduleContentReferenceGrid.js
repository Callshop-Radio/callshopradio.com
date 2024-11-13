import {ProjectsIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleContentReferenceGrid = {
  title: 'Content Grid',
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
            title: 'Words',
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
            title: 'Artists only',
            value: 'artists',
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
        ( parent?.type !== 'pool' ),
        },
    {
      title: 'Genres',
      name: 'setsContentType',
      type: 'array',
      description: 'Select genres to load sets from.',
      group: 'editorial',
      of: [
        {
          name: 'subGenre',
          type: 'reference',
          title: 'Genre',
          to: [{type: 'tag.subGenre'}],
          options: {
            disableNew: true,
          },
        },
      ],
      hidden: ({parent}) =>
        ( parent?.type !== 'sets' ),
    },
    {
      name: 'pool',
      title: 'Pool',
      description: 'Only selected content below will be displayed.',
      type: 'array',
      group: 'editorial',
      hidden: ({parent}) =>
        ( parent?.type !== 'pool' ),
      of: [
        {
          name: 'artist',
          type: 'reference',
          title: 'Artist',
          to: [{type: 'artist'}],
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
      hidden: ({parent}) =>
        ( parent?.type !== 'words' ),
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
      hidden: ({parent}) =>
        ( parent?.type !== 'shows' ),
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
      hidden: ({parent}) =>
        ( parent?.type !== 'sets' ),
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
          "Large Grid with Filters. Entries from '" + type.charAt(0).toUpperCase() + type.slice(1) + "'.",
      }
    },
  },
}
