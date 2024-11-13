import { UlistIcon, SearchIcon, TextIcon, CogIcon} from '@sanity/icons'

const TITLE = 'Words Page'

export const words = {
  name: 'words',
  type: 'document',
  title: TITLE,
  icon: UlistIcon,
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
      type: 'modules',
      group: 'editorial',
    },
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
