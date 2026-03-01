import {ProjectsIcon, TextIcon, CogIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const moduleContentReferenceGrid = defineType({
  title: 'Content Grid with Filters',
  name: 'module.contentReferenceGrid',
  type: 'object',
  icon: ProjectsIcon,
  groups: [
    {title: 'Editorial', name: 'editorial', icon: TextIcon},
    {title: 'Settings', name: 'settings', icon: CogIcon},
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
          {title: 'Pool', value: 'pool'},
          {title: 'Sets', value: 'sets'},
          {title: 'Shows', value: 'shows'},
          {title: 'Articles (Words)', value: 'words'},
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
          {title: 'All Pool Content', value: 'all'},
          {title: 'Persons only', value: 'persons'},
          {title: 'Venues only', value: 'venues'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      hidden: ({parent}) => parent?.type !== 'pool',
    },
  ],
  preview: {
    select: {
      type: 'type',
    },
    prepare(selection) {
      const {type} = selection
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
})
