import {DashboardIcon} from '@sanity/icons'

export const animationsPage = {
  title: 'Animations',
  name: 'animations.page',
  type: 'object',
  icon: DashboardIcon,
  fields: [
    {
      title: 'Animations active',
      type: 'boolean',
      name: 'active',
      initialValue: true,
      options: {layout: 'checkbox'},
    },
  ],
}
