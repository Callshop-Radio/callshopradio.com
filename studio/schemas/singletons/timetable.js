import {CalendarIcon, SearchIcon, TextIcon, CogIcon} from '@sanity/icons'

const TITLE = 'Schedule'

export const timetable = {
  name: 'timetable',
  type: 'document',
  title: TITLE,
  icon: CalendarIcon,
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
    {
      title: 'SEO',
      name: 'seo',
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      group: 'editorial',
    },
    {
      title: 'Modules',
      name: 'modules',
      description: 'Modules will appear below the timetable.',
      type: 'modules',
      group: 'editorial',
    },
    {
      title: 'SEO',
      name: 'seo',
      type: 'seo.page',
      group: 'seo',
    },
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.page',
    //   group: 'settings',
    // },
    {
      name: 'color',
      title: 'Page Color',
      type: 'color',
      group: 'settings',
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      }
    },
  },
}
