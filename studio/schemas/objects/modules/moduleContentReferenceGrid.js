import {ProjectsIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleContentReferenceGrid = {
  title: 'Content Grid with Filters',
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
      title: 'Pool Content Type',
      name: 'poolContentType',
      type: 'string',
      initialValue: 'all',
      group: 'editorial',
      options: {
        list: [
          {
            title: 'All Pool Content',
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
    // {
    //   title: 'Genres',
    //   name: 'setsContentType',
    //   type: 'array',
    //   description: 'Select genres to load sets from.',
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
    //   hidden: ({parent}) => parent?.type !== 'sets',
    // },
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
        title: 'Content Grid',
        subtitle:
          "Large Grid with Filters. Entries from '" +
          type.charAt(0).toUpperCase() +
          type.slice(1) +
          "'.",
      }
    },
  },
}