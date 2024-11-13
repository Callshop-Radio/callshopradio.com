import {MenuIcon} from '@sanity/icons'

const TITLE = 'Navigation'

export const siteNav = {
  name: 'siteNav',
  type: 'document',
  title: TITLE,
  icon: MenuIcon,
  fields: [
    {
      title: 'Main Menu',
      name: 'mainMenu',
      type: 'array',
      of: [
        {
          type: 'link',
        },
      ],
    },
    {
      title: 'Foooter Menu',
      name: 'footerMenu',
      type: 'array',
      of: [
        {
          type: 'link',
        },
      ],
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
